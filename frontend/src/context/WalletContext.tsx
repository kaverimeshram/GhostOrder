import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AccountInterface, Contract, RpcProvider, uint256 } from 'starknet';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG, SUPPORTED_TOKENS } from '../config/contracts';
import { ERC20_ABI } from '../config/abis';

interface WalletContextType {
  address: string | null;
  account: AccountInterface | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  strkBalance: bigint;
  strkBalanceFormatted: string;
  provider: RpcProvider;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function toBigIntSafe(val: any): bigint {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') return BigInt(val);
  if (typeof val === 'string') return BigInt(val);
  if (val && typeof val === 'object') {
    if ('balance' in val) return toBigIntSafe(val.balance);
    if ('low' in val && 'high' in val) return uint256.uint256ToBN(val);
  }
  return 0n;
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [strkBalance, setStrkBalance] = useState<bigint>(0n);

  const provider = new RpcProvider({ nodeUrl: NETWORK_CONFIG.rpcUrl });

  const fetchBalance = useCallback(async (accountAddr: string) => {
    try {
      const strkAddress = SUPPORTED_TOKENS[0].address;
      const strkContract = new Contract({
        abi: ERC20_ABI,
        address: strkAddress,
        providerOrAccount: provider
      });
      const res = await strkContract.balanceOf(accountAddr);
      const bal = toBigIntSafe(res);
      setStrkBalance(bal);
    } catch (err) {
      console.warn('Failed to fetch STRK balance:', err);
    }
  }, [provider]);

  const refreshBalance = useCallback(async () => {
    if (address) {
      await fetchBalance(address);
    }
  }, [address, fetchBalance]);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      // 1. Check for browser Starknet wallet objects (Ready X, ArgentX, Braavos)
      const win = window as any;
      const starknetWallet =
        win['starknet_ready'] ||
        win['starknet_argentX'] ||
        win['starknet_braavos'] ||
        win['starknet'];

      if (starknetWallet) {
        await starknetWallet.enable({ starknetVersion: 'v5' });
        if (starknetWallet.isConnected && starknetWallet.selectedAddress) {
          const userAddress = starknetWallet.selectedAddress;
          setAddress(userAddress);
          setAccount(starknetWallet.account);
          await fetchBalance(userAddress);
          setIsConnecting(false);
          return;
        }
      }

      // 2. Check for configured development account in process.env if in local environment
      if (process.env.ACCOUNT_ADDRESS) {
        const fallbackAddress = process.env.ACCOUNT_ADDRESS;
        setAddress(fallbackAddress);
        await fetchBalance(fallbackAddress);
        setIsConnecting(false);
        return;
      }

      throw new Error(
        'No Starknet browser wallet (Ready X / ArgentX / Braavos) detected. Please install a Starknet wallet.'
      );
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setAccount(null);
    setStrkBalance(0n);
  };

  useEffect(() => {
    // Auto-connect dev account or check injected wallet on initial load
    const initCheck = async () => {
      const win = window as any;
      const starknetWallet = win['starknet_ready'] || win['starknet_argentX'] || win['starknet_braavos'] || win['starknet'];
      if (starknetWallet && starknetWallet.isConnected && starknetWallet.selectedAddress) {
        setAddress(starknetWallet.selectedAddress);
        setAccount(starknetWallet.account);
        await fetchBalance(starknetWallet.selectedAddress);
      } else if (process.env.ACCOUNT_ADDRESS) {
        setAddress(process.env.ACCOUNT_ADDRESS);
        await fetchBalance(process.env.ACCOUNT_ADDRESS);
      }
    };
    initCheck();
  }, [fetchBalance]);

  const strkBalanceFormatted = (Number(strkBalance) / 1e18).toFixed(4);

  return (
    <WalletContext.Provider
      value={{
        address,
        account,
        isConnected: !!address,
        isConnecting,
        error,
        strkBalance,
        strkBalanceFormatted,
        provider,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
