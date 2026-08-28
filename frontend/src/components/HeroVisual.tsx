import React from 'react';
import { useOrders } from '../context/OrderContext';
import { ArrowRight } from 'lucide-react';

interface HeroVisualProps {
  onOpenCreateOrder: () => void;
}

export const HeroVisual: React.FC<HeroVisualProps> = ({ onOpenCreateOrder }) => {
  const { oraclePriceFormatted } = useOrders();

  const displayPrice = oraclePriceFormatted !== '0.00' ? `$${oraclePriceFormatted}` : '$2.50';

  return (
    <div className="relative w-full max-w-[380px] select-none">
      {/* Premium Product Preview Card */}
      <div className="w-full bg-navy-card/80 backdrop-blur-md border border-border-strong rounded-2xl p-7 flex flex-col gap-6 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-accent-blue/30">
        
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-subtle pb-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse"></div>
            <span className="font-mono text-[9px] font-bold text-text-primary tracking-widest uppercase">
              GHOST ORDER #002
            </span>
          </div>

          <span className="badge-status badge-ready text-[8px] tracking-widest py-1 px-2.5">
            <span className="h-1 w-1 rounded-full bg-accent-green"></span>
            READY
          </span>
        </div>

        {/* Spec Rows Grid */}
        <div className="grid grid-cols-2 gap-y-5 gap-x-4 font-sans text-xs">
          <div>
            <div className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Pair
            </div>
            <div className="text-xs font-extrabold text-text-primary mt-1.5 flex items-center gap-1">
              <span>STRK</span>
              <span className="text-text-muted font-normal">→</span>
              <span>USDC</span>
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Escrow
            </div>
            <div className="text-xs font-extrabold text-text-primary mt-1.5">
              0.0100 <span className="text-[9px] font-normal font-mono text-text-muted">STRK</span>
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Target Price
            </div>
            <div className="text-xs font-extrabold text-text-primary mt-1.5 font-mono">
              ≥ $2.00
            </div>
          </div>

          <div>
            <div className="font-mono text-[9px] font-bold text-text-muted uppercase tracking-widest">
              Current Oracle
            </div>
            <div className="text-xs font-extrabold text-accent-blue mt-1.5 font-mono">
              {displayPrice}
            </div>
          </div>
        </div>

        {/* Card Footer Button */}
        <div className="pt-5 border-t border-subtle flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-accent-green font-mono uppercase tracking-wider text-[9px] font-semibold">
            <span className="h-1 w-1 rounded-full bg-accent-green"></span>
            <span>Target met</span>
          </div>

          <button
            onClick={onOpenCreateOrder}
            className="btn-primary text-[9px] py-2 px-4 font-semibold cursor-pointer h-10 rounded-xl shadow-md border-0"
          >
            <span>Execute Order</span>
            <ArrowRight size={11} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
