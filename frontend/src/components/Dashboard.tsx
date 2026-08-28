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
    <div className="pt-16 pb-0 bg-[#06080c] w-full">
      <div className="container-custom">
        {/* Header and Create Order CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <div className="section-eyebrow">
              // ON-CHAIN MONITOR
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-sans text-text-primary tracking-tight uppercase">
              Your Orders
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              Monitor and manage your conditional orders.
            </p>
          </div>

          <button
            onClick={onOpenCreateOrder}
            className="btn-primary text-xs sm:text-sm font-semibold py-2 px-5 cursor-pointer"
          >
            <span>+ Create Order</span>
          </button>
        </div>

        {/* Top Stats - Minimalist Protocol Metrics Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-10">
          {/* Total Orders */}
          <div className="bg-surface-elevated/40 border border-border rounded-2xl p-6 flex flex-col justify-between min-h-[110px] hover:border-border-strong transition duration-200">
            <div className="font-mono text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Total Orders
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-text-primary">
              {stats.totalOrders < 10 ? `0${stats.totalOrders}` : stats.totalOrders}
            </div>
            <div className="mt-1.5 text-[9px] text-text-muted font-mono tracking-wider uppercase">
              STRK/USDC • ETH/USDC
            </div>
          </div>

          {/* Active Orders */}
          <div className="bg-surface-elevated/40 border border-border rounded-2xl p-6 flex flex-col justify-between min-h-[110px] hover:border-accent/20 transition duration-200">
            <div className="font-mono text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Active Orders
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-accent">
              {stats.activeOrders < 10 ? `0${stats.activeOrders}` : stats.activeOrders}
            </div>
            <div className="mt-1.5 text-[9px] text-text-muted font-mono tracking-wider uppercase">
              Dormant in Escrow
            </div>
          </div>

          {/* Total Escrowed */}
          <div className="bg-surface-elevated/40 border border-border rounded-2xl p-6 flex flex-col justify-between min-h-[110px] hover:border-accent/20 transition duration-200">
            <div className="font-mono text-[9px] font-bold tracking-widest text-text-muted uppercase">
              Total Escrowed
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-accent flex items-baseline gap-1.5">
              <span>{totalEscrowedFormatted}</span>
              <span className="text-xs font-normal text-text-muted">STRK</span>
            </div>
            <div className="mt-1.5 text-[9px] text-text-muted font-mono tracking-wider uppercase">
              Value Locked on-chain
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
