#[starknet::contract]
pub mod GhostEscrowV2 {
    use core::num::traits::Zero;
    use ghost_orders::types::{
        IERC20Dispatcher, IERC20DispatcherTrait, IGhostEscrowV2, IPriceOracleDispatcher,
        IPriceOracleDispatcherTrait, ISettlementDispatcher, ISettlementDispatcherTrait, OrderV2,
        OrderStatus, Condition, ConditionType, Operator, Action, ActionType,
    };
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{
        ContractAddress, get_block_timestamp, get_caller_address, get_contract_address,
    };

    #[storage]
    struct Storage {
        oracle: ContractAddress,
        settlement: ContractAddress,
        orders_count: u64,
        orders: Map<u64, OrderV2>,
        conditions: Map<(u64, u32), Condition>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        OrderCreated: OrderCreated,
        OrderCancelled: OrderCancelled,
        OrderExecuted: OrderExecuted,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderCreated {
        #[key]
        pub order_id: u64,
        #[key]
        pub owner: ContractAddress,
        pub action: Action,
        pub expiry: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderCancelled {
        #[key]
        pub order_id: u64,
        #[key]
        pub owner: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OrderExecuted {
        #[key]
        pub order_id: u64,
        #[key]
        pub keeper: ContractAddress,
        pub amount_out: u256,
    }

    #[constructor]
    pub fn constructor(
        ref self: ContractState, oracle: ContractAddress, settlement: ContractAddress
    ) {
        assert(!oracle.is_zero(), 'Oracle cannot be 0');
        assert(!settlement.is_zero(), 'Settlement cannot be 0');
        self.oracle.write(oracle);
        self.settlement.write(settlement);
        self.orders_count.write(0);
    }

    #[abi(embed_v0)]
    pub impl GhostEscrowV2Impl of IGhostEscrowV2<ContractState> {
        fn create_order(
            ref self: ContractState,
            conditions: Array<Condition>,
            action: Action,
            expiry: u64,
        ) -> u64 {
            let caller = get_caller_address();
            let this_contract = get_contract_address();

            assert(!caller.is_zero(), 'Caller cannot be 0');
            assert(conditions.len() > 0, 'Must have at least 1 condition');

            let current_time = get_block_timestamp();
            assert(expiry > current_time, 'Expiry must be in future');

            // Validate Action & Lock Funds
            match action.action_type {
                ActionType::Swap => {
                    assert(!action.token_in.is_zero(), 'Token in cannot be 0');
                    assert(!action.token_out.is_zero(), 'Token out cannot be 0');
                    assert(action.token_in != action.token_out, 'Tokens must be distinct');
                    assert(action.amount_in > 0, 'Amount in must be > 0');
                    assert(action.min_amount_out > 0, 'Min amount out must be > 0');

                    // Escrow token_in from caller into GhostEscrowV2
                    let token_dispatcher = IERC20Dispatcher { contract_address: action.token_in };
                    let success = token_dispatcher.transfer_from(caller, this_contract, action.amount_in);
                    assert(success, 'Deposit transfer failed');
                }
            };

            let new_order_id = self.orders_count.read() + 1;
            let conditions_count = conditions.len();

            // Store Conditions
            let mut conditions_span = conditions.span();
            let mut idx: u32 = 0;
            loop {
                match conditions_span.pop_front() {
                    Option::Some(condition) => {
                        let cond = *condition;
                        // Basic validation per condition type
                        match cond.cond_type {
                            ConditionType::Price => {
                                assert(!cond.token_in.is_zero(), 'Token in cannot be 0');
                                assert(!cond.token_out.is_zero(), 'Token out cannot be 0');
                                assert(cond.value > 0, 'Threshold must be > 0');
                            },
                            ConditionType::Time => {
                                assert(cond.value > 0, 'Timestamp must be > 0');
                            }
                        };
                        self.conditions.write((new_order_id, idx), cond);
                        idx += 1;
                    },
                    Option::None => {
                        break;
                    }
                };
            };

            let order = OrderV2 {
                order_id: new_order_id,
                owner: caller,
                action,
                expiry,
                status: OrderStatus::Active,
                conditions_count,
            };

            self.orders.write(new_order_id, order);
            self.orders_count.write(new_order_id);

            self.emit(OrderCreated { order_id: new_order_id, owner: caller, action, expiry });

            new_order_id
        }

        fn cancel_order(ref self: ContractState, order_id: u64) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'Caller cannot be 0');
            assert(order_id > 0 && order_id <= self.orders_count.read(), 'Order does not exist');

            let mut order = self.orders.read(order_id);
            assert(order.owner == caller, 'Unauthorized: not owner');
            assert(order.status == OrderStatus::Active, 'Order is not active');

            // Checks-effects-interactions
            order.status = OrderStatus::Cancelled;
            self.orders.write(order_id, order);

            self.emit(OrderCancelled { order_id, owner: caller });

            // Refund logic
            match order.action.action_type {
                ActionType::Swap => {
                    let token_dispatcher = IERC20Dispatcher { contract_address: order.action.token_in };
                    let success = token_dispatcher.transfer(order.owner, order.action.amount_in);
                    assert(success, 'Refund transfer failed');
                }
            };
        }

        fn execute_order(ref self: ContractState, order_id: u64) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'Caller cannot be 0');
            assert(order_id > 0 && order_id <= self.orders_count.read(), 'Order does not exist');

