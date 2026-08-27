import React, { useState } from 'react';
import { OnChainOrder, OrderStatus } from '../types/contracts';
import { getTokenByAddress, NETWORK_CONFIG, CONTRACT_ADDRESSES } from '../config/contracts';
import { useOrders } from '../context/OrderContext';
import { useWallet } from '../context/WalletContext';
import {
  X,
  ExternalLink,
  Play,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
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
  const orderNum = order.id.toString().padStart(3, '0');

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

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-6 py-4 bg-[#080D18]">
          <div className="flex items-center gap-3">
            <h3 className="font-mono text-base font-bold text-white">
              Order #{orderNum}
            </h3>

            {order.status === OrderStatus.Executed && (
              <span className="badge-status badge-executed">Executed</span>
            )}
            {order.status === OrderStatus.Cancelled && (
              <span className="badge-status badge-cancelled">Cancelled</span>
            )}
            {order.status === OrderStatus.Active && (
              <span
                className={`badge-status ${
                  order.isExecutable ? 'badge-ready' : 'badge-active'
                }`}
              >
                {order.isExecutable ? 'Ready' : 'Active'}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white transition p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-[#050505] font-mono text-xs">
          {/* Main Grid Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium p-3.5 space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">OWNER</div>
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>{shorten(order.owner)}</span>
                <button
                  onClick={() => handleCopy(order.owner, 'owner')}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  {copiedField === 'owner' ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <div className="card-premium p-3.5 space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">ESCROW AMOUNT</div>
              <div className="text-xs font-bold text-white">
                {formattedAmountIn} {tokenInInfo.symbol}
              </div>
            </div>

            <div className="card-premium p-3.5 space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">OUTPUT TOKEN</div>
              <div className="text-xs font-bold text-white">
                {tokenOutInfo.symbol} (Min: {formattedMinOut})
              </div>
            </div>

            <div className="card-premium p-3.5 space-y-1">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">TARGET PRICE</div>
              <div className="text-xs font-bold text-white">
                ≥ ${formattedTargetPrice}
              </div>
            </div>

            <div className="card-premium p-3.5 space-y-1 col-span-2">
              <div className="text-[10px] text-[var(--text-muted)] uppercase">CURRENT ORACLE PRICE</div>
              <div className="text-sm font-bold text-[var(--accent-cyan)]">
                ${oraclePriceFormatted} USDC
              </div>
            </div>
          </div>

          {/* Contract Address Box */}
          <div className="card-premium p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Contract Address:</span>
              <div className="flex items-center gap-2 text-white">
                <span>{shorten(CONTRACT_ADDRESSES.ghostEscrow)}</span>
                <button
                  onClick={() => handleCopy(CONTRACT_ADDRESSES.ghostEscrow, 'contract')}
                  className="text-[var(--text-muted)] hover:text-white"
                >
                  {copiedField === 'contract' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.04)] pt-2">
              <span className="text-[var(--text-muted)]">Starkscan Explorer:</span>
              <a
                href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrow}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[var(--accent-blue)] hover:underline"
              >
                <span>View on Starkscan</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Actions */}
          {order.status === OrderStatus.Active && (
            <div className="flex items-center gap-3 pt-2 font-sans">
              {order.isExecutable && (
                <button
                  onClick={handleExecute}
                  disabled={!isConnected || actionLoading === 'exec'}
                  className="btn-primary flex-1 text-xs py-2.5 font-semibold"
                >
                  <Play size={13} fill="currentColor" />
                  <span>{actionLoading === 'exec' ? 'Executing...' : 'Execute Order'}</span>
                </button>
              )}

              <button
                onClick={handleCancel}
                disabled={!isConnected || actionLoading === 'cancel'}
                className="btn-action-cancel flex-1 text-xs py-2.5 font-semibold justify-center"
              >
                <XCircle size={14} />
                <span>{actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
