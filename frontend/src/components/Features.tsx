import React from 'react';
import { ShieldCheck, Database, CheckCircle2 } from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      title: 'Smart Escrow',
      desc: 'Your assets remain secured in the GhostEscrow contract until execution or cancellation.',
      icon: <ShieldCheck size={22} className="text-emerald-400" />,
    },
    {
      title: 'Oracle Driven',
      desc: 'Orders only become executable when the configured price condition is met on-chain.',
      icon: <Database size={22} className="text-[var(--accent-cyan)]" />,
    },
    {
      title: 'Execution Protection',
      desc: 'Executed or cancelled orders cannot be processed again, preventing double execution replay.',
      icon: <CheckCircle2 size={22} className="text-[var(--accent-blue)]" />,
    },
  ];

  return (
    <section className="py-24 border-b border-[rgba(255,255,255,0.06)] bg-[#070B14]">
      <div className="container-custom">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--accent-cyan)]">
            // PROTOCOL INVARIANTS
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Security & On-Chain Guarantees
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)]">
            Battle-tested Cairo smart contract guarantees ensuring zero fund leakage and verified accounting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((item, idx) => (
            <div key={idx} className="card-premium p-8 space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0C1322] border border-[rgba(79,124,255,0.3)] shadow-[0_0_15px_rgba(79,124,255,0.15)]">
                {item.icon}
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                {item.title}
              </h3>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
