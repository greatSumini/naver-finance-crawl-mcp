/**
 * 크롤러 옵션 인터페이스
 */
export interface CrawlerOptions {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

/**
 * 크롤링 결과 인터페이스
 */
export interface CrawlResult {
  url: string;
  data: unknown;
  timestamp: Date;
  statusCode?: number;
}

/**
 * HTTP 응답 인터페이스
 */
export interface HttpResponse {
  status: number;
  data: string;
  headers: Record<string, unknown>;
}

/**
 * 파서 옵션 인터페이스
 */
export interface ParserOptions {
  selector?: string;
  attribute?: string;
}

/**
 * 네이버 금융 주식 데이터 인터페이스
 */
export interface StockData {
  company: {
    name: string | null;
    code: string | null;
    market: string | null;
  };
  quote: {
    date: string | null;
    currentPrice: number | null;
    changeValue: number | null;
    changeRate: number | null;
    prevClose: number | null;
    open: number | null;
    high: number | null;
    low: number | null;
    volume: number | null;
    tradeValueMillion: number | null;
  };
  investment: {
    marketCap: string | null;
    marketCapRank: string | null;
    listedShares: number | null;
    foreignerRatio: number | null;
    high52w: number | null;
    low52w: number | null;
    per: number | string | null;
    eps: number | null;
    pbr: number | string | null;
    bps: number | null;
    dividendYield: number | string | null;
    industryPer: number | string | null;
  };
}
