import React from 'react';
import { useWallet } from '../context/WalletContext';
import { NETWORK_CONFIG } from '../config/contracts';
import { Wallet, ExternalLink, RefreshCw, Plus } from 'lucide-react';

interface HeaderProps {
  onOpenCreateOrder: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateOrder,
  onRefresh,
  isRefreshing,
}) => {
  const {
    address,
    isConnected,
    isConnecting,
    strkBalanceFormatted,
    connect,
    disconnect,
  } = useWallet();

  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-6 py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-tight text-white">
              GHOST<span className="text-[var(--text-muted)]">//</span>ORDER
            </span>
          </div>

          <div className="hidden items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2.5 py-1 text-xs sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-executed)]"></span>
            <span className="font-mono text-[var(--text-secondary)]">
              {NETWORK_CONFIG.networkName}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-9 w-9 items-center justify-center rounded border border-[var(--border-strong)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:border-[var(--border-focus)] hover:text-white"
            title="Refresh on-chain state"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin text-white' : ''}
            />
          </button>

          {/* Create Order Primary Action */}
          <button
            onClick={onOpenCreateOrder}
            className="btn-primary flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus size={14} />
            <span>Create Order</span>
          </button>

          {/* Wallet Connection */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <div className="hidden flex-col items-end text-right sm:flex">
                <span className="font-mono text-xs text-[var(--text-primary)]">
                  {strkBalanceFormatted} STRK
                </span>
                <a
                  href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                >
                  <span>{shortenAddress(address)}</span>
                  <ExternalLink size={10} />
                </a>
              </div>

              <button
                onClick={disconnect}
                className="btn-secondary text-xs"
                title="Disconnect Wallet"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="btn-secondary text-xs"
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
