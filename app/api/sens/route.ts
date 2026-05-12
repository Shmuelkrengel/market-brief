import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 600; // 10 minutes

interface SENSItem {
  headline: string;
  company: string;
  time: string;
  category: string;
  link: string;
  isPriority: boolean;
}

const PRIORITY_KEYWORDS = [
  'cautionary',
  'results',
  'dividend',
  'acquisition',
  'disposal',
  'trading statement',
  'general offer',
  'listing',
  'delisting',
  'rights offer',
  'voluntary',
  'mandatory',
  'scheme',
  'merger',
  'offer to acquire',
  'interim',
  'annual',
  'earnings',
];

function isPriority(text: string): boolean {
  const lower = text.toLowerCase();
  return PRIORITY_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchSENSFromMoneyweb(): Promise<SENSItem[]> {
  const res = await fetch('https://www.moneyweb.co.za/tools-and-data/moneyweb-sens/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const items: SENSItem[] = [];

  // Extract SENS links from href pattern
  const linkRegex = /href="(https:\/\/www\.moneyweb\.co\.za\/mny_sens\/[^"]+)"/g;
  const titleRegex = /title="Go to SENS announcement"[^>]*>([\s\S]*?)<\/a>/g;
  const strongRegex = /<strong>([^<]+)<\/strong>/;

  // Find all SENS announcement blocks
  // Pattern: <a href="https://www.moneyweb.co.za/mny_sens/..." title="Go to SENS announcement" ...>
  //            <strong>COMPANY</strong>&nbsp;&#8211;&nbsp; HEADLINE<br />
  //          </a>
  const blockRegex = /<a\s+href="(https:\/\/www\.moneyweb\.co\.za\/mny_sens\/[^"]+)"[^>]*title="Go to SENS announcement"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = blockRegex.exec(html)) !== null && items.length < 30) {
    const link = match[1];
    const content = match[2];

    // Extract company from <strong> tag
    const companyMatch = strongRegex.exec(content);
    const company = companyMatch ? companyMatch[1].trim() : '';

    // Extract headline - text after the company name and dash
    const cleanContent = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#8211;/g, '–')
      .replace(/&#038;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove company name from start
    const headline = cleanContent
      .replace(new RegExp(`^${company}\\s*[–-]\\s*`, 'i'), '')
      .trim();

    if (company || headline) {
      const text = `${company} ${headline}`;
      items.push({
        company,
        headline: headline || company,
        time: '', // Moneyweb page doesn't show times without login
        category: '',
        link,
        isPriority: isPriority(text),
      });
    }
  }

  // If block regex didn't work well, try simpler link extraction
  if (items.length === 0) {
    const links: string[] = [];
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      links.push(linkMatch[1]);
    }

    // Extract corresponding titles
    const titles: string[] = [];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
      const clean = titleMatch[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#8211;/g, '–')
        .replace(/&#038;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      titles.push(clean);
    }

    for (let i = 0; i < Math.min(links.length, titles.length, 25); i++) {
      const text = titles[i];
      const dashIdx = text.indexOf('–');
      const company = dashIdx > 0 ? text.slice(0, dashIdx).trim() : '';
      const headline = dashIdx > 0 ? text.slice(dashIdx + 1).trim() : text;

      items.push({
        company,
        headline,
        time: '',
        category: '',
        link: links[i],
        isPriority: isPriority(text),
      });
    }
  }

  return items;
}

export async function GET() {
  try {
    const items = await fetchSENSFromMoneyweb();

    // Sort priority first
    items.sort((a, b) => {
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      return 0;
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      announcements: items,
      count: items.length,
      source: 'Moneyweb',
    });
  } catch (err) {
    console.error('SENS API error:', err);
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      announcements: [],
      count: 0,
      error: 'SENS data temporarily unavailable',
      source: 'Moneyweb',
    });
  }
}
