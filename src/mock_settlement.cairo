#[starknet::contract]
pub mod MockSettlement {
    use core::num::traits::Zero;
    use ghost_orders::types::{IERC20Dispatcher, IERC20DispatcherTrait, IMockSettlement};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        configured_outputs: Map<(ContractAddress, ContractAddress, u256), u256>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        SettlementExecuted: SettlementExecuted,
        OutputAmountConfigured: OutputAmountConfigured,
    }

    #[derive(Drop, starknet::Event)]
    pub struct SettlementExecuted {
        #[key]
        pub token_in: ContractAddress,
        #[key]
        pub token_out: ContractAddress,
        pub amount_in: u256,
        pub output_amount: u256,
        pub recipient: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct OutputAmountConfigured {
        #[key]
        pub token_in: ContractAddress,
        #[key]
        pub token_out: ContractAddress,
        pub amount_in: u256,
        pub output_amount: u256,
    }

    #[constructor]
    pub fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    pub impl MockSettlementImpl of IMockSettlement<ContractState> {
        fn settle(
            ref self: ContractState,
            token_in: ContractAddress,
            token_out: ContractAddress,
            amount_in: u256,
            min_amount_out: u256,
            recipient: ContractAddress,
        ) -> u256 {
            assert(!token_in.is_zero(), 'Token in cannot be 0');
            assert(!token_out.is_zero(), 'Token out cannot be 0');
            assert(!recipient.is_zero(), 'Recipient cannot be 0');

            let configured = self.configured_outputs.read((token_in, token_out, amount_in));
            let output_amount = if configured > 0 {
                configured
            } else {
                min_amount_out
            };

            assert(output_amount >= min_amount_out, 'Output below min_amount_out');

            // Transfer token_out from MockSettlement to the recipient (order owner)
            let token_out_dispatcher = IERC20Dispatcher { contract_address: token_out };
            let success = token_out_dispatcher.transfer(recipient, output_amount);
            assert(success, 'Settlement payout failed');

            self
                .emit(
                    SettlementExecuted {
                        token_in, token_out, amount_in, output_amount, recipient,
                    },
                );

            output_amount
        }

        fn set_output_amount(
            ref self: ContractState,
            token_in: ContractAddress,
            token_out: ContractAddress,
            amount_in: u256,
            output_amount: u256,
        ) {
            self.configured_outputs.write((token_in, token_out, amount_in), output_amount);
            self.emit(OutputAmountConfigured { token_in, token_out, amount_in, output_amount });
        }

        fn get_output_amount(
            self: @ContractState,
            token_in: ContractAddress,
            token_out: ContractAddress,
            amount_in: u256,
        ) -> u256 {
            let configured = self.configured_outputs.read((token_in, token_out, amount_in));
            if configured > 0 {
                configured
            } else {
                0
            }
        }
    }
}
