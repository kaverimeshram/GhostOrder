import React from 'react';
import BrowserFrame from './BrowserFrame';
import HeroPanel from './HeroPanel';

interface HeroProps {
  onRequestAccess: () => void;
}

export default function Hero({ onRequestAccess }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden bg-grid-fade pb-8 pt-20 lg:pt-28">
      <div className="container-custom text-center">
        <span className="mono mb-6 inline-flex items-center gap-2 rounded-full border border-border-soft px-3 py-1.5 text-[11px] tracking-wide text-text-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-phosphor" />
          Live on Starknet Sepolia
        </span>

        <h1 className="font-display mx-auto max-w-3xl text-[38px] font-bold leading-[1.08] tracking-tight sm:text-[52px] lg:text-[60px] text-text-primary">
          Trade without broadcasting your intent.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-text-secondary">
          GhostOrder holds your conditional orders dormant on-chain — invisible to
          front-runners, copy-traders, and MEV bots — until your exact price
          target fires.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={onRequestAccess} className="btn-primary">
            Request Access →
          </button>
          <a href="#protocol" className="btn-secondary">
            Read the Protocol
          </a>
        </div>
      </div>

      {/* the embedded product — this is the hero's real subject */}
      <div className="container-custom mt-14 lg:mt-20">
        <div className="relative">
          <div
            className="pointer-events-none absolute -inset-x-10 -inset-y-6 rounded-[32px] bg-phosphor/10 blur-3xl"
            aria-hidden="true"
          />
          <BrowserFrame url="app.ghostorder.xyz/dashboard" className="relative shadow-glow">
            <HeroPanel />
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}
