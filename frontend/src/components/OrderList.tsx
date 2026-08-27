import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { useWallet } from '../context/WalletContext';
import { OnChainOrder, OrderStatus } from '../types/contracts';
import { getTokenByAddress, NETWORK_CONFIG } from '../config/contracts';
import { Play, XCircle, ExternalLink, Eye, Clock, ShieldAlert } from 'lucide-react';

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
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-executed)]"></span>
          EXECUTED
        </span>
      );
    }
    if (order.status === OrderStatus.Cancelled) {
      return (
        <span className="badge-status badge-cancelled">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-cancelled)]"></span>
          CANCELLED
        </span>
      );
    }
    if (order.isExecutable) {
      return (
        <span className="badge-status badge-executable animate-pulse-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-executable)]"></span>
          EXECUTABLE
        </span>
      );
    }
    return (
      <span className="badge-status badge-pending">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-pending)]"></span>
        PENDING
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Section Header & Tabs */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            On-Chain Escrow Orders
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
            Live orders verified from Starknet Sepolia Escrow contract
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-1 text-xs">
          {(['ALL', 'ACTIVE', 'EXECUTED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`font-mono px-3 py-1 rounded transition text-xs ${
                activeTab === tab
                  ? 'bg-[var(--bg-hover)] text-white font-semibold'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="mt-6 overflow-hidden rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
            <Clock size={24} className="animate-spin text-[var(--text-secondary)]" />
            <p className="mt-3 font-mono text-xs">Reading Starknet Sepolia state...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-muted)]">
            <ShieldAlert size={28} className="text-[var(--text-muted)]" />
            <p className="mt-3 font-mono text-xs text-[var(--text-secondary)]">
              No orders found in "{activeTab}" filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-terminal">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Input (Escrowed)</th>
                  <th>Target Output</th>
                  <th>Target Price</th>
                  <th>Oracle Price</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const tokenInInfo = getTokenByAddress(order.tokenIn);
                  const tokenOutInfo = getTokenByAddress(order.tokenOut);

                  const formattedAmountIn = (Number(order.amountIn) / 1e18).toFixed(4);
                  const formattedMinOut = (Number(order.minAmountOut) / 1e18).toFixed(4);
                  const formattedTargetPrice = (Number(order.targetPrice) / 1e18).toFixed(2);

                  const isExecLoading = actionLoadingId === `exec-${order.id}`;
                  const isCancelLoading = actionLoadingId === `cancel-${order.id}`;

                  return (
                    <tr
                      key={order.id.toString()}
                      onClick={() => onSelectOrder(order)}
                      className="cursor-pointer transition hover:bg-[var(--bg-hover)]"
                    >
                      {/* ID */}
                      <td className="font-mono font-bold text-white">
                        #{order.id.toString()}
                      </td>

                      {/* Input */}
                      <td className="font-mono">
                        <span className="font-medium text-white">{formattedAmountIn}</span>{' '}
                        <span className="text-[var(--text-muted)]">{tokenInInfo.symbol}</span>
                      </td>

                      {/* Output */}
                      <td className="font-mono">
                        <span className="font-medium text-white">{formattedMinOut}</span>{' '}
                        <span className="text-[var(--text-muted)]">{tokenOutInfo.symbol}</span>
                      </td>

                      {/* Target Price */}
                      <td className="font-mono text-white">
                        ${formattedTargetPrice}
                      </td>

                      {/* Current Oracle Price */}
                      <td className="font-mono text-[var(--text-secondary)]">
                        ${oraclePriceFormatted}
                      </td>

                      {/* Status */}
                      <td>{renderStatusBadge(order)}</td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {order.status === OrderStatus.Active && (
                            <>
                              {order.isExecutable && (
                                <button
                                  onClick={(e) => handleExecute(e, order.id)}
                                  disabled={!isConnected || isExecLoading}
                                  className="btn-success text-xs font-semibold"
                                  title="Trigger settlement execution"
                                >
                                  <Play size={12} fill="currentColor" />
                                  <span>{isExecLoading ? 'Executing...' : 'Execute'}</span>
                                </button>
                              )}

                              <button
                                onClick={(e) => handleCancel(e, order.id)}
                                disabled={!isConnected || isCancelLoading}
                                className="btn-danger text-xs font-semibold"
                                title="Cancel order and refund deposit"
                              >
                                <XCircle size={12} />
                                <span>{isCancelLoading ? 'Cancelling...' : 'Cancel'}</span>
                              </button>
                            </>
                          )}

                          {order.status !== OrderStatus.Active && (
                            <button
                              onClick={() => onSelectOrder(order)}
                              className="btn-secondary text-xs py-1 px-2 text-[var(--text-muted)] hover:text-white"
                            >
                              <Eye size={12} />
                              <span>Details</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
