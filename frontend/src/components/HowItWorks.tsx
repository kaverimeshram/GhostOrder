import React from 'react';
import { Sliders, Lock, Database, Zap } from 'lucide-react';

interface HowItWorksProps {
  onOpenCreateOrder: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenCreateOrder }) => {
  const steps = [
    {
      num: '01',
      title: 'Create Order',
      desc: 'Set asset, amount and trigger condition.',
      icon: <Sliders size={16} className="text-accent" />,
      meta: 'INPUT: STRK / ETH',
      actionText: 'CONFIGURE',
    },
    {
      num: '02',
      title: 'Funds Enter Escrow',
      desc: 'Assets remain protected in the GhostEscrow contract.',
      icon: <Lock size={16} className="text-accent" />,
      meta: 'ESCROW: GHOST_ESCROW',
      actionText: 'ESCROW LOCKED',
    },
    {
      num: '03',
      title: 'Condition Verified',
      desc: 'Oracle checks whether execution conditions are met.',
      icon: <Database size={16} className="text-accent" />,
      meta: 'ORACLE: PRICE_ORACLE',
      actionText: 'ACTIVE CHECK',
    },
    {
      num: '04',
      title: 'Order Executes',
      desc: 'Settlement completes automatically.',
      icon: <Zap size={16} className="text-success" />,
      meta: 'ROUTER: SETTLEMENT',
      actionText: 'AUTO SETTLED',
    },
  ];

  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-[#06080c] w-full">
      <div className="container-custom">
        {/* Section Header - Left-Aligned */}
        <div className="text-left space-y-4 mb-16">
          <div className="section-eyebrow">
            // WORKFLOW & STATE ENGINE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-sans text-text-primary tracking-tight uppercase">
            Conditional Trading, Simplified
          </h2>
          <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
            Create an order, lock funds securely, and let the protocol execute automatically when your conditions are met.
          </p>
        </div>

        {/* 4 Step Timeline Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="card-premium flex flex-col justify-between min-h-[200px] group bg-surface-elevated/40 border border-border hover:border-accent/30 transition duration-300"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-text-muted group-hover:text-accent transition duration-200 select-none">
                    {step.num}
                  </span>
                  
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-base border border-border-strong text-accent shadow-sm">
                    {step.icon}
                  </div>
                </div>

                <h3 className="mt-6 text-base font-bold text-text-primary tracking-tight font-sans">
                  {step.title}
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
                  {step.desc}
                </p>

                {/* Sub-meta to earn vertical card height */}
                <div className="mt-4 font-mono text-[8px] text-text-muted tracking-widest uppercase">
                  {step.meta}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border font-mono text-[9px] tracking-widest text-text-muted flex items-center justify-between uppercase">
                <span>STAGE {step.num}</span>
                <span className="text-text-muted group-hover:text-accent transition duration-300 font-bold">{step.actionText}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
