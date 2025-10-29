import { describe, it, expect, beforeEach } from 'vitest';
import { ExampleCrawler } from '../../src/crawlers/exampleCrawler.js';

describe('ExampleCrawler', () => {
  let crawler: ExampleCrawler;

  beforeEach(() => {
    crawler = new ExampleCrawler({
      timeout: 5000,
      retries: 1,
    });
  });

  it('should initialize successfully', () => {
    expect(crawler).toBeDefined();
  });

  it('should have default options', () => {
    const defaultCrawler = new ExampleCrawler();
    expect(defaultCrawler).toBeDefined();
  });
});
