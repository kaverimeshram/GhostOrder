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
          <span className="h-1 w-1 rounded-full bg-success"></span>
          EXECUTED
        </span>
      );
    }
    if (order.status === OrderStatus.Cancelled) {
      return (
        <span className="badge-status badge-cancelled">
          <span className="h-1 w-1 rounded-full bg-danger"></span>
          CANCELLED
        </span>
      );
    }
    if (order.isExecutable) {
      return (
        <span className="badge-status badge-ready">
          <span className="h-1 w-1 rounded-full bg-success animate-ping"></span>
          READY
        </span>
      );
    }
    return (
      <span className="badge-status badge-active">
        <span className="h-1 w-1 rounded-full bg-accent animate-pulse"></span>
        ACTIVE
      </span>
    );
  };

  return (
    <div className="pb-24 pt-6 bg-[#06080c] w-full">
      <div className="container-custom">
        {/* Filter Tabs Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
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
                  className={`font-mono text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab
                      ? 'bg-accent text-white font-semibold shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="text-[9px] text-text-muted">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-text-secondary">
            <span>Oracle Price:</span>
            <span className="text-accent font-bold">${oraclePriceFormatted} USDC</span>
          </div>
        </div>

        {/* Order Table / List */}
        <div className="mt-6 space-y-3.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted border border-border bg-surface rounded-xl">
              <Clock size={24} className="animate-spin text-accent" />
              <p className="mt-3 font-mono text-xs">Syncing on-chain orders from Starknet Sepolia...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted border border-border bg-surface rounded-xl">
              <ShieldAlert size={28} className="text-text-muted" />
              <p className="mt-3 font-mono text-xs text-text-secondary">
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
                  className="p-5 cursor-pointer relative overflow-hidden group flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-border-strong bg-surface-elevated rounded-xl hover:-translate-y-0.5 hover:border-accent/30 hover:bg-[#121622]/40 transition duration-300 pl-6"
                >
                  {/* Subtle left accent highlight indicator line on hover */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent scale-y-0 group-hover:scale-y-100 transition duration-200"></div>

                  {/* Order ID & Pair */}
                  <div className="flex items-center gap-6 min-w-[220px]">
                    <span className="font-mono text-sm font-bold text-text-muted group-hover:text-text-primary transition duration-300">
                      #{orderNum}
                    </span>

                    <div>
                      <div className="text-base font-bold text-text-primary flex items-center gap-1.5">
                        <span>{tokenInInfo.symbol}</span>
                        <span className="text-text-muted font-normal text-xs">/</span>
                        <span>{tokenOutInfo.symbol}</span>
                      </div>
                      <div className="font-mono text-xs text-text-secondary mt-0.5">
                        Escrow: {formattedAmountIn} {tokenInInfo.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Target & Oracle Price */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 font-mono text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-text-muted">TARGET</div>
                      <div className="text-sm font-bold text-text-primary mt-0.5">
                        ≥ ${formattedTargetPrice}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-text-muted">ORACLE</div>
                      <div className="text-sm font-bold text-accent mt-0.5">
                        ${oraclePriceFormatted}
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <div className="text-[10px] uppercase text-text-muted">STATUS</div>
                      <div className="mt-1">{renderStatusBadge(order)}</div>
                    </div>
                  </div>

                  {/* Actions & Mobile Status */}
                  <div
                    className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t border-border lg:border-t-0"
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
                              className="btn-action-execute cursor-pointer"
                              title="Execute conditional order"
                            >
                              <Play size={12} fill="currentColor" />
                              <span>{isExecLoading ? 'Executing...' : 'Execute'}</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => handleCancel(e, order.id)}
                            disabled={!isConnected || isCancelLoading}
                            className="btn-action-cancel cursor-pointer"
                            title="Cancel order and refund escrow"
                          >
                            <XCircle size={12} />
                            <span>{isCancelLoading ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
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
