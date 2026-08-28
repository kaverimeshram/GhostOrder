import React from 'react';
import { HeroVisual } from './HeroVisual';
import { useRouter } from '../context/RouterContext';

interface HeroProps {
  onOpenCreateOrder: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onOpenCreateOrder,
}) => {
  const { navigate } = useRouter();

  return (
    <section className="py-12 lg:py-0 bg-base overflow-hidden flex items-center min-h-[calc(100vh-80px)] w-full">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-center">
          {/* Left Column: Headline & Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            {/* Live Eyebrow */}
            <div className="inline-flex self-start items-center gap-2 text-[10px] font-mono font-bold text-accent-blue uppercase tracking-widest bg-accent-blue/5 border border-accent-blue/15 px-3.5 py-1.5 rounded-full select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-green animate-pulse"></span>
              <span>LIVE ON STARKNET SEPOLIA</span>
            </div>

            {/* Main Headings */}
            <div className="flex flex-col gap-4">
              <h1 
                className="font-sans font-extrabold tracking-tight text-text-primary leading-[1.05] uppercase"
                style={{ fontSize: 'clamp(2.2rem, 5vw, 4.8rem)' }}
              >
                Private<br />
                Conditional<br />
                Orders
              </h1>
              
              <h2 
                className="font-serif italic font-normal text-text-secondary leading-[1.2] pt-1"
                style={{ fontSize: 'clamp(1.4rem, 2.8vw, 2.5rem)' }}
              >
                Executed When Conditions Are Met.
              </h2>
            </div>

            {/* Description */}
            <p className="max-w-xl text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
              Create conditional on-chain orders that remain dormant until your price conditions are satisfied. GhostOrder automates trade intent on Starknet without custodian key exposure.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() => navigate('dashboard')}
                className="btn-primary text-xs font-semibold cursor-pointer h-12 rounded-xl px-6"
              >
                <span>Open Dashboard →</span>
              </button>

              <button
                onClick={() => navigate('protocol')}
                className="btn-secondary text-xs font-semibold cursor-pointer h-12 rounded-xl px-6"
              >
                <span>Verify Protocol →</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Product Preview */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end relative">
            {/* Ambient background glow */}
            <div className="absolute -inset-10 bg-gradient-to-tr from-accent-blue/10 to-accent-blue/0 blur-[64px] pointer-events-none rounded-full"></div>
            <HeroVisual onOpenCreateOrder={() => navigate('dashboard')} />
          </div>
        </div>
      </div>
    </section>
  );
};
