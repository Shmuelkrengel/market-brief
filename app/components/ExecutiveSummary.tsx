'use client';

import { MarketData, NewsData } from './types';

interface Props {
  markets: MarketData | null;
  news: NewsData | null;
}

function sign(n: number | null | undefined) {
  if (n == null) return '';
  return n >= 0 ? '+' : '';
}

function pct(n: number | null | undefined, dp = 2) {
  if (n == null) return null;
  return `${sign(n)}${n.toFixed(dp)}%`;
}

function fmt(n: number | null | undefined, dp = 2) {
  if (n == null) return null;
  return n.toLocaleString('en-ZA', { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function sentimentWord(changePct: number | null | undefined): string {
  if (changePct == null) return 'flat';
  if (changePct > 1.5) return 'rallying sharply';
  if (changePct > 0.5) return 'advancing';
  if (changePct > 0.1) return 'edging higher';
  if (changePct > -0.1) return 'broadly flat';
  if (changePct > -0.5) return 'drifting lower';
  if (changePct > -1.5) return 'under pressure';
  return 'selling off sharply';
}

function generateSummary(markets: MarketData, news: NewsData | null): string {
  const sp500 = markets.indicesUS.find(i => i.name === 'S&P 500');
  const dow = markets.indicesUS.find(i => i.name === 'Dow Jones');
  const nasdaq = markets.indicesUS.find(i => i.name === 'Nasdaq');
  const ftse = markets.indicesEU.find(i => i.name === 'FTSE 100');
  const dax = markets.indicesEU.find(i => i.name === 'DAX');
  const jseAll = markets.indicesSA.find(i => i.name === 'JSE All Share');
  const nikkei = markets.indicesASIA.find(i => i.name === 'Nikkei 225');
  const hsi = markets.indicesASIA.find(i => i.name === 'Hang Seng');

  const usdzar = markets.currencies.find(i => i.name === 'USD/ZAR');
  const gbpzar = markets.currencies.find(i => i.name === 'GBP/ZAR');

  const gold = markets.commodities.find(i => i.name === 'Gold');
  const brent = markets.commodities.find(i => i.name === 'Brent Crude');
  const platinum = markets.commodities.find(i => i.name === 'Platinum');

  const us10y = markets.bondsYahoo.find(i => i.name === 'US 10yr');
  const saGovt = markets.bondsTE.find(i => i.region === 'SA');

  const parts: string[] = [];

  // === GLOBAL RISK TONE ===
  const usMove = sp500?.changePct ?? 0;
  const globalTone = usMove > 0.5 ? 'risk-on' : usMove < -0.5 ? 'risk-off' : 'cautious';
  const toneAdj = usMove > 0.5 ? 'constructive' : usMove < -0.5 ? 'defensive' : 'mixed';

  parts.push(
    `Global markets are trading with a ${globalTone} tone. ` +
    `US equities ${sentimentWord(sp500?.changePct)}, with the S&P 500 ` +
    `${pct(sp500?.changePct) ?? 'flat'} at ${fmt(sp500?.price) ?? '—'}, ` +
    `the Dow ${pct(dow?.changePct) ?? 'flat'}, and the Nasdaq ${pct(nasdaq?.changePct) ?? 'flat'}.`
  );

  // === EUROPEAN MARKETS ===
  if (ftse?.price) {
    parts.push(
      `In Europe, the FTSE 100 is ${sentimentWord(ftse.changePct)} (${pct(ftse.changePct)})` +
      (dax?.price ? ` and the DAX is ${sentimentWord(dax.changePct)} (${pct(dax.changePct)})` : '') +
      ', reflecting ' +
      (ftse.changePct != null && ftse.changePct > 0 ? 'broader risk appetite and positive macro sentiment.' : 'caution amid macro headwinds.')
    );
  }

  // === ASIAN MARKETS ===
  if (nikkei?.price || hsi?.price) {
    const asianParts = [];
    if (nikkei?.price) asianParts.push(`Tokyo's Nikkei ${sentimentWord(nikkei.changePct)} (${pct(nikkei.changePct)})`);
    if (hsi?.price) asianParts.push(`Hong Kong's Hang Seng ${sentimentWord(hsi.changePct)} (${pct(hsi.changePct)})`);
    parts.push(`Asian session: ${asianParts.join(', ')}.`);
  }

  // === SA MARKETS ===
  if (jseAll?.price) {
    const jseTone = sentimentWord(jseAll.changePct);
    parts.push(
      `The JSE All Share is ${jseTone} at ${fmt(jseAll.price, 0) ?? '—'} (${pct(jseAll.changePct) ?? 'flat'}). ` +
      `The Rand is trading at ${fmt(usdzar?.price, 4) ?? '—'} to the dollar` +
      (usdzar?.changePct != null ? `, ${usdzar.changePct >= 0 ? 'weakening' : 'strengthening'} ${Math.abs(usdzar.changePct).toFixed(2)}%` : '') +
      (gbpzar?.price ? ` and ${fmt(gbpzar.price, 4) ?? '—'} to sterling` : '') +
      '.'
    );
  }

  // === BONDS ===
  if (us10y?.price) {
    const bondTone = (us10y.price > 4.5) ? 'elevated, maintaining pressure on rate-sensitive assets' : 'contained, providing support for equities';
    parts.push(
      `US 10-year Treasury yield stands at ${fmt(us10y.price, 3)}%, ${bondTone}.` +
      (saGovt?.price ? ` The South African 10-year government bond yield is at ${fmt(saGovt.price, 2)}%, ` +
        (saGovt.price > 10 ? 'reflecting ongoing fiscal concerns and sovereign risk premium.' :
         saGovt.price > 8.5 ? 'reflecting a meaningful risk premium over developed market peers.' :
         'indicating relatively stable sovereign sentiment.') : '')
    );
  }

  // === COMMODITIES ===
  if (gold?.price || brent?.price) {
    const commParts = [];
    if (gold?.price) {
      const goldTone = (gold.changePct ?? 0) > 0.5 ? 'bid as a safe haven' : (gold.changePct ?? 0) < -0.5 ? 'under selling pressure' : 'trading quietly';
      commParts.push(`Gold is ${goldTone} at $${fmt(gold.price)}/oz (${pct(gold.changePct)})`);
    }
    if (brent?.price) {
      const oilTone = (brent.changePct ?? 0) > 1 ? 'surging on supply concerns' : (brent.changePct ?? 0) < -1 ? 'sliding on demand worries' : 'steady';
      commParts.push(`Brent crude is ${oilTone} at $${fmt(brent.price)}/bbl (${pct(brent.changePct)})`);
    }
    if (platinum?.price) commParts.push(`Platinum at $${fmt(platinum.price)}/oz (${pct(platinum.changePct)})`);
    parts.push(commParts.join('. ') + '.');
  }

  // === NEWS HEADLINE CONTEXT ===
  if (news?.markets?.length) {
    const topHeadline = news.markets[0];
    parts.push(`Key story: ${topHeadline.title} — ${topHeadline.source}.`);
  }

  // === OVERALL TONE ===
  parts.push(
    `Overall, the ${toneAdj} macro backdrop calls for ` +
    (globalTone === 'risk-on'
      ? 'selective risk-taking, with attention on data releases and central bank signals.'
      : globalTone === 'risk-off'
      ? 'defensively positioned portfolios and close monitoring of sovereign spreads.'
      : 'disciplined position management and awareness of cross-asset divergences.')
  );

  return parts.join(' ');
}

export default function ExecutiveSummary({ markets, news }: Props) {
  if (!markets) return null;

  const summary = generateSummary(markets, news);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
  const dateStr = now.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0d1520 0%, #111318 60%, #0d1520 100%)',
      border: '1px solid rgba(79,195,247,0.2)',
      borderRadius: 10,
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '0.9rem' }}>🏦</span>
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--blue)',
        }}>
          Morning Briefing
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#4a5568' }}>
          {dateStr} · {timeStr}
        </span>
      </div>

      <p style={{
        margin: 0,
        fontSize: '0.82rem',
        color: '#cbd5e0',
        lineHeight: 1.75,
        fontWeight: 400,
      }}>
        {summary}
      </p>
    </div>
  );
}
