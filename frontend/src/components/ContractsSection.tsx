import React, { useState } from 'react';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from '../config/contracts';
import { ShieldCheck, ExternalLink, Copy, Check } from 'lucide-react';

export const ContractsSection: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const contracts = [
    {
      name: 'GhostEscrow',
      role: 'Conditional Order Escrow & Settlement Engine',
      address: CONTRACT_ADDRESSES.ghostEscrow,
      classHash: '0x01f01ca79d1f2184a047df7adc594f97610882cf9f7825dc25d1bcc96a61ecd3',
    },
    {
      name: 'MockPriceOracle',
      role: 'On-Chain Price Feed & Condition Evaluator',
      address: CONTRACT_ADDRESSES.oracle,
      classHash: '0x03326e03ae724c33c4902a653d94775996e4e2cd651078bf8c71476e2d5a919e',
    },
    {
      name: 'MockSettlement',
      role: 'Direct Output Payout & Liquidity Swapper',
      address: CONTRACT_ADDRESSES.settlement,
      classHash: '0x06d5bc2a2456020a27f6b7592f3cf296bb39799c399a83cf4723845ec8983b66',
    },
  ];

  return (
    <section id="contracts" className="py-24 border-t border-[rgba(255,255,255,0.06)] bg-[#050505]">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="text-xs font-mono text-[var(--accent-blue)] uppercase tracking-wider mb-1">
              // SMART CONTRACTS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Deployed Contracts
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              All contracts are compiled in Cairo 2.9 and deployed on Starknet Sepolia.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-1 text-xs text-emerald-400 font-mono">
            <ShieldCheck size={14} />
            <span>3 / 3 Verified on Sepolia</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {contracts.map((c) => (
            <div key={c.name} className="card-premium p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-white">{c.name}</span>
                <span className="badge-status badge-ready text-[10px]">Verified</span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {c.role}
              </p>

              <div className="rounded-lg border border-[rgba(255,255,255,0.04)] bg-[#070B14] p-3 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)] text-[10px]">Address:</span>
                  <div className="flex items-center gap-1.5 text-white">
                    <span className="text-[11px] truncate max-w-[140px]">{c.address}</span>
                    <button
                      onClick={() => handleCopy(c.address, c.name)}
                      className="text-[var(--text-muted)] hover:text-white"
                      title="Copy Address"
                    >
                      {copiedKey === c.name ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.03)] pt-1.5">
                  <span className="text-[var(--text-muted)] text-[10px]">Class Hash:</span>
                  <span className="text-[10px] text-[var(--text-secondary)] truncate max-w-[140px]">
                    {c.classHash}
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <a
                  href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${c.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-mono text-[var(--accent-blue)] hover:underline"
                >
                  <span>View on Starkscan</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
