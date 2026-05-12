'use client';

import { useEffect, useState } from 'react';

interface HeaderProps {
  lastUpdated: string | null;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function Header({ lastUpdated, onRefresh, isLoading }: HeaderProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeStr = now.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0 18px',
      borderBottom: '1px solid var(--border)',
      marginBottom: 20,
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div className="live-dot" />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f7fafc' }}>
            Market Brief
          </h1>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#718096' }}>
          {dateStr} &nbsp;·&nbsp; <span style={{ fontVariantNumeric: 'tabular-nums', color: '#a0aec0' }}>{timeStr}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {lastUpdated && (
          <div style={{ fontSize: '0.65rem', color: '#4a5568', textAlign: 'right' }}>
            Updated {new Date(lastUpdated).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            background: isLoading ? 'var(--border)' : 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: isLoading ? '#4a5568' : '#a0aec0',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ display: 'inline-block', animation: isLoading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
