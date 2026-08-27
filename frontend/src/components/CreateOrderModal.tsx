import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useOrders } from '../context/OrderContext';
import { SUPPORTED_TOKENS, NETWORK_CONFIG } from '../config/contracts';
import { X, ArrowDown, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isConnected, connect, strkBalanceFormatted } = useWallet();
  const { oraclePriceFormatted, createOrder, txStatus, resetTxStatus } = useOrders();

  const [tokenIn, setTokenIn] = useState<string>(SUPPORTED_TOKENS[0].address);
  const [tokenOut, setTokenOut] = useState<string>(SUPPORTED_TOKENS[1].address);
  const [amountIn, setAmountIn] = useState<string>('0.01');
  const [targetPrice, setTargetPrice] = useState<string>('2.00');
  const [minAmountOut, setMinAmountOut] = useState<string>('0.02');
  const [expiryHours, setExpiryHours] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmountIn = parseFloat(amountIn) || 0;
  const numTargetPrice = parseFloat(targetPrice) || 0;
  const estimatedOutput = (numAmountIn * numTargetPrice).toFixed(4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isConnected) {
      await connect();
      return;
    }

    if (numAmountIn <= 0) {
      setLocalError('Please enter a valid input amount.');
      return;
    }
    if (numTargetPrice <= 0) {
      setLocalError('Please enter a valid target price.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrder(
        tokenIn,
        tokenOut,
        amountIn,
        targetPrice,
        minAmountOut || (numAmountIn * numTargetPrice * 0.95).toFixed(4),
        expiryHours
      );
    } catch (err: any) {
      setLocalError(err.message || 'Transaction submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetTxStatus();
    setLocalError(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              Create Conditional Order
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Active Transaction Banner */}
          {txStatus.stage !== 'idle' && (
            <div className="mb-6 rounded border border-[var(--border-strong)] bg-[var(--bg-tertiary)] p-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                {txStatus.stage === 'submitting' || txStatus.stage === 'waiting' ? (
                  <Loader2 size={16} className="animate-spin text-[var(--color-executable)]" />
                ) : txStatus.stage === 'confirmed' ? (
                  <CheckCircle2 size={16} className="text-[var(--color-executed)]" />
                ) : (
                  <AlertCircle size={16} className="text-[var(--color-cancelled)]" />
                )}
                <span className="font-semibold text-white">
                  {txStatus.stage === 'submitting' && '1/3 Sign Transaction in Wallet'}
                  {txStatus.stage === 'waiting' && '2/3 Confirming on Starknet Sepolia'}
                  {txStatus.stage === 'confirmed' && '3/3 Order Created & Escrow Locked'}
                  {txStatus.stage === 'error' && 'Transaction Reverted'}
                </span>
              </div>

              <div className="mt-2 text-[var(--text-secondary)]">
                {txStatus.message}
              </div>

              {txStatus.txHash && (
                <div className="mt-3 flex items-center gap-1 border-t border-[var(--border-subtle)] pt-2">
                  <a
                    href={`${NETWORK_CONFIG.blockExplorerUrl}/tx/${txStatus.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[var(--color-executable)] hover:underline"
                  >
                    <span>View Transaction on Starkscan</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {localError && (
            <div className="mb-4 flex items-center gap-2 rounded border border-[var(--color-cancelled)]/30 bg-[var(--color-cancelled-bg)] p-3 text-xs text-[var(--color-cancelled)]">
              <AlertCircle size={14} />
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* FROM (Input Token & Amount) */}
            <div className="card-terminal p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="font-mono uppercase font-semibold">From (Escrow Deposit)</span>
                <span className="font-mono">
                  Balance: {strkBalanceFormatted} STRK
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0"
                  className="input-terminal flex-1 text-base font-bold"
                  disabled={isSubmitting}
                  required
                />

                <select
                  value={tokenIn}
                  onChange={(e) => setTokenIn(e.target.value)}
                  className="select-terminal font-semibold"
                  disabled={isSubmitting}
                >
                  <option value={SUPPORTED_TOKENS[0].address}>STRK</option>
                </select>
              </div>
            </div>

            {/* Down Arrow Divider */}
            <div className="flex justify-center -my-2 relative z-10">
              <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-tertiary)] p-1.5 text-[var(--text-muted)]">
                <ArrowDown size={14} />
              </div>
            </div>

            {/* TO (Output Token) */}
            <div className="card-terminal p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="font-mono uppercase font-semibold">To (Target Settlement)</span>
                <span className="font-mono">Est. Output: {estimatedOutput} USDC</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={estimatedOutput}
                  className="input-terminal flex-1 bg-[var(--bg-secondary)] text-base font-bold text-[var(--text-secondary)]"
                />

                <select
                  value={tokenOut}
                  onChange={(e) => setTokenOut(e.target.value)}
                  className="select-terminal font-semibold"
                  disabled={isSubmitting}
                >
                  <option value={SUPPORTED_TOKENS[1].address}>USDC (Mock)</option>
                  <option value={SUPPORTED_TOKENS[2].address}>ETH</option>
                </select>
              </div>
            </div>

            {/* PRICE CONDITION */}
            <div className="card-terminal p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono uppercase font-semibold text-[var(--text-muted)]">
                  Price Trigger Condition
                </span>
                <span className="font-mono text-[var(--text-secondary)]">
                  Oracle Price: <strong className="text-white">${oraclePriceFormatted}</strong>
                </span>
              </div>

              <div className="text-xs text-[var(--text-secondary)]">
                Execute when STRK price is greater than or equal to:
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="2.00"
                    className="input-terminal pl-7"
                    disabled={isSubmitting}
                    required
                  />
                  <span className="absolute left-3 top-2.5 font-mono text-sm text-[var(--text-muted)]">
                    $
                  </span>
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)]">USDC / STRK</span>
              </div>
            </div>

            {/* Order Summary Specs */}
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-3 font-mono text-xs space-y-1.5 text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Escrow Lock:</span>
                <span className="text-white font-medium">{amountIn} STRK</span>
              </div>
              <div className="flex justify-between">
                <span>Min Output:</span>
                <span className="text-white font-medium">{minAmountOut} USDC</span>
              </div>
              <div className="flex justify-between">
                <span>Order Expiry:</span>
                <span className="text-white font-medium">{expiryHours} Hours</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3 text-sm font-semibold tracking-wide uppercase"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing on Starknet...</span>
                  </span>
                ) : !isConnected ? (
                  'Connect Wallet to Create Order'
                ) : (
                  'Approve STRK & Create Order'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
