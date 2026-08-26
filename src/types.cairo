use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store, PartialEq, Debug, Default)]
pub enum OrderStatus {
    #[default]
    None,
    Active,
    Executed,
    Cancelled,
}

#[derive(Drop, Copy, Serde, starknet::Store, Debug, PartialEq)]
pub struct Order {
    pub order_id: u64,
    pub owner: ContractAddress,
    pub token_in: ContractAddress,
    pub token_out: ContractAddress,
    pub amount_in: u256,
    pub target_price: u256,
    pub min_amount_out: u256,
    pub expiry: u64,
    pub status: OrderStatus,
}

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn name(self: @TContractState) -> ByteArray;
    fn symbol(self: @TContractState) -> ByteArray;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IPriceOracle<TContractState> {
    fn set_price(
        ref self: TContractState, token_in: ContractAddress, token_out: ContractAddress, price: u256
    );
    fn get_price(
        self: @TContractState, token_in: ContractAddress, token_out: ContractAddress
    ) -> u256;
}

#[starknet::interface]
pub trait ISettlement<TContractState> {
    fn settle(
        ref self: TContractState,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
        min_amount_out: u256,
        recipient: ContractAddress,
    ) -> u256;
}

#[starknet::interface]
pub trait IMockSettlement<TContractState> {
    fn settle(
        ref self: TContractState,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
        min_amount_out: u256,
        recipient: ContractAddress,
    ) -> u256;

    fn set_output_amount(
        ref self: TContractState,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
        output_amount: u256,
    );

    fn get_output_amount(
        self: @TContractState,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
    ) -> u256;
}

#[starknet::interface]
pub trait IGhostEscrow<TContractState> {
    fn create_order(
        ref self: TContractState,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
        target_price: u256,
        min_amount_out: u256,
        expiry: u64,
    ) -> u64;

    fn cancel_order(ref self: TContractState, order_id: u64);

    fn execute_order(ref self: TContractState, order_id: u64);

    fn get_order(self: @TContractState, order_id: u64) -> Order;

    fn get_order_count(self: @TContractState) -> u64;

    fn is_order_executable(self: @TContractState, order_id: u64) -> bool;

    fn get_oracle(self: @TContractState) -> ContractAddress;

    fn get_settlement(self: @TContractState) -> ContractAddress;
}
