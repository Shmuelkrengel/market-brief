import { QuoteData, NewsItem, SENSItem } from '../components/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function signed(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

function find<T extends QuoteData>(arr: T[] | undefined, name: string): T | undefined {
  return arr?.find(i => i.name === name);
}

// ── news matching: STRICT ─────────────────────────────────────────────────────
// The company/asset name (or alias) must literally appear in the headline.

const STOCK_ALIASES: Record<string, string[]> = {
  'NPN.JO':  ['naspers'],
  'PRX.JO':  ['prosus'],
  'BHP.JO':  ['bhp'],
  'AGL.JO':  ['anglo american', 'anglo plc'],
  'SBK.JO':  ['standard bank', 'stanbic'],
  'FSR.JO':  ['firstrand', 'fnb'],
  'SOL.JO':  ['sasol'],
  'MTN.JO':  ['mtn'],
  'VOD.JO':  ['vodacom'],
  'ABG.JO':  ['absa'],
  'REM.JO':  ['remgro'],
  'SHP.JO':  ['shoprite'],
  'AAPL':    ['apple'],
  'MSFT':    ['microsoft'],
  'NVDA':    ['nvidia'],
  'AMZN':    ['amazon'],
  'GOOGL':   ['google', 'alphabet'],
  'META':    ['meta ', 'facebook', 'instagram'],
  'TSLA':    ['tesla'],
  'BRK-B':   ['berkshire', 'warren buffett'],
};

// News keywords that must appear in a headline for it to be relevant to a card
const CARD_STRICT_KEYWORDS: Record<string, string[]> = {
  'US Markets':        ['s&p 500', 'dow jones', 'nasdaq', 'wall street', 'us stocks', 'us equities', 'federal reserve', 'fed rate', 'us economy', 'us gdp', 'us inflation'],
  'SA Markets':        ['jse', 'south africa', 'johannesburg stock', 'south african market'],
  'European Markets':  ['ftse 100', 'dax', 'cac 40', 'stoxx', 'european stocks', 'eurozone', 'ecb rate', 'uk economy'],
  'Asian Markets':     ['nikkei', 'hang seng', 'shanghai composite', 'chinese stocks', 'japanese stocks', 'boj rate'],
  'Currencies':        ['rand ', 'usd/zar', 'south african rand', 'currency markets', 'dollar strengthens', 'dollar weakens', 'forex'],
  'Commodities':       ['oil price', 'crude oil', 'brent crude', 'wti', 'gold price', 'platinum price', 'opec', 'copper price'],
  'Bond Yield Tracker':['treasury yield', 'bond yield', 'gilt yield', '10-year yield', '10yr yield', 'rate hike', 'rate cut', 'fed funds'],
};

function strictNewsForStock(item: QuoteData, pool: NewsItem[]): NewsItem | null {
  const terms = STOCK_ALIASES[item.symbol] ?? [item.name.toLowerCase()];
  for (const news of pool) {
    const text = (news.title + ' ' + (news.summary ?? '')).toLowerCase();
    if (terms.some(t => text.includes(t))) return news;
  }
  return null;
}

function strictNewsForCard(cardName: string, pool: NewsItem[]): NewsItem | null {
  const terms = CARD_STRICT_KEYWORDS[cardName] ?? [];
  for (const news of pool) {
    const text = (news.title + ' ' + (news.summary ?? '')).toLowerCase();
    if (terms.some(t => text.includes(t))) return news;
  }
  return null;
}

// ── full market context ───────────────────────────────────────────────────────

export interface ExplainContext {
  currencies?: QuoteData[];
  commodities?: QuoteData[];
  indicesUS?: QuoteData[];
  indicesSA?: QuoteData[];
  indicesASIA?: QuoteData[];
  bondsYahoo?: QuoteData[];
  bondsTE?: QuoteData[];
}

// ── per-stock cross-asset fallbacks ───────────────────────────────────────────

