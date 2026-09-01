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
        <div className="flex items-center justify-between border-b border-border-soft px-6 py-4 bg-surface text-left">
          <div className="flex items-center gap-3">
            <h3 className="font-display text-[16px] font-bold text-text-primary tracking-tight">
              Order #{orderNum}
            </h3>

            {order.status === OrderStatus.Executed && (
              <span className="mono rounded-full border border-phosphor/30 bg-phosphor/10 px-2.5 py-1 text-[10px] text-phosphor">
                Executed
              </span>
            )}
            {order.status === OrderStatus.Cancelled && (
              <span className="mono rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-[10px] text-danger">
                Cancelled
              </span>
            )}
            {order.status === OrderStatus.Active && (
              <span
                className={`mono rounded-full border px-2.5 py-1 text-[10px] ${
                  order.isExecutable
                    ? 'border-phosphor/30 bg-phosphor/10 text-phosphor animate-pulse'
                    : 'border-white/10 bg-white/[0.03] text-text-muted'
                }`}
              >
                {order.isExecutable ? 'Ready' : 'Active'}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition p-1 cursor-pointer bg-transparent border-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 bg-bg font-mono text-xs text-left">
          {/* Main Grid Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border-soft bg-surface-2 p-3.5 space-y-1">
              <div className="text-[10px] text-text-muted uppercase">OWNER</div>
              <div className="text-xs font-bold text-text-primary flex items-center justify-between">
                <span>{shorten(order.owner)}</span>
                <button
                  onClick={() => handleCopy(order.owner, 'owner')}
                  className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-0"
                >
                  {copiedField === 'owner' ? <span className="text-phosphor">✓</span> : <Copy size={11} />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border-soft bg-surface-2 p-3.5 space-y-1">
              <div className="text-[10px] text-text-muted uppercase">ESCROW AMOUNT</div>
              <div className="text-xs font-bold text-text-primary">
                {formattedAmountIn} {tokenInInfo.symbol}
              </div>
            </div>

            <div className="rounded-lg border border-border-soft bg-surface-2 p-3.5 space-y-1">
              <div className="text-[10px] text-text-muted uppercase">OUTPUT TOKEN</div>
              <div className="text-xs font-bold text-text-primary">
                {tokenOutInfo.symbol} (Min: {formattedMinOut})
              </div>
            </div>

            <div className="rounded-lg border border-border-soft bg-surface-2 p-3.5 space-y-1">
              <div className="text-[10px] text-text-muted uppercase">TARGET PRICE</div>
              <div className="text-xs font-bold text-text-primary">
                ≥ ${formattedTargetPrice}
              </div>
            </div>

            <div className="rounded-lg border border-border-soft bg-surface-2 p-3.5 space-y-1 col-span-2">
              <div className="text-[10px] text-text-muted uppercase">CURRENT ORACLE PRICE</div>
              <div className="text-sm font-bold text-phosphor">
                ${oraclePriceFormatted} USDC
              </div>
            </div>
          </div>

          {/* Contract Address Box */}
          <div className="rounded-lg border border-border-soft bg-surface-2 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-text-muted font-sans text-[11px]">Contract Address:</span>
              <div className="flex items-center gap-2 text-text-primary">
                <span>{shorten(CONTRACT_ADDRESSES.ghostEscrowV2)}</span>
                <button
                  onClick={() => handleCopy(CONTRACT_ADDRESSES.ghostEscrowV2, 'contract')}
                  className="text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-0"
                >
                  {copiedField === 'contract' ? <span className="text-phosphor">✓</span> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-soft pt-2">
              <span className="text-text-muted font-sans text-[11px]">Starkscan Explorer:</span>
              <a
                href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrowV2}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-phosphor hover:underline font-sans text-[11px] decoration-none"
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
                  className="mono flex-1 flex items-center justify-center gap-1.5 rounded-md border border-phosphor/30 bg-phosphor/10 px-3 py-2 text-[12.5px] text-phosphor hover:bg-phosphor/20 transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  <Play size={10} fill="currentColor" />
                  <span>{actionLoading === 'exec' ? 'Executing...' : 'Execute Order'}</span>
                </button>
              )}

              <button
                onClick={handleCancel}
                disabled={!isConnected || actionLoading === 'cancel'}
                className="mono flex-1 flex items-center justify-center gap-1.5 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger hover:bg-danger/20 transition duration-150 cursor-pointer disabled:opacity-50"
              >
                <XCircle size={12} />
                <span>{actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
