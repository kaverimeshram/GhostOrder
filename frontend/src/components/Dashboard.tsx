import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useOrders } from '../context/OrderContext';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from '../config/contracts';
import { ArrowRight, ShieldCheck, Cpu, ExternalLink } from 'lucide-react';

interface DashboardProps {
  onOpenCreateOrder: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenCreateOrder }) => {
  const { isConnected, address, strkBalanceFormatted } = useWallet();
  const { stats, oraclePriceFormatted } = useOrders();

  const shorten = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] py-10 px-6">
      <div className="mx-auto max-w-7xl">
        {/* Main Hero Header */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2.5 py-1 text-xs">
              <Cpu size={12} className="text-[var(--text-secondary)]" />
              <span className="font-mono text-[var(--text-secondary)]">
                Starknet Cairo 2.9 Escrow Protocol
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Conditional orders, executed on-chain.
            </h1>

            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Create a price-triggered order. Your funds remain in escrow until
              the condition is met or you cancel.
            </p>
          </div>

          <div>
            <button
              onClick={onOpenCreateOrder}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
            >
              <span>Create Order</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Protocol & Account Metrics Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* 1. Connected Wallet */}
          <div className="card-terminal p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Connected Wallet
            </div>
            <div className="mt-1 font-mono text-sm font-medium text-white truncate">
              {isConnected && address ? shorten(address) : 'Disconnected'}
            </div>
            <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]">
              <span>{NETWORK_CONFIG.networkName}</span>
            </div>
          </div>

          {/* 2. STRK Balance */}
          <div className="card-terminal p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              STRK Balance
            </div>
            <div className="mt-1 font-mono text-base font-bold text-white">
              {isConnected ? `${strkBalanceFormatted}` : '0.0000'}
            </div>
            <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
              Sepolia STRK
            </div>
          </div>

          {/* 3. Live Oracle Price */}
          <div className="card-terminal p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              STRK Oracle Price
            </div>
            <div className="mt-1 font-mono text-base font-bold text-white">
              ${oraclePriceFormatted}
            </div>
            <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-[var(--text-muted)]">
              <span>MockPriceOracle</span>
            </div>
          </div>

          {/* 4. Total Orders */}
          <div className="card-terminal p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Total Orders
            </div>
            <div className="mt-1 font-mono text-base font-bold text-white">
              {stats.totalOrders}
            </div>
            <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
              All Protocol Orders
            </div>
          </div>

          {/* 5. Active Orders */}
          <div className="card-terminal p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Active Escrows
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[var(--color-executable)]">
              {stats.activeOrders}
            </div>
            <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
              Pending / Executable
            </div>
          </div>

          {/* 6. Executed Orders */}
          <div className="card-terminal p-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
              Executed Orders
            </div>
            <div className="mt-1 font-mono text-base font-bold text-[var(--color-executed)]">
              {stats.executedOrders}
            </div>
            <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
              Settled On-Chain
            </div>
          </div>
        </div>

        {/* Verified Contracts Sub-Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-4 text-xs">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <ShieldCheck size={14} className="text-[var(--color-executed)]" />
            <span>Deployed Contracts Verified on Sepolia:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
            <a
              href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrow}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-white"
            >
              <span>Escrow: {shorten(CONTRACT_ADDRESSES.ghostEscrow)}</span>
              <ExternalLink size={10} />
            </a>

            <span className="text-[var(--border-strong)]">|</span>

            <a
              href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.oracle}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-white"
            >
              <span>Oracle: {shorten(CONTRACT_ADDRESSES.oracle)}</span>
              <ExternalLink size={10} />
            </a>

            <span className="text-[var(--border-strong)]">|</span>

            <a
              href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.settlement}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-white"
            >
              <span>Settlement: {shorten(CONTRACT_ADDRESSES.settlement)}</span>
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
