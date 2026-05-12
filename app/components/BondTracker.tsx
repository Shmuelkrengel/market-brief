'use client';

import { QuoteData } from './types';

function fmt(val: number | null | undefined, decimals = 3): string {
  if (val == null) return '—';
  return val.toFixed(decimals);
}

function fmtChange(val: number | null | undefined): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(3)}`;
}

interface BondTrackerProps {
  bondsYahoo?: QuoteData[];
  bondsTE?: QuoteData[];
}

const REGION_FLAGS: Record<string, string> = {
  US: '🇺🇸', UK: '🇬🇧', SA: '🇿🇦', DE: '🇩🇪',
  FR: '🇫🇷', JP: '🇯🇵', AU: '🇦🇺', CN: '🇨🇳', IT: '🇮🇹',
};

function YieldGauge({ value, max = 12 }: { value: number | null; max?: number }) {
  if (value == null) return (
    <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2 }} />
  );
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);
  const color = value > 7 ? 'var(--down)' : value > 4 ? 'var(--gold)' : 'var(--up)';
  return (
    <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
    </div>
  );
}

function BondRow({ bond }: { bond: QuoteData }) {
  const isUp = (bond.change ?? 0) >= 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
        <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
          {REGION_FLAGS[bond.region ?? ''] ?? ''} {bond.name}
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: bond.price == null ? '#4a5568' : '#e2e8f0' }}>
            {bond.price != null ? `${fmt(bond.price)}%` : '—'}
          </span>
          {bond.change != null && (
            <span style={{ fontSize: '0.66rem', fontWeight: 600, color: isUp ? 'var(--down)' : 'var(--up)' }}>
              {/* bond yield up = price down — intentionally inverted color */}
              {fmtChange(bond.change)}
            </span>
          )}
        </div>
      </div>
      <YieldGauge value={bond.price} />
    </div>
  );
}

function BondGroup({ title, bonds }: { title: string; bonds: QuoteData[] }) {
  const valid = bonds.filter(b => !b.error || b.price != null);
  return (
    <div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 10 }}>
        {title}
      </div>
      {valid.length === 0
        ? <div style={{ fontSize: '0.72rem', color: '#4a5568' }}>Loading...</div>
        : valid.map(b => <BondRow key={b.symbol} bond={b} />)
      }
    </div>
  );
}

export default function BondTracker({ bondsYahoo, bondsTE }: BondTrackerProps) {
  const by = bondsYahoo ?? [];
  const bt = bondsTE ?? [];
  const usYahoo = by.filter(b => b.region === 'US');
  const ukTE = bt.filter(b => b.region === 'UK');
  const saTE = bt.filter(b => b.region === 'SA');
  const euTE = bt.filter(b => ['DE', 'FR', 'IT'].includes(b.region ?? ''));
  const asiaTE = bt.filter(b => ['JP', 'AU', 'CN'].includes(b.region ?? ''));

  return (
    <div className="card">
      <div className="card-header">
        <span>📈</span>
        Bond Yield Tracker
        <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: '#4a5568' }}>
          ▲ yield = ▼ bond price &nbsp;·&nbsp; TE = Trading Economics
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20 }}>
        <BondGroup title="🇺🇸 US Treasuries" bonds={usYahoo} />
        <BondGroup title="🇬🇧 UK Gilts" bonds={ukTE} />
        <BondGroup title="🇿🇦 South Africa" bonds={saTE} />
        <BondGroup title="🇪🇺 Europe" bonds={euTE} />
        <BondGroup title="Asia / Pacific" bonds={asiaTE} />
      </div>
    </div>
  );
}
