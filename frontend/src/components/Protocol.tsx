import React from 'react';

const INVARIANTS = [
  {
    title: 'Non-Custodial Escrow',
    desc: 'Assets never leave a contract you can inspect. No admin key, no override.',
  },
  {
    title: 'Owner-Only Cancellation',
    desc: 'Only the order creator can reclaim escrowed funds before execution.',
  },
  {
    title: 'Oracle-Gated Execution',
    desc: 'A trade only settles when the on-chain price feed confirms your condition.',
  },
  {
    title: 'Atomic Settlement',
    desc: 'Trigger match and payout happen in a single transaction — no partial states.',
  },
];

export default function Protocol() {
  return (
    <section id="protocol" className="section border-b border-border-soft">
      <div className="container-custom">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 text-left">
          <div>
            <p className="eyebrow mb-4">// Protocol</p>
            <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight sm:text-[38px] text-text-primary">
              Four invariants. No exceptions.
            </h2>
            <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-text-secondary">
              GhostOrder is built in Cairo for Starknet, with a minimal, auditable
              surface — every guarantee below is enforced by the contract, not by
              a promise.
            </p>
          </div>

          <div id="security" className="grid gap-px overflow-hidden rounded-xl border border-border-soft sm:grid-cols-2 bg-border-soft">
            {INVARIANTS.map((inv) => (
              <div key={inv.title} className="bg-surface p-6">
                <span className="mono mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-phosphor/25 text-phosphor">
                  ✓
                </span>
                <h3 className="text-[15px] font-semibold text-text-primary">{inv.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">{inv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
