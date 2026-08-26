#[starknet::contract]
pub mod MockPriceOracle {
    use core::num::traits::Zero;
    use ghost_orders::types::IPriceOracle;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        prices: Map<(ContractAddress, ContractAddress), u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        PriceSet: PriceSet,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PriceSet {
        #[key]
        pub token_in: ContractAddress,
        #[key]
        pub token_out: ContractAddress,
        pub price: u256,
    }

    #[constructor]
    pub fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    pub impl MockPriceOracleImpl of IPriceOracle<ContractState> {
        fn set_price(
            ref self: ContractState,
            token_in: ContractAddress,
            token_out: ContractAddress,
            price: u256
        ) {
            assert(!token_in.is_zero(), 'Token in cannot be 0');
            assert(!token_out.is_zero(), 'Token out cannot be 0');
            self.prices.write((token_in, token_out), price);
            self.emit(PriceSet { token_in, token_out, price });
        }

        fn get_price(
            self: @ContractState, token_in: ContractAddress, token_out: ContractAddress
        ) -> u256 {
            self.prices.read((token_in, token_out))
        }
    }
}