            let mut order = self.orders.read(order_id);
            assert(order.status == OrderStatus::Active, 'Order is not active');

            let current_time = get_block_timestamp();
            assert(current_time < order.expiry, 'Order has expired');

            // Evaluate all conditions
            let executable = self.is_order_executable(order_id);
            assert(executable, 'Conditions not met');

            let settlement_addr = self.settlement.read();

            match order.action.action_type {
                ActionType::Swap => {
                    // Transfer token_in to settlement
                    let token_in_dispatcher = IERC20Dispatcher { contract_address: order.action.token_in };
                    let transfer_success = token_in_dispatcher.transfer(settlement_addr, order.action.amount_in);
                    assert(transfer_success, 'Transfer to settlement failed');

                    // Call settlement
                    let settlement_dispatcher = ISettlementDispatcher { contract_address: settlement_addr };
                    let actual_amount_out = settlement_dispatcher
                        .settle(
                            order.action.token_in,
                            order.action.token_out,
                            order.action.amount_in,
                            order.action.min_amount_out,
                            order.owner,
                        );
                    assert(actual_amount_out >= order.action.min_amount_out, 'Output below min_amount_out');

                    // Update state
                    order.status = OrderStatus::Executed;
                    self.orders.write(order_id, order);

                    self.emit(OrderExecuted { order_id, keeper: caller, amount_out: actual_amount_out });
                }
            };
        }

        fn get_order(self: @ContractState, order_id: u64) -> OrderV2 {
            self.orders.read(order_id)
        }

        fn get_condition(self: @ContractState, order_id: u64, condition_idx: u32) -> Condition {
            self.conditions.read((order_id, condition_idx))
        }

        fn get_order_count(self: @ContractState) -> u64 {
            self.orders_count.read()
        }

        fn is_order_executable(self: @ContractState, order_id: u64) -> bool {
            if order_id == 0 || order_id > self.orders_count.read() {
                return false;
            }

            let order = self.orders.read(order_id);
            if order.status != OrderStatus::Active {
                return false;
            }

            let current_time = get_block_timestamp();
            if current_time >= order.expiry {
                return false;
            }

            // Loop and evaluate conditions (AND logic)
            let mut idx: u32 = 0;
            let mut all_satisfied = true;
            let count = order.conditions_count;
            loop {
                if idx >= count {
                    break;
                }
                let condition = self.conditions.read((order_id, idx));
                if !self.evaluate_condition(condition) {
                    all_satisfied = false;
                    break;
                }
                idx += 1;
            };

            all_satisfied
        }

        fn get_oracle(self: @ContractState) -> ContractAddress {
            self.oracle.read()
        }

        fn get_settlement(self: @ContractState) -> ContractAddress {
            self.settlement.read()
        }
    }

    #[generate_trait]
    impl InternalMethods of InternalMethodsTrait {
        fn evaluate_condition(self: @ContractState, condition: Condition) -> bool {
            match condition.cond_type {
                ConditionType::Price => {
                    let oracle_addr = self.oracle.read();
                    let oracle_dispatcher = IPriceOracleDispatcher { contract_address: oracle_addr };
                    let current_price = oracle_dispatcher.get_price(condition.token_in, condition.token_out);
                    self.compare_values(current_price, condition.value, condition.operator)
                },
                ConditionType::Time => {
                    let current_time = get_block_timestamp();
                    let current_time_u256: u256 = current_time.into();
                    self.compare_values(current_time_u256, condition.value, condition.operator)
                }
            }
        }

        fn compare_values(self: @ContractState, val1: u256, val2: u256, op: Operator) -> bool {
            match op {
                Operator::Lt => val1 < val2,
                Operator::Lte => val1 <= val2,
                Operator::Gt => val1 > val2,
                Operator::Gte => val1 >= val2,
                Operator::Eq => val1 == val2,
            }
        }
    }
}