function stockCrossAsset(item: QuoteData, ctx: ExplainContext): string | null {
  const brent   = find(ctx.commodities, 'Brent Crude');
  const copper  = find(ctx.commodities, 'Copper');
  const plat    = find(ctx.commodities, 'Platinum');
  const hsi     = find(ctx.indicesASIA, 'Hang Seng');
  const jse     = find(ctx.indicesSA, 'JSE All Share');
  const sp500   = find(ctx.indicesUS, 'S&P 500');
  const nasdaq  = find(ctx.indicesUS, 'Nasdaq');
  const usdZar  = find(ctx.currencies, 'USD/ZAR');

  switch (item.symbol) {
    case 'SOL.JO':
      if (brent?.changePct != null)
        return `Brent Crude ${signed(brent.changePct)} — Sasol's earnings are directly tied to the oil price.`;
      break;

    case 'NPN.JO':
    case 'PRX.JO': {
      const label = item.symbol === 'NPN.JO' ? 'Naspers' : 'Prosus';
      if (hsi?.changePct != null)
        return `Hang Seng ${signed(hsi.changePct)} — ${label} holds a ~${item.symbol === 'NPN.JO' ? '31%' : '26%'} stake in Tencent (listed in Hong Kong).`;
      return `${label} tracks Tencent closely; Chinese tech sentiment drives the stock.`;
    }

    case 'BHP.JO':
      if (copper?.changePct != null)
        return `Copper ${signed(copper.changePct)} — BHP's earnings are heavily driven by copper and iron ore prices.`;
      break;

    case 'AGL.JO':
      if (plat?.changePct != null)
        return `Platinum ${signed(plat.changePct)} — Anglo American has major platinum group metals and base metals exposure.`;
      break;

    case 'SBK.JO':
    case 'FSR.JO':
    case 'ABG.JO': {
      if (usdZar?.changePct != null && Math.abs(usdZar.changePct) > 0.3)
        return `Rand ${usdZar.changePct >= 0 ? 'weakened' : 'strengthened'} ${Math.abs(usdZar.changePct).toFixed(2)}% vs USD — rand volatility is a key driver of SA banking sector sentiment.`;
      if (jse?.changePct != null)
        return `JSE All Share ${signed(jse.changePct)} — ${item.name} moved with the broader South African market.`;
      break;
    }

    case 'MTN.JO':
    case 'VOD.JO':
      if (jse?.changePct != null)
        return `JSE All Share ${signed(jse.changePct)} — ${item.name} tracked the broader SA market; telecom stocks are sensitive to rand and consumer spending.`;
      break;

    case 'SHP.JO':
    case 'REM.JO':
      if (jse?.changePct != null)
        return `JSE All Share ${signed(jse.changePct)} — ${item.name} moved with the broader local market.`;
      break;

    case 'NVDA':
      if (nasdaq?.changePct != null) {
        const diff = (item.changePct ?? 0) - nasdaq.changePct;
        const rel = Math.abs(diff) > 1
          ? ` (significantly ${diff > 0 ? 'outperforming' : 'underperforming'} the index)`
          : '';
        return `Nasdaq ${signed(nasdaq.changePct)} — Nvidia moves with semiconductor and AI sentiment${rel}.`;
      }
      break;

    case 'TSLA':
      if (sp500?.changePct != null)
        return `S&P 500 ${signed(sp500.changePct)} — Tesla is a high-beta stock; moves are typically amplified vs. the index.`;
      break;

    case 'BRK-B':
      if (sp500?.changePct != null)
        return `S&P 500 ${signed(sp500.changePct)} — Berkshire Hathaway broadly tracks the US market.`;
      break;

    default:
      break;
  }

  // Generic: US tech tracks Nasdaq, others track S&P
  const isJSE = item.symbol.endsWith('.JO');
  if (isJSE && jse?.changePct != null)
    return `JSE All Share ${signed(jse.changePct)} — ${item.name} moved with the broader South African market.`;
  if (!isJSE) {
    const idx = ['AAPL','MSFT','AMZN','GOOGL','META'].includes(item.symbol) ? nasdaq : sp500;
    if (idx?.changePct != null)
      return `${idx.name} ${signed(idx.changePct)} — ${item.name} moved broadly in line with the ${isJSE ? 'SA' : 'US'} market.`;
  }

  return null;
}

