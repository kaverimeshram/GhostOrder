#[starknet::contract]
pub mod GhostEscrow {
    use core::num::traits::Zero;
    use ghost_orders::types::{
        IERC20Dispatcher, IERC20DispatcherTrait, IGhostEscrow, IPriceOracleDispatcher,
        IPriceOracleDispatcherTrait, ISettlementDispatcher, ISettlementDispatcherTrait, Order,
        OrderStatus,
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
        orders: Map<u64, Order>,
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
        pub token_in: ContractAddress,
        pub token_out: ContractAddress,
        pub amount_in: u256,
        pub target_price: u256,
        pub min_amount_out: u256,
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
    pub impl GhostEscrowImpl of IGhostEscrow<ContractState> {
        fn create_order(
            ref self: ContractState,
            token_in: ContractAddress,
            token_out: ContractAddress,
            amount_in: u256,
            target_price: u256,
            min_amount_out: u256,
            expiry: u64,
        ) -> u64 {
            let caller = get_caller_address();
            let this_contract = get_contract_address();

            assert(!caller.is_zero(), 'Caller cannot be 0');
            assert(!token_in.is_zero(), 'Token in cannot be 0');
            assert(!token_out.is_zero(), 'Token out cannot be 0');
            assert(token_in != token_out, 'Tokens must be distinct');
            assert(amount_in > 0, 'Amount in must be > 0');
            assert(target_price > 0, 'Target price must be > 0');
            assert(min_amount_out > 0, 'Min amount out must be > 0');

            let current_time = get_block_timestamp();
            assert(expiry > current_time, 'Expiry must be in future');

            // Escrow token_in from caller into GhostEscrow
            let token_dispatcher = IERC20Dispatcher { contract_address: token_in };
            let success = token_dispatcher.transfer_from(caller, this_contract, amount_in);
            assert(success, 'Deposit transfer failed');

            let new_order_id = self.orders_count.read() + 1;
            let order = Order {
                order_id: new_order_id,
                owner: caller,
                token_in,
                token_out,
                amount_in,
                target_price,
                min_amount_out,
                expiry,
                status: OrderStatus::Active,
            };

            self.orders.write(new_order_id, order);
            self.orders_count.write(new_order_id);

            self
                .emit(
                    OrderCreated {
                        order_id: new_order_id,
                        owner: caller,
                        token_in,
                        token_out,
                        amount_in,
                        target_price,
                        min_amount_out,
                        expiry,
                    },
                );

            new_order_id
        }

        fn cancel_order(ref self: ContractState, order_id: u64) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'Caller cannot be 0');
            assert(order_id > 0 && order_id <= self.orders_count.read(), 'Order does not exist');

            let mut order = self.orders.read(order_id);
            assert(order.owner == caller, 'Unauthorized: not owner');
            assert(order.status == OrderStatus::Active, 'Order is not active');

            // Checks-effects-interactions: Update status before external refund transfer
            order.status = OrderStatus::Cancelled;
            self.orders.write(order_id, order);

            self.emit(OrderCancelled { order_id, owner: caller });

            // Return exact escrowed token_in to order owner
            let token_dispatcher = IERC20Dispatcher { contract_address: order.token_in };
            let success = token_dispatcher.transfer(order.owner, order.amount_in);
            assert(success, 'Refund transfer failed');
        }

        fn execute_order(ref self: ContractState, order_id: u64) {
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'Caller cannot be 0');
            assert(order_id > 0 && order_id <= self.orders_count.read(), 'Order does not exist');

            let mut order = self.orders.read(order_id);
            assert(order.status == OrderStatus::Active, 'Order is not active');

            let current_time = get_block_timestamp();
            assert(current_time < order.expiry, 'Order has expired');

            let oracle_addr = self.oracle.read();
            let oracle_dispatcher = IPriceOracleDispatcher { contract_address: oracle_addr };
            let current_price = oracle_dispatcher.get_price(order.token_in, order.token_out);
            assert(current_price >= order.target_price, 'Price condition not met');

            let settlement_addr = self.settlement.read();

            // Checks-effects: update state before external settlement
            order.status = OrderStatus::Executed;
            self.orders.write(order_id, order);

            // Interactions: send escrowed token_in to settlement
            let token_in_dispatcher = IERC20Dispatcher { contract_address: order.token_in };
            let transfer_success = token_in_dispatcher.transfer(settlement_addr, order.amount_in);
            assert(transfer_success, 'Transfer to settlement failed');

            // Execute settlement swap directly delivering token_out to order.owner
            let settlement_dispatcher = ISettlementDispatcher { contract_address: settlement_addr };
            let actual_amount_out = settlement_dispatcher
                .settle(
                    order.token_in,
                    order.token_out,
                    order.amount_in,
                    order.min_amount_out,
                    order.owner,
                );
            assert(actual_amount_out >= order.min_amount_out, 'Output below min_amount_out');

            self.emit(OrderExecuted { order_id, keeper: caller, amount_out: actual_amount_out });
        }

        fn get_order(self: @ContractState, order_id: u64) -> Order {
            self.orders.read(order_id)
        }

        fn get_order_count(self: @ContractState) -> u64 {
            self.orders_count.read()
        }

        fn is_order_executable(self: @ContractState, order_id: u64) -> bool {
            // 1. Verify order exists
            if order_id == 0 || order_id > self.orders_count.read() {
                return false;
            }

            let order = self.orders.read(order_id);

            // 2. Verify order status is Active
            if order.status != OrderStatus::Active {
                return false;
            }

            // 3. Verify order has not expired (current block timestamp < expiry)
            let current_time = get_block_timestamp();
            if current_time >= order.expiry {
                return false;
            }

            // 4. Query price from the configured oracle
            let oracle_addr = self.oracle.read();
            let oracle_dispatcher = IPriceOracleDispatcher { contract_address: oracle_addr };
            let current_price = oracle_dispatcher.get_price(order.token_in, order.token_out);

            // 5. Compare current price against target_price (current_price >= target_price)
            current_price >= order.target_price
        }

        fn get_oracle(self: @ContractState) -> ContractAddress {
            self.oracle.read()
        }

        fn get_settlement(self: @ContractState) -> ContractAddress {
            self.settlement.read()
        }
    }
}
