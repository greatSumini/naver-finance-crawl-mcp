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
