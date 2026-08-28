import React from 'react';
import { NETWORK_CONFIG, CONTRACT_ADDRESSES } from '../config/contracts';
import { Shield } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer className="border-t border-border-strong/45 bg-[#06080c] py-20 text-xs text-text-secondary w-full">
      <div className="container-custom grid grid-cols-1 md:grid-cols-12 gap-12 font-sans">
        
        {/* Left Brand Column (Spans 5 columns) */}
        <div className="md:col-span-5 space-y-4">
          <div 
            onClick={() => navigate('home')}
            className="flex items-center gap-2 text-text-primary font-bold text-sm uppercase tracking-widest cursor-pointer group select-none"
          >
            <Shield size={18} className="text-accent group-hover:scale-105 transition duration-200" />
            <span>GhostOrder</span>
          </div>
          <p className="text-text-secondary/70 leading-relaxed max-w-sm">
            Automating conditional L2 orders trustlessly. Built on Starknet Sepolia.
          </p>
        </div>

        {/* Right Links Columns (Spans 7 columns) */}
        <div className="md:col-span-7 grid grid-cols-3 gap-8">
          {/* Column 1: Application */}
          <div className="space-y-4">
            <h4 className="font-mono text-[9px] font-bold text-text-primary uppercase tracking-widest">// Product</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => navigate('home')} className="hover:text-text-primary transition duration-150 cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => navigate('dashboard')} className="hover:text-text-primary transition duration-150 cursor-pointer">
                  Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture */}
          <div className="space-y-4">
            <h4 className="font-mono text-[9px] font-bold text-text-primary uppercase tracking-widest">// Protocol</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => navigate('protocol')} className="hover:text-text-primary transition duration-150 cursor-pointer">
                  Specifications
                </button>
              </li>
              <li>
                <button onClick={() => navigate('contracts')} className="hover:text-text-primary transition duration-150 cursor-pointer">
                  Deployments
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div className="space-y-4">
            <h4 className="font-mono text-[9px] font-bold text-text-primary uppercase tracking-widest">// Starknet</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`${NETWORK_CONFIG.blockExplorerUrl}/contract/${CONTRACT_ADDRESSES.ghostEscrow}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary transition flex items-center gap-1 cursor-pointer"
                >
                  Starkscan ↗
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/kaverimeshram/GhostOrder"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-text-primary transition flex items-center gap-1 cursor-pointer"
                >
                  GitHub ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Bottom Legal row */}
      <div className="container-custom mt-16 pt-8 border-t border-border-strong/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted font-mono text-[10px] tracking-widest uppercase">
        <span>© 2026 GhostOrder Protocol</span>
        <span>Built on Starknet L2</span>
      </div>
    </footer>
  );
};
