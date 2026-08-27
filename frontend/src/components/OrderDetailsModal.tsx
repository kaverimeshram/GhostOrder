import React, { useState } from 'react';
import { OnChainOrder, OrderStatus } from '../types/contracts';
import { getTokenByAddress, NETWORK_CONFIG, CONTRACT_ADDRESSES } from '../config/contracts';
import { useOrders } from '../context/OrderContext';
import { useWallet } from '../context/WalletContext';
import {
  X,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Play,
  Copy,
  Clock,
  Check,
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: OnChainOrder | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
}) => {
  const { oraclePriceFormatted, executeOrder, cancelOrder } = useOrders();
  const { isConnected } = useWallet();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (!order) return null;

  const tokenInInfo = getTokenByAddress(order.tokenIn);
  const tokenOutInfo = getTokenByAddress(order.tokenOut);

  const formattedAmountIn = (Number(order.amountIn) / 1e18).toFixed(4);
  const formattedMinOut = (Number(order.minAmountOut) / 1e18).toFixed(4);
  const formattedTargetPrice = (Number(order.targetPrice) / 1e18).toFixed(2);
  const expiryDate = new Date(Number(order.expiry) * 1000).toLocaleString();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExecute = async () => {
    setActionLoading('exec');
    try {
      await executeOrder(order.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading('cancel');
    try {
      await cancelOrder(order.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // Determine stage progression for visual lifecycle
  const isCancelled = order.status === OrderStatus.Cancelled;
  const isExecuted = order.status === OrderStatus.Executed;
  const isExecutable = order.isExecutable && order.status === OrderStatus.Active;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-white">
              Order #{order.id.toString()}
            </span>

            {order.status === OrderStatus.Executed && (
              <span className="badge-status badge-executed">Executed</span>
            )}
            {order.status === OrderStatus.Cancelled && (
              <span className="badge-status badge-cancelled">Cancelled</span>
            )}
            {order.status === OrderStatus.Active && (
              <span
                className={`badge-status ${
                  order.isExecutable ? 'badge-executable' : 'badge-pending'
                }`}
              >
                {order.isExecutable ? 'Executable' : 'Pending'}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Lifecycle Progression Tracker */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-4">
            <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Protocol Lifecycle Progression
            </div>

            <div className="grid grid-cols-4 gap-2">
              {/* Step 1: Created */}
              <div className="flex flex-col items-center text-center">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-executed)]/20 text-[var(--color-executed)] font-mono text-xs font-bold border border-[var(--color-executed)]">
                  ✓
                </div>
                <span className="mt-1 font-mono text-[10px] font-semibold text-white">
                  CREATED
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  Escrow Locked
                </span>
              </div>

              {/* Step 2: Pending */}
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold border ${
                    isCancelled || isExecuted || isExecutable
                      ? 'bg-[var(--color-executed)]/20 text-[var(--color-executed)] border-[var(--color-executed)]'
                      : 'bg-[var(--color-pending-bg)] text-white border-[var(--border-focus)]'
                  }`}
                >
                  {isCancelled || isExecuted || isExecutable ? '✓' : '2'}
                </div>
                <span className="mt-1 font-mono text-[10px] font-semibold text-white">
                  PENDING
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  Oracle Monitored
                </span>
              </div>

              {/* Step 3: Trigger Condition */}
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold border ${
                    isCancelled
                      ? 'bg-[var(--color-cancelled-bg)] text-[var(--color-cancelled)] border-[var(--color-cancelled)]'
                      : isExecuted
                      ? 'bg-[var(--color-executed)]/20 text-[var(--color-executed)] border-[var(--color-executed)]'
                      : isExecutable
                      ? 'bg-[var(--color-executable-bg)] text-[var(--color-executable)] border-[var(--color-executable)] animate-pulse-subtle'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {isCancelled ? '✕' : isExecuted ? '✓' : '3'}
                </div>
                <span className="mt-1 font-mono text-[10px] font-semibold text-white">
                  {isCancelled ? 'CANCELLED' : 'EXECUTABLE'}
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  {isCancelled ? 'Refund Issued' : 'Condition Met'}
                </span>
              </div>

              {/* Step 4: Final Settlement */}
              <div className="flex flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold border ${
                    isExecuted
                      ? 'bg-[var(--color-executed)] text-black border-[var(--color-executed)] font-bold'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                  }`}
                >
                  {isExecuted ? '✓' : '4'}
                </div>
                <span className="mt-1 font-mono text-[10px] font-semibold text-white">
                  SETTLED
                </span>
                <span className="text-[9px] text-[var(--text-muted)]">
                  {isExecuted ? 'Payout Complete' : 'Awaiting Keeper'}
                </span>
              </div>
            </div>
          </div>

          {/* On-Chain Specs Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Input Asset */}
            <div className="card-terminal p-3.5 space-y-1">
              <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Input Asset (Locked in Escrow)
              </div>
              <div className="font-mono text-sm font-bold text-white">
                {formattedAmountIn} {tokenInInfo.symbol}
              </div>
              <div className="font-mono text-[10px] text-[var(--text-secondary)] truncate">
                Address: {order.tokenIn}
              </div>
            </div>

            {/* Target Output */}
            <div className="card-terminal p-3.5 space-y-1">
              <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Target Output Asset
              </div>
              <div className="font-mono text-sm font-bold text-white">
                {formattedMinOut} {tokenOutInfo.symbol}
              </div>
              <div className="font-mono text-[10px] text-[var(--text-secondary)] truncate">
                Address: {order.tokenOut}
              </div>
            </div>

            {/* Price Condition */}
            <div className="card-terminal p-3.5 space-y-1">
              <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Target Execution Price
              </div>
              <div className="font-mono text-sm font-bold text-white">
                ≥ ${formattedTargetPrice} USDC
              </div>
              <div className="font-mono text-[10px] text-[var(--text-secondary)]">
                Live Oracle: ${oraclePriceFormatted}
              </div>
            </div>

            {/* Expiry */}
            <div className="card-terminal p-3.5 space-y-1">
              <div className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Order Expiry Timestamp
              </div>
              <div className="font-mono text-xs font-semibold text-white">
                {expiryDate}
              </div>
              <div className="font-mono text-[10px] text-[var(--text-muted)]">
                Unix: {order.expiry.toString()}
              </div>
            </div>
          </div>

          {/* Owner & Explorer Links */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3.5 font-mono text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Order Owner:</span>
              <div className="flex items-center gap-1.5 text-white">
                <span className="truncate max-w-[200px] sm:max-w-[280px]">
                  {order.owner}
                </span>
                <button
                  onClick={() => handleCopy(order.owner, 'owner')}
                  className="text-[var(--text-muted)] hover:text-white"
                  title="Copy Owner Address"
                >
                  {copiedField === 'owner' ? (
                    <Check size={12} className="text-[var(--color-executed)]" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-2">
              <span className="text-[var(--text-muted)]">GhostEscrow Contract:</span>
              <a
                href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrow}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[var(--color-executable)] hover:underline"
              >
                <span>View Escrow on Starkscan</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Actions */}
          {order.status === OrderStatus.Active && (
            <div className="flex items-center gap-3 pt-2">
              {order.isExecutable && (
                <button
                  onClick={handleExecute}
                  disabled={!isConnected || actionLoading === 'exec'}
                  className="btn-success flex-1 py-2.5 font-semibold text-sm justify-center"
                >
                  <Play size={14} fill="currentColor" />
                  <span>
                    {actionLoading === 'exec'
                      ? 'Settling on-chain...'
                      : 'Execute & Settle Order'}
                  </span>
                </button>
              )}

              <button
                onClick={handleCancel}
                disabled={!isConnected || actionLoading === 'cancel'}
                className="btn-danger flex-1 py-2.5 font-semibold text-sm justify-center"
              >
                <XCircle size={14} />
                <span>
                  {actionLoading === 'cancel'
                    ? 'Cancelling on-chain...'
                    : 'Cancel & Refund Escrow'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
