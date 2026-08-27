import React from 'react';
import { useOrders } from '../context/OrderContext';
import { Plus } from 'lucide-react';

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
    <div id="dashboard" className="pt-16 pb-6">
      <div className="container-custom">
        {/* Header and Create Order CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
          <div>
            <div className="text-xs font-mono text-[var(--accent-blue)] uppercase tracking-wider mb-1">
              // ON-CHAIN MONITOR
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Your Orders
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              Monitor and manage your conditional orders.
            </p>
          </div>

          <button
            onClick={onOpenCreateOrder}
            className="btn-primary text-xs sm:text-sm font-semibold py-2 px-4"
          >
            <Plus size={15} />
            <span>Create Order</span>
          </button>
        </div>

        {/* 3 Top Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
          {/* Total Orders */}
          <div className="card-premium p-6">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              TOTAL ORDERS
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-white">
              {stats.totalOrders < 10 ? `0${stats.totalOrders}` : stats.totalOrders}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Created on Starknet
            </div>
          </div>

          {/* Active Orders */}
          <div className="card-premium p-6">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              ACTIVE ORDERS
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-[var(--accent-blue)]">
              {stats.activeOrders < 10 ? `0${stats.activeOrders}` : stats.activeOrders}
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Dormant in Escrow
            </div>
          </div>

          {/* Total Escrowed */}
          <div className="card-premium p-6">
            <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              TOTAL ESCROWED
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-white">
              {totalEscrowedFormatted} <span className="text-sm font-normal text-[var(--text-muted)]">STRK</span>
            </div>
            <div className="mt-1 text-xs text-[var(--text-secondary)]">
              Locked Value
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
