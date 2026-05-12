import { NextResponse } from 'next/server';
import YahooFinanceClass from 'yahoo-finance2';

// yahoo-finance2 v3 requires instantiation
const yahooFinance = new (YahooFinanceClass as unknown as new (opts?: Record<string, unknown>) => typeof YahooFinanceClass)({ suppressNotices: ['yahooSurvey'] });

export const runtime = 'nodejs';
export const revalidate = 300; // 5 minutes

const TICKERS = {
  indicesUS: [
    { symbol: '^GSPC', name: 'S&P 500', region: 'US' },
    { symbol: '^DJI', name: 'Dow Jones', region: 'US' },
    { symbol: '^IXIC', name: 'Nasdaq', region: 'US' },
    { symbol: '^RUT', name: 'Russell 2000', region: 'US' },
  ],
  indicesEU: [
    { symbol: '^FTSE', name: 'FTSE 100', region: 'UK' },
    { symbol: '^GDAXI', name: 'DAX', region: 'DE' },
    { symbol: '^FCHI', name: 'CAC 40', region: 'FR' },
    { symbol: '^STOXX50E', name: 'Euro Stoxx 50', region: 'EU' },
  ],
  indicesASIA: [
    { symbol: '^N225', name: 'Nikkei 225', region: 'JP' },
    { symbol: '^HSI', name: 'Hang Seng', region: 'HK' },
    { symbol: '000001.SS', name: 'Shanghai', region: 'CN' },
    { symbol: '^AXJO', name: 'ASX 200', region: 'AU' },
    { symbol: '^KS11', name: 'KOSPI', region: 'KR' },
  ],
  indicesSA: [
    { symbol: '^J203.JO', name: 'JSE All Share', region: 'SA' },
    { symbol: '^J200.JO', name: 'JSE Top 40', region: 'SA' },
  ],
  currencies: [
    { symbol: 'USDZAR=X', name: 'USD/ZAR' },
    { symbol: 'GBPZAR=X', name: 'GBP/ZAR' },
    { symbol: 'EURZAR=X', name: 'EUR/ZAR' },
    { symbol: 'EURUSD=X', name: 'EUR/USD' },
    { symbol: 'GBPUSD=X', name: 'GBP/USD' },
    { symbol: 'USDJPY=X', name: 'USD/JPY' },
    { symbol: 'USDCNH=X', name: 'USD/CNH' },
  ],
  commodities: [
    { symbol: 'GC=F', name: 'Gold', unit: 'USD/oz' },
    { symbol: 'SI=F', name: 'Silver', unit: 'USD/oz' },
    { symbol: 'PL=F', name: 'Platinum', unit: 'USD/oz' },
    { symbol: 'BZ=F', name: 'Brent Crude', unit: 'USD/bbl' },
    { symbol: 'CL=F', name: 'WTI Crude', unit: 'USD/bbl' },
    { symbol: 'HG=F', name: 'Copper', unit: 'USD/lb' },
    { symbol: 'NG=F', name: 'Natural Gas', unit: 'USD/MMBtu' },
  ],
  bondsYahoo: [
    { symbol: '^TNX', name: 'US 10yr', region: 'US', type: 'yield' },
    { symbol: '^TYX', name: 'US 30yr', region: 'US', type: 'yield' },
    { symbol: '^FVX', name: 'US 5yr', region: 'US', type: 'yield' },
    { symbol: '^IRX', name: 'US 3mo', region: 'US', type: 'yield' },
  ],
  jseMajors: [
    { symbol: 'NPN.JO', name: 'Naspers' },
    { symbol: 'PRX.JO', name: 'Prosus' },
    { symbol: 'BHP.JO', name: 'BHP' },
    { symbol: 'AGL.JO', name: 'Anglo American' },
    { symbol: 'SBK.JO', name: 'Standard Bank' },
    { symbol: 'FSR.JO', name: 'FirstRand' },
    { symbol: 'SOL.JO', name: 'Sasol' },
    { symbol: 'MTN.JO', name: 'MTN' },
    { symbol: 'VOD.JO', name: 'Vodacom' },
    { symbol: 'ABG.JO', name: 'Absa' },
    { symbol: 'REM.JO', name: 'Remgro' },
    { symbol: 'SHP.JO', name: 'Shoprite' },
  ],
  usMajors: [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'NVDA', name: 'Nvidia' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'BRK-B', name: 'Berkshire' },
  ],
};

