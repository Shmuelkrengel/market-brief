'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from './Header';
import TickerCard from './TickerCard';
import BigMovers from './BigMovers';
import BondTracker from './BondTracker';
import NewsSection from './NewsSection';
import SENSFeed from './SENSFeed';
import DailyContent from './DailyContent';
import ExecutiveSummary from './ExecutiveSummary';
import { MarketData, NewsData, SENSData, DailyContent as DailyContentType } from './types';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function Dashboard() {
  const [markets, setMarkets] = useState<MarketData | null>(null);
  const [news, setNews] = useState<NewsData | null>(null);
  const [sens, setSens] = useState<SENSData | null>(null);
  const [daily, setDaily] = useState<DailyContentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchAll = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [mRes, nRes, sRes, dRes] = await Promise.allSettled([
        fetch('/api/markets').then(r => r.json()),
        fetch('/api/news').then(r => r.json()),
        fetch('/api/sens').then(r => r.json()),
        fetch('/api/daily-content').then(r => r.json()),
      ]);

      if (mRes.status === 'fulfilled' && !mRes.value.error) setMarkets(mRes.value);
      if (nRes.status === 'fulfilled' && !nRes.value.error) setNews(nRes.value);
      if (sRes.status === 'fulfilled') setSens(sRes.value);
      if (dRes.status === 'fulfilled' && !dRes.value.error) setDaily(dRes.value);

      setLastUpdated(new Date().toISOString());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(() => fetchAll(false), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchAll]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px 40px' }}>
      <Header lastUpdated={lastUpdated} onRefresh={() => fetchAll(true)} isLoading={isLoading} />

      {isLoading && !markets ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 16 }}>⚡</div>
          <p style={{ color: '#4a5568', fontSize: '0.85rem' }}>Fetching live market data...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Executive Summary */}
          <ExecutiveSummary markets={markets} news={news} />

          {/* Row 1: US + SA Markets */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <TickerCard title="US Markets" icon="🇺🇸" items={markets?.indicesUS ?? []} />
            <TickerCard title="SA Markets" icon="🇿🇦" items={markets?.indicesSA ?? []} />
          </div>

          {/* Row 2: European + Asian Markets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TickerCard title="European Markets" icon="🇪🇺" items={markets?.indicesEU ?? []} />
            <TickerCard title="Asian Markets" icon="🌏" items={markets?.indicesASIA ?? []} />
          </div>

          {/* Row 3: Currencies + Commodities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <TickerCard title="Currencies" icon="💱" items={markets?.currencies ?? []} decimals={4} />
            <TickerCard title="Commodities" icon="🪙" items={markets?.commodities ?? []} showUnit decimals={2} />
          </div>

          {/* Row 4: Bond Tracker */}
          <BondTracker
            bondsYahoo={markets?.bondsYahoo ?? []}
            bondsTE={markets?.bondsTE ?? []}
          />

          {/* Row 5: Big Movers */}
          <BigMovers
            jseMajors={markets?.jseMajors ?? []}
            usMajors={markets?.usMajors ?? []}
          />

          {/* Row 6: JSE SENS */}
          {sens && (
            <SENSFeed
              announcements={sens.announcements}
              count={sens.count}
              error={sens.error}
            />
          )}

          {/* Row 7: News */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <NewsSection title="Markets News" icon="📰" items={news?.markets ?? []} />
            <NewsSection title="Geopolitics & World" icon="🌍" items={news?.world ?? []} />
            <NewsSection title="South Africa" icon="🇿🇦" items={news?.sa ?? []} />
          </div>

          {/* Row 8: Daily Content */}
          <DailyContent
            concept={daily?.concept ?? null}
            randomFact={daily?.randomFact ?? null}
          />

          <div style={{ textAlign: 'center', fontSize: '0.62rem', color: '#2d3748', paddingTop: 8 }}>
            Data: Yahoo Finance · Trading Economics · Reuters · BBC · Business Day · JSE SENS (Moneyweb)
            &nbsp;·&nbsp; Auto-refreshes every 5 minutes
          </div>
        </div>
      )}
    </div>
  );
}
