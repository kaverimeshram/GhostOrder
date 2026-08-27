import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { useWallet } from '../context/WalletContext';
import { OnChainOrder, OrderStatus } from '../types/contracts';
import { getTokenByAddress } from '../config/contracts';
import { ArrowRight, Play, XCircle, Clock, ShieldAlert } from 'lucide-react';

interface OrderListProps {
  onSelectOrder: (order: OnChainOrder) => void;
}

export const OrderList: React.FC<OrderListProps> = ({ onSelectOrder }) => {
  const { orders, oraclePriceFormatted, executeOrder, cancelOrder, isLoading } = useOrders();
  const { isConnected } = useWallet();

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'EXECUTED' | 'CANCELLED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ACTIVE') return order.status === OrderStatus.Active;
    if (activeTab === 'EXECUTED') return order.status === OrderStatus.Executed;
    if (activeTab === 'CANCELLED') return order.status === OrderStatus.Cancelled;
    return true;
  });

  const handleExecute = async (e: React.MouseEvent, orderId: bigint) => {
    e.stopPropagation();
    setActionLoadingId(`exec-${orderId}`);
    try {
      await executeOrder(orderId);
    } catch (err) {
      console.error('Execute error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent, orderId: bigint) => {
    e.stopPropagation();
    setActionLoadingId(`cancel-${orderId}`);
    try {
      await cancelOrder(orderId);
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderStatusBadge = (order: OnChainOrder) => {
    if (order.status === OrderStatus.Executed) {
      return (
        <span className="badge-status badge-executed">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
          EXECUTED
        </span>
      );
    }
    if (order.status === OrderStatus.Cancelled) {
      return (
        <span className="badge-status badge-cancelled">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
          CANCELLED
        </span>
      );
    }
    if (order.isExecutable) {
      return (
        <span className="badge-status badge-ready">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping"></span>
          READY
        </span>
      );
    }
    return (
      <span className="badge-status badge-active">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-blue)]"></span>
        ACTIVE
      </span>
    );
  };

  return (
    <div className="pb-24 pt-6">
      <div className="container-custom">
        {/* Filter Tabs Header */}
        <div className="flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-2">
            {(['ALL', 'ACTIVE', 'EXECUTED', 'CANCELLED'] as const).map((tab) => {
              const count =
                tab === 'ALL'
                  ? orders.length
                  : tab === 'ACTIVE'
                  ? orders.filter((o) => o.status === OrderStatus.Active).length
                  : tab === 'EXECUTED'
                  ? orders.filter((o) => o.status === OrderStatus.Executed).length
                  : orders.filter((o) => o.status === OrderStatus.Cancelled).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-mono text-xs px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                    activeTab === tab
                      ? 'bg-[#0C1322] text-white border border-[rgba(79,124,255,0.4)] shadow-[0_0_12px_rgba(79,124,255,0.2)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[#080D18]'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
            <span>Oracle Price:</span>
            <span className="text-[var(--accent-cyan)] font-bold">${oraclePriceFormatted} USDC</span>
          </div>
        </div>

        {/* Order Table / List */}
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="card-premium flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
              <Clock size={24} className="animate-spin text-[var(--accent-blue)]" />
              <p className="mt-3 font-mono text-xs">Syncing on-chain orders from Starknet Sepolia...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="card-premium flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
              <ShieldAlert size={28} className="text-[var(--text-muted)]" />
              <p className="mt-3 font-mono text-xs text-[var(--text-secondary)]">
                No orders found in "{activeTab}" filter.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const tokenInInfo = getTokenByAddress(order.tokenIn);
              const tokenOutInfo = getTokenByAddress(order.tokenOut);

              const formattedAmountIn = (Number(order.amountIn) / 1e18).toFixed(4);
              const formattedTargetPrice = (Number(order.targetPrice) / 1e18).toFixed(2);
              const orderNum = order.id.toString().padStart(3, '0');

              const isExecLoading = actionLoadingId === `exec-${order.id}`;
              const isCancelLoading = actionLoadingId === `cancel-${order.id}`;

              return (
                <div
                  key={order.id.toString()}
                  onClick={() => onSelectOrder(order)}
                  className="card-premium p-5 cursor-pointer group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Order ID & Pair */}
                  <div className="flex items-center gap-6 min-w-[220px]">
                    <span className="font-mono text-sm font-bold text-[var(--text-muted)] group-hover:text-white transition">
                      #{orderNum}
                    </span>

                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-1.5">
                        <span>{tokenInInfo.symbol}</span>
                        <span className="text-[var(--text-muted)] font-normal text-xs">/</span>
                        <span>{tokenOutInfo.symbol}</span>
                      </div>
                      <div className="font-mono text-xs text-[var(--text-secondary)] mt-0.5">
                        Escrow: {formattedAmountIn} {tokenInInfo.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Target & Oracle Price */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-[var(--text-muted)]">TARGET</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        ≥ ${formattedTargetPrice}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-[var(--text-muted)]">ORACLE</div>
                      <div className="text-sm font-bold text-[var(--accent-cyan)] mt-0.5">
                        ${oraclePriceFormatted}
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <div className="text-[10px] uppercase text-[var(--text-muted)]">STATUS</div>
                      <div className="mt-1">{renderStatusBadge(order)}</div>
                    </div>
                  </div>

                  {/* Actions & Mobile Status */}
                  <div
                    className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t border-[rgba(255,255,255,0.04)] lg:border-t-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="sm:hidden">{renderStatusBadge(order)}</div>

                    <div className="flex items-center gap-2">
                      {order.status === OrderStatus.Active && (
                        <>
                          {order.isExecutable && (
                            <button
                              onClick={(e) => handleExecute(e, order.id)}
                              disabled={!isConnected || isExecLoading}
                              className="btn-action-execute"
                              title="Execute conditional order"
                            >
                              <Play size={12} fill="currentColor" />
                              <span>{isExecLoading ? 'Executing...' : 'Execute'}</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleCancel(e, order.id)}
                            disabled={!isConnected || isCancelLoading}
                            className="btn-action-cancel"
                            title="Cancel order and refund escrow"
                          >
                            <XCircle size={12} />
                            <span>{isCancelLoading ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
