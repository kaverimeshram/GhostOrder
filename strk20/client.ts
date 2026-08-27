import { RpcProvider, WalletAccountV6 } from 'starknet';
import { getSTRK20Config, STRK20Config } from './config';
import {
  GhostOrderParams,
  buildShadowAccountOrderFundingAction,
  buildUnshieldOrderFundingActions,
  encodeApproveCall,
  encodeCreateOrderCall,
} from './order-funding';
import { deriveViewingKeyFromSignature, ViewingKeyDerivationResult } from './viewing-key';
import {
  STRK20_DEPOSIT_ACTION,
  STRK20_SHADOW_ACCOUNT_INVOKE_ACTION,
  STRK20_TRANSFER_ACTION,
  STRK20_WITHDRAW_ACTION,
  STRK20Action,
  PreparedSTRK20Transaction,
} from './wallet';

export class STRK20Client {
  private config: STRK20Config;
  private provider: RpcProvider;

  constructor(customConfig?: Partial<STRK20Config>) {
    const baseConfig = getSTRK20Config();
    this.config = { ...baseConfig, ...customConfig };
    this.provider = new RpcProvider({ nodeUrl: this.config.rpcUrl });
  }

  public getConfig(): STRK20Config {
    return this.config;
  }

  public getProvider(): RpcProvider {
    return this.provider;
  }

  /**
   * Verifies live connectivity to the Starknet RPC provider and retrieves current block height.
   */
  public async verifyNetworkConnection(): Promise<{ chainId: string; blockNumber: number }> {
    const blockNumber = await this.provider.getBlockNumber();
    const chainId = await this.provider.getChainId();
    return { chainId, blockNumber };
  }

  /**
   * Checks if the configured STRK20 Shielded Pool contract is deployed on-chain and returns its class hash.
   */
  public async verifyPoolDeployment(): Promise<{ deployed: boolean; classHash?: string; error?: string }> {
    try {
      const classHash = await this.provider.getClassHashAt(this.config.poolAddress);
      return { deployed: true, classHash };
    } catch (err: any) {
      return { deployed: false, error: err.message };
    }
  }

  /**
   * Derives a deterministic private viewing key according to the official STRK20 specification.
   */
  public deriveViewingKey(signature: { r: string | bigint; s: string | bigint }): ViewingKeyDerivationResult {
    return deriveViewingKeyFromSignature(this.config.chainId, this.config.poolAddress, signature);
  }

  /**
   * Builds an action payload to shield ERC20 tokens into the STRK20 pool.
   */
  public buildShieldAction(tokenAddress: string, amount: string): STRK20_DEPOSIT_ACTION {
    return {
      type: 'deposit',
      token: tokenAddress,
      amount,
    };
  }

  /**
   * Builds an action payload for a private note-to-note transfer.
   */
  public buildPrivateTransferAction(
    tokenAddress: string,
    amount: string,
    recipient: string
  ): STRK20_TRANSFER_ACTION {
    return {
      type: 'transfer',
      token: tokenAddress,
      amount,
      recipient,
    };
  }

  /**
   * Builds a Shadow Account order funding action for GhostEscrow.
   */
  public buildShadowAccountOrderFunding(
    ghostEscrowAddress: string,
    params: GhostOrderParams,
    nonce: string = '0x0'
  ): STRK20_SHADOW_ACCOUNT_INVOKE_ACTION {
    return buildShadowAccountOrderFundingAction(ghostEscrowAddress, params, nonce);
  }

  /**
   * Builds an Unshield & Order Creation workflow for GhostEscrow.
   */
  public buildUnshieldOrderFunding(
    ghostEscrowAddress: string,
    params: GhostOrderParams,
    unlinkedRecipient: string
  ) {
    return buildUnshieldOrderFundingActions(ghostEscrowAddress, params, unlinkedRecipient);
  }

  /**
   * Encodes standard GhostEscrow calls (approve + create_order).
   */
  public encodeOrderCalls(ghostEscrowAddress: string, params: GhostOrderParams) {
    return {
      approveCall: encodeApproveCall(params.tokenIn, ghostEscrowAddress, params.amountIn),
      createOrderCall: encodeCreateOrderCall(ghostEscrowAddress, params),
    };
  }

  /**
   * Prepares a privacy transaction using WalletAccountV6.
   * Invokes strk20PrepareInvoke on the connected wallet to generate SNIP-36 proof & calls.
   */
  public async preparePrivacyTransaction(
    walletAccount: WalletAccountV6,
    actions: STRK20Action[]
  ): Promise<PreparedSTRK20Transaction> {
    try {
      const result: any = await (walletAccount as any).strk20PrepareInvoke(actions);
      return {
        actions,
        status: 'prepared',
        calls: result.call ? [result.call] : result.calls,
        proof: result.proof,
        notes: 'Successfully generated SNIP-36 proof and call payload via wallet.',
      };
    } catch (err: any) {
      return {
        actions,
        status: 'ready_for_wallet_signature',
        notes: `Wallet interaction boundary reached: ${err.message}`,
      };
    }
  }
}
