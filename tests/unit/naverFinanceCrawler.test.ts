import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NaverFinanceCrawler } from '../../src/crawlers/naverFinanceCrawler.js';
import { StockData } from '../../src/types/index.js';

describe('NaverFinanceCrawler', () => {
  let crawler: NaverFinanceCrawler;

  beforeEach(() => {
    crawler = new NaverFinanceCrawler();
  });

  describe('URL validation and building', () => {
    it('should validate correct URLs', () => {
      const validUrl =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      expect(NaverFinanceCrawler.validateUrl(validUrl)).toBe(true);
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://finance.naver.com/item/main.naver?code=005930',
        'https://finance.naver.com/item/coinfo.naver?code=12345',
        'https://finance.naver.com/item/coinfo.naver?code=1234567',
        'https://wrong-domain.com/item/coinfo.naver?code=005930',
      ];

      invalidUrls.forEach((url) => {
        expect(NaverFinanceCrawler.validateUrl(url)).toBe(false);
      });
    });

    it('should build URL from stock code', () => {
      const stockCode = '005930';
      const expectedUrl =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      expect(NaverFinanceCrawler.buildUrl(stockCode)).toBe(expectedUrl);
    });

    it('should throw error for invalid stock code', () => {
      expect(() => NaverFinanceCrawler.buildUrl('12345')).toThrow(
        'Stock code must be 6 digits',
      );
      expect(() => NaverFinanceCrawler.buildUrl('abcdef')).toThrow(
        'Stock code must be 6 digits',
      );
    });
  });

  describe('Data extraction', () => {
    it('should extract company information correctly', async () => {
      // Mock HTML 응답
      const mockHtml = `
        <html>
          <body>
            <div class="wrap_company">
              <h2><a>삼성전자</a></h2>
              <div class="description">
                <span class="code">005930</span>
                <img class="kospi" alt="KOSPI" />
              </div>
            </div>
            <div id="tab_con1">
              <table class="no_info">
                <tr><th>전일</th><td><em>70,000</em></td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      // fetchHtml 메서드 모킹
      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);
      const data = result.data as StockData;

      expect(data.company.name).toBe('삼성전자');
      expect(data.company.code).toBe('005930');
      expect(data.company.market).toBe('KOSPI');
    });

    it('should handle missing data with null values', async () => {
      const mockHtml = `
        <html>
          <body>
            <div id="tab_con1"></div>
          </body>
        </html>
      `;

      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);
      const data = result.data as StockData;

      // 데이터가 없을 경우 null 반환 확인
      expect(data.company.name).toBeNull();
      expect(data.company.code).toBeNull();
    });

    it('should parse numbers correctly and return null for invalid data', async () => {
      const mockHtml = `
        <html>
          <body>
            <div id="tab_con1">
              <table class="no_info">
                <tr><th>전일</th><td><em>70,000</em></td></tr>
                <tr><th>시가</th><td><em>N/A</em></td></tr>
                <tr><th>거래량</th><td><em>1,234,567</em></td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);
      const data = result.data as StockData;

      expect(data.quote.prevClose).toBe(70000);
      expect(data.quote.open).toBeNull(); // N/A는 null로 파싱
      expect(data.quote.volume).toBe(1234567);
    });

    it('should extract change information with correct sign', async () => {
      const mockHtml = `
        <html>
          <body>
            <div id="tab_con1">
              <div class="today">
                <p class="no_exday">
                  <span class="no_down">하락</span>
                  1,000
                  <span>-1.41%</span>
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);
      const data = result.data as StockData;

      // 하락일 경우 음수 값
      expect(data.quote.changeValue).toBeLessThan(0);
      expect(data.quote.changeRate).toBe(-1.41);
    });
  });

  describe('Helper methods', () => {
    it('should parse market cap correctly', () => {
      const parseMarketCap = (crawler as any).parseMarketCap.bind(crawler);

      expect(parseMarketCap('61조 7,501억')).toBe('61조 7,501억');
      expect(parseMarketCap('100억')).toBe('100억');
      expect(parseMarketCap('')).toBeNull();
      expect(parseMarketCap(null)).toBeNull();
    });

    it('should parse 52 week high/low correctly', () => {
      const parse52WeekHighLow = (crawler as any).parse52WeekHighLow.bind(
        crawler,
      );

      const result1 = parse52WeekHighLow('85,000 / 65,000');
      expect(result1.high).toBe(85000);
      expect(result1.low).toBe(65000);

      const result2 = parse52WeekHighLow('');
      expect(result2.high).toBeNull();
      expect(result2.low).toBeNull();
    });

    it('should parse PER/EPS correctly', () => {
      const parsePerEps = (crawler as any).parsePerEps.bind(crawler);

      const result1 = parsePerEps('15.5 / 4,500');
      expect(result1.per).toBe('15.5');
      expect(result1.eps).toBe(4500);

      const result2 = parsePerEps('N/A / 4,500');
      expect(result2.per).toBe('N/A');
      expect(result2.eps).toBe(4500);

      const result3 = parsePerEps('');
      expect(result3.per).toBeNull();
      expect(result3.eps).toBeNull();
    });

    it('should parse numbers with various formats', () => {
      const parseNumber = (crawler as any).parseNumber.bind(crawler);

      expect(parseNumber('1,234,567')).toBe(1234567);
      expect(parseNumber('1234.56')).toBe(1234.56);
      expect(parseNumber('-123.45')).toBe(-123.45);
      expect(parseNumber('1,234원')).toBe(1234);
      expect(parseNumber('N/A')).toBeNull();
      expect(parseNumber('')).toBeNull();
      expect(parseNumber(undefined)).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should throw error on network failure', async () => {
      vi.spyOn(crawler as any, 'fetchHtml').mockRejectedValue(
        new Error('Network error'),
      );

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';

      await expect(crawler.crawl(url)).rejects.toThrow('Failed to crawl');
    });

    it('should handle malformed HTML gracefully', async () => {
      const mockHtml = '<html><body><div></div></body></html>';

      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);
      const data = result.data as StockData;

      // 데이터를 찾지 못해도 에러 없이 null 반환
      expect(data.company.name).toBeNull();
      expect(data.quote.currentPrice).toBeNull();
    });
  });

  describe('Crawl result structure', () => {
    it('should return correct result structure', async () => {
      const mockHtml = `<html><body><div id="tab_con1"></div></body></html>`;
      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);

      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('statusCode');

      expect(result.url).toBe(url);
      expect(result.statusCode).toBe(200);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should have correct data structure', async () => {
      const mockHtml = `<html><body><div id="tab_con1"></div></body></html>`;
      vi.spyOn(crawler as any, 'fetchHtml').mockResolvedValue(mockHtml);

      const url =
        'https://finance.naver.com/item/coinfo.naver?code=005930';
      const result = await crawler.crawl(url);
      const data = result.data as StockData;

      // 회사 정보
      expect(data).toHaveProperty('company');
      expect(data.company).toHaveProperty('name');
      expect(data.company).toHaveProperty('code');
      expect(data.company).toHaveProperty('market');

      // 시세 정보
      expect(data).toHaveProperty('quote');
      expect(data.quote).toHaveProperty('currentPrice');
      expect(data.quote).toHaveProperty('changeValue');
      expect(data.quote).toHaveProperty('volume');

      // 투자 정보
      expect(data).toHaveProperty('investment');
      expect(data.investment).toHaveProperty('marketCap');
      expect(data.investment).toHaveProperty('per');
      expect(data.investment).toHaveProperty('pbr');
    });
  });
});
