'use client';

import { SENSItem } from './types';

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  } catch {
    return dateStr;
  }
}

interface SENSFeedProps {
  announcements: SENSItem[];
  count: number;
  error?: string;
}

export default function SENSFeed({ announcements, count, error }: SENSFeedProps) {
  return (
    <div className="card">
      <div className="card-header">
        <span>📣</span>
        JSE SENS Announcements
        {count > 0 && (
          <span style={{
            marginLeft: 6,
            background: 'rgba(79,195,247,0.15)',
            color: 'var(--blue)',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: '0.6rem',
            fontWeight: 700,
          }}>
            {count}
          </span>
        )}
        <a
          href="https://www.jse.co.za/current-companies/company-announcements"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'var(--blue)', textDecoration: 'none' }}
        >
          View all →
        </a>
      </div>

      {error && announcements.length === 0 ? (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#4a5568', marginBottom: 8 }}>
            SENS data temporarily unavailable via scraper.
          </p>
          <a
            href="https://www.jse.co.za/current-companies/company-announcements"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: '0.72rem',
              color: 'var(--blue)',
              textDecoration: 'none',
            }}
          >
            Open JSE SENS →
          </a>
        </div>
      ) : (
        <div className="scrollbar-thin" style={{ overflowY: 'auto', maxHeight: 340 }}>
          {announcements.length === 0 ? (
            <p style={{ fontSize: '0.75rem', color: '#4a5568', textAlign: 'center', padding: '16px 0' }}>
              Loading SENS...
            </p>
          ) : (
            announcements.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textDecoration: 'none', padding: '7px 0', borderBottom: '1px solid var(--border)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                      {item.isPriority && (
                        <span className="pill pill-priority">Priority</span>
                      )}
                      {item.company && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#e2e8f0' }}>
                          {item.company}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#a0aec0', lineHeight: 1.35 }}>
                      {item.headline}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#4a5568', marginTop: 2 }}>
                      {item.category && <span style={{ color: 'var(--blue)' }}>{item.category} · </span>}
                      {timeAgo(item.time)}
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
