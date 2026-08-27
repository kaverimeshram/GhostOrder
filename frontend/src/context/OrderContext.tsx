import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { CallData, Contract, cairo, uint256 } from 'starknet';
import { OnChainOrder, OrderStatus, ProtocolStats } from '../types/contracts';
import { CONTRACT_ADDRESSES, SUPPORTED_TOKENS } from '../config/contracts';
import { GHOST_ESCROW_ABI, MOCK_ORACLE_ABI, ERC20_ABI } from '../config/abis';
import { useWallet } from './WalletContext';

export interface TxStatusState {
  stage: 'idle' | 'approving' | 'submitting' | 'waiting' | 'confirmed' | 'error';
  txHash?: string;
  message?: string;
}

interface OrderContextType {
  orders: OnChainOrder[];
  stats: ProtocolStats;
  oraclePrice: bigint;
  oraclePriceFormatted: string;
  isLoading: boolean;
  txStatus: TxStatusState;
  selectedOrder: OnChainOrder | null;
  setSelectedOrder: (order: OnChainOrder | null) => void;
  createOrder: (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    targetPrice: string,
    minAmountOut: string,
    expiryHours: number
  ) => Promise<string>;
  executeOrder: (orderId: bigint) => Promise<string>;
  cancelOrder: (orderId: bigint) => Promise<string>;
  refreshOrders: () => Promise<void>;
  resetTxStatus: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

function toBigIntSafe(val: any): bigint {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') return BigInt(val);
  if (typeof val === 'string') return BigInt(val);
  if (val && typeof val === 'object') {
    if ('price' in val) return toBigIntSafe(val.price);
    if ('count' in val) return toBigIntSafe(val.count);
    if ('balance' in val) return toBigIntSafe(val.balance);
    if ('low' in val && 'high' in val) return uint256.uint256ToBN(val);
  }
  return 0n;
}

function parseOrderStatus(status: any): OrderStatus {
  if (status && typeof status === 'object') {
    if (typeof status.activeVariant === 'function') {
      const v = status.activeVariant();
      if (v === 'Executed') return OrderStatus.Executed;
      if (v === 'Cancelled') return OrderStatus.Cancelled;
      return OrderStatus.Active;
    }
    if (status.variant) {
      if (status.variant.Executed !== undefined) return OrderStatus.Executed;
      if (status.variant.Cancelled !== undefined) return OrderStatus.Cancelled;
      if (status.variant.Active !== undefined) return OrderStatus.Active;
    }
    if ('Executed' in status) return OrderStatus.Executed;
    if ('Cancelled' in status) return OrderStatus.Cancelled;
  }
  const num = Number(status);
  if (num === 1) return OrderStatus.Executed;
  if (num === 2) return OrderStatus.Cancelled;
  return OrderStatus.Active;
}

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { account, provider, refreshBalance } = useWallet();
  const [orders, setOrders] = useState<OnChainOrder[]>([]);
  const [oraclePrice, setOraclePrice] = useState<bigint>(2500000000000000000n); // Default 2.50
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<OnChainOrder | null>(null);
  const [txStatus, setTxStatus] = useState<TxStatusState>({ stage: 'idle' });

  const [stats, setStats] = useState<ProtocolStats>({
    totalOrders: 0,
    activeOrders: 0,
    executedOrders: 0,
    cancelledOrders: 0,
    currentOraclePrice: 2500000000000000000n,
    strkBalance: 0n,
    ethBalance: 0n,
  });

  const resetTxStatus = () => setTxStatus({ stage: 'idle' });

