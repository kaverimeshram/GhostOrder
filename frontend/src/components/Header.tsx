import React from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORK_CONFIG } from '../config/contracts';
import { useRouter } from '../context/RouterContext';

interface HeaderProps {
  onRequestAccess: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRequestAccess }) => {
  const { page, navigate } = useRouter();
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isLandingPage = page === 'home';

  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-bg/85 backdrop-blur-md">
      <div className="container-custom flex h-16 items-center justify-between">
        {/* Left Brand: GhostOrder Logo */}
        <button
          onClick={() => navigate('home')}
          className="flex items-center gap-2 text-text-primary bg-transparent border-0 cursor-pointer outline-none"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className="text-phosphor">
            <path
              d="M12 2 4 6v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6l-8-4Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-[15px] font-bold tracking-tight">GhostOrder</span>
        </button>

        {/* Navigation Links */}
        {isLandingPage ? (
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            {['Product', 'Protocol', 'Security', 'FAQ'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary decoration-none"
              >
                {item}
              </a>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-7 md:flex" aria-label="App">
            <button
              onClick={() => navigate('home')}
              className={`text-[13px] font-medium transition-colors bg-transparent border-0 cursor-pointer ${
                (page as string) === 'home' ? 'text-phosphor font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate('dashboard')}
              className={`text-[13px] font-medium transition-colors bg-transparent border-0 cursor-pointer ${
                page === 'dashboard' ? 'text-phosphor font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('contracts')}
              className={`text-[13px] font-medium transition-colors bg-transparent border-0 cursor-pointer ${
                page === 'contracts' ? 'text-phosphor font-medium' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Contracts
            </button>
          </nav>
        )}

        {/* Right Action */}
        <div className="flex items-center gap-4">
          {isLandingPage ? (
            <button onClick={onRequestAccess} className="btn-primary !px-4 !py-2 text-[12.5px]">
              Request Access →
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {/* Network name status tag */}
              <div className="hidden sm:flex items-center gap-2 rounded-md border border-border-soft bg-surface-2 px-3 py-1.5 text-[11px] text-text-muted select-none">
                <span>Starknet Sepolia</span>
                <span className="h-1.5 w-1.5 rounded-full bg-phosphor" />
              </div>

              {/* Wallet Button */}
              {isConnected && address ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mono flex items-center gap-2 rounded-md border border-border-soft bg-surface-2 px-3 py-1.5 text-[11.5px] text-text-secondary hover:text-text-primary decoration-none transition-colors"
                  >
                    <span>{shorten(address)}</span>
                  </a>

                  <button
                    onClick={disconnect}
                    className="mono flex h-8 w-8 items-center justify-center rounded-md border border-border-soft text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
                    title="Disconnect Wallet"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="btn-primary !px-4 !py-2 text-[12.5px]"
                >
                  <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
