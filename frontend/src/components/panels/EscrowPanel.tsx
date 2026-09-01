import React from 'react';

export default function EscrowPanel() {
  return (
    <div className="p-6 sm:p-8 text-left">
      <div className="mono mb-6 flex items-center justify-between text-[11px] text-text-muted">
        <span>ESCROW #014</span>
        <span className="flex items-center gap-1.5 text-phosphor">
          <span className="h-1.5 w-1.5 rounded-full bg-phosphor" />
          LOCKED
        </span>
      </div>

      <div className="flex items-center justify-center py-8">
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-phosphor/25 bg-phosphor/5">
          <div className="absolute inset-0 animate-pulse rounded-full border border-phosphor/10" />
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-phosphor">
            <path
              d="M6 11V8a6 6 0 1 1 12 0v3M5 11h14v9H5v-9Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border-soft bg-surface-2 p-4">
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-text-muted">Contract</span>
          <span className="mono text-text-primary">GhostEscrow.cairo</span>
        </div>
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-text-muted">Locked amount</span>
          <span className="mono text-text-primary">150.00 STRK</span>
        </div>
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-text-muted">Retrievable by</span>
          <span className="mono text-text-primary">Owner only</span>
        </div>
        <div className="flex items-center justify-between text-[12.5px]">
          <span className="text-text-muted">Visible on explorer</span>
          <span className="mono text-text-secondary">Deposit event only</span>
        </div>
      </div>
    </div>
  );
}
