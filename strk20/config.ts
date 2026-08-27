import * as dotenv from 'dotenv';
dotenv.config();

export interface STRK20Config {
  chainId: string;
  rpcUrl: string;
  poolAddress: string;
  strkTokenAddress: string;
  ghostEscrowAddress?: string;
  discoveryUrl?: string;
  provingUrl?: string;
  relayerUrl?: string;
}

export const MAINNET_POOL_ADDRESS = '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a';
export const MAINNET_STRK_TOKEN = '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d';

export function getSTRK20Config(): STRK20Config {
  const chainId = process.env.CHAIN_ID || 'SN_MAIN';
  const rpcUrl = process.env.STARKNET_RPC_URL || 'https://rpc.starknet.lava.build';
  const poolAddress = process.env.STRK20_POOL_ADDRESS || MAINNET_POOL_ADDRESS;
  const strkTokenAddress = process.env.STRK_TOKEN_ADDRESS || MAINNET_STRK_TOKEN;
  const ghostEscrowAddress = process.env.GHOST_ESCROW_ADDRESS;

  return {
    chainId,
    rpcUrl,
    poolAddress,
    strkTokenAddress,
    ghostEscrowAddress,
    discoveryUrl: process.env.STRK20_DISCOVERY_URL,
    provingUrl: process.env.STRK20_PROVING_URL,
    relayerUrl: process.env.STRK20_RELAYER_URL,
  };
}
