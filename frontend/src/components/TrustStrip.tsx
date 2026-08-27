import React from 'react';
import { Layers, ShieldCheck, Database, Cpu } from 'lucide-react';

export const TrustStrip: React.FC = () => {
  return (
    <div className="border-y border-[rgba(255,255,255,0.06)] bg-[#070B14]/80 py-8">
      <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)] text-center md:text-left">
          Built for Starknet
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm font-semibold text-[var(--text-secondary)]">
          {/* Cairo 2.9 */}
          <div className="flex items-center gap-2 hover:text-white transition">
            <Layers size={16} className="text-[var(--accent-blue)]" />
            <span className="font-mono text-xs font-bold tracking-wider">Cairo 2.9</span>
          </div>

          {/* Starknet */}
          <div className="flex items-center gap-2 hover:text-white transition">
            <Cpu size={16} className="text-[var(--accent-cyan)]" />
            <span className="font-mono text-xs font-bold tracking-wider">Starknet</span>
          </div>

          {/* Alchemy */}
          <div className="flex items-center gap-2 hover:text-white transition">
            <Database size={16} className="text-purple-400" />
            <span className="font-mono text-xs font-bold tracking-wider">Alchemy</span>
          </div>

          {/* Starkscan */}
          <div className="flex items-center gap-2 hover:text-white transition">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="font-mono text-xs font-bold tracking-wider">Starkscan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
