#[cfg(test)]
mod tests {
    use core::array::ArrayTrait;
    use core::result::ResultTrait;
    use core::traits::TryInto;
    use ghost_orders::ghost_escrow::GhostEscrow;
    use ghost_orders::mock_erc20::{
        IMockERC20Dispatcher, IMockERC20DispatcherTrait, MockERC20,
    };
    use ghost_orders::mock_price_oracle::{MockPriceOracle};
    use ghost_orders::mock_settlement::{MockSettlement};
    use ghost_orders::types::{
        IGhostEscrowDispatcher, IGhostEscrowDispatcherTrait, IMockSettlementDispatcher,
        IMockSettlementDispatcherTrait, IPriceOracleDispatcher, IPriceOracleDispatcherTrait,
        OrderStatus,
    };
    use starknet::ContractAddress;
    use starknet::syscalls::deploy_syscall;
    use starknet::testing::{set_block_timestamp, set_caller_address, set_contract_address};

    fn USER1() -> ContractAddress {
        'user1'.try_into().unwrap()
    }

    fn USER2() -> ContractAddress {
        'user2'.try_into().unwrap()
    }

    fn KEEPER() -> ContractAddress {
        'keeper'.try_into().unwrap()
    }

    fn ADMIN() -> ContractAddress {
        'admin'.try_into().unwrap()
    }

    fn deploy_mock_token(name: ByteArray, symbol: ByteArray, decimals: u8) -> ContractAddress {
        let mut calldata: Array<felt252> = ArrayTrait::new();
        name.serialize(ref calldata);
        symbol.serialize(ref calldata);
        decimals.serialize(ref calldata);

        let (addr, _) = deploy_syscall(
            MockERC20::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
        )
            .unwrap();
        addr
    }

    fn deploy_oracle() -> ContractAddress {
        let calldata: Array<felt252> = ArrayTrait::new();
        let (addr, _) = deploy_syscall(
            MockPriceOracle::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
        )
            .unwrap();
        addr
    }

    fn deploy_settlement() -> ContractAddress {
        let calldata: Array<felt252> = ArrayTrait::new();
        let (addr, _) = deploy_syscall(
            MockSettlement::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
        )
            .unwrap();
        addr
    }

    fn deploy_escrow(oracle_addr: ContractAddress, settlement_addr: ContractAddress) -> ContractAddress {
        let mut calldata: Array<felt252> = ArrayTrait::new();
        oracle_addr.serialize(ref calldata);
        settlement_addr.serialize(ref calldata);
        let (addr, _) = deploy_syscall(
            GhostEscrow::TEST_CLASS_HASH.try_into().unwrap(), 0, calldata.span(), false,
        )
            .unwrap();
        addr
    }

    fn setup() -> (ContractAddress, ContractAddress, ContractAddress, ContractAddress, ContractAddress) {
        set_contract_address(ADMIN());
        set_caller_address(ADMIN());
        set_block_timestamp(1000);
        let oracle_addr = deploy_oracle();
        let settlement_addr = deploy_settlement();
        let escrow_addr = deploy_escrow(oracle_addr, settlement_addr);
        let token_in_addr = deploy_mock_token("Token In", "TKNI", 18);
        let token_out_addr = deploy_mock_token("Token Out", "TKNO", 18);
        (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr)
    }

    #[test]
    fn test_escrow_oracle_and_settlement_getters() {
        let (escrow_addr, oracle_addr, settlement_addr, _, _) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        assert(escrow.get_oracle() == oracle_addr, 'Wrong oracle address');
        assert(escrow.get_settlement() == settlement_addr, 'Wrong settlement address');
    }

    #[test]
    fn test_successful_execution_price_above_target() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        let amount_in: u256 = 1000_u256;
        let target_price: u256 = 2500_u256;
        let min_amount_out: u256 = 2400_u256;
        let expiry: u64 = 5000;

