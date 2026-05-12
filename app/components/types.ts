export interface QuoteData {
  symbol: string;
  name: string;
  price: number | null;
  previousClose?: number | null;
  change: number | null;
  changePct: number | null;
  marketState?: string | null;
  currency?: string | null;
  unit?: string;
  region?: string;
  type?: string;
  error?: boolean;
  source?: string;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  summary: string;
  source: string;
  category: string;
}

export interface SENSItem {
  headline: string;
  company: string;
  time: string;
  category: string;
  link: string;
  isPriority: boolean;
}

export interface MarketData {
  timestamp: string;
  indicesUS: QuoteData[];
  indicesEU: QuoteData[];
  indicesASIA: QuoteData[];
  indicesSA: QuoteData[];
  currencies: QuoteData[];
  commodities: QuoteData[];
  bondsYahoo: QuoteData[];
  bondsTE: QuoteData[];
  jseMajors: QuoteData[];
  usMajors: QuoteData[];
}

export interface NewsData {
  timestamp: string;
  markets: NewsItem[];
  world: NewsItem[];
  sa: NewsItem[];
}

export interface SENSData {
  timestamp: string;
  announcements: SENSItem[];
  count: number;
  error?: string;
}

export interface DailyContent {
  timestamp: string;
  concept: {
    term: string;
    definition: string;
  };
  randomFact: string;
}
