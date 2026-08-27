export enum OrderStatus {
  Active = 0,
  Executed = 1,
  Cancelled = 2,
}

export interface OnChainOrder {
  id: bigint;
  owner: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  targetPrice: bigint;
  minAmountOut: bigint;
  expiry: bigint;
  status: OrderStatus;
  isExecutable: boolean;
  currentOraclePrice?: bigint;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
}

export interface ProtocolStats {
  totalOrders: number;
  activeOrders: number;
  executedOrders: number;
  cancelledOrders: number;
  currentOraclePrice: bigint;
  strkBalance: bigint;
  ethBalance: bigint;
}
