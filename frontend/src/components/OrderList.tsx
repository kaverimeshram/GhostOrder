import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { useWallet } from '../context/WalletContext';
import { OnChainOrder, OrderStatus } from '../types/contracts';
import { getTokenByAddress } from '../config/contracts';
import { Play, XCircle, Clock, ShieldAlert } from 'lucide-react';

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
        <span className="mono rounded-full border border-phosphor/30 bg-phosphor/10 px-2.5 py-1 text-[10px] text-phosphor">
          EXECUTED
        </span>
      );
    }
    if (order.status === OrderStatus.Cancelled) {
      return (
        <span className="mono rounded-full border border-danger/30 bg-danger/10 px-2.5 py-1 text-[10px] text-danger">
          CANCELLED
        </span>
      );
    }
    if (order.isExecutable) {
      return (
        <span className="mono rounded-full border border-phosphor/30 bg-phosphor/10 px-2.5 py-1 text-[10px] text-phosphor animate-pulse">
          READY
        </span>
      );
    }
    return (
      <span className="mono rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-text-muted">
        ACTIVE
      </span>
    );
  };

  return (
    <div className="pb-24 pt-6 bg-bg w-full text-left">
      <div className="container-custom">
        {/* Filter Tabs Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border-soft pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['ALL', 'ACTIVE', 'EXECUTED', 'CANCELLED'] as const).map((tab) => {
              const count =
                tab === 'ALL'
                  ? orders.length
                  : tab === 'ACTIVE'
                  ? orders.filter((o) => o.status === OrderStatus.Active).length
                  : tab === 'EXECUTED'
                  ? orders.filter((o) => o.status === OrderStatus.Executed).length
                  : orders.filter((o) => o.status === OrderStatus.Cancelled).length;

              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`mono text-[11px] tracking-wide px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? 'bg-phosphor/10 text-phosphor border-phosphor/30 font-medium'
                      : 'text-text-secondary hover:text-text-primary border-border-soft hover:bg-surface-3'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="opacity-60 text-[9px]">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 mono text-[11px] text-text-muted">
            <span>Oracle Price:</span>
            <span className="text-phosphor font-bold">${oraclePriceFormatted} USDC</span>
          </div>
        </div>

        {/* Order Table / List */}
        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted border border-border-soft bg-surface rounded-xl">
              <Clock size={20} className="animate-spin text-phosphor" />
              <p className="mt-3 mono text-[12px] text-text-secondary">Syncing on-chain orders from Starknet Sepolia...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted border border-border-soft bg-surface rounded-xl">
              <ShieldAlert size={24} className="text-text-muted" />
              <p className="mt-3 mono text-[12px] text-text-secondary">
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
                  className="p-5 cursor-pointer relative overflow-hidden group flex flex-col lg:flex-row lg:items-center justify-between gap-4 panel hover:-translate-y-0.5 hover:border-phosphor/30 transition duration-300 pl-6"
                >
                  {/* Subtle left accent highlight indicator line on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-phosphor scale-y-0 group-hover:scale-y-100 transition duration-200"></div>

                  {/* Order ID & Pair */}
                  <div className="flex items-center gap-6 min-w-[220px]">
                    <span className="mono text-xs text-text-muted group-hover:text-text-primary transition duration-300">
                      #{orderNum}
                    </span>

                    <div>
                      <div className="font-display text-[15px] font-bold text-text-primary flex items-center gap-1.5">
                        <span>{tokenInInfo.symbol}</span>
                        <span className="text-text-muted font-normal text-xs">→</span>
                        <span>{tokenOutInfo.symbol}</span>
                      </div>
                      <div className="mono text-[11px] text-text-secondary mt-0.5">
                        Escrow: {formattedAmountIn} {tokenInInfo.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Target & Oracle Price */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mono text-[12px]">
                    <div>
                      <div className="text-[10px] tracking-wide text-text-muted uppercase">TARGET</div>
                      <div className="font-medium text-text-primary mt-0.5">
                        ≥ ${formattedTargetPrice}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] tracking-wide text-text-muted uppercase">ORACLE</div>
                      <div className="font-medium text-phosphor mt-0.5">
                        ${oraclePriceFormatted}
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <div className="text-[10px] tracking-wide text-text-muted uppercase">STATUS</div>
                      <div className="mt-1">{renderStatusBadge(order)}</div>
                    </div>
                  </div>

                  {/* Actions & Mobile Status */}
                  <div
                    className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t border-border-soft lg:border-t-0"
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
                              className="mono flex items-center gap-1.5 rounded-md border border-phosphor/30 bg-phosphor/10 px-3 py-1.5 text-[11.5px] text-phosphor hover:bg-phosphor/20 transition duration-150 cursor-pointer disabled:opacity-50"
                              title="Execute conditional order"
                            >
                              <Play size={10} fill="currentColor" />
                              <span>{isExecLoading ? 'Executing...' : 'Execute'}</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleCancel(e, order.id)}
                            disabled={!isConnected || isCancelLoading}
                            className="mono flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger/10 px-3 py-1.5 text-[11.5px] text-danger hover:bg-danger/20 transition duration-150 cursor-pointer disabled:opacity-50"
                            title="Cancel order and refund escrow"
                          >
                            <XCircle size={10} />
                            <span>{isCancelLoading ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="btn-secondary !px-3 !py-1.5 text-[11.5px]"
                      >
                        <span>View →</span>
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
