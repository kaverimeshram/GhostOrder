import React from 'react';
import { HeroVisual } from './HeroVisual';
import { ArrowRight, Zap, Shield, EyeOff } from 'lucide-react';

interface HeroProps {
  onOpenCreateOrder: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenCreateOrder,
  onScrollToSection,
}) => {
  return (
    <section id="hero" className="relative pt-16 pb-20 overflow-hidden">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Actions (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(79,124,255,0.3)] bg-[#080D18] px-3.5 py-1 text-xs shadow-[0_0_15px_rgba(79,124,255,0.2)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-blue)] animate-pulse"></span>
              <span className="font-mono text-xs font-semibold text-[var(--accent-blue)] uppercase tracking-wider">
                LIVE ON STARKNET SEPOLIA
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold tracking-tight text-white leading-[1.1]">
              Private Conditional Orders<br />
              <span className="text-[#8B95A7] font-bold">
                Executed When Conditions Are Met.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
              Create conditional on-chain orders that remain dormant until your price conditions are satisfied.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onOpenCreateOrder}
                className="btn-primary text-sm sm:text-base font-semibold"
              >
                <span>Create Order</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => onScrollToSection('contracts')}
                className="btn-secondary text-sm sm:text-base font-semibold"
              >
                <span>View Contracts →</span>
              </button>
            </div>

            {/* Feature Indicators */}
            <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-4 text-xs text-[var(--text-secondary)] font-mono">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-[var(--accent-cyan)]" />
                <span>Instant L2 Execution</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[var(--accent-blue)] text-sm font-bold">◎</span>
                <span>Private Until Triggered</span>
              </div>

              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-400" />
                <span>Smart Contract Escrow</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Trading Card (5 cols on lg) */}
          <div className="lg:col-span-5 w-full">
            <HeroVisual onOpenCreateOrder={onOpenCreateOrder} />
          </div>
        </div>
      </div>
    </section>
  );
};
