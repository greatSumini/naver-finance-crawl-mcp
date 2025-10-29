import { HttpClient } from '../utils/request.js';
import { HtmlParser } from '../utils/parser.js';
import { CrawlerOptions, CrawlResult } from '../types/index.js';

/**
 * 기본 크롤러 클래스 - 모든 크롤러의 기반
 */
export abstract class BaseCrawler {
  protected httpClient: HttpClient;
  protected options: CrawlerOptions;

  constructor(options: CrawlerOptions = {}) {
    this.options = {
      timeout: options.timeout || 10000,
      retries: options.retries || 3,
      headers: options.headers || {},
    };
    this.httpClient = new HttpClient(this.options);
  }

  /**
   * URL에서 HTML을 가져옵니다
   */
  protected async fetchHtml(url: string): Promise<string> {
    const response = await this.httpClient.get(url);
    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch ${url}: HTTP ${response.status}`,
      );
    }
    return response.data;
  }

  /**
   * HTML을 파싱하여 데이터를 추출합니다
   */
  protected parseHtml(html: string): HtmlParser {
    return new HtmlParser(html);
  }

  /**
   * 크롤링을 수행합니다 (서브클래스에서 구현)
   */
  abstract crawl(url: string): Promise<CrawlResult>;

  /**
   * 여러 URL을 크롤링합니다
   */
  async crawlMultiple(urls: string[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];

    for (const url of urls) {
      try {
        const result = await this.crawl(url);
        results.push(result);
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
        results.push({
          url,
          data: null,
          timestamp: new Date(),
          statusCode: 0,
        });
      }
    }

    return results;
  }
}