// Trading Economics bond yield scraper
// Returns yield as a number (e.g. 8.79) or null
async function fetchTEBondYield(country: string): Promise<number | null> {
  try {
    const res = await fetch(`https://tradingeconomics.com/${country}/government-bond-yield`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/"value":(\d+\.\d+)/);
    return match ? parseFloat(match[1]) : null;
  } catch {
    return null;
  }
}

async function fetchAllBondsFromTE() {
  const countries = [
    { key: 'south-africa', name: 'SA 10yr', region: 'SA' },
    { key: 'united-kingdom', name: 'UK 10yr Gilt', region: 'UK' },
    { key: 'germany', name: 'Germany 10yr', region: 'DE' },
    { key: 'france', name: 'France 10yr', region: 'FR' },
    { key: 'italy', name: 'Italy 10yr', region: 'IT' },
    { key: 'japan', name: 'Japan 10yr', region: 'JP' },
    { key: 'australia', name: 'Australia 10yr', region: 'AU' },
    { key: 'china', name: 'China 10yr', region: 'CN' },
  ];

  const results = await Promise.allSettled(
    countries.map(c => fetchTEBondYield(c.key))
  );

  return countries.map((c, i) => ({
    symbol: `TE:${c.key}`,
    name: c.name,
    region: c.region,
    type: 'yield',
    price: results[i].status === 'fulfilled' ? results[i].value : null,
    change: null,
    changePct: null,
    error: results[i].status !== 'fulfilled' || results[i].value === null,
    source: 'Trading Economics',
  }));
}

async function fetchQuotes(symbols: string[]) {
  try {
    const results = await Promise.allSettled(
      symbols.map(s => yahooFinance.quote(s, {}, { validateResult: false }))
    );
    return results.map((r, i) => ({
      symbol: symbols[i],
      data: r.status === 'fulfilled' ? r.value : null,
    }));
  } catch {
    return symbols.map(s => ({ symbol: s, data: null }));
  }
}

function formatQuote(raw: Record<string, unknown> | null, meta: { symbol: string; name: string; unit?: string; region?: string; type?: string }) {
  if (!raw) return { ...meta, price: null, change: null, changePct: null, error: true };
  return {
    ...meta,
    price: (raw.regularMarketPrice as number) ?? null,
    previousClose: (raw.regularMarketPreviousClose as number) ?? null,
    change: (raw.regularMarketChange as number) ?? null,
    changePct: (raw.regularMarketChangePercent as number) ?? null,
    marketState: (raw.marketState as string) ?? null,
    currency: (raw.currency as string) ?? null,
  };
}

export async function GET() {
  try {
    const allYahooTickers = [
      ...TICKERS.indicesUS,
      ...TICKERS.indicesEU,
      ...TICKERS.indicesASIA,
      ...TICKERS.indicesSA,
      ...TICKERS.currencies,
      ...TICKERS.commodities,
      ...TICKERS.bondsYahoo,
      ...TICKERS.jseMajors,
      ...TICKERS.usMajors,
    ];

    // Fetch Yahoo Finance quotes and TE bonds in parallel
    const [quotes, teBonds] = await Promise.all([
      fetchQuotes(allYahooTickers.map(t => t.symbol)),
      fetchAllBondsFromTE(),
    ]);

    const quoteMap = Object.fromEntries(quotes.map(q => [q.symbol, q.data]));

    const data = {
      timestamp: new Date().toISOString(),
      indicesUS: TICKERS.indicesUS.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      indicesEU: TICKERS.indicesEU.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      indicesASIA: TICKERS.indicesASIA.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      indicesSA: TICKERS.indicesSA.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      currencies: TICKERS.currencies.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      commodities: TICKERS.commodities.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      bondsYahoo: TICKERS.bondsYahoo.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      bondsTE: teBonds,
      jseMajors: TICKERS.jseMajors.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
      usMajors: TICKERS.usMajors.map(t => formatQuote(quoteMap[t.symbol] as Record<string, unknown> | null, t)),
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error('Markets API error:', err);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
