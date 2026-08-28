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
      role: 'Conditional Order Escrow & Settlement Engine. Locks inputs and triggers output payouts upon condition fulfillment.',
      address: CONTRACT_ADDRESSES.ghostEscrow,
      classHash: '0x01f01ca79d1f2184a047df7adc594f97610882cf9f7825dc25d1bcc96a61ecd3',
    },
    {
      name: 'MockPriceOracle',
      role: 'On-Chain Price Feed & Condition Evaluator. Serves as price authority during L2 condition matches.',
      address: CONTRACT_ADDRESSES.oracle,
      classHash: '0x03326e03ae724c33c4902a653d94775996e4e2cd651078bf8c71476e2d5a919e',
    },
    {
      name: 'MockSettlement',
      role: 'Direct Output Payout & Liquidity Swapper. Completes swapping inputs into output tokens directly.',
      address: CONTRACT_ADDRESSES.settlement,
      classHash: '0x06d5bc2a2456020a27f6b7592f3cf296bb39799c399a83cf4723845ec8983b66',
    },
  ];

  return (
    <section className="py-20 sm:py-28 lg:py-36 bg-[#06080c]">
      <div className="container-custom">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16">
          <div className="space-y-3">
            <div className="section-eyebrow">
              // ON-CHAIN PROTOCOL REGISTRY
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-text-primary tracking-tight uppercase">
              Deployed Contracts
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-xl leading-relaxed">
              All core Cairo smart contracts deployed and verified on Starknet Sepolia.
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/5 px-3.5 py-1 text-xs text-success font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></span>
            <span>3 / 3 Verified on Starknet L2</span>
          </div>
        </div>

        {/* Technical Details Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {contracts.map((c) => (
            <div 
              key={c.name} 
              className="card-premium flex flex-col justify-between min-h-[360px] hover:border-accent/40"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-text-primary uppercase tracking-wide">
                    {c.name}
                  </span>
                  <span className="badge-status badge-ready">Verified</span>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed min-h-[40px]">
                  {c.role}
                </p>

                <div className="rounded-xl border border-border-strong bg-bg-base p-4 font-mono text-xs space-y-3">
                  <div className="space-y-1">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider block">Contract Address:</span>
                    <div className="flex items-center justify-between text-text-primary">
                      <span className="truncate max-w-[170px] select-all">{c.address}</span>
                      <button
                        onClick={() => handleCopy(c.address, c.name + '-addr')}
                        className="text-text-muted hover:text-text-primary transition cursor-pointer"
                        title="Copy Address"
                      >
                        {copiedKey === c.name + '-addr' ? (
                          <Check size={12} className="text-success" />
                        ) : (
                          <Copy size={12} className="hover:scale-110 transition duration-150" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-border-strong pt-3 space-y-1">
                    <span className="text-text-muted text-[10px] uppercase tracking-wider block">Cairo Class Hash:</span>
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="truncate max-w-[170px] select-all">{c.classHash}</span>
                      <button
                        onClick={() => handleCopy(c.classHash, c.name + '-hash')}
                        className="text-text-muted hover:text-text-primary transition cursor-pointer"
                        title="Copy Class Hash"
                      >
                        {copiedKey === c.name + '-hash' ? (
                          <Check size={12} className="text-success" />
                        ) : (
                          <Copy size={12} className="hover:scale-110 transition duration-150" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <a
                  href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${c.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-2 px-4 justify-center w-full cursor-pointer text-center"
                >
                  <span>View on Explorer ↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
