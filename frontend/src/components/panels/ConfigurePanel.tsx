import React from 'react';

export default function ConfigurePanel() {
  return (
    <div className="p-6 sm:p-8 text-left">
      <div className="mono mb-6 flex items-center justify-between text-[11px] text-text-muted">
        <span>NEW ORDER</span>
        <span className="text-phosphor">DRAFT</span>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mono mb-2 text-[10px] tracking-wide text-text-muted">PAIR</p>
          <div className="flex items-center gap-3 rounded-lg border border-border-soft bg-surface-2 px-4 py-3">
            <span className="font-medium text-text-primary">STRK</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-muted">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-medium text-text-primary">USDC</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mono mb-2 text-[10px] tracking-wide text-text-muted">ESCROW AMOUNT</p>
            <div className="rounded-lg border border-border-soft bg-surface-2 px-4 py-3">
              <span className="font-medium text-text-primary">150.00</span>
              <span className="ml-1 text-[12px] text-text-muted">STRK</span>
            </div>
          </div>
          <div>
            <p className="mono mb-2 text-[10px] tracking-wide text-text-muted">TARGET PRICE</p>
            <div className="rounded-lg border border-phosphor/30 bg-phosphor/5 px-4 py-3">
              <span className="font-medium text-phosphor">≥ $2.00</span>
            </div>
          </div>
        </div>

        <div>
          <p className="mono mb-2 text-[10px] tracking-wide text-text-muted">EXPIRY</p>
          <div className="rounded-lg border border-border-soft bg-surface-2 px-4 py-3">
            <span className="font-medium text-text-primary">7 days</span>
          </div>
        </div>

        <button className="btn-primary w-full justify-center !py-3">Lock into Escrow →</button>
        <p className="mono text-center text-[10px] text-text-muted">
          This order is not broadcast until it executes.
        </p>
      </div>
    </div>
  );
}
