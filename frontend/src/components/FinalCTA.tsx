import React from 'react';

interface FinalCTAProps {
  onRequestAccess: () => void;
}

export default function FinalCTA({ onRequestAccess }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-grid-fade" aria-hidden="true" />
      <div className="container-custom relative text-center">
        <p className="eyebrow mb-4">// Get Started</p>
        <h2 className="font-display mx-auto max-w-2xl text-[32px] font-bold leading-tight tracking-tight sm:text-[44px]">
          Your next order doesn't need an audience.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-text-secondary">
          Request access, connect a Sepolia wallet, and place a conditional order in under two minutes.
        </p>
        <button onClick={onRequestAccess} className="btn-primary mt-8">
          Request Access →
        </button>
      </div>
    </section>
  );
}