  const fetchOnChainData = useCallback(async () => {
    try {
      const escrowContract = new Contract({
        abi: GHOST_ESCROW_ABI,
        address: CONTRACT_ADDRESSES.ghostEscrow,
        providerOrAccount: provider,
      });

      const oracleContract = new Contract({
        abi: MOCK_ORACLE_ABI,
        address: CONTRACT_ADDRESSES.oracle,
        providerOrAccount: provider,
      });

      // 1. Fetch Oracle Price for STRK -> USDC
      const strkAddress = SUPPORTED_TOKENS[0].address;
      const usdcAddress = SUPPORTED_TOKENS[1].address;
      let currentPrice = 2500000000000000000n;
      try {
        const rawPrice = await oracleContract.get_price(strkAddress, usdcAddress);
        currentPrice = toBigIntSafe(rawPrice);
        setOraclePrice(currentPrice);
      } catch (err) {
        console.warn('Failed to fetch oracle price:', err);
      }

      // 2. Fetch Total Orders Count
      const countRes = await escrowContract.get_order_count();
      const count = Number(toBigIntSafe(countRes));

      const fetchedOrders: OnChainOrder[] = [];
      let activeCount = 0;
      let executedCount = 0;
      let cancelledCount = 0;

      // 3. Fetch Each Order (1-indexed in Cairo contract)
      for (let i = 1; i <= count; i++) {
        try {
          const rawOrder: any = await escrowContract.get_order(i);
          let isExec = false;
          try {
            const isExecRes = await escrowContract.is_order_executable(i);
            isExec = Boolean(isExecRes);
          } catch {
            isExec = false;
          }

          const data = rawOrder?.order || rawOrder || {};
          const statusEnum = parseOrderStatus(data.status);

          if (statusEnum === OrderStatus.Active) activeCount++;
          else if (statusEnum === OrderStatus.Executed) executedCount++;
          else if (statusEnum === OrderStatus.Cancelled) cancelledCount++;

          const formatAddress = (val: any) => {
            if (!val) return '';
            try {
              if (typeof val === 'bigint') return `0x${val.toString(16).padStart(64, '0')}`;
              if (typeof val === 'string') return val.startsWith('0x') ? val : `0x${BigInt(val).toString(16).padStart(64, '0')}`;
              return String(val);
            } catch {
              return String(val || '');
            }
          };

          const formattedOwner = formatAddress(data.owner);
          const formattedTokenIn = formatAddress(data.token_in);
          const formattedTokenOut = formatAddress(data.token_out);

          fetchedOrders.push({
            id: BigInt(i),
            owner: formattedOwner,
            tokenIn: formattedTokenIn,
            tokenOut: formattedTokenOut,
            amountIn: toBigIntSafe(data.amount_in),
            targetPrice: toBigIntSafe(data.target_price),
            minAmountOut: toBigIntSafe(data.min_amount_out),
            expiry: toBigIntSafe(data.expiry),
            status: statusEnum,
            isExecutable: isExec,
            currentOraclePrice: currentPrice,
          });
        } catch (err) {
          console.warn(`Failed to fetch order #${i}:`, err);
        }
      }

      // Sort newest orders first
      fetchedOrders.reverse();
      setOrders(fetchedOrders);

      setStats({
        totalOrders: count,
        activeOrders: activeCount,
        executedOrders: executedCount,
        cancelledOrders: cancelledCount,
        currentOraclePrice: currentPrice,
        strkBalance: 0n,
        ethBalance: 0n,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching on-chain data:', err);
      setIsLoading(false);
    }
  }, [provider]);

  useEffect(() => {
    fetchOnChainData();
    const interval = setInterval(fetchOnChainData, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, [fetchOnChainData]);

  // Create Order Flow
  const createOrder = async (
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    targetPrice: string,
    minAmountOut: string,
    expiryHours: number
  ): Promise<string> => {
    if (!account) {
      throw new Error('Please connect your Starknet wallet first.');
    }

    try {
      setTxStatus({ stage: 'submitting', message: 'Requesting wallet signature...' });

      const amountInBN = BigInt(Math.floor(parseFloat(amountIn) * 1e18));
      const targetPriceBN = BigInt(Math.floor(parseFloat(targetPrice) * 1e18));
      const minAmountOutBN = BigInt(Math.floor(parseFloat(minAmountOut) * 1e18));
      const expiryBN = BigInt(Math.floor(Date.now() / 1000) + expiryHours * 3600);

      const strkContract = new Contract({
        abi: ERC20_ABI,
        address: tokenIn,
        providerOrAccount: account,
      });

      const escrowContract = new Contract({
        abi: GHOST_ESCROW_ABI,
        address: CONTRACT_ADDRESSES.ghostEscrow,
        providerOrAccount: account,
      });

      const approveCall = strkContract.populate('approve', {
        spender: CONTRACT_ADDRESSES.ghostEscrow,
        amount: cairo.uint256(amountInBN),
      });

      const createCall = escrowContract.populate('create_order', {
        token_in: tokenIn,
        token_out: tokenOut,
        amount_in: cairo.uint256(amountInBN),
        target_price: cairo.uint256(targetPriceBN),
        min_amount_out: cairo.uint256(minAmountOutBN),
        expiry: expiryBN,
      });

      const res = await account.execute([approveCall, createCall]);
      const txHash = res.transaction_hash;

      setTxStatus({
        stage: 'waiting',
        txHash,
        message: 'Transaction submitted. Waiting for L2 block acceptance...',
      });

      await provider.waitForTransaction(txHash);
      await refreshBalance();
      await fetchOnChainData();

      setTxStatus({
        stage: 'confirmed',
        txHash,
        message: 'Order created and escrow locked successfully!',
      });

      return txHash;
    } catch (err: any) {
      console.error('Failed to create order:', err);
      setTxStatus({
        stage: 'error',
        message: err.message || 'Failed to create order on Starknet.',
      });
      throw err;
    }
  };

  // Execute Order Flow
  const executeOrder = async (orderId: bigint): Promise<string> => {
    if (!account) {
      throw new Error('Please connect your Starknet wallet first.');
    }

    try {
      setTxStatus({ stage: 'submitting', message: `Executing Order #${orderId}...` });

      const escrowContract = new Contract({
        abi: GHOST_ESCROW_ABI,
        address: CONTRACT_ADDRESSES.ghostEscrow,
        providerOrAccount: account,
      });

      const res = await escrowContract.execute_order(orderId);
      const txHash = res.transaction_hash;

      setTxStatus({
        stage: 'waiting',
        txHash,
        message: `Order #${orderId} execution broadcasted. Waiting for settlement...`,
      });

      await provider.waitForTransaction(txHash);
      await refreshBalance();
      await fetchOnChainData();

      setTxStatus({
        stage: 'confirmed',
        txHash,
        message: `Order #${orderId} settled and executed successfully!`,
      });

      return txHash;
    } catch (err: any) {
      console.error('Failed to execute order:', err);
      setTxStatus({
        stage: 'error',
        message: err.message || 'Order execution failed or reverted.',
      });
      throw err;
    }
  };

  // Cancel Order Flow
  const cancelOrder = async (orderId: bigint): Promise<string> => {
    if (!account) {
      throw new Error('Please connect your Starknet wallet first.');
    }

    try {
      setTxStatus({ stage: 'submitting', message: `Cancelling Order #${orderId}...` });

      const escrowContract = new Contract({
        abi: GHOST_ESCROW_ABI,
        address: CONTRACT_ADDRESSES.ghostEscrow,
        providerOrAccount: account,
      });

      const res = await escrowContract.cancel_order(orderId);
      const txHash = res.transaction_hash;

      setTxStatus({
        stage: 'waiting',
        txHash,
        message: `Cancel request submitted for Order #${orderId}. Waiting for refund...`,
      });

      await provider.waitForTransaction(txHash);
      await refreshBalance();
      await fetchOnChainData();

      setTxStatus({
        stage: 'confirmed',
        txHash,
        message: `Order #${orderId} cancelled and STRK refunded to owner!`,
      });

      return txHash;
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      setTxStatus({
        stage: 'error',
        message: err.message || 'Order cancellation failed.',
      });
      throw err;
    }
  };

  const oraclePriceFormatted = (Number(oraclePrice) / 1e18).toFixed(2);

  return (
    <OrderContext.Provider
      value={{
        orders,
        stats,
        oraclePrice,
        oraclePriceFormatted,
        isLoading,
        txStatus,
        selectedOrder,
        setSelectedOrder,
        createOrder,
        executeOrder,
        cancelOrder,
        refreshOrders: fetchOnChainData,
        resetTxStatus,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
