import { Call, RpcProvider, WalletAccountV6 } from 'starknet';

export type STRK20_DAPP_NAME = string;

export type STRK20_COLLECT_POLICY =
  | { type: 'all' }
  | { type: 'diff' }
  | { type: 'exact'; amount: string };

export type STRK20_CALLDATA_ITEM = string;

export interface STRK20_DEPOSIT_ACTION {
  type: 'deposit';
  token: string;
  amount: string;
}

export interface STRK20_WITHDRAW_ACTION {
  type: 'withdraw';
  token: string;
  amount: string;
  recipient: string;
}

export interface STRK20_TRANSFER_ACTION {
  type: 'transfer';
  token: string;
  amount: string | 'OPEN';
  recipient: string;
}

export interface STRK20_INVOKE_ACTION {
  type: 'invoke';
  contract: string;
  calldata: STRK20_CALLDATA_ITEM[];
}

export interface STRK20_SHADOW_ACCOUNT_INVOKE_ACTION {
  type: 'shadow_account_invoke';
  dapp_name: STRK20_DAPP_NAME;
  nonce: string;
  calls: Call[];
  collect_policy: STRK20_COLLECT_POLICY;
}

export type STRK20Action =
  | STRK20_DEPOSIT_ACTION
  | STRK20_WITHDRAW_ACTION
  | STRK20_TRANSFER_ACTION
  | STRK20_INVOKE_ACTION
  | STRK20_SHADOW_ACCOUNT_INVOKE_ACTION;

export interface PreparedSTRK20Transaction {
  actions: STRK20Action[];
  status: 'prepared' | 'ready_for_wallet_signature' | 'submitted';
  calls?: Call[];
  proof?: any;
  notes?: string;
}

/**
 * Creates a standard WalletAccountV6 instance.
 * In a browser environment, walletProvider is supplied by standard get-starknet v6 (e.g. ArgentX or Braavos).
 * In a Node.js CLI environment, we supply a provider and mock adapter to test API signatures and parameter serialization.
 */
export function createWalletAccountAdapter(
  provider: RpcProvider,
  accountAddress: string,
  customWalletProvider?: any
): WalletAccountV6 {
  const defaultWalletProvider = customWalletProvider || {
    features: {
      'standard:events': {
        on: (_event: string, _callback: Function) => {
          return () => {};
        },
      },
      'starknet:walletApi': {
        request: async (request: { type: string; params?: any }) => {
          if (request.type === 'wallet_requestAccounts') {
            return [accountAddress];
          }
          throw new Error(
            `Browser wallet extension required for request '${request.type}'. In CLI/testing mode, connect via a browser dApp.`
          );
        },
      },
    },
  };

  return new WalletAccountV6({
    provider,
    walletProvider: defaultWalletProvider,
    address: accountAddress,
  });
}
