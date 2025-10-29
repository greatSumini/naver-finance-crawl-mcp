import { describe, it, expect, beforeEach } from 'vitest';
import { BaseCrawler } from '../../src/crawlers/baseCrawler.js';
import { CrawlResult } from '../../src/types/index.js';

// Test implementation of BaseCrawler
class TestCrawler extends BaseCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    const html = await this.fetchHtml(url);
    const parser = this.parseHtml(html);
    const title = parser.getFirstText('h1');

    return {
      url,
      data: { title },
      timestamp: new Date(),
      statusCode: 200,
    };
  }
}

describe('BaseCrawler', () => {
  let crawler: TestCrawler;

  beforeEach(() => {
    crawler = new TestCrawler({
      timeout: 5000,
      retries: 1,
    });
  });

  it('should initialize with options', () => {
    const testCrawler = new TestCrawler({
      timeout: 3000,
      retries: 2,
    });

    expect(testCrawler).toBeDefined();
  });

  it('should have default options', () => {
    const defaultCrawler = new TestCrawler();

    expect(defaultCrawler).toBeDefined();
  });

  it('should create httpClient', () => {
    expect(crawler['httpClient']).toBeDefined();
  });

  it('should create parseHtml method', () => {
    const html = '<h1>Test</h1>';
    const parser = crawler['parseHtml'](html);

    expect(parser).toBeDefined();
    expect(parser.getFirstText('h1')).toBe('Test');
  });
});
