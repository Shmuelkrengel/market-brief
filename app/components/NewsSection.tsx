'use client';

import { NewsItem } from './types';

function timeAgo(pubDate: string): string {
  if (!pubDate) return '';
  const diff = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface NewsSectionProps {
  title: string;
  icon: string;
  items: NewsItem[];
  maxItems?: number;
}

export default function NewsSection({ title, icon, items, maxItems = 8 }: NewsSectionProps) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div className="card-header">
        <span>{icon}</span>
        {title}
      </div>
      <div className="scrollbar-thin" style={{ overflowY: 'auto', maxHeight: 340 }}>
        {items.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: '#4a5568', textAlign: 'center', padding: '16px 0' }}>
            Loading news...
          </p>
        ) : (
          items.slice(0, maxItems).map((item, i) => (
            <div key={i} className="news-item">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="news-title"
                style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}
              >
                {item.title}
              </a>
              <div className="news-meta">
                <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{item.source}</span>
                {' · '}
                {timeAgo(item.pubDate)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
