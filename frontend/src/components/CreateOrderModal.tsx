import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useOrders } from '../context/OrderContext';
import { SUPPORTED_TOKENS, NETWORK_CONFIG } from '../config/contracts';
import { X, ArrowRight, ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
      setLocalError('Please enter a valid amount.');
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
      <div className="modal-content-card">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-4 bg-[#080D18]">
          <h3 className="font-sans text-base font-bold text-white">
            Create Conditional Order
          </h3>

          <button
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-[#050505]">
          {/* Active Transaction Status Banner */}
          {txStatus.stage !== 'idle' && (
            <div className="rounded-xl border border-[rgba(79,124,255,0.3)] bg-[#080D18] p-4 font-mono text-xs shadow-[0_0_20px_rgba(79,124,255,0.15)]">
              <div className="flex items-center gap-2">
                {txStatus.stage === 'submitting' || txStatus.stage === 'waiting' ? (
                  <Loader2 size={16} className="animate-spin text-[var(--accent-blue)]" />
                ) : txStatus.stage === 'confirmed' ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="text-red-400" />
                )}
                <span className="font-semibold text-white">
                  {txStatus.stage === 'submitting' && '1/3 Sign in Starknet Wallet'}
                  {txStatus.stage === 'waiting' && '2/3 Confirming on Sepolia Block'}
                  {txStatus.stage === 'confirmed' && '3/3 Order Created & Escrow Locked'}
                  {txStatus.stage === 'error' && 'Transaction Failed'}
                </span>
              </div>

              <div className="mt-2 text-[var(--text-secondary)] leading-relaxed">
                {txStatus.message}
              </div>

              {txStatus.txHash && (
                <div className="mt-3 flex items-center gap-1 border-t border-[rgba(255,255,255,0.06)] pt-2">
                  <a
                    href={`${NETWORK_CONFIG.blockExplorerUrl}/tx/${txStatus.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[var(--accent-blue)] hover:underline"
                  >
                    <span>View Transaction on Starkscan</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {localError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-400">
              <AlertCircle size={14} />
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            {/* TOKEN TO ESCROW */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span className="uppercase font-semibold">TOKEN TO ESCROW</span>
                <span>Balance: {strkBalanceFormatted} STRK</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={tokenIn}
                  onChange={(e) => setTokenIn(e.target.value)}
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0C1322] px-4 py-2.5 text-sm font-bold text-white outline-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value={SUPPORTED_TOKENS[0].address}>STRK</option>
                </select>

                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0100"
                  className="input-premium flex-1 text-sm font-bold"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* OUTPUT TOKEN */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span className="uppercase font-semibold">OUTPUT TOKEN</span>
                <span>Est. Output: {estimatedOutput} USDC</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={tokenOut}
                  onChange={(e) => setTokenOut(e.target.value)}
                  className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0C1322] px-4 py-2.5 text-sm font-bold text-white outline-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value={SUPPORTED_TOKENS[1].address}>USDC</option>
                  <option value={SUPPORTED_TOKENS[2].address}>ETH</option>
                </select>

                <input
                  type="text"
                  readOnly
                  value={estimatedOutput}
                  className="input-premium flex-1 text-sm font-bold text-[var(--text-secondary)] cursor-not-allowed"
                />
              </div>
            </div>

            {/* TARGET PRICE */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span className="uppercase font-semibold">TARGET PRICE</span>
                <span>Oracle: ${oraclePriceFormatted}</span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="rounded-lg border border-[rgba(255,255,255,0.1)] bg-[#0C1322] px-3.5 py-2.5 text-sm font-bold text-white">
                  ≥
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="2.00"
                  className="input-premium flex-1 text-sm font-bold"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Order Preview Box */}
            <div className="rounded-xl border border-[rgba(79,124,255,0.2)] bg-[#080D18] p-4 text-xs space-y-1 font-sans">
              <div className="font-mono text-[11px] font-semibold text-[var(--accent-blue)] uppercase">
                You are creating:
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                If STRK price reaches <strong className="text-white">${targetPrice || '2.00'}</strong>,{' '}
                <strong className="text-white">{amountIn || '0.0100'} STRK</strong> will be used for settlement.
              </p>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 font-sans">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn-secondary text-xs py-2.5 px-4"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-xs py-2.5 px-5 font-semibold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Broadcasting...</span>
                  </span>
                ) : !isConnected ? (
                  'Connect Wallet'
                ) : (
                  <span>Create Order →</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
