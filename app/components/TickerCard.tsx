'use client';

import { QuoteData } from './types';

function fmt(val: number | null | undefined, decimals = 2): string {
  if (val == null) return '—';
  return val.toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(val: number | null | undefined): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

function fmtChange(val: number | null | undefined, decimals = 2): string {
  if (val == null) return '—';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${fmt(val, decimals)}`;
}

function getColor(val: number | null | undefined): string {
  if (val == null) return 'neutral';
  if (val > 0) return 'up';
  if (val < 0) return 'down';
  return 'neutral';
}

interface TickerCardProps {
  title: string;
  icon?: string;
  items: QuoteData[];
  showUnit?: boolean;
  decimals?: number;
  explanation?: string;
}

export default function TickerCard({ title, icon, items, showUnit, decimals = 2, explanation }: TickerCardProps) {
  return (
    <div className="card">
      <div className="card-header">
        {icon && <span>{icon}</span>}
        {title}
      </div>
      {items.map((item) => (
        <div key={item.symbol} className="ticker-row">
          <div>
            <div className="ticker-name">{item.name}</div>
            {showUnit && item.unit && (
              <div style={{ fontSize: '0.6rem', color: '#4a5568' }}>{item.unit}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            {item.error || item.price == null ? (
              <span style={{ fontSize: '0.72rem', color: '#4a5568' }}>—</span>
            ) : (
              <>
                <div className={`ticker-price ${getColor(item.changePct)}`}>
                  {item.type === 'yield'
                    ? `${fmt(item.price, 3)}%`
                    : fmt(item.price, decimals)}
                </div>
                <div className={`ticker-change ${getColor(item.changePct)}`}>
                  {fmtChange(item.change, decimals)} ({fmtPct(item.changePct)})
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      {explanation && (
        <div style={{
          marginTop: 10,
          padding: '7px 10px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 6,
          borderLeft: '2px solid rgba(79,195,247,0.25)',
          fontSize: '0.67rem',
          color: '#718096',
          lineHeight: 1.55,
        }}>
          💡 {explanation}
        </div>
      )}
    </div>
  );
}
