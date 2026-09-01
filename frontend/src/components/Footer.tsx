import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-border-soft bg-bg">
      <div className="container-custom flex flex-col items-center gap-4 py-10 sm:flex-row sm:justify-between text-left">
        <a href="#top" className="flex items-center gap-2 text-text-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-phosphor">
            <path
              d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-[13px] font-bold tracking-tight">GhostOrder</span>
        </a>
        <p className="mono text-[11px] text-text-muted">© 2026 GhostOrder Protocol · Built on Starknet L2</p>
        <a href="#" className="mono text-[11px] text-text-secondary transition-colors hover:text-text-primary">
          @GhostOrderXYZ ↗
        </a>
      </div>
    </footer>
  );
}
