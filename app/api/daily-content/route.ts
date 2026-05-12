import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 86400; // 24 hours

const FINANCIAL_CONCEPTS = [
  {
    term: 'Yield Curve Inversion',
    definition:
      'When short-term bond yields exceed long-term yields, it signals investor concern about near-term economic conditions. Historically, an inverted yield curve has preceded recessions — notably the US 2yr/10yr spread going negative before every recession since 1950.',
  },
  {
    term: 'Duration Risk',
    definition:
      'The sensitivity of a bond\'s price to changes in interest rates. A bond with a 10-year duration drops roughly 10% in price for every 1% rise in yields. This is why long-dated bonds got hammered in the 2022 rate-hiking cycle.',
  },
  {
    term: 'Basis Points (bps)',
    definition:
      '1 basis point = 0.01%. Central banks and bond traders speak in bps to avoid ambiguity. "The Fed hiked 75bps" means rates went up 0.75%. It sounds minor — but on $30 trillion of US government debt, 1bps costs $3 billion annually.',
  },
  {
    term: 'Price-to-Earnings (P/E) Ratio',
    definition:
      'Share price divided by annual earnings per share. A P/E of 20 means you\'re paying R20 for every R1 of earnings. The long-run average for the S&P 500 is ~16x. Above that suggests optimism; below it suggests pessimism or genuine value.',
  },
  {
    term: 'Short Selling',
    definition:
      'Borrowing shares, selling them now, and hoping to buy them back cheaper later. Profit = the difference. Risk = theoretically unlimited, since a share price can rise infinitely. In 2021, GameStop shorts lost over $5 billion in a week.',
  },
  {
    term: 'Quantitative Easing (QE)',
    definition:
      'Central banks create money to buy bonds, injecting liquidity into the financial system. It pushes down yields and pushes up asset prices. The Fed\'s balance sheet went from $900bn in 2008 to nearly $9 trillion by 2022 through successive rounds of QE.',
  },
  {
    term: 'The Rand Carry Trade',
    definition:
      'Investors borrow in low-interest currencies (JPY, CHF) and invest in higher-yielding SA assets. When global risk appetite falls, these trades unwind fast — which is why the Rand often sells off sharply in global crises even when SA-specific fundamentals haven\'t changed.',
  },
  {
    term: 'Credit Default Swap (CDS)',
    definition:
      'Insurance against a borrower defaulting. If SA\'s 5-year CDS spread widens from 200bps to 300bps, it means the market now requires more compensation to insure against SA government default — a red flag for bond investors.',
  },
  {
    term: 'Book Value vs Market Value',
    definition:
      'Book value is what the accountants say a company is worth (assets minus liabilities). Market value is what the market will pay. A price-to-book below 1 suggests the market thinks the assets are worth less than stated — often a value signal, or a red flag.',
  },
  {
    term: 'EBITDA',
    definition:
      'Earnings Before Interest, Tax, Depreciation and Amortisation. A rough proxy for operating cash flow. Useful for comparing companies across different capital structures, but Warren Buffett famously called it "voodoo" because it ignores the real cost of maintaining assets.',
  },
  {
    term: 'Free Float',
    definition:
      'The portion of a company\'s shares freely available to trade in the market. Low free float = high volatility. If 70% of a JSE company\'s shares are locked up with a founding family, any institutional buying or selling will move the price dramatically.',
  },
  {
    term: 'Rights Issue',
    definition:
      'A company raises new capital by offering existing shareholders the right to buy new shares — typically at a discount. Good if the money funds growth; dilutive if it\'s used to plug a balance sheet hole. Always check why the company needs the cash.',
  },
  {
    term: 'Sovereign Spread',
    definition:
      'The yield premium a government pays above the US Treasury rate (the "risk-free" benchmark). SA\'s 10yr sovereign spread reflects how much extra return global investors demand to hold SA risk. Compression = confidence; widening = concern.',
  },
  {
    term: 'Momentum Investing',
    definition:
      'Buying what\'s been going up, selling what\'s been going down. Academically documented as a persistent factor — but it mean-reverts brutally. Momentum strategies can lose 30-40% in a single month when market trends reverse sharply.',
  },
  {
    term: 'Dividend Cover',
    definition:
      'Earnings per share divided by dividend per share. Cover of 2x means the company earns twice what it pays out — sustainable. Cover below 1x means the dividend is being paid from reserves or borrowings — a cut is likely coming.',
  },
  {
    term: 'Contango vs Backwardation',
    definition:
      'In commodity futures, contango = future price higher than spot (normal for storage costs). Backwardation = future price lower than spot (signals immediate supply tightness). Brent crude in backwardation is often a bullish signal for oil prices.',
  },
  {
    term: 'The VIX',
    definition:
      'The CBOE Volatility Index — often called the "fear gauge." It measures expected 30-day volatility of the S&P 500. Above 30 signals fear; below 15 signals complacency. Historically, buying equities when the VIX spikes above 40 has been well-rewarded.',
  },
  {
    term: 'SARB Monetary Policy Committee (MPC)',
    definition:
      'SA\'s equivalent of the Fed. The MPC meets 6 times a year to set the repo rate — the rate at which the SARB lends to commercial banks. Prime rate = repo + 3.5%. Every 25bps move by the MPC translates directly into bond prices and variable mortgage rates.',
  },
  {
    term: 'Thin Capitalisation',
    definition:
      'When a company is funded mostly by debt rather than equity. High leverage amplifies returns in good times but makes survival harder in downturns. The debt-to-equity ratio and interest cover ratio are the key metrics to watch.',
  },
  {
    term: 'Market Cap Weighted Index',
    definition:
      'Most major indices (S&P 500, JSE Top 40) weight constituents by market cap. This means the biggest companies dominate the index. In 2023, the "Magnificent 7" accounted for ~30% of the S&P 500 — meaning the "diversified" index was heavily concentrated.',
  },
  {
    term: 'IPO Lock-up Period',
    definition:
      'After a company lists, insiders (founders, early investors) are typically locked up for 90-180 days. When the lock-up expires, a flood of shares can hit the market, often depressing the price. Always check the lock-up expiry date when investing in recent IPOs.',
  },
  {
    term: 'The R186 Bond',
    definition:
      'South Africa\'s most-traded government bond, maturing in 2026. It\'s the benchmark used by traders to gauge SA sovereign risk. When offshore investors sell SA assets, the R186 yield typically spikes first — it\'s the canary in the SA bond market coal mine.',
  },
  {
    term: 'Purchasing Power Parity (PPP)',
    definition:
      'The idea that exchange rates should equalise the price of identical goods across countries. A Big Mac costs $5.69 in the US and R62 in SA — at PPP, USD/ZAR should be ~10.9. That it trades at ~18 reflects SA\'s risk premium and structural inflation differential.',
  },
  {
    term: 'Beta',
    definition:
      'A measure of a stock\'s volatility relative to the market. Beta of 1 = moves with the market. Beta of 1.5 = 50% more volatile. Beta of 0.5 = half as volatile. High-beta stocks like mining and tech amplify market moves; low-beta defensive stocks like utilities cushion them.',
  },
  {
    term: 'Return on Equity (ROE)',
    definition:
      'Net income divided by shareholders\' equity. Measures how efficiently management uses equity capital to generate profit. Consistently high ROE (20%+) with low debt is a hallmark of great businesses. Compare ROE to the cost of equity to assess whether management is actually creating value.',
  },
  {
    term: 'Repo Rate vs Prime Rate',
    definition:
      'The repo rate is what the SARB charges banks to borrow. Prime is what banks charge their best customers — currently repo + 3.5%. Your bond, overdraft, and credit card rates are priced off prime. Each 25bps repo cut saves ~R250/month per R1m of variable-rate debt.',
  },
  {
    term: 'Algorithmic Trading',
    definition:
      'Computer programs executing trades based on pre-set rules — from simple moving-average crossovers to complex arbitrage strategies. Algo trading now accounts for 60-70% of daily US equity volume. Flash crashes (like the 2010 "Flash Crash" where the Dow dropped 1000 points in minutes) are its dark side.',
  },
  {
    term: 'Dollar Cost Averaging (DCA)',
    definition:
      'Investing a fixed amount at regular intervals regardless of price. You buy more units when prices are low, fewer when high — automatically lowering your average cost in volatile markets. Removes the impossible task of timing the market and the emotional biases that come with it.',
  },
];

