import React from 'react';
import { ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-[#06080c] w-full">
      <div className="container-custom">
        {/* Section Header - Left-Aligned */}
        <div className="text-left space-y-4 mb-16">
          <div className="section-eyebrow">
            // PROTOCOL INVARIANTS
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-sans text-text-primary tracking-tight uppercase">
            Security & On-Chain Guarantees
          </h2>
          <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
            Battle-tested Cairo smart contract guarantees ensuring zero fund leakage and verified accounting.
          </p>
        </div>

        {/* Asymmetric Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Highlighted Card - Smart Escrow (Spans 7 columns on desktop) */}
          <div className="lg:col-span-7 card-premium bg-surface-elevated/40 border border-border rounded-2xl p-8 lg:p-12 flex flex-col justify-between min-h-[340px] hover:border-accent/30 transition duration-300">
            <div className="space-y-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-base border border-border text-success shadow-sm">
                <ShieldCheck size={20} />
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-text-primary tracking-tight font-sans">
                  Smart Escrow Safeguards
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-lg font-sans">
                  Your assets remain locked securely in the GhostEscrow smart contract. Payouts and swaps are only triggered upon direct match of oracle price targets, ensuring zero custody risk. The owner retains sole, absolute authority to cancel active orders at any time.
                </p>
              </div>

              {/* Specifications grid to earn height */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border-strong/50 font-mono text-[8px] text-text-secondary uppercase tracking-widest">
                <div>
                  <span className="text-accent-blue block font-bold">// INVARIANT 01A</span>
                  <span className="text-text-primary block mt-1 font-sans text-xs font-semibold normal-case">Non-Custodial Asset Locking</span>
                </div>
                <div>
                  <span className="text-accent-blue block font-bold">// INVARIANT 01B</span>
                  <span className="text-text-primary block mt-1 font-sans text-xs font-semibold normal-case">Owner-Only Cancel & Refund</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border font-mono text-[9px] tracking-widest text-text-muted uppercase">
              Core Security Invariant // 01
            </div>
          </div>

          {/* Right Column - Two Stacked Smaller Cards (Spans 5 columns on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-8 justify-between">
            {/* Card 2: Oracle Driven */}
            <div className="card-premium flex-1 bg-surface-elevated/40 border border-border rounded-2xl p-8 flex flex-col justify-between hover:border-accent/30 transition duration-300">
              <div className="space-y-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-base border border-border text-accent shadow-sm">
                  <Database size={16} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-text-primary tracking-tight font-sans">
                    Oracle Driven Pricing
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    Orders only trigger when target price conditions are matched against audited, on-chain price feeds.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Execution Protection */}
            <div className="card-premium flex-1 bg-surface-elevated/40 border border-border rounded-2xl p-8 flex flex-col justify-between hover:border-accent/30 transition duration-300">
              <div className="space-y-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-bg-base border border-border text-accent shadow-sm">
                  <CheckCircle2 size={16} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-text-primary tracking-tight font-sans">
                    Execution Protection
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed font-sans">
                    Orders transition instantly to completed states, protecting escrows against replay attacks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
