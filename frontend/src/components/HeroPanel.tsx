import React from 'react';

const ORDERS = [
  { id: '#014', pair: 'STRK → USDC', target: '≥ $2.00', oracle: '$2.50', status: 'EXECUTED' },
  { id: '#013', pair: 'ETH → STRK', target: '≤ $3,000', oracle: '$3,180', status: 'DORMANT' },
  { id: '#012', pair: 'STRK → ETH', target: '≥ $2.20', oracle: '$1.94', status: 'DORMANT' },
];

const STATUS_STYLE: Record<string, string> = {
  EXECUTED: 'text-phosphor border-phosphor/30 bg-phosphor/10',
  DORMANT: 'text-text-muted border-white/10 bg-white/[0.03]',
};

export default function HeroPanel() {
  return (
    <div className="grid lg:grid-cols-[220px_1fr] text-left">
      {/* sidebar */}
      <div className="hidden border-r border-border-soft p-4 lg:block bg-surface">
        <div className="mono mb-6 text-[10px] tracking-widest text-text-muted">MENU</div>
        <div className="space-y-1">
          {[
            { label: 'Overview', active: true },
            { label: 'Orders', active: false },
            { label: 'Monitor', active: false },
            { label: 'Settlement', active: false },
            { label: 'Settings', active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-md px-3 py-2 text-[13px] ${
                item.active ? 'bg-phosphor/10 font-medium text-phosphor' : 'text-text-secondary'
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-7 bg-bg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="mono flex items-center gap-2 rounded-md border border-border-soft bg-surface-2 px-3 py-1.5 text-[11px] text-text-muted">
            <span>⌘K Search orders</span>
          </div>
          <div className="mono flex items-center gap-2 text-[11px] text-text-muted">
            <span>Starknet Sepolia</span>
            <span className="h-1.5 w-1.5 rounded-full bg-phosphor" />
          </div>
        </div>

        {/* stat tiles */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Orders tracked', value: '14', delta: '↑3' },
            { label: 'Hidden until trigger', value: '100%', delta: '' },
            { label: 'Avg. trigger latency', value: '2.1s', delta: '↓0.4' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border-soft bg-surface-2 p-4">
              <p className="mono text-[10px] tracking-wide text-text-muted">{stat.label.toUpperCase()}</p>
              <p className="font-display mt-2 text-[22px] font-bold text-text-primary">
                {stat.value}{' '}
                {stat.delta && <span className="text-[12px] font-normal text-phosphor">{stat.delta}</span>}
              </p>
            </div>
          ))}
        </div>

        {/* sparkline strip */}
        <div className="mb-6 rounded-lg border border-border-soft bg-surface-2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="mono text-[10px] tracking-wide text-text-muted">STRK / USDC · 24H</p>
            <p className="mono text-[11px] text-phosphor">$2.50</p>
          </div>
          <svg viewBox="0 0 400 60" className="w-full" preserveAspectRatio="none">
            <polyline
              points="0,40 40,44 80,30 120,35 160,20 200,28 240,15 280,22 320,10 360,18 400,8"
              fill="none"
              stroke="#5eff8f"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {/* order rows */}
        <div className="overflow-hidden rounded-lg border border-border-soft bg-surface">
          {ORDERS.map((o, i) => (
            <div
              key={o.id}
              className={`flex items-center justify-between px-4 py-3 text-[12.5px] ${
                i !== ORDERS.length - 1 ? 'border-b border-border-soft' : ''
              }`}
            >
              <span className="mono text-text-muted">{o.id}</span>
              <span className="font-medium text-text-primary">{o.pair}</span>
              <span className="mono hidden text-text-secondary sm:inline">{o.target}</span>
              <span className="mono hidden text-text-secondary md:inline">{o.oracle}</span>
              <span className={`mono rounded-full border px-2.5 py-1 text-[10px] ${STATUS_STYLE[o.status]}`}>
                {o.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
