import React from 'react';

export const TrustStrip: React.FC = () => {
  const items = [
    { label: 'Private Until Triggered', symbol: '◉' },
    { label: 'Smart Contract Escrow', symbol: '⬡' },
    { label: 'Oracle Driven', symbol: '◈' },
    { label: 'Cairo', symbol: '▱' },
    { label: 'Starknet', symbol: '◈' },
  ];

  return (
    <div className="py-8 bg-[#06080c] w-full border-t border-b border-border-strong/40">
      <div className="container-custom flex flex-wrap items-center justify-center sm:justify-between gap-y-4 gap-x-8">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-text-secondary uppercase select-none">
            <span className="text-accent font-bold">{item.symbol}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
