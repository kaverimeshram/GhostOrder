import React from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORK_CONFIG } from '../config/contracts';
import { Shield, Wallet, LogOut } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

interface HeaderProps {
  onOpenCreateOrder: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { page, navigate } = useRouter();
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-subtle bg-base/85 backdrop-blur-md transition-all h-20 w-full flex items-center">
      <div className="container-custom flex items-center justify-between w-full">
        {/* Left Brand: GhostOrder Logo */}
        <div
          onClick={() => navigate('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <Shield size={20} className="text-accent-blue transition duration-300 group-hover:scale-105" />
          <span className="font-sans text-sm font-extrabold tracking-widest text-text-primary uppercase">
            GhostOrder
          </span>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-10 text-[10px] font-mono tracking-widest uppercase text-text-secondary">
          <button
            onClick={() => navigate('home')}
            className={`transition-colors duration-200 cursor-pointer ${
              page === 'home' ? 'text-accent-blue font-bold' : 'hover:text-text-primary'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => navigate('dashboard')}
            className={`transition-colors duration-200 cursor-pointer ${
              page === 'dashboard' ? 'text-accent-blue font-bold' : 'hover:text-text-primary'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('protocol')}
            className={`transition-colors duration-200 cursor-pointer ${
              page === 'protocol' ? 'text-accent-blue font-bold' : 'hover:text-text-primary'
            }`}
          >
            Protocol
          </button>
          <button
            onClick={() => navigate('contracts')}
            className={`transition-colors duration-200 cursor-pointer ${
              page === 'contracts' ? 'text-accent-blue font-bold' : 'hover:text-text-primary'
            }`}
          >
            Contracts
          </button>
        </nav>

        {/* Right Wallet Status / Actions */}
        <div className="flex items-center gap-4">
          {/* Network name status tag */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border-strong bg-navy-dark px-4 py-1.5 text-xs text-text-secondary select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse"></span>
            <span className="font-mono text-[9px] tracking-widest uppercase">{NETWORK_CONFIG.networkName}</span>
          </div>

          {/* Wallet connectivity trigger */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <a
                href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border-strong bg-navy-card px-4 py-2 font-mono text-[10px] tracking-wider font-semibold text-text-secondary hover:bg-navy-hover hover:text-text-primary transition-all duration-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent-blue"></span>
                <span>{shorten(address)}</span>
              </a>

              <button
                onClick={disconnect}
                className="flex items-center justify-center h-9 w-9 rounded-xl border border-border-strong bg-navy-card text-text-muted hover:text-text-primary hover:bg-navy-hover transition-all duration-200 cursor-pointer"
                title="Disconnect Wallet"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-primary text-[10px] tracking-widest py-2 px-5 cursor-pointer h-10 rounded-xl"
            >
              <Wallet size={13} />
              <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