        // Mint token_in to USER1 and token_out to settlement contract
        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);

        // USER1 approves and creates order
        set_contract_address(USER1());
        token_in.approve(escrow_addr, amount_in);
        let order_id = escrow
            .create_order(token_in_addr, token_out_addr, amount_in, target_price, min_amount_out, expiry);

        // Set oracle price ABOVE target (3000 > 2500)
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 3000_u256);

        // Keeper executes order permissionlessly
        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        // Verify balances after execution
        assert(token_in.balance_of(escrow_addr) == 0_u256, 'Escrow token_in should be 0');
        assert(token_in.balance_of(settlement_addr) == amount_in, 'Settlement got token_in');
        assert(token_out.balance_of(USER1()) == min_amount_out, 'Owner got token_out');
        assert(token_in.balance_of(KEEPER()) == 0_u256, 'Keeper got no token_in');
        assert(token_out.balance_of(KEEPER()) == 0_u256, 'Keeper got no token_out');

        // Verify order status is Executed
        let order = escrow.get_order(order_id);
        assert(order.status == OrderStatus::Executed, 'Status should be Executed');
    }

    #[test]
    fn test_successful_execution_price_equals_target() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        let amount_in: u256 = 1000_u256;
        let target_price: u256 = 2500_u256;
        let min_amount_out: u256 = 2400_u256;
        let expiry: u64 = 5000;

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, amount_in);
        let order_id = escrow
            .create_order(token_in_addr, token_out_addr, amount_in, target_price, min_amount_out, expiry);

        // Set oracle price EQUAL to target (2500 == 2500)
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        assert(token_in.balance_of(escrow_addr) == 0_u256, 'Escrow token_in 0');
        assert(token_in.balance_of(settlement_addr) == amount_in, 'Settlement received token_in');
        assert(token_out.balance_of(USER1()) == min_amount_out, 'Owner received token_out');
        assert(token_in.balance_of(KEEPER()) == 0_u256, 'Keeper has no token_in');
        assert(token_out.balance_of(KEEPER()) == 0_u256, 'Keeper has no token_out');

        let order = escrow.get_order(order_id);
        assert(order.status == OrderStatus::Executed, 'Status should be Executed');
    }

    #[test]
    #[should_panic(expected: ('Price condition not met', 'ENTRYPOINT_FAILED'))]
    fn test_execute_fails_when_price_below_target() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2400_u256); // below target 2500

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);
    }

    #[test]
    #[should_panic(expected: ('Order has expired', 'ENTRYPOINT_FAILED'))]
    fn test_execute_fails_for_expired_order() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        // Advance time to expiry
        set_block_timestamp(5000);
        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);
    }

    #[test]
    #[should_panic(expected: ('Order is not active', 'ENTRYPOINT_FAILED'))]
    fn test_execute_fails_for_cancelled_order() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        // Cancel order
        escrow.cancel_order(order_id);

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);
    }

    #[test]
    #[should_panic(expected: ('Order does not exist', 'ENTRYPOINT_FAILED'))]
    fn test_execute_fails_for_nonexistent_order_zero() {
        let (escrow_addr, _, _, _, _) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(0);
    }

    #[test]
    #[should_panic(expected: ('Order does not exist', 'ENTRYPOINT_FAILED'))]
    fn test_execute_fails_for_nonexistent_order_high() {
        let (escrow_addr, _, _, _, _) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(999);
    }

    #[test]
    fn test_order_status_becomes_executed_after_successful_execution() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        let order_before = escrow.get_order(order_id);
        assert(order_before.status == OrderStatus::Active, 'Status before should be Active');

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        let order_after = escrow.get_order(order_id);
        assert(order_after.status == OrderStatus::Executed, 'Status after should be Executed');
    }

    #[test]
    fn test_owner_receives_expected_token_out() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        let min_amount_out: u256 = 2400_u256;

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, min_amount_out, 5000);

        assert(token_out.balance_of(USER1()) == 0_u256, 'Owner token_out before is 0');

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        assert(token_out.balance_of(USER1()) == min_amount_out, 'Owner received token_out');
    }

    #[test]
    fn test_escrow_no_longer_holds_executed_token_in() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        let amount_in: u256 = 1000_u256;

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, amount_in);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, amount_in, 2500_u256, 2400_u256, 5000);

        assert(token_in.balance_of(escrow_addr) == amount_in, 'Escrow holds token_in before');

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        assert(token_in.balance_of(escrow_addr) == 0_u256, 'Escrow holds 0 token_in after');
    }

    #[test]
    fn test_keeper_receives_no_user_tokens() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        assert(token_in.balance_of(KEEPER()) == 0_u256, 'Keeper token_in before 0');
        assert(token_out.balance_of(KEEPER()) == 0_u256, 'Keeper token_out before 0');

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        assert(token_in.balance_of(KEEPER()) == 0_u256, 'Keeper token_in after 0');
        assert(token_out.balance_of(KEEPER()) == 0_u256, 'Keeper token_out after 0');
    }

    #[test]
    #[should_panic(expected: ('Output below min_amount_out', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_settlement_failure_reverts_execution_output_below_min() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let settlement = IMockSettlementDispatcher { contract_address: settlement_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        // Configure settlement to return only 2000 output (< 2400 min_amount_out)
        settlement.set_output_amount(token_in_addr, token_out_addr, 1000_u256, 2000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);
    }

    #[test]
    #[should_panic(expected: ('Order is not active', 'ENTRYPOINT_FAILED'))]
    fn test_cannot_double_execute_order() {
        let (escrow_addr, oracle_addr, settlement_addr, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let token_out = IMockERC20Dispatcher { contract_address: token_out_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);
        token_out.mint(settlement_addr, 10000_u256);
        oracle.set_price(token_in_addr, token_out_addr, 2500_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500_u256, 2400_u256, 5000);

        set_caller_address(KEEPER());
        set_contract_address(KEEPER());
        escrow.execute_order(order_id);

        // Second execution must fail
        escrow.execute_order(order_id);
    }

    #[test]
    fn test_cancel_order_refunds_exact_amount_to_owner() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        let amount_in: u256 = 1000_u256;
        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, amount_in);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, amount_in, 2500, 2400, 5000);

        assert(token_in.balance_of(USER1()) == 4000_u256, 'Balance before cancel');
        assert(token_in.balance_of(escrow_addr) == 1000_u256, 'Escrow before cancel');

        // Cancel order
        escrow.cancel_order(order_id);

        // Check balances after cancellation
        assert(token_in.balance_of(USER1()) == 5000_u256, 'User balance not restored');
        assert(token_in.balance_of(escrow_addr) == 0_u256, 'Escrow balance not 0');

        let order = escrow.get_order(order_id);
        assert(order.status == OrderStatus::Cancelled, 'Status not cancelled');
    }

    #[test]
    fn test_order_executable_price_below_target() {
        let (escrow_addr, oracle_addr, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };

        let target_price: u256 = 100_u256;
        set_contract_address(ADMIN());
        token_in.mint(USER1(), 1000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 500_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 500_u256, target_price, 90, 5000);

        // Set oracle price to 90 (below target 100)
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 90_u256);

        assert(!escrow.is_order_executable(order_id), 'Not executable: 90 < 100');
    }

    #[test]
    fn test_order_executable_price_equals_target() {
        let (escrow_addr, oracle_addr, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };

        let target_price: u256 = 100_u256;
        set_contract_address(ADMIN());
        token_in.mint(USER1(), 1000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 500_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 500_u256, target_price, 90, 5000);

        // Set oracle price to 100 (equals target 100)
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 100_u256);

        assert(escrow.is_order_executable(order_id), 'Executable: 100 == 100');
    }

    #[test]
    fn test_order_executable_price_above_target() {
        let (escrow_addr, oracle_addr, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };

        let target_price: u256 = 100_u256;
        set_contract_address(ADMIN());
        token_in.mint(USER1(), 1000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 500_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 500_u256, target_price, 90, 5000);

        // Set oracle price to 120 (above target 100)
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 120_u256);

        assert(escrow.is_order_executable(order_id), 'Executable: 120 > 100');
    }

    #[test]
    fn test_order_executable_cancelled_order_returns_false() {
        let (escrow_addr, oracle_addr, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 1000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 500_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 500_u256, 100_u256, 90, 5000);

        // Cancel order
        escrow.cancel_order(order_id);

        // Set price above target
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 150_u256);

        // Cancelled order must return false
        assert(!escrow.is_order_executable(order_id), 'Cancelled not executable');
    }

    #[test]
    fn test_order_executable_expired_order_returns_false() {
        let (escrow_addr, oracle_addr, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        let oracle = IPriceOracleDispatcher { contract_address: oracle_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 1000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 500_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 500_u256, 100_u256, 90, 5000);

        // Set price above target
        set_contract_address(ADMIN());
        oracle.set_price(token_in_addr, token_out_addr, 150_u256);

        // Advance block timestamp to 5000 (expired)
        set_block_timestamp(5000);
        assert(!escrow.is_order_executable(order_id), 'Expired at 5000 should be false');

        // Advance past 5000
        set_block_timestamp(5001);
        assert(!escrow.is_order_executable(order_id), 'Expired at 5001 should be false');
    }

    #[test]
    fn test_order_executable_nonexistent_order_returns_false() {
        let (escrow_addr, _, _, _, _) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        assert(!escrow.is_order_executable(0), 'Order 0 should be false');
        assert(!escrow.is_order_executable(999), 'Order 999 should be false');
    }

    #[test]
    #[should_panic(expected: ('Unauthorized: not owner', 'ENTRYPOINT_FAILED'))]
    fn test_unauthorized_user_cannot_cancel() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500, 2400, 5000);

        // USER2 tries to cancel USER1's order
        set_caller_address(USER2());
        set_contract_address(USER2());
        escrow.cancel_order(order_id);
    }

    #[test]
    #[should_panic(expected: ('Order is not active', 'ENTRYPOINT_FAILED'))]
    fn test_cannot_cancel_already_cancelled_order() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        let order_id = escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500, 2400, 5000);

        escrow.cancel_order(order_id);
        // Second cancel attempt must fail
        escrow.cancel_order(order_id);
    }

    #[test]
    #[should_panic(expected: ('Insufficient allowance', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_fails_without_approval() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 5000_u256);

        set_contract_address(USER1());
        // Approve only 500 but request 1000
        token_in.approve(escrow_addr, 500_u256);
        escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500, 2400, 5000);
    }

    #[test]
    #[should_panic(expected: ('Insufficient balance', 'ENTRYPOINT_FAILED', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_fails_insufficient_balance() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 200_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        // Has allowance 1000 but only 200 balance
        escrow.create_order(token_in_addr, token_out_addr, 1000_u256, 2500, 2400, 5000);
    }

    #[test]
    fn test_multi_order_accounting() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        // Fund USER1 and USER2
        set_contract_address(ADMIN());
        token_in.mint(USER1(), 10000_u256);
        token_in.mint(USER2(), 10000_u256);

        // USER1 creates order 1 (3000)
        set_contract_address(USER1());
        token_in.approve(escrow_addr, 3000_u256);
        let id1 = escrow.create_order(token_in_addr, token_out_addr, 3000_u256, 100, 90, 5000);

        // USER2 creates order 2 (5000)
        set_contract_address(USER2());
        token_in.approve(escrow_addr, 5000_u256);
        let id2 = escrow.create_order(token_in_addr, token_out_addr, 5000_u256, 200, 180, 6000);

        // USER1 creates order 3 (2000)
        set_contract_address(USER1());
        token_in.approve(escrow_addr, 2000_u256);
        let id3 = escrow.create_order(token_in_addr, token_out_addr, 2000_u256, 300, 270, 7000);

        assert(token_in.balance_of(escrow_addr) == 10000_u256, 'Escrow should hold 10000');
        assert(token_in.balance_of(USER1()) == 5000_u256, 'USER1 balance should be 5000');
        assert(token_in.balance_of(USER2()) == 5000_u256, 'USER2 balance should be 5000');

        // Cancel order 2 (USER2) -> refunds 5000 to USER2
        set_contract_address(USER2());
        escrow.cancel_order(id2);

        assert(token_in.balance_of(escrow_addr) == 5000_u256, 'Escrow after cancel 2');
        assert(token_in.balance_of(USER2()) == 10000_u256, 'USER2 refunded');
        assert(token_in.balance_of(USER1()) == 5000_u256, 'USER1 unaffected');

        // Cancel order 1 (USER1) -> refunds 3000 to USER1
        set_contract_address(USER1());
        escrow.cancel_order(id1);

        assert(token_in.balance_of(escrow_addr) == 2000_u256, 'Escrow after cancel 1');
        assert(token_in.balance_of(USER1()) == 8000_u256, 'USER1 balance 8000');

        // Cancel order 3 (USER1) -> refunds 2000 to USER1
        escrow.cancel_order(id3);

        assert(token_in.balance_of(escrow_addr) == 0_u256, 'Escrow should be 0');
        assert(token_in.balance_of(USER1()) == 10000_u256, 'USER1 fully restored');
        assert(token_in.balance_of(USER2()) == 10000_u256, 'USER2 fully restored');
    }

    #[test]
    #[should_panic(expected: ('Order does not exist', 'ENTRYPOINT_FAILED'))]
    fn test_cancel_nonexistent_order() {
        let (escrow_addr, _, _, _, _) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };
        set_contract_address(USER1());
        escrow.cancel_order(999);
    }

    #[test]
    #[should_panic(expected: ('Tokens must be distinct', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_same_tokens() {
        let (escrow_addr, _, _, token_in_addr, _) = setup();
        let token_in = IMockERC20Dispatcher { contract_address: token_in_addr };
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(ADMIN());
        token_in.mint(USER1(), 1000_u256);

        set_contract_address(USER1());
        token_in.approve(escrow_addr, 1000_u256);
        escrow.create_order(token_in_addr, token_in_addr, 1000_u256, 100, 90, 5000);
    }

    #[test]
    #[should_panic(expected: ('Amount in must be > 0', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_zero_amount() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(USER1());
        escrow.create_order(token_in_addr, token_out_addr, 0_u256, 100, 90, 5000);
    }

    #[test]
    #[should_panic(expected: ('Target price must be > 0', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_zero_target_price() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(USER1());
        escrow.create_order(token_in_addr, token_out_addr, 100_u256, 0_u256, 90, 5000);
    }

    #[test]
    #[should_panic(expected: ('Min amount out must be > 0', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_zero_min_out() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(USER1());
        escrow.create_order(token_in_addr, token_out_addr, 100_u256, 100, 0_u256, 5000);
    }

    #[test]
    #[should_panic(expected: ('Expiry must be in future', 'ENTRYPOINT_FAILED'))]
    fn test_create_order_past_expiry() {
        let (escrow_addr, _, _, token_in_addr, token_out_addr) = setup();
        let escrow = IGhostEscrowDispatcher { contract_address: escrow_addr };

        set_contract_address(USER1());
        escrow.create_order(token_in_addr, token_out_addr, 100_u256, 100, 90, 1000);
    }
}
