'use client';

import { QuoteData } from './types';

function fmtPct(val: number | null | undefined): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

interface BigMoversProps {
  jseMajors: QuoteData[];
  usMajors: QuoteData[];
}

function MoverBar({ changePct }: { changePct: number | null }) {
  if (changePct == null) return null;
  const clamped = Math.min(Math.abs(changePct), 10);
  const width = `${(clamped / 10) * 100}%`;
  const color = changePct >= 0 ? 'var(--up)' : 'var(--down)';
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
      <div style={{ width, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

function MoverList({ items, title }: { items: QuoteData[]; title: string }) {
  const valid = items.filter(i => i.changePct != null).sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!));

  return (
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {valid.slice(0, 8).map(item => (
          <div key={item.symbol}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e0' }}>{item.name}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: (item.changePct ?? 0) >= 0 ? 'var(--up)' : 'var(--down)' }}>
                {fmtPct(item.changePct)}
              </span>
            </div>
            <MoverBar changePct={item.changePct} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BigMovers({ jseMajors, usMajors }: BigMoversProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span>📊</span>
        Big Movers
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <MoverList items={jseMajors} title="JSE" />
        <MoverList items={usMajors} title="US Stocks" />
      </div>
    </div>
  );
}
