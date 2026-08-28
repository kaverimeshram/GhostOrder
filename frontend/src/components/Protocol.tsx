import React from 'react';
import { Shield, Lock, Eye, Database, Terminal, ArrowRight } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

export const Protocol: React.FC = () => {
  const { navigate } = useRouter();

  const architectures = [
    {
      title: 'Trustless Escrow Custody',
      desc: 'Deposited funds are held solely by the GhostEscrow smart contract. There are no admin keys, no multi-sigs, and no third-party custodians. Assets can only be released via automated oracle trigger matches or owner cancellation refunds.',
      icon: <Lock size={20} className="text-accent" />,
      details: 'Function: create_order() & cancel_order()',
    },
    {
      title: 'Conditional Trigger Privacy',
      desc: 'Order parameters, including execution logic and target prices, are stored securely on-chain. Order details are dormant until the exact pricing conditions are matched, preventing front-running and copy-trading.',
      icon: <Eye size={20} className="text-accent" />,
      details: 'Cairo Struct: Order { token_in, token_out, target_price }',
    },
    {
      title: 'On-Chain Oracle Validation',
      desc: 'Execution conditions are checked dynamically on-chain against Starknet price feeds (MockPriceOracle). A caller can only trigger execution if the current oracle price is greater than or equal to the target price set by the user.',
      icon: <Database size={20} className="text-success" />,
      details: 'Interface: IOracleDispatcher.get_price()',
    },
    {
      title: 'Automated Escrow Settlement',
      desc: 'Upon validation, the GhostEscrow contract directly releases the locked inputs to the MockSettlement contract. The settlement contract completes the trade swap and sends output tokens directly back to the owner.',
      icon: <Terminal size={20} className="text-accent" />,
      details: 'Function: execute_order() -> settle()',
    },
  ];

  return (
    <div className="bg-[#06080c]">
      {/* Intro Hero Section */}
      <section className="py-20 sm:py-28 lg:py-36 bg-[#06080c]">
        <div className="container-custom">
          <div className="max-w-3xl space-y-6 text-left">
            <div className="section-eyebrow">
              // ARCHITECTURE SPECIFICATION
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight uppercase leading-none text-text-primary">
              GhostOrder Protocol
            </h1>
            <p className="text-base sm:text-lg text-text-secondary leading-relaxed">
              GhostOrder is a decentralized conditional order protocol built in Cairo for Starknet. It enables users to submit orders that execute automatically once verified on-chain by oracles.
            </p>
          </div>
        </div>
      </section>

      {/* Deep Dive Breakdown Section */}
      <section className="py-20 sm:py-28 lg:py-36 bg-[#06080c]">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Left Column: Visual Flowchart & MONO Terminal */}
            <div className="lg:col-span-5 space-y-8">
              <div className="p-8 border border-border-strong bg-surface rounded-2xl space-y-6">
                <div className="flex items-center gap-2 text-text-primary font-mono text-xs font-bold border-b border-border pb-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                  <span>ORDER LIFECYCLE STATE MACHINE</span>
                </div>

                <div className="font-mono text-xs text-text-secondary space-y-4 leading-relaxed">
                  <div className="p-3 bg-bg-base border border-border rounded-lg">
                    <span className="text-accent font-semibold">1. SUBMISSION</span>
                    <p className="text-[10px] text-text-muted mt-1">User calls create_order(). Tokens transferred to GhostEscrow contract.</p>
                  </div>
                  
                  <div className="flex justify-center text-text-muted">↓</div>

                  <div className="p-3 bg-bg-base border border-border rounded-lg">
                    <span className="text-accent font-semibold">2. ESCROW LOCK</span>
                    <p className="text-[10px] text-text-muted mt-1">State set to Active. Price target remains dormant until matched.</p>
                  </div>

                  <div className="flex justify-center text-text-muted">↓</div>

                  <div className="p-3 bg-bg-base border border-border rounded-lg">
                    <span className="text-success font-semibold">3. PRICE MATCH & EXECUTE</span>
                    <p className="text-[10px] text-text-muted mt-1">execute_order() verifies Oracle price. MockSettlement swapper runs.</p>
                  </div>

                  <div className="flex justify-center text-text-muted">↓</div>

                  <div className="p-3 bg-bg-base border border-border rounded-lg">
                    <span className="text-text-primary font-semibold">4. SETTLEMENT COMPLETE</span>
                    <p className="text-[10px] text-text-muted mt-1">Output tokens sent to owner. Order state set to Executed.</p>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="p-8 border border-border-strong bg-surface-elevated rounded-2xl space-y-4">
                <h3 className="font-sans text-lg font-bold text-text-primary">Ready to interact?</h3>
                <p className="text-xs text-text-secondary">Navigate to the dashboard to start simulating or executing live Starknet orders.</p>
                <button
                  onClick={() => navigate('dashboard')}
                  className="btn-primary w-full text-xs font-semibold"
                >
                  <span>Open Dashboard →</span>
                </button>
              </div>
            </div>

            {/* Right Column: Architectural Pillars */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-text-primary">
                  Protocol Pillars
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary">
                  How GhostOrder guarantees trustless execution and protection of user assets.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {architectures.map((pillar, idx) => (
                  <div 
                    key={idx} 
                    className="p-8 border border-border bg-surface-elevated rounded-2xl flex gap-6 hover:border-accent/30 transition-all duration-300"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bg-base border border-border text-accent">
                      {pillar.icon}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-text-primary tracking-tight font-sans">
                        {pillar.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-sans">
                        {pillar.desc}
                      </p>
                      <div className="inline-block pt-1 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                        {pillar.details}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
