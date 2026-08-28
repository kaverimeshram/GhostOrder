import React, { useState, useEffect } from 'react';
import { ShieldCheck, Play, ArrowRight, Activity, Cpu } from 'lucide-react';

export const ProductExperience: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps = [
    {
      title: 'Configure Order Intent',
      label: 'Create Order',
      desc: 'Users specify execution parameters, input assets, and price triggers. The parameters are stored directly on L2.',
      detail: 'STRK → USDC | Target ≥ $2.00',
    },
    {
      title: 'Non-Custodial Escrow Lock',
      label: 'Funds Secured',
      desc: 'Tokens are transferred into the GhostEscrow contract, locking inputs. Funds can only be retrieved by user cancellation.',
      detail: '0.0100 STRK locked in GhostEscrow',
    },
    {
      title: 'Block-by-Block Oracle Checks',
      label: 'Oracle Monitors',
      desc: 'On-chain price feeds (MockPriceOracle) continuously check asset values against target prices on Starknet.',
      detail: 'Feed checked: STRK/USDC Price = $1.90',
    },
    {
      title: 'Price Threshold Reached',
      label: 'Condition Met',
      desc: 'Oracle price feeds confirm that the condition matches. The order state transitions dynamically to ready.',
      detail: 'STRK/USDC Price = $2.55 (Matched)',
    },
    {
      title: 'Instant Execution & Swap',
      label: 'Execute',
      desc: 'Decentralized triggers call execute. GhostEscrow routes inputs to MockSettlement for direct swap and wallet payout.',
      detail: 'Output tokens sent directly to owner',
    },
  ];

  // Auto-play the steps sequence
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-[#0a0d14] w-full border-t border-b border-border-strong/40">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
          
          {/* Left Column: Product copy */}
          <div className="lg:col-span-6 flex flex-col gap-8 text-left">
            <div className="flex flex-col gap-4">
              <div className="section-eyebrow">
                // SYSTEM MECHANICS
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold text-text-primary uppercase tracking-tight">
                The Trustless Trade Pipeline
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-xl">
                GhostOrder executes conditional intent securely by bridging off-chain pricing triggers with non-custodial Starknet smart contracts.
              </p>
            </div>

            {/* Stepper items list */}
            <div className="flex flex-col gap-4 pt-2">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-4 ${
                    activeStep === idx
                      ? 'bg-surface-elevated border-accent/20 shadow-md'
                      : 'bg-transparent border-transparent hover:bg-surface/20'
                  }`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                    activeStep === idx
                      ? 'bg-accent text-white'
                      : 'bg-border-strong text-text-muted'
                  }`}>
                    {idx + 1}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <h3 className={`text-sm font-bold tracking-tight transition-colors duration-200 ${
                      activeStep === idx ? 'text-text-primary' : 'text-text-secondary'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-xs leading-relaxed transition-colors duration-200 ${
                      activeStep === idx ? 'text-text-secondary' : 'text-text-muted'
                    }`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Visual pipeline animation preview */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <div className="w-full max-w-[420px] bg-surface-elevated/40 border border-border rounded-2xl p-8 flex flex-col gap-6 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-border pb-4 font-mono text-[9px] text-text-muted tracking-widest uppercase">
                <span>ON-CHAIN MONITOR</span>
                <span className="flex items-center gap-1.5 text-accent font-bold">
                  <Activity size={10} className="animate-pulse" />
                  LIVE FLOW
                </span>
              </div>

              {/* Steps progression flow visually represented */}
              <div className="flex flex-col gap-5">
                {steps.map((s, idx) => {
                  const isPast = idx < activeStep;
                  const isActive = idx === activeStep;

                  return (
                    <div key={idx} className="flex items-center gap-4 relative">
                      {/* Vertical line indicator */}
                      {idx < steps.length - 1 && (
                        <div className={`absolute left-3.5 top-8 w-[1px] h-8 ${
                          isPast ? 'bg-accent' : 'bg-border-strong'
                        }`} />
                      )}

                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 font-mono text-[9px] font-bold ${
                        isActive
                          ? 'bg-accent border-accent text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] scale-110'
                          : isPast
                          ? 'bg-accent/10 border-accent/20 text-accent'
                          : 'bg-bg-base border-border-strong text-text-muted'
                      }`}>
                        {idx === 4 ? '✓' : idx + 1}
                      </div>

                      <div className="flex-1 flex items-center justify-between p-3.5 rounded-xl border border-border-strong/40 bg-[#06080c]/50">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-mono font-bold tracking-wider uppercase block ${
                            isActive ? 'text-text-primary' : isPast ? 'text-text-secondary' : 'text-text-muted'
                          }`}>
                            {s.label}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono block truncate max-w-[240px]">
                            {s.detail}
                          </span>
                        </div>

                        {isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-ping"></span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
