import React, { ReactNode } from 'react';

interface BrowserFrameProps {
  url?: string;
  children: ReactNode;
  className?: string;
}

export default function BrowserFrame({
  url = 'app.ghostorder.xyz',
  children,
  className = '',
}: BrowserFrameProps) {
  return (
    <div className={`panel overflow-hidden shadow-panel ${className}`}>
      <div className="flex items-center gap-3 border-b border-border-soft bg-surface-2 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
        <div className="mono flex flex-1 items-center justify-center rounded-md bg-surface-3 px-3 py-1 text-[11px] text-text-muted">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="mr-1.5 text-phosphor-dim">
            <path
              d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          {url}
        </div>
      </div>
      <div className="bg-bg">{children}</div>
    </div>
  );
}
