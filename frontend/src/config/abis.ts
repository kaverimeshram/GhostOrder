import ESCROW_ABI from './escrow_abi.json';
import ESCROW_V2_ABI from './escrow_v2_abi.json';
import ORACLE_ABI from './oracle_abi.json';
import SETTLEMENT_ABI from './settlement_abi.json';

export const GHOST_ESCROW_ABI = ESCROW_ABI;
export const GHOST_ESCROW_V2_ABI = ESCROW_V2_ABI;
export const MOCK_ORACLE_ABI = ORACLE_ABI;
export const MOCK_SETTLEMENT_ABI = SETTLEMENT_ABI;

export const ERC20_ABI = [
  {
    name: 'name',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'name', type: 'core::byte_array::ByteArray' }],
    state_mutability: 'view'
  },
  {
    name: 'symbol',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'symbol', type: 'core::byte_array::ByteArray' }],
    state_mutability: 'view'
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: 'decimals', type: 'core::integer::u8' }],
    state_mutability: 'view'
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'balance', type: 'core::integer::u256' }],
    state_mutability: 'view'
  },
  {
    name: 'balance_of',
    type: 'function',
    inputs: [{ name: 'account', type: 'core::starknet::contract_address::ContractAddress' }],
    outputs: [{ name: 'balance', type: 'core::integer::u256' }],
    state_mutability: 'view'
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'amount', type: 'core::integer::u256' }
    ],
    outputs: [{ name: 'success', type: 'core::bool' }],
    state_mutability: 'external'
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [
      { name: 'owner', type: 'core::starknet::contract_address::ContractAddress' },
      { name: 'spender', type: 'core::starknet::contract_address::ContractAddress' }
    ],
    outputs: [{ name: 'remaining', type: 'core::integer::u256' }],
    state_mutability: 'view'
  }
];