// ── card-level cross-asset fallbacks ─────────────────────────────────────────

function cardCrossAsset(cardName: string, items: QuoteData[], ctx: ExplainContext): string | null {
  const biggest = items
    .filter(i => i.changePct != null && i.price != null)
    .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!))[0];

  const usdZar = find(ctx.currencies, 'USD/ZAR');
  const brent  = find(ctx.commodities, 'Brent Crude');
  const gold   = find(ctx.commodities, 'Gold');
  const sp500  = find(ctx.indicesUS, 'S&P 500');
  const nasdaq = find(ctx.indicesUS, 'Nasdaq');
  const hsi    = find(ctx.indicesASIA, 'Hang Seng');
  const jse    = find(ctx.indicesSA, 'JSE All Share');
  const us10y  = find(ctx.bondsYahoo, 'US 10yr');

  switch (cardName) {
    case 'US Markets':
      if (sp500?.changePct != null && us10y?.price != null) {
        const yieldNote = us10y.price > 4.5
          ? `US 10yr yield at ${us10y.price.toFixed(3)}% — elevated rates creating headwinds for equities.`
          : `US 10yr yield at ${us10y.price.toFixed(3)}% — contained, broadly supportive for equities.`;
        return `S&P 500 ${signed(sp500.changePct)} · ${yieldNote}`;
      }
      if (sp500?.changePct != null)
        return `S&P 500 ${signed(sp500.changePct)} · ${sp500.changePct > 0 ? 'Risk-on tone; broad-based buying across sectors.' : 'Risk-off tone; selling pressure across US equities.'}`;
      break;

    case 'SA Markets':
      if (jse?.changePct != null) {
        const parts: string[] = [`JSE All Share ${signed(jse.changePct)}`];
        if (usdZar?.changePct != null)
          parts.push(`rand ${usdZar.changePct >= 0 ? 'weakened' : 'strengthened'} ${Math.abs(usdZar.changePct).toFixed(2)}% vs USD`);
        if (sp500?.changePct != null)
          parts.push(`global tone ${sp500.changePct > 0 ? 'constructive' : 'risk-off'}`);
        return parts.join(' · ') + '.';
      }
      break;

    case 'European Markets':
      if (biggest) {
        const note = biggest.changePct! > 0
          ? 'Positive global risk appetite supporting European equities.'
          : 'Macro concerns and rate uncertainty weighing on European markets.';
        return `${biggest.name} ${signed(biggest.changePct!)} · ${note}`;
      }
      break;

    case 'Asian Markets':
      if (hsi?.changePct != null && biggest) {
        const usdJpy = find(ctx.currencies, 'USD/JPY');
        if (usdJpy?.changePct != null && Math.abs(usdJpy.changePct) > 0.3)
          return `${biggest.name} ${signed(biggest.changePct!)} · Yen ${usdJpy.changePct >= 0 ? 'weakened' : 'strengthened'} ${Math.abs(usdJpy.changePct).toFixed(2)}% vs USD — yen moves are a key driver of Nikkei direction.`;
        return `${biggest.name} ${signed(biggest.changePct!)} · Asian session tracking ${sp500?.changePct != null ? `Wall Street (S&P 500 ${signed(sp500.changePct)})` : 'global risk sentiment'}.`;
      }
      break;

    case 'Currencies':
      if (usdZar?.changePct != null) {
        const reason = Math.abs(usdZar.changePct) > 0.8
          ? usdZar.changePct > 0
            ? 'Sharp rand weakness driven by global risk-off and dollar demand.'
            : 'Rand strength on improved EM risk appetite and dollar selling.'
          : usdZar.changePct > 0
            ? 'Rand drifting lower; dollar holding firm amid cautious global sentiment.'
            : 'Rand edging higher; dollar softness supporting emerging market currencies.';
        return `USD/ZAR ${signed(usdZar.changePct)} · ${reason}`;
      }
      break;

    case 'Commodities':
      if (brent?.changePct != null && gold?.changePct != null) {
        return (
          `Brent ${signed(brent.changePct)} · ` +
          (Math.abs(brent.changePct) > 1
            ? brent.changePct > 0 ? 'Oil surging on supply concerns.' : 'Oil sliding on demand worries.'
            : 'Oil steady.') +
          ` Gold ${signed(gold.changePct)} — ` +
          (gold.changePct < -0.3 ? 'safe-haven selling as risk appetite improves.' :
           gold.changePct > 0.3 ? 'safe-haven demand on risk-off sentiment.' :
           'trading sideways with no clear directional catalyst.')
        );
      }
      if (brent?.changePct != null)
        return `Brent ${signed(brent.changePct)} · ${Math.abs(brent.changePct) > 1 ? (brent.changePct > 0 ? 'Supply concerns driving oil higher.' : 'Demand worries pushing oil lower.') : 'Oil range-bound.'}`;
      break;

    case 'Bond Yield Tracker':
      if (us10y?.price != null && us10y.change != null) {
        const bps = Math.round(Math.abs(us10y.change) * 100);
        const direction = us10y.change >= 0 ? 'rose' : 'fell';
        return `US 10yr yield ${direction} ${bps}bps to ${us10y.price.toFixed(3)}% · ${us10y.price > 4.5 ? 'Elevated yields maintaining pressure on rate-sensitive assets.' : 'Contained yields providing support for equities and risk assets.'}`;
      }
      break;
  }

  return null;
}

