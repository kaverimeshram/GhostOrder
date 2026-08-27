import React from 'react';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from '../config/contracts';
import { ExternalLink, Shield } from 'lucide-react';

interface FooterProps {
  onScrollToSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToSection }) => {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#050505] py-12 text-xs text-[var(--text-secondary)]">
      <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-6 font-mono">
        {/* Left: Brand info */}
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold font-sans text-sm">
            <Shield size={16} className="text-[var(--accent-blue)]" />
            <span>GhostOrder</span>
          </div>
          <p className="text-[var(--text-muted)] text-[11px]">
            Private conditional orders on Starknet.
          </p>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/kaverimeshram/GhostOrder"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition flex items-center gap-1"
          >
            <span>GitHub</span>
            <ExternalLink size={10} />
          </a>

          <a
            href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrow}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition flex items-center gap-1"
          >
            <span>Starkscan</span>
            <ExternalLink size={10} />
          </a>

          <button
            onClick={() => onScrollToSection('contracts')}
            className="hover:text-white transition"
          >
            Contracts
          </button>
        </div>

        {/* Right: Network info */}
        <div className="text-[var(--text-muted)] text-center md:text-right">
          <span>Built on Starknet Sepolia</span>
        </div>
      </div>
    </footer>
  );
};
