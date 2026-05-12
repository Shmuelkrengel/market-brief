import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const runtime = 'nodejs';
export const revalidate = 900; // 15 minutes

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketBrief/1.0)' },
});

const FEEDS = [
  {
    url: 'https://feeds.reuters.com/reuters/businessNews',
    source: 'Reuters',
    category: 'markets',
  },
  {
    url: 'https://feeds.reuters.com/reuters/topNews',
    source: 'Reuters',
    category: 'world',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    source: 'BBC',
    category: 'world',
  },
  {
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    source: 'BBC',
    category: 'markets',
  },
  {
    url: 'https://www.businesslive.co.za/rss/companies/',
    source: 'Business Day',
    category: 'sa',
  },
  {
    url: 'https://www.businesslive.co.za/rss/economy/',
    source: 'Business Day',
    category: 'sa',
  },
  {
    url: 'https://www.dailymaverick.co.za/rss/',
    source: 'Daily Maverick',
    category: 'sa',
  },
];

async function fetchFeed(feed: { url: string; source: string; category: string }) {
  try {
    const result = await parser.parseURL(feed.url);
    return result.items.slice(0, 8).map(item => ({
      title: item.title ?? '',
      link: item.link ?? '',
      pubDate: item.pubDate ?? item.isoDate ?? '',
      summary: item.contentSnippet?.slice(0, 180) ?? '',
      source: feed.source,
      category: feed.category,
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f)));
    const allItems = results.flatMap(r => (r.status === 'fulfilled' ? r.value : []));

    // Deduplicate by title similarity and sort by date
    const seen = new Set<string>();
    const unique = allItems.filter(item => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    const markets = unique.filter(i => i.category === 'markets').slice(0, 10);
    const world = unique.filter(i => i.category === 'world').slice(0, 10);
    const sa = unique.filter(i => i.category === 'sa').slice(0, 10);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      markets,
      world,
      sa,
    });
  } catch (err) {
    console.error('News API error:', err);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
