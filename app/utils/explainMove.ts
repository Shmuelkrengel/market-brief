import { QuoteData, NewsItem, SENSItem } from '../components/types';

// Keywords to find relevant news for each card
const CARD_KEYWORDS: Record<string, string[]> = {
  'US Markets': ['s&p', 'sp500', 'dow jones', 'nasdaq', 'wall street', 'federal reserve', 'fed ', 'rate cut', 'rate hike', 'inflation', 'nonfarm', 'payroll', 'us stocks', 'american equities', 'us economy'],
  'SA Markets': ['jse', 'south africa', 'rand', 'johannesburg', 'sarb', 'south african market', 'sa economy'],
  'European Markets': ['ftse', 'dax', 'cac 40', 'stoxx', 'europe', 'ecb', 'eurozone', 'bank of england', 'boe', 'uk economy', 'eu economy'],
  'Asian Markets': ['nikkei', 'hang seng', 'shanghai', 'china', 'japan', 'korea', 'asia', 'boj', 'pboc', 'chinese economy', 'japanese economy'],
  'Currencies': ['rand', 'dollar', 'sterling', 'euro', 'yen', 'forex', 'exchange rate', 'currency', 'fx market', 'reserve bank'],
  'Commodities': ['oil', 'gold', 'brent', 'wti', 'crude', 'copper', 'platinum', 'silver', 'natural gas', 'opec', 'commodity'],
  'Bond Yield Tracker': ['treasury', 'yield', 'gilt', 'bond', 'rate', 'fed ', 'federal reserve', 'boe', 'ecb', 'inflation', 'rate hike', 'rate cut'],
};

// Per-stock keyword map — for matching against news and SENS
const STOCK_KEYWORDS: Record<string, string[]> = {
  'NPN.JO':  ['naspers', 'tencent'],
  'PRX.JO':  ['prosus', 'tencent', 'naspers'],
  'BHP.JO':  ['bhp', 'iron ore', 'mining'],
  'AGL.JO':  ['anglo american', 'mining', 'platinum'],
  'SBK.JO':  ['standard bank', 'stanbic'],
  'FSR.JO':  ['firstrand', 'fnb', 'rand merchant'],
  'SOL.JO':  ['sasol', 'chemicals', 'synthetic fuel'],
  'MTN.JO':  ['mtn', 'mobile telephony'],
  'VOD.JO':  ['vodacom'],
  'ABG.JO':  ['absa', 'barclays africa'],
  'REM.JO':  ['remgro'],
  'SHP.JO':  ['shoprite', 'usave'],
  'AAPL':    ['apple', 'iphone', 'ios', 'app store', 'tim cook'],
  'MSFT':    ['microsoft', 'azure', 'windows', 'openai', 'copilot'],
  'NVDA':    ['nvidia', 'gpu', 'chips', 'semiconductor', 'ai chip', 'artificial intelligence'],
  'AMZN':    ['amazon', 'aws', 'prime', 'alexa'],
  'GOOGL':   ['google', 'alphabet', 'youtube', 'search', 'android'],
  'META':    ['meta ', 'facebook', 'instagram', 'whatsapp', 'zuckerberg'],
  'TSLA':    ['tesla', 'electric vehicle', ' ev ', 'elon musk', 'autopilot'],
  'BRK-B':   ['berkshire', 'warren buffett', 'buffett'],
};

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function scoreText(keywords: string[], text: string): number {
  const lower = text.toLowerCase();
  return keywords.reduce((n, kw) => n + (lower.includes(kw.toLowerCase()) ? 1 : 0), 0);
}

function bestNews(keywords: string[], pool: NewsItem[]): NewsItem | null {
  let best: NewsItem | null = null;
  let top = 0;
  for (const item of pool) {
    const score = scoreText(keywords, item.title + ' ' + item.summary);
    if (score > top) { top = score; best = item; }
  }
  return top > 0 ? best : null;
}

interface MarketContext {
  currencies?: QuoteData[];
  commodities?: QuoteData[];
}

