import React, { useState } from 'react';

interface RequestAccessModalProps {
  onClose: () => void;
}

export default function RequestAccessModal({ onClose }: RequestAccessModalProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-md p-7 shadow-glow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="text-left">
            <p className="eyebrow mb-2">// Early Access</p>
            <h3 id="modal-title" className="font-display text-[20px] font-bold">
              Request Access
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border-soft text-text-secondary transition-colors hover:text-text-primary cursor-pointer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center">
            <span className="mono mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-phosphor/30 text-phosphor">
              ✓
            </span>
            <p className="text-[15px] font-medium">You're on the list.</p>
            <p className="mt-1.5 text-[13px] text-text-secondary">
              We'll reach out with mainnet access details.
            </p>
          </div>
        ) : (
          <form
            className="space-y-4 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
          >
            <div>
              <label className="mono mb-1.5 block text-[10px] tracking-wide text-text-muted">
                WALLET ADDRESS
              </label>
              <input
                required
                type="text"
                placeholder="0x..."
                className="mono w-full rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5 text-[13px] outline-none focus:border-phosphor/40"
              />
            </div>
            <div>
              <label className="mono mb-1.5 block text-[10px] tracking-wide text-text-muted">EMAIL</label>
              <input
                required
                type="email"
                placeholder="you@domain.com"
                className="w-full rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5 text-[13px] outline-none focus:border-phosphor/40"
              />
            </div>
            <div>
              <label className="mono mb-1.5 block text-[10px] tracking-wide text-text-muted">
                WHAT WILL YOU TRADE?
              </label>
              <textarea
                rows={3}
                placeholder="e.g. STRK/USDC conditional DCA"
                className="w-full resize-none rounded-lg border border-border-soft bg-surface-2 px-3.5 py-2.5 text-[13px] outline-none focus:border-phosphor/40"
              />
            </div>
            <button type="submit" className="btn-primary w-full justify-center !py-3">
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