// ── public API ────────────────────────────────────────────────────────────────

/** One-line explanation shown under a TickerCard or BondTracker */
export function explainCard(
  cardName: string,
  items: QuoteData[],
  allNews: NewsItem[],
  _sens: SENSItem[],
  ctx: ExplainContext = {},
): string | null {
  // 1. Strict news match
  const hit = strictNewsForCard(cardName, allNews);
  if (hit) {
    const biggest = items
      .filter(i => i.changePct != null && i.price != null)
      .sort((a, b) => Math.abs(b.changePct!) - Math.abs(a.changePct!))[0];
    if (biggest)
      return `${biggest.name} ${signed(biggest.changePct!)} · ${truncate(hit.title, 80)} (${hit.source})`;
  }
  // 2. Cross-asset fallback
  return cardCrossAsset(cardName, items, ctx);
}

/** Micro-explanation for a single stock row in BigMovers */
export function explainStock(
  item: QuoteData,
  allNews: NewsItem[],
  sens: SENSItem[],
  ctx: ExplainContext = {},
): string | null {
  if (item.changePct == null || Math.abs(item.changePct) < 0.1) return null;
  const arrow = item.changePct >= 0 ? '▲' : '▼';

  // 1. SENS: exact company name match (most authoritative for JSE)
  const terms = STOCK_ALIASES[item.symbol] ?? [item.name.toLowerCase()];
  const sensHit = sens.find(s =>
    terms.some(t => s.company.toLowerCase().includes(t))
  );
  if (sensHit)
    return `${arrow} SENS: ${truncate(sensHit.headline, 70)}`;

  // 2. Strict news match: company name must appear in headline
  const newsHit = strictNewsForStock(item, allNews);
  if (newsHit)
    return `${arrow} ${truncate(newsHit.title, 70)} (${newsHit.source})`;

  // 3. Cross-asset logic
  const macro = stockCrossAsset(item, ctx);
  if (macro) return macro;

  return null;
}
