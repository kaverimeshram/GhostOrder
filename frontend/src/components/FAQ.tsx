import React, { useState } from 'react';

const FAQS = [
  {
    q: 'What exactly stays private before execution?',
    a: 'Your target price, pair direction, and order size are stored on-chain but never exposed by any public read path before the trigger condition matches. Only the initial deposit (amount, no strategy) and the final settlement are publicly visible.',
  },
  {
    q: 'Who can trigger my order to execute?',
    a: 'Anyone can call execute_order() — but the call only succeeds if the on-chain oracle condition is already met. There’s no privileged keeper, and no one can force an early or incorrect execution.',
  },
  {
    q: 'What happens if my order never triggers?',
    a: 'You can cancel and reclaim your escrowed funds at any time before execution. GhostEscrow enforces owner-only cancellation — no one else can touch your locked assets.',
  },
  {
    q: 'Is this audited?',
    a: 'GhostEscrow, MockPriceOracle, and MockSettlement are deployed and verified on Starknet Sepolia. A formal audit is planned ahead of mainnet launch — request access for updates.',
  },
  {
    q: 'Does GhostOrder custody my funds?',
    a: 'No. Funds sit in a non-custodial smart contract you can inspect on Starkscan at any time. There is no admin key and no multisig with override authority.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section border-b border-border-soft">
      <div className="container-custom">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 text-left">
          <div>
            <p className="eyebrow mb-4">// FAQ</p>
            <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight sm:text-[36px] text-text-primary">
              Questions, answered.
            </h2>
          </div>

          <div className="divide-y divide-border-soft">
            {FAQS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left cursor-pointer outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] font-medium text-text-primary">{item.q}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`shrink-0 text-text-muted transition-transform ${isOpen ? 'rotate-45' : ''}`}
                    >
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                  {isOpen && (
                    <p className="max-w-lg pb-6 text-[14px] leading-relaxed text-text-secondary">{item.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
