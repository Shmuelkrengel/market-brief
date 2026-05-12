import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

export const runtime = 'nodejs';
export const revalidate = 600; // 10 minutes

const PRIORITY_KEYWORDS = [
  'cautionary', 'results', 'dividend', 'acquisition', 'disposal',
  'trading statement', 'general offer', 'listing', 'delisting',
  'rights offer', 'voluntary', 'mandatory', 'scheme', 'merger',
  'offer to acquire', 'interim', 'annual', 'earnings', 'condensed',
  'audited', 'unaudited', 'business update', 'strategic',
];

function isPriority(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIORITY_KEYWORDS.some(kw => lower.includes(kw));
}

function parseCompanyAndHeadline(title: string): { company: string; headline: string } {
  // Format: "COMPANY NAME – Headline text" or "COMPANY NAME - Headline text"
  const dashIdx = title.search(/\s[–—-]\s/);
  if (dashIdx > 0) {
    return {
      company: title.slice(0, dashIdx).trim(),
      headline: title.slice(dashIdx).replace(/^\s[–—-]\s/, '').trim(),
    };
  }
  return { company: '', headline: title.trim() };
}

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; MarketBrief/1.0)',
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
});

export async function GET() {
  try {
    const feed = await parser.parseURL('https://www.moneyweb.co.za/feed/?post_type=mny_sens');

    const items = feed.items.slice(0, 40).map(item => {
      const title = item.title ?? '';
      const { company, headline } = parseCompanyAndHeadline(title);
      const text = title;

      return {
        company,
        headline,
        time: item.pubDate ?? item.isoDate ?? '',
        category: '',
        link: item.link ?? 'https://www.moneyweb.co.za/tools-and-data/moneyweb-sens/',
        isPriority: isPriority(text),
      };
    });

    // Priority first, then chronological
    items.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      announcements: items,
      count: items.length,
      source: 'Moneyweb RSS',
    });
  } catch (err) {
    console.error('SENS RSS error:', err);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      announcements: [],
      count: 0,
      error: 'SENS data temporarily unavailable',
    });
  }
}
