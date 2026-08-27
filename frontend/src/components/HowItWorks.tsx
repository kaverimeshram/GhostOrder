import React from 'react';
import { ArrowRight, Sliders, Lock, Zap } from 'lucide-react';

interface HowItWorksProps {
  onOpenCreateOrder: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenCreateOrder }) => {
  const steps = [
    {
      num: '01',
      title: 'Create Order',
      desc: 'Set your trading pair, target condition, and escrow amount.',
      icon: <Sliders size={22} className="text-[var(--accent-cyan)]" />,
    },
    {
      num: '02',
      title: 'Funds Stay Protected',
      desc: 'Assets remain locked inside the GhostEscrow smart contract.',
      icon: <Lock size={22} className="text-[var(--accent-blue)]" />,
    },
    {
      num: '03',
      title: 'Execute Automatically',
      desc: 'When the oracle confirms your condition, the order can execute on-chain.',
      icon: <Zap size={22} className="text-emerald-400" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 border-b border-[rgba(255,255,255,0.06)] bg-[#050505]">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--accent-blue)]">
            // WORKFLOW & ARCHITECTURE
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Conditional Trading, Simplified.
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Three simple steps to execute conditional trading intent without exposing counterparty risk.
          </p>
        </div>

        {/* 3 Step Cards with large background numbers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="card-premium p-8 relative flex flex-col justify-between min-h-[240px] group"
            >
              {/* Large number in background */}
              <div className="absolute right-4 top-2 font-mono text-7xl font-extrabold text-[rgba(255,255,255,0.03)] select-none group-hover:text-[rgba(79,124,255,0.08)] transition duration-300">
                {step.num}
              </div>

              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C1322] border border-[rgba(79,124,255,0.3)] shadow-[0_0_15px_rgba(79,124,255,0.15)]">
                  {step.icon}
                </div>

                <h3 className="mt-6 text-xl font-bold text-white tracking-tight">
                  {step.title}
                </h3>

                <p className="mt-2.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.04)] text-xs font-mono text-[var(--text-muted)] flex items-center justify-between">
                <span>Step {step.num}</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 group-hover:text-[var(--accent-blue)] transition" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
