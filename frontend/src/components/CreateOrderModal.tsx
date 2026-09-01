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
  const [timeConditionEnabled, setTimeConditionEnabled] = useState<boolean>(false);
  const [timeConditionHours, setTimeConditionHours] = useState<number>(1);
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
        expiryHours,
        timeConditionEnabled,
        timeConditionEnabled ? Math.floor(Date.now() / 1000) + timeConditionHours * 3600 : undefined
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
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4 bg-surface text-left">
          <h3 className="font-display text-[16px] font-bold text-text-primary tracking-tight">
            Create Conditional Order
          </h3>

          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary transition p-1 cursor-pointer bg-transparent border-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 bg-bg text-left">
          {/* Active Transaction Status Banner */}
          {txStatus.stage !== 'idle' && (
            <div className="rounded-lg border border-phosphor/20 bg-surface-2 p-4 font-mono text-xs">
              <div className="flex items-center gap-2">
                {txStatus.stage === 'submitting' || txStatus.stage === 'waiting' ? (
                  <Loader2 size={14} className="animate-spin text-phosphor" />
                ) : txStatus.stage === 'confirmed' ? (
                  <span className="text-phosphor font-bold">✓</span>
                ) : (
                  <span className="text-danger font-bold">!</span>
                )}
                <span className="font-semibold text-text-primary">
                  {txStatus.stage === 'submitting' && '1/3 Sign in Starknet Wallet'}
                  {txStatus.stage === 'waiting' && '2/3 Confirming on Sepolia Block'}
                  {txStatus.stage === 'confirmed' && '3/3 Order Created & Escrow Locked'}
                  {txStatus.stage === 'error' && 'Transaction Failed'}
                </span>
              </div>

              <div className="mt-2 text-text-secondary leading-relaxed">
                {txStatus.message}
              </div>

              {txStatus.txHash && (
                <div className="mt-3 flex items-center gap-1 border-t border-border-soft pt-2">
                  <a
                    href={`${NETWORK_CONFIG.blockExplorerUrl}/tx/${txStatus.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-phosphor hover:underline decoration-none"
                  >
                    <span>View Transaction on Starkscan</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}

          {localError && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/25 bg-danger/5 p-3 text-xs text-danger font-mono">
              <AlertCircle size={14} />
              <span>{localError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            {/* TOKEN TO ESCROW */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span className="mono tracking-wide">TOKEN TO ESCROW</span>
                <span>Balance: {strkBalanceFormatted} STRK</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={tokenIn}
                  onChange={(e) => setTokenIn(e.target.value)}
                  className="mono rounded-lg border border-border-soft bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-primary outline-none cursor-pointer focus:border-phosphor/40"
                  disabled={isSubmitting}
                >
                  <option value={SUPPORTED_TOKENS[0].address} className="bg-surface text-text-primary">STRK</option>
                </select>

                <input
                  type="number"
                  step="0.001"
                  min="0.0001"
                  value={amountIn}
                  onChange={(e) => setAmountIn(e.target.value)}
                  placeholder="0.0100"
                  className="input-premium flex-1 text-sm font-medium"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* OUTPUT TOKEN */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-text-muted">
                <span className="mono tracking-wide">OUTPUT TOKEN</span>
                <span>Est. Output: {estimatedOutput} USDC</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={tokenOut}
                  onChange={(e) => setTokenOut(e.target.value)}
                  className="mono rounded-lg border border-border-soft bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-primary outline-none cursor-pointer focus:border-phosphor/40"
                  disabled={isSubmitting}
                >
                  <option value={SUPPORTED_TOKENS[1].address} className="bg-surface text-text-primary">USDC</option>
                  <option value={SUPPORTED_TOKENS[2].address} className="bg-surface text-text-primary">ETH</option>
                </select>

                <input
                  type="text"
                  readOnly
                  value={estimatedOutput}
                  className="input-premium flex-1 text-sm font-medium text-text-secondary cursor-not-allowed bg-surface-2"
                />
              </div>
            </div>

            {/* CONDITIONAL ENGINE - WHEN / AND / THEN */}
            <div className="space-y-4 border-t border-border-soft pt-4">
              <div className="mono text-[10px] text-phosphor tracking-widest">// PROGRAMMABLE CONDITIONS</div>

              {/* WHEN PRICE CONDITION */}
              <div className="space-y-1.5 p-3 rounded-lg bg-surface-2 border border-border-soft">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span className="font-bold text-text-primary">WHEN PRICE</span>
                  <span>Oracle: ${oraclePriceFormatted}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    disabled
                    className="rounded-lg border border-border-soft bg-surface-3 px-3 py-2 text-xs font-medium text-text-secondary outline-none"
                  >
                    <option>STRK Price</option>
                  </select>
                  <div className="rounded-lg border border-border-soft bg-surface-3 px-3 py-2 text-xs font-medium text-text-secondary">
                    ≥
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="2.00"
                    className="input-premium flex-1 text-sm font-medium"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* AND TIME CONDITION */}
              <div className="space-y-2 p-3 rounded-lg bg-surface-2 border border-border-soft">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-text-muted select-none">
                    <input
                      type="checkbox"
                      checked={timeConditionEnabled}
                      onChange={(e) => setTimeConditionEnabled(e.target.checked)}
                      disabled={isSubmitting}
                      className="rounded border-border-soft bg-surface bg-surface-2 text-phosphor focus:ring-phosphor cursor-pointer"
                    />
                    <span className={timeConditionEnabled ? "text-text-primary font-bold" : "text-text-muted"}>
                      AND TIME CONDITION
                    </span>
                  </label>
                </div>

                {timeConditionEnabled && (
                  <div className="flex gap-2 items-center pt-1">
                    <div className="text-xs font-medium text-text-secondary pr-1">Current +</div>
                    <select
                      value={timeConditionHours}
                      onChange={(e) => setTimeConditionHours(Number(e.target.value))}
                      className="rounded-lg border border-border-soft bg-surface-3 px-3 py-2 text-xs font-medium text-text-primary outline-none cursor-pointer focus:border-phosphor/40"
                      disabled={isSubmitting}
                    >
                      <option value={1}>1 hour</option>
                      <option value={2}>2 hours</option>
                      <option value={6}>6 hours</option>
                      <option value={12}>12 hours</option>
                      <option value={24}>24 hours</option>
                    </select>
                    <div className="text-xs text-text-muted font-mono">
                      (~ {new Date(Date.now() + timeConditionHours * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Preview Box */}
            <div className="rounded-lg border border-phosphor/25 bg-surface-2 p-4 text-xs space-y-2 font-mono">
              <div className="mono text-[10px] text-phosphor tracking-widest">
                EXECUTION PREVIEW:
              </div>
              <div className="text-text-secondary leading-relaxed font-mono text-[12px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-phosphor font-bold">WHEN</span>
                  <span>STRK Price &ge; ${targetPrice || '2.00'}</span>
                </div>
                {timeConditionEnabled && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-phosphor font-bold">AND</span>
                    <span>Time &ge; {timeConditionHours}h from now (~ {new Date(Date.now() + timeConditionHours * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-2 border-t border-border-soft pt-2">
                  <span className="text-phosphor font-bold">THEN</span>
                  <span>Swap {amountIn || '0.0100'} STRK &rarr; {estimatedOutput} USDC (Min: {minAmountOut || (numAmountIn * numTargetPrice * 0.95).toFixed(4)} USDC)</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn-secondary !px-4 !py-2 text-[12.5px]"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary !px-4 !py-2 text-[12.5px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
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
