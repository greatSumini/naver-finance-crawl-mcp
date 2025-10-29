import { BaseCrawler } from './baseCrawler.js';
import { CrawlResult, CrawlerOptions } from '../types/index.js';

/**
 * 예제 크롤러 - 웹사이트에서 기본 정보를 추출합니다
 */
export class ExampleCrawler extends BaseCrawler {
  constructor(options?: CrawlerOptions) {
    super(options);
  }

  /**
   * URL에서 제목과 링크를 크롤링합니다
   */
  async crawl(url: string): Promise<CrawlResult> {
    try {
      const html = await this.fetchHtml(url);
      const parser = this.parseHtml(html);

      // 기본 정보 추출
      const title = parser.getFirstText('title');
      const heading = parser.getFirstText('h1');
      const links = parser.getAttributes('a[href]', 'href');

      return {
        url,
        data: {
          title,
          heading,
          links: links.slice(0, 5), // 처음 5개 링크만
          linkCount: links.length,
        },
        timestamp: new Date(),
        statusCode: 200,
      };
    } catch (error) {
      throw new Error(
        `Failed to crawl ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
