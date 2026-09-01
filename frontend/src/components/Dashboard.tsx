import React from 'react';
import { useOrders } from '../context/OrderContext';

interface DashboardProps {
  onOpenCreateOrder: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenCreateOrder }) => {
  const { stats, orders } = useOrders();

  // Compute total escrowed from active orders
  const totalEscrowedBN = orders
    .filter((o) => o.status === 0)
    .reduce((acc, o) => acc + o.amountIn, 0n);
  const totalEscrowedFormatted = (Number(totalEscrowedBN) / 1e18).toFixed(3);

  return (
    <div className="pt-16 pb-0 bg-bg w-full text-left">
      <div className="container-custom">
        {/* Header and Create Order CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border-soft pb-6">
          <div className="space-y-1">
            <div className="eyebrow mb-2">
              // ON-CHAIN MONITOR
            </div>
            <h2 className="font-display text-[26px] font-bold leading-tight tracking-tight text-text-primary">
              Your Orders
            </h2>
            <p className="text-[14px] text-text-secondary">
              Monitor and manage your conditional orders on Starknet.
            </p>
          </div>

          <button
            onClick={onOpenCreateOrder}
            className="btn-primary !px-4 !py-2.5 text-[12.5px] cursor-pointer"
          >
            <span>+ Create Order</span>
          </button>
        </div>

        {/* Top Stats - Minimalist Protocol Metrics Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8">
          {/* Total Orders */}
          <div className="rounded-lg border border-border-soft bg-surface-2 p-5">
            <div className="mono text-[10px] tracking-wide text-text-muted">
              TOTAL ORDERS
            </div>
            <div className="font-display mt-2 text-[22px] font-bold text-text-primary">
              {stats.totalOrders < 10 ? `0${stats.totalOrders}` : stats.totalOrders}
            </div>
            <div className="mt-1.5 text-[11px] text-text-muted font-mono tracking-wider">
              STRK/USDC • ETH/USDC
            </div>
          </div>

          {/* Active Orders */}
          <div className="rounded-lg border border-border-soft bg-surface-2 p-5">
            <div className="mono text-[10px] tracking-wide text-text-muted">
              ACTIVE ORDERS
            </div>
            <div className="font-display mt-2 text-[22px] font-bold text-phosphor">
              {stats.activeOrders < 10 ? `0${stats.activeOrders}` : stats.activeOrders}
            </div>
            <div className="mt-1.5 text-[11px] text-text-muted font-mono tracking-wider">
              Dormant in Escrow
            </div>
          </div>

          {/* Total Escrowed */}
          <div className="rounded-lg border border-border-soft bg-surface-2 p-5">
            <div className="mono text-[10px] tracking-wide text-text-muted">
              TOTAL ESCROWED
            </div>
            <div className="font-display mt-2 text-[22px] font-bold text-phosphor flex items-baseline gap-1.5">
              <span>{totalEscrowedFormatted}</span>
              <span className="text-[12px] font-normal text-text-muted">STRK</span>
            </div>
            <div className="mt-1.5 text-[11px] text-text-muted font-mono tracking-wider">
              Value Locked on-chain
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