/** One-line explanation shown under a whole TickerCard or BondTracker */
export function explainCard(
  cardName: string,
  items: QuoteData[],
  allNews: NewsItem[],
  _sens: SENSItem[],
  ctx?: MarketContext,
): string | null {
  const keywords = CARD_KEYWORDS[cardName];
  if (!keywords) return null;

  const movers = items.filter(i => i.changePct != null && Math.abs(i.changePct!) > 0.05);
  if (movers.length === 0) return null;

  const biggest = movers.reduce((a, b) =>
    Math.abs(b.changePct!) > Math.abs(a.changePct!) ? b : a,
  );
  const dir = (biggest.changePct ?? 0) >= 0 ? 'rose' : 'fell';
  const pct = Math.abs(biggest.changePct!).toFixed(2);

  // Try news first
  const hit = bestNews(keywords, allNews);
  if (hit) {
    return `${biggest.name} ${dir} ${pct}% · ${truncate(hit.title, 85)} (${hit.source})`;
  }

  // Cross-asset fallbacks
  const usd = ctx?.currencies?.find(c => c.name === 'USD/ZAR');
  const gold = ctx?.commodities?.find(c => c.name === 'Gold');
  const oil  = ctx?.commodities?.find(c => c.name === 'Brent Crude');

  if (cardName === 'SA Markets' && usd?.changePct != null) {
    const rDir = usd.changePct > 0 ? 'weakened' : 'strengthened';
    const impact = usd.changePct > 0 ? 'weighing on' : 'supporting';
    return `${biggest.name} ${dir} ${pct}% · Rand ${rDir} ${Math.abs(usd.changePct).toFixed(2)}% vs USD, ${impact} local sentiment.`;
  }

  if (cardName === 'Currencies' && usd?.changePct != null) {
    const rDir = usd.changePct >= 0 ? 'weakened' : 'strengthened';
    const reason = Math.abs(usd.changePct) > 0.5
      ? (usd.changePct > 0 ? 'Dollar strength and global risk-off tone.' : 'Dollar softness and improved EM appetite.')
      : 'Thin market conditions; no clear catalyst.';
    return `Rand ${rDir} ${Math.abs(usd.changePct).toFixed(2)}% vs USD · ${reason}`;
  }

  if (cardName === 'Commodities') {
    if (oil?.changePct != null && Math.abs(oil.changePct) > 0.5) {
      return `${biggest.name} ${dir} ${pct}% · Brent ${oil.changePct >= 0 ? 'gained' : 'fell'} ${Math.abs(oil.changePct).toFixed(2)}% on supply/demand dynamics.`;
    }
    if (gold?.changePct != null && Math.abs(gold.changePct) > 0.3) {
      const gSent = gold.changePct < 0 ? 'risk-on mood' : 'safe-haven demand';
      return `${biggest.name} ${dir} ${pct}% · Gold ${gold.changePct >= 0 ? '+' : ''}${gold.changePct.toFixed(2)}% amid ${gSent}.`;
    }
  }

  if (cardName === 'Bond Yield Tracker') {
    const tone = (biggest.changePct ?? 0) > 0 ? 'pushed yields higher' : 'drove yields lower';
    return `${biggest.name} ${dir} ${pct}% · Rate expectations ${tone}; monitor central bank signals.`;
  }

  // Generic
  const tone = (biggest.changePct ?? 0) > 0 ? 'positive' : 'cautious';
  return `${biggest.name} ${dir} ${pct}% · No specific catalyst in feeds; ${tone} global risk tone.`;
}

/** Micro-explanation for a single stock row in BigMovers */
export function explainStock(
  item: QuoteData,
  allNews: NewsItem[],
  sens: SENSItem[],
  ctx?: MarketContext,
): string | null {
  if (item.changePct == null || Math.abs(item.changePct) < 0.1) return null;

  const keywords = STOCK_KEYWORDS[item.symbol] ?? [item.name.toLowerCase()];
  const arrow = item.changePct >= 0 ? '▲' : '▼';

  // SENS is most authoritative for JSE stocks
  const sensHit = sens.find(s => {
    const compLower = s.company.toLowerCase();
    return keywords.some(kw => compLower.includes(kw.toLowerCase()));
  });
  if (sensHit) {
    return `${arrow} ${truncate(sensHit.headline, 65)}`;
  }

  // News match
  const newsHit = bestNews(keywords, allNews);
  if (newsHit) {
    return `${arrow} ${truncate(newsHit.title, 65)}`;
  }

  // Oil correlation for Sasol
  const oil = ctx?.commodities?.find(c => c.name === 'Brent Crude');
  if (item.symbol === 'SOL.JO' && oil?.changePct != null) {
    return `${arrow} Brent ${oil.changePct >= 0 ? '+' : ''}${oil.changePct.toFixed(1)}% · Sasol tracks crude`;
  }

  return null;
}
