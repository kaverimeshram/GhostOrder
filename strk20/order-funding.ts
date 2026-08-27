import { Call, CallData, hash, uint256 } from 'starknet';
import {
  STRK20_SHADOW_ACCOUNT_INVOKE_ACTION,
  STRK20_WITHDRAW_ACTION,
  STRK20Action,
} from './wallet';

export interface GhostOrderParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint | string;
  targetPrice: bigint | string;
  minAmountOut: bigint | string;
  expiry: number | bigint;
}

/**
 * Encodes an ERC20 `approve` call targeting GhostEscrow.
 */
export function encodeApproveCall(
  tokenIn: string,
  spenderEscrow: string,
  amountIn: bigint | string
): Call {
  const amountBn = BigInt(amountIn);
  const amountU256 = uint256.bnToUint256(amountBn);

  return {
    contractAddress: tokenIn,
    entrypoint: 'approve',
    calldata: CallData.compile([spenderEscrow, amountU256.low, amountU256.high]),
  };
}

/**
 * Encodes a `create_order` call for GhostEscrow.
 * Calldata layout matching GhostEscrow.create_order ABI:
 * 1. token_in (felt)
 * 2. token_out (felt)
 * 3. amount_in (u256: low, high)
 * 4. target_price (u256: low, high)
 * 5. min_amount_out (u256: low, high)
 * 6. expiry (u64 / felt)
 */
export function encodeCreateOrderCall(
  ghostEscrowAddress: string,
  params: GhostOrderParams
): Call {
  const amountInU256 = uint256.bnToUint256(BigInt(params.amountIn));
  const targetPriceU256 = uint256.bnToUint256(BigInt(params.targetPrice));
  const minAmountOutU256 = uint256.bnToUint256(BigInt(params.minAmountOut));
  const expiryFelt = BigInt(params.expiry).toString();

  return {
    contractAddress: ghostEscrowAddress,
    entrypoint: 'create_order',
    calldata: CallData.compile([
      params.tokenIn,
      params.tokenOut,
      amountInU256.low,
      amountInU256.high,
      targetPriceU256.low,
      targetPriceU256.high,
      minAmountOutU256.low,
      minAmountOutU256.high,
      expiryFelt,
    ]),
  };
}

/**
 * Builds STRK20 privacy actions for funding a GhostOrder using the Shadow Account pattern.
 * The user's wallet executes calls through a deterministic, unlinked shadow account,
 * funding the escrow while decoupling the user's permanent address from the order.
 */
export function buildShadowAccountOrderFundingAction(
  ghostEscrowAddress: string,
  params: GhostOrderParams,
  nonce: string = '0x0'
): STRK20_SHADOW_ACCOUNT_INVOKE_ACTION {
  const approveCall = encodeApproveCall(params.tokenIn, ghostEscrowAddress, params.amountIn);
  const createOrderCall = encodeCreateOrderCall(ghostEscrowAddress, params);

  return {
    type: 'shadow_account_invoke',
    dapp_name: 'GhostOrder',
    nonce,
    calls: [approveCall, createOrderCall],
    collect_policy: { type: 'diff' },
  };
}

/**
 * Builds STRK20 privacy actions for funding a GhostOrder using the Unshield & Ephemeral Funding pattern.
 * Unshields exact token_in amount to an unlinked recipient account, which subsequently creates the order.
 */
export function buildUnshieldOrderFundingActions(
  ghostEscrowAddress: string,
  params: GhostOrderParams,
  unlinkedRecipientAddress: string
): {
  unshieldAction: STRK20_WITHDRAW_ACTION;
  subsequentCalls: Call[];
} {
  const unshieldAction: STRK20_WITHDRAW_ACTION = {
    type: 'withdraw',
    token: params.tokenIn,
    amount: BigInt(params.amountIn).toString(),
    recipient: unlinkedRecipientAddress,
  };

  const approveCall = encodeApproveCall(params.tokenIn, ghostEscrowAddress, params.amountIn);
  const createOrderCall = encodeCreateOrderCall(ghostEscrowAddress, params);

  return {
    unshieldAction,
    subsequentCalls: [approveCall, createOrderCall],
  };
}

/**
 * Computes selector for create_order verification.
 */
export function getCreateOrderSelector(): string {
  return hash.getSelectorFromName('create_order');
}
