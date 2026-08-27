import React from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORK_CONFIG } from '../config/contracts';
import { Shield, ExternalLink, Wallet, LogOut } from 'lucide-react';

interface HeaderProps {
  onOpenCreateOrder: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateOrder,
  onScrollToSection,
}) => {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[rgba(255,255,255,0.08)] bg-[#050505]/85 backdrop-blur-md transition-all">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Left: GhostOrder Logo */}
        <div
          onClick={() => onScrollToSection('hero')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(79,124,255,0.3)] bg-[#080D18] text-[var(--accent-blue)] shadow-[0_0_15px_rgba(79,124,255,0.25)] group-hover:border-[var(--accent-cyan)] transition">
            <Shield size={18} />
          </div>
          <span className="font-sans text-base font-bold tracking-tight text-white">
            Ghost<span className="text-[var(--accent-blue)]">Order</span>
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
          <button
            onClick={() => onScrollToSection('dashboard')}
            className="hover:text-white transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => onScrollToSection('how-it-works')}
            className="hover:text-white transition"
          >
            How It Works
          </button>
          <button
            onClick={() => onScrollToSection('contracts')}
            className="hover:text-white transition"
          >
            Contracts
          </button>
        </nav>

        {/* Right: Network & Wallet Button */}
        <div className="flex items-center gap-3.5">
          {/* Network indicator */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[#080D18] px-3 py-1 text-xs text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></span>
            <span className="font-mono text-[11px]">{NETWORK_CONFIG.networkName}</span>
          </div>

          {/* Wallet button */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <a
                href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-[rgba(79,124,255,0.35)] bg-[#080D18] px-3.5 py-1.5 font-mono text-xs font-semibold text-white hover:border-[var(--accent-blue)] transition shadow-[0_0_15px_rgba(79,124,255,0.2)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-cyan)]"></span>
                <span>{shorten(address)}</span>
              </a>

              <button
                onClick={disconnect}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#080D18] text-[var(--text-secondary)] hover:text-white hover:border-[rgba(255,255,255,0.2)] transition"
                title="Disconnect Wallet"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary text-xs py-2 px-4"
            >
              <Wallet size={14} />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
