import { describe, it, expect, beforeEach } from 'vitest';
import { HtmlParser } from '../../src/utils/parser.js';
import { BaseCrawler } from '../../src/crawlers/baseCrawler.js';
import { CrawlResult } from '../../src/types/index.js';

/**
 * E2E 테스트 크롤러
 */
class E2ECrawler extends BaseCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    // URL이 유효한 형식인지 확인
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL format');
    }

    // 여기서는 실제 크롤링 대신 테스트용 HTML을 파싱
    const testHtml = this.createTestHtml();
    const parser = this.parseHtml(testHtml);

    const items = parser.parseStructure('div.product', {
      name: 'h2',
      price: 'span.price',
    });

    return {
      url,
      data: { items },
      timestamp: new Date(),
      statusCode: 200,
    };
  }

  private createTestHtml(): string {
    return `
      <html>
        <body>
          <div class="product">
            <h2>Product 1</h2>
            <span class="price">$100</span>
          </div>
          <div class="product">
            <h2>Product 2</h2>
            <span class="price">$200</span>
          </div>
        </body>
      </html>
    `;
  }
}

describe('E2E: Full Crawling Workflow', () => {
  let crawler: E2ECrawler;

  beforeEach(() => {
    crawler = new E2ECrawler();
  });

  it('should crawl and extract product data', async () => {
    const result = await crawler.crawl('https://example.com');

    expect(result).toBeDefined();
    expect(result.url).toBe('https://example.com');
    expect(result.statusCode).toBe(200);
    expect(result.data).toBeDefined();
  });

  it('should handle multiple URLs', async () => {
    const urls = ['https://example.com', 'https://example.org'];
    const results = await crawler.crawlMultiple(urls);

    expect(results).toHaveLength(2);
    results.forEach((result) => {
      expect(result.url).toMatch(/^https:\/\//);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  it('should parse product structure correctly', async () => {
    const result = await crawler.crawl('https://example.com');
    const data = result.data as { items: Array<{ name: string; price: string }> };

    expect(data.items).toHaveLength(2);
    expect(data.items[0]).toEqual({
      name: 'Product 1',
      price: '$100',
    });
    expect(data.items[1]).toEqual({
      name: 'Product 2',
      price: '$200',
    });
  });

  it('should throw error for invalid URL format', async () => {
    await expect(crawler.crawl('invalid-url')).rejects.toThrow(
      'Invalid URL format',
    );
  });

  it('should work with HtmlParser independently', () => {
    const html = `
      <div class="item">
        <h3>Item 1</h3>
        <p>Description</p>
      </div>
    `;

    const parser = new HtmlParser(html);
    const title = parser.getFirstText('h3');

    expect(title).toBe('Item 1');
  });
});
