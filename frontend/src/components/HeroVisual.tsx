import React from 'react';
import { useOrders } from '../context/OrderContext';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';

interface HeroVisualProps {
  onOpenCreateOrder: () => void;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({ onOpenCreateOrder }) => {
  const { oraclePriceFormatted } = useOrders();

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Background Soft Blue Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-[#4F7CFF]/20 via-[#00D2FF]/15 to-transparent blur-3xl -z-10 rounded-2xl pointer-events-none"></div>

      {/* Floating Trading Terminal Card */}
      <div className="card-glass-terminal p-6 sm:p-7 space-y-5 relative">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-[var(--accent-blue)]"></div>
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              GHOST ORDER #002
            </span>
          </div>

          <span className="badge-status badge-ready">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)] animate-ping"></span>
            ● READY
          </span>
        </div>

        {/* Spec Rows */}
        <div className="grid grid-cols-2 gap-4 font-mono">
          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              PAIR
            </div>
            <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              <span>STRK</span>
              <span className="text-[var(--text-muted)] font-normal">→</span>
              <span>USDC</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              ESCROW
            </div>
            <div className="text-base font-bold text-white mt-1">
              0.0100 <span className="text-xs font-normal text-[var(--text-muted)]">STRK</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              TARGET PRICE
            </div>
            <div className="text-base font-bold text-white mt-1">
              ≥ $2.00
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              CURRENT ORACLE
            </div>
            <div className="text-base font-bold text-[var(--accent-cyan)] mt-1">
              ${oraclePriceFormatted}
            </div>
          </div>
        </div>

        {/* Card Footer Button */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-mono">
            <TrendingUp size={13} className="text-emerald-400" />
            <span>Target condition met</span>
          </div>

          <button
            onClick={onOpenCreateOrder}
            className="btn-primary text-xs py-2 px-4 font-semibold"
          >
            <span>Create Order</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
