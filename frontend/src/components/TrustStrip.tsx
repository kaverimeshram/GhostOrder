import React from 'react';

const STACK = ['Starknet', 'Cairo 2.9', 'Scarb', 'Starkscan', 'Pragma Oracle'];

export default function TrustStrip() {
  return (
    <div className="border-y border-border-soft py-8 text-center bg-[#070907]">
      <div className="container-custom">
        <p className="mono mb-5 text-[10px] tracking-widest text-text-muted">
          BUILT ON AUDITED STARKNET PRIMITIVES
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {STACK.map((name) => (
            <span key={name} className="font-display text-[15px] font-medium text-text-secondary/70">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