async function getRandomFact(): Promise<string> {
  try {
    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.text ?? getFallbackFact();
    }
  } catch {
    // fallthrough
  }

  // Fallback: try another source
  try {
    const res = await fetch('https://api.chucknorris.io/jokes/random', {
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.value ?? getFallbackFact();
    }
  } catch {
    // fallthrough
  }

  return getFallbackFact();
}

const FALLBACK_FACTS = [
  "A group of flamingos is called a 'flamboyance'.",
  "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "The shortest war in history was between Britain and Zanzibar on 27 August 1896. Zanzibar surrendered after 38–45 minutes.",
  "Oxford University is older than the Aztec Empire.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "The inventor of the Pringles can is buried in one.",
  "Nintendo was founded in 1889 — as a playing card company.",
  "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
  "A day on Venus is longer than a year on Venus.",
  "Otters hold hands while sleeping so they don't drift apart.",
  "The Eiffel Tower grows about 15cm taller in summer due to thermal expansion of iron.",
  "Bananas are technically berries. Strawberries are not.",
  "A bolt of lightning contains enough energy to toast about 100,000 slices of bread.",
  "The longest English word you can type using only the top row of a keyboard is 'typewriter'.",
  "Scotland's national animal is the unicorn.",
];

function getFallbackFact(): string {
  const day = new Date().getDate();
  return FALLBACK_FACTS[day % FALLBACK_FACTS.length];
}

export async function GET() {
  try {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    const concept = FINANCIAL_CONCEPTS[dayOfYear % FINANCIAL_CONCEPTS.length];
    const randomFact = await getRandomFact();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      concept,
      randomFact,
    });
  } catch (err) {
    console.error('Daily content error:', err);
    return NextResponse.json({ error: 'Failed to fetch daily content' }, { status: 500 });
  }
}
