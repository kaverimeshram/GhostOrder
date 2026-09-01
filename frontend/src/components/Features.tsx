import React from 'react';
import BrowserFrame from './BrowserFrame';
import ConfigurePanel from './panels/ConfigurePanel';
import EscrowPanel from './panels/EscrowPanel';
import MonitorPanel from './panels/MonitorPanel';
import DiffPanel from './panels/DiffPanel';

const FEATURES = [
  {
    n: '01',
    eyebrow: 'Configure',
    title: 'Set your pair, size, and trigger — nothing leaves your device yet.',
    desc: 'Every parameter is drafted client-side. Nothing is submitted to Starknet until you choose to lock funds into escrow — your target price never touches a public mempool.',
    panel: <ConfigurePanel />,
    url: 'app.ghostorder.xyz/create',
  },
  {
    n: '02',
    eyebrow: 'Escrow',
    title: 'Funds lock into a non-custodial contract — dormant, not idle.',
    desc: 'GhostEscrow holds your assets under a single invariant: release only on a matched oracle condition, or a refund to you. No admin key, no multisig, no third party ever has custody.',
    panel: <EscrowPanel />,
    url: 'app.ghostorder.xyz/escrow',
  },
  {
    n: '03',
    eyebrow: 'Monitor',
    title: 'The oracle checks your condition — you don’t have to watch it.',
    desc: 'Block-by-block, the on-chain price feed evaluates your trigger. Nothing about your order is queryable until the exact condition is matched — there’s no partial signal to front-run.',
    panel: <MonitorPanel />,
    url: 'app.ghostorder.xyz/monitor',
  },
];

export default function Features() {
  return (
    <div id="product">
      {FEATURES.map((f, i) => (
        <section key={f.n} className="section border-b border-border-soft">
          <div className="container-custom">
            <div
              className={`grid items-center gap-14 lg:grid-cols-2 lg:gap-16 text-left ${
                i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div>
                <span className="font-display text-[13px] font-bold text-phosphor">{f.n}</span>
                <p className="eyebrow mt-3 mb-4">{f.eyebrow}</p>
                <h3 className="font-display max-w-md text-[26px] font-bold leading-tight tracking-tight sm:text-[30px] text-text-primary">
                  {f.title}
                </h3>
                <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-text-secondary">{f.desc}</p>
              </div>
              <BrowserFrame url={f.url}>{f.panel}</BrowserFrame>
            </div>
          </div>
        </section>
      ))}

      {/* signature diff section — the standout, bold element */}
      <section className="section border-b border-border-soft">
        <div className="container-custom">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-4">// The Difference</p>
            <h2 className="font-display text-[30px] font-bold leading-tight tracking-tight sm:text-[38px] text-text-primary">
              Same trade. Radically different footprint.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
              Here's exactly what a front-runner can read off-chain, before and
              after switching to GhostOrder.
            </p>
          </div>
          <div className="mt-12">
            <BrowserFrame url="starkscan.co/tx-comparison">
              <DiffPanel />
            </BrowserFrame>
          </div>
        </div>
      </section>
    </div>
  );
}
