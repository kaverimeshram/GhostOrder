import { TokenInfo } from '../types/contracts';

export const CONTRACT_ADDRESSES = {
  ghostEscrow:
    process.env.GHOST_ESCROW_ADDRESS ||
    '0x05ac12e8a803d62ce65883a6352d1a38e7718b513721da2a5a0aeb2b79c6d53f',
  oracle:
    process.env.ORACLE_ADDRESS ||
    '0x063cc916c44b0ca8e6394adbead8a30aa3c1c3de6355f1d060e2962eed5883f2',
  settlement:
    process.env.SETTLEMENT_ADDRESS ||
    '0x06a24514c06e79b6879321b2d178f5d58848dc31e5c9aac5a0c51fd6bb6bf87e',
};

export const NETWORK_CONFIG = {
  rpcUrl:
    process.env.STARKNET_RPC_URL ||
    'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/demo',
  chainId: process.env.CHAIN_ID || 'SN_SEPOLIA',
  networkName: 'Starknet Sepolia',
  blockExplorerUrl: 'https://sepolia.starkscan.co',
};

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'STRK',
    name: 'Starknet Token',
    address: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    decimals: 18,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (Mock)',
    address: '0x072761a60da419b3f60b6e72900478f9bade6e01a0cfbdc8c49a69253fb8936f',
    decimals: 18,
  },
  {
    symbol: 'ETH',
    name: 'Ether',
    address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    decimals: 18,
  },
];

export function getTokenByAddress(address: string): TokenInfo {
  const normalized = address.toLowerCase();
  const found = SUPPORTED_TOKENS.find(
    (t) =>
      t.address.toLowerCase() === normalized ||
      BigInt(t.address).toString(16) === BigInt(address || '0x0').toString(16)
  );
  if (found) return found;
  return {
    symbol: `${address.slice(0, 6)}...${address.slice(-4)}`,
    name: 'Unknown Token',
    address,
    decimals: 18,
  };
}
