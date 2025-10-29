import { BaseCrawler } from './baseCrawler.js';
import { CrawlResult, StockData, CrawlerOptions } from '../types/index.js';
import { CheerioAPI } from 'cheerio';

/**
 * 네이버 증권 셀렉터 설정
 * 텍스트 앵커링 기반으로 안정성 확보
 */
const selectors = {
  company: {
    name: '.wrap_company h2 a',
    code: '.description .code',
    market: '.description .kospi, .description .kosdaq',
  },
  quote: {
    base: '#tab_con1',
    date: '#time .date',
    currentPrice: '.today .no_today .blind',
    changeInfo: '.today .no_exday',
    // 텍스트 앵커링: '전일', '시가' 등의 레이블을 기준으로 데이터 추출
    labeledData: 'table.no_info tr',
  },
  investment: {
    base: '#tab_con1',
    marketCap: '#_market_sum',
    // 투자정보 테이블
    infoTable: 'table.tb_type1',
  },
};

/**
 * 네이버 증권 크롤러
 * URL: https://finance.naver.com/item/coinfo.naver?code=XXXXXX
 */
export class NaverFinanceCrawler extends BaseCrawler {
  constructor(options?: CrawlerOptions) {
    super(options);
  }

  /**
   * 주식 코드에서 크롤링 수행
   */
  async crawl(url: string): Promise<CrawlResult> {
    try {
      // HTML 가져오기
      const html = await this.fetchHtml(url);
      const parser = this.parseHtml(html);
      const $ = parser.getRawCheerio();

      // 데이터 추출
      const stockData = this.extractStockData($);

      return {
        url,
        data: stockData,
        timestamp: new Date(),
        statusCode: 200,
      };
    } catch (error) {
      throw new Error(
        `Failed to crawl ${url}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 주식 데이터 추출
   */
  private extractStockData($: CheerioAPI): StockData {
    return {
      company: this.extractCompanyInfo($),
      quote: this.extractQuoteInfo($),
      investment: this.extractInvestmentInfo($),
    };
  }

  /**
   * 회사 정보 추출
   */
  private extractCompanyInfo($: CheerioAPI): StockData['company'] {
    const name = $(selectors.company.name).text().trim() || null;
    const code = $(selectors.company.code).text().trim() || null;
    const marketEl = $(selectors.company.market);
    const market = marketEl.attr('alt') || marketEl.text().trim() || null;

    return { name, code, market };
  }

  /**
   * 시세 정보 추출 (텍스트 앵커링 기법 사용)
   */
  private extractQuoteInfo($: CheerioAPI): StockData['quote'] {
    const quoteBase = $(selectors.quote.base);

    // 날짜
    const date = $(selectors.quote.date).text().trim().replace(/\s+/g, ' ') || null;

    // 현재가
    const currentPrice = this.parseNumber(
      quoteBase.find(selectors.quote.currentPrice).text(),
    );

    // 전일대비, 등락률 추출
    const changeInfoText = quoteBase.find(selectors.quote.changeInfo).text();
    const { changeValue, changeRate } = this.parseChangeInfo($, changeInfoText);

    // 텍스트 앵커링으로 시세 데이터 추출
    const prevClose = this.parseNumber(this.getValueByLabel($, quoteBase, '전일'));
    const open = this.parseNumber(this.getValueByLabel($, quoteBase, '시가'));
    const high = this.parseNumber(this.getValueByLabel($, quoteBase, '고가'));
    const low = this.parseNumber(this.getValueByLabel($, quoteBase, '저가'));
    const volume = this.parseNumber(this.getValueByLabel($, quoteBase, '거래량'));
    const tradeValueMillion = this.parseNumber(this.getValueByLabel($, quoteBase, '거래대금'));

    return {
      date,
      currentPrice,
      changeValue,
      changeRate,
      prevClose,
      open,
      high,
      low,
      volume,
      tradeValueMillion,
    };
  }

  /**
   * 투자 정보 추출 (텍스트 앵커링 기법 사용)
   */
  private extractInvestmentInfo($: CheerioAPI): StockData['investment'] {
    const investmentBase = $(selectors.investment.base);

    // 시가총액 (특수 처리)
    const marketCapText = investmentBase.find(selectors.investment.marketCap).text();
    const marketCap = this.parseMarketCap(marketCapText);

    // 시가총액 순위
    const marketCapRank = this.getValueByLabel($, investmentBase, '시가총액순위');

    // 상장주식수
    const listedShares = this.parseNumber(
      this.getValueByLabel($, investmentBase, '상장주식수'),
    );

    // 외국인소진율
    const foreignerRatio = this.parseNumber(
      this.getValueByLabel($, investmentBase, '외국인소진율'),
    );

    // 52주 최고/최저
    const week52Text = this.getValueByLabel($, investmentBase, '52주최고');
    const { high, low } = this.parse52WeekHighLow(week52Text);

    // PER/EPS
    const perEpsText = this.getValueByLabel($, investmentBase, 'PER');
    const { per, eps } = this.parsePerEps(perEpsText);

    // PBR/BPS
    const pbrBpsText = this.getValueByLabel($, investmentBase, 'PBR');
    const { pbr, bps } = this.parsePbrBps(pbrBpsText);

    // 배당수익률
    const dividendYield = this.getValueByLabel($, investmentBase, '배당수익률') || null;

    // 동일업종 PER
    const industryPer = this.getValueByLabel($, investmentBase, '동일업종 PER') || null;

    return {
      marketCap,
      marketCapRank,
      listedShares,
      foreignerRatio,
      high52w: high,
      low52w: low,
      per,
      eps,
      pbr,
      bps,
      dividendYield,
      industryPer,
    };
  }

  /**
   * 헬퍼: 텍스트 레이블로 값 찾기 (앵커링)
   */
  private getValueByLabel($: CheerioAPI, base: any, label: string): string {
    let result = '';

    // th 요소에서 레이블 찾기
    base.find('th').each((_: number, th: any) => {
      const thText = $(th).text().trim();
      if (thText.includes(label)) {
        // 다음 td 요소의 값 추출
        const td = $(th).next('td');
        result = this.cleanText(td.text());
        return false; // break
      }
    });

    // 못 찾았으면 span이나 em으로 시도
    if (!result) {
      base.find('span, em').each((_: number, el: any) => {
        const elText = $(el).text().trim();
        if (elText === label) {
          const nextEm = $(el).next('em');
          if (nextEm.length) {
            result = this.cleanText(nextEm.text());
            return false;
          }
        }
      });
    }

    return result;
  }

  /**
   * 헬퍼: 텍스트 정리 (공백, 탭, 줄바꿈 제거)
   */
  private cleanText(text: string): string {
    return text
      .replace(/[\n\r\t]/g, '') // 줄바꿈, 탭 제거
      .replace(/\s+/g, ' ') // 연속된 공백을 하나로
      .trim(); // 양쪽 공백 제거
  }

  /**
   * 헬퍼: 전일대비/등락률 파싱
   */
  private parseChangeInfo(
    $: CheerioAPI,
    changeInfoText: string,
  ): { changeValue: number | null; changeRate: number | null } {
    const parts = changeInfoText.trim().split(/\s+/);

    // 상승/하락 판별
    const changeSign = changeInfoText.includes('하락') ? -1 : 1;

    // 전일대비 값
    const changeValueRaw = parts.find((s) => s.match(/[\d,]+/));
    const changeValue = changeValueRaw
      ? (this.parseNumber(changeValueRaw) || 0) * changeSign
      : null;

    // 등락률
    const changeRateRaw = parts.find((s) => s.includes('%'));
    const changeRate = changeRateRaw ? this.parseNumber(changeRateRaw) : null;

    return { changeValue, changeRate };
  }

  /**
   * 헬퍼: 시가총액 파싱 (조/억 단위 처리)
   */
  private parseMarketCap(text: string): string | null {
    if (!text) return null;
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * 헬퍼: 52주 최고/최저 파싱
   */
  private parse52WeekHighLow(text: string): {
    high: number | null;
    low: number | null;
  } {
    if (!text) return { high: null, low: null };

    const parts = text.split(/[/\s]+/);
    const high = parts[0] ? this.parseNumber(parts[0]) : null;
    const low = parts[1] ? this.parseNumber(parts[1]) : null;

    return { high, low };
  }

  /**
   * 헬퍼: PER/EPS 파싱
   */
  private parsePerEps(text: string): {
    per: number | string | null;
    eps: number | null;
  } {
    if (!text) return { per: null, eps: null };

    // N/A 처리를 먼저 확인
    if (text.startsWith('N/A')) {
      const parts = text.split(/\s+/);
      const eps = parts.length > 2 ? this.parseNumber(parts[2]) : null;
      return { per: 'N/A', eps };
    }

    const parts = text.split(/\s*\/\s*/);
    const per = parts[0] ? parts[0].trim() : null;
    const eps = parts[1] ? this.parseNumber(parts[1]) : null;

    return { per, eps };
  }

  /**
   * 헬퍼: PBR/BPS 파싱
   */
  private parsePbrBps(text: string): {
    pbr: number | string | null;
    bps: number | null;
  } {
    if (!text) return { pbr: null, bps: null };

    // N/A 처리를 먼저 확인
    if (text.startsWith('N/A')) {
      const parts = text.split(/\s+/);
      const bps = parts.length > 2 ? this.parseNumber(parts[2]) : null;
      return { pbr: 'N/A', bps };
    }

    const parts = text.split(/\s*\/\s*/);
    const pbr = parts[0] ? parts[0].trim() : null;
    const bps = parts[1] ? this.parseNumber(parts[1]) : null;

    return { pbr, bps };
  }

  /**
   * 헬퍼: 숫자 파싱 (null 반환으로 안정성 확보)
   */
  private parseNumber(text: string | undefined): number | null {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * URL 유효성 검증
   */
  static validateUrl(url: string): boolean {
    const pattern = /^https:\/\/finance\.naver\.com\/item\/coinfo\.naver\?code=\d{6}$/;
    return pattern.test(url);
  }

  /**
   * 주식 코드로 URL 생성
   */
  static buildUrl(stockCode: string): string {
    if (!/^\d{6}$/.test(stockCode)) {
      throw new Error('Stock code must be 6 digits');
    }
    return `https://finance.naver.com/item/coinfo.naver?code=${stockCode}`;
  }
}
