import React from 'react';

const LINES = [
  { t: '14:02:01', text: 'watching STRK/USDC oracle feed…', tone: 'muted' },
  { t: '14:02:11', text: 'price = $1.94 — condition not met', tone: 'muted' },
  { t: '14:03:41', text: 'price = $1.98 — condition not met', tone: 'muted' },
  { t: '14:04:52', text: 'price = $2.00 — condition MATCHED', tone: 'phosphor' },
  { t: '14:04:53', text: 'submitting execute_order(14)…', tone: 'amber' },
  { t: '14:04:55', text: 'settlement confirmed · block #812441', tone: 'phosphor' },
];

export default function MonitorPanel() {
  return (
    <div className="p-6 font-mono sm:p-8 text-left">
      <div className="mono mb-4 flex items-center justify-between text-[11px] text-text-muted">
        <span>ORDER #014 · LIVE</span>
        <span className="text-phosphor">↝ STREAMING</span>
      </div>
      <div className="space-y-2 rounded-lg border border-border-soft bg-surface-2 p-4">
        {LINES.map((line, i) => (
          <div key={i} className="flex gap-3 text-[12px] leading-relaxed">
            <span className="shrink-0 text-text-muted">{line.t}</span>
            <span
              className={
                line.tone === 'phosphor'
                  ? 'text-phosphor'
                  : line.tone === 'amber'
                    ? 'text-amber'
                    : 'text-text-secondary'
              }
            >
              {line.text}
            </span>
          </div>
        ))}
        <span className="mt-1 inline-block h-3.5 w-1.5 animate-pulse bg-phosphor/70" />
      </div>
    </div>
  );
}
