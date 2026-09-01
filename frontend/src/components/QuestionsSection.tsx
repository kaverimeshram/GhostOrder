import React from 'react';

const QUESTIONS = [
  {
    n: '01',
    title: 'Can anyone see your order?',
    desc: 'Public limit orders sit in the mempool the moment you sign — size, direction, and trigger price all visible before they even fill.',
  },
  {
    n: '02',
    title: 'Can anyone front-run your trigger?',
    desc: 'Bots watch for orders approaching their target and jump the queue. A visible trigger price is a standing invitation to be front-run.',
  },
  {
    n: '03',
    title: 'Will it execute exactly as configured?',
    desc: 'Escrowed funds, an on-chain oracle check, and a single atomic settlement — no custodian, no keeper you have to trust with your strategy.',
  },
];

export default function QuestionsSection() {
  return (
    <section className="section border-b border-border-soft">
      <div className="container-custom">
        <p className="eyebrow mb-4 text-center">// Why It Matters</p>
        <h2 className="font-display mx-auto max-w-2xl text-center text-[30px] font-bold leading-tight tracking-tight sm:text-[38px]">
          Your customers execute on-chain. Your strategy shouldn't be public before it fires.
        </h2>

        <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8 text-left">
          {QUESTIONS.map((q) => (
            <div key={q.n}>
              <span className="font-display text-[13px] font-bold text-phosphor">{q.n}</span>
              <h3 className="font-display mt-3 text-[19px] font-semibold">{q.title}</h3>
              <p className="mt-2.5 text-[14px] leading-relaxed text-text-secondary">{q.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
