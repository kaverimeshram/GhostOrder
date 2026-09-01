import React from 'react';

const PUBLIC_LINES = [
  { sign: '−', text: 'mempool: BUY 5 ETH @ trigger $3,000, size visible' },
  { sign: '−', text: 'direction, pair, and target price readable pre-fill' },
  { sign: '−', text: 'bots track distance-to-trigger in real time' },
  { sign: '−', text: 'front-run tx lands 1 block ahead of yours' },
];

const GHOST_LINES = [
  { sign: '+', text: 'on-chain: Deposit event only — amount, no strategy' },
  { sign: '+', text: 'target price stored, dormant, unreadable pre-trigger' },
  { sign: '+', text: 'no visible order to track distance against' },
  { sign: '+', text: 'settlement lands atomically, same block as trigger' },
];

export default function DiffPanel() {
  return (
    <div className="grid divide-y divide-border-soft lg:grid-cols-2 lg:divide-x lg:divide-y-0 text-left">
      <div className="p-6 sm:p-7">
        <p className="mono mb-4 text-[11px] tracking-wide text-text-muted">
          BEFORE · public-limit-order.tx
        </p>
        <div className="space-y-2.5">
          {PUBLIC_LINES.map((l, i) => (
            <div key={i} className="diff-remove rounded px-3 py-2 text-[12.5px] leading-relaxed">
              <span className="mono mr-2 opacity-60">{l.sign}</span>
              {l.text}
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 sm:p-7">
        <p className="mono mb-4 text-[11px] tracking-wide text-text-muted">
          AFTER · ghostorder.tx
        </p>
        <div className="space-y-2.5">
          {GHOST_LINES.map((l, i) => (
            <div key={i} className="diff-add rounded px-3 py-2 text-[12.5px] leading-relaxed">
              <span className="mono mr-2 opacity-60">{l.sign}</span>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
