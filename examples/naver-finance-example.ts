import { NaverFinanceCrawler } from '../src/crawlers/naverFinanceCrawler.js';
import { StockData } from '../src/types/index.js';

/**
 * 네이버 증권 크롤러 사용 예제
 */
async function main() {
  // 크롤러 인스턴스 생성
  const crawler = new NaverFinanceCrawler({
    timeout: 10000,
    retries: 3,
  });

  try {
    // 방법 1: 주식 코드로 URL 생성
    const stockCode = '005930'; // 삼성전자
    const url = NaverFinanceCrawler.buildUrl(stockCode);

    console.log(`크롤링 시작: ${url}\n`);

    // 크롤링 수행
    const result = await crawler.crawl(url);
    const data = result.data as StockData;

    // 결과 출력
    console.log('=== 회사 정보 ===');
    console.log(`회사명: ${data.company.name}`);
    console.log(`종목코드: ${data.company.code}`);
    console.log(`시장: ${data.company.market}\n`);

    console.log('=== 시세 정보 ===');
    console.log(`날짜: ${data.quote.date}`);
    console.log(`현재가: ${data.quote.currentPrice?.toLocaleString()}원`);
    console.log(`전일대비: ${data.quote.changeValue?.toLocaleString()}원`);
    console.log(`등락률: ${data.quote.changeRate}%`);
    console.log(`전일: ${data.quote.prevClose?.toLocaleString()}원`);
    console.log(`시가: ${data.quote.open?.toLocaleString()}원`);
    console.log(`고가: ${data.quote.high?.toLocaleString()}원`);
    console.log(`저가: ${data.quote.low?.toLocaleString()}원`);
    console.log(`거래량: ${data.quote.volume?.toLocaleString()}주`);
    console.log(`거래대금: ${data.quote.tradeValueMillion?.toLocaleString()}백만원\n`);

    console.log('=== 투자 정보 ===');
    console.log(`시가총액: ${data.investment.marketCap}`);
    console.log(`시가총액순위: ${data.investment.marketCapRank}`);
    console.log(`상장주식수: ${data.investment.listedShares?.toLocaleString()}주`);
    console.log(`외국인소진율: ${data.investment.foreignerRatio}%`);
    console.log(`52주 최고: ${data.investment.high52w?.toLocaleString()}원`);
    console.log(`52주 최저: ${data.investment.low52w?.toLocaleString()}원`);
    console.log(`PER: ${data.investment.per}`);
    console.log(`EPS: ${data.investment.eps?.toLocaleString()}원`);
    console.log(`PBR: ${data.investment.pbr}`);
    console.log(`BPS: ${data.investment.bps?.toLocaleString()}원`);
    console.log(`배당수익률: ${data.investment.dividendYield}`);
    console.log(`동일업종 PER: ${data.investment.industryPer}\n`);

    console.log('=== 전체 JSON 데이터 ===');
    console.log(JSON.stringify(data, null, 2));

    // 방법 2: 여러 종목 크롤링
    console.log('\n\n=== 여러 종목 크롤링 ===');
    const stockCodes = ['005930', '000660', '035420']; // 삼성전자, SK하이닉스, NAVER
    const urls = stockCodes.map((code) => NaverFinanceCrawler.buildUrl(code));

    const results = await crawler.crawlMultiple(urls);

    results.forEach((result) => {
      const stockData = result.data as StockData;
      if (stockData) {
        console.log(
          `${stockData.company.name} (${stockData.company.code}): ${stockData.quote.currentPrice?.toLocaleString()}원`,
        );
      }
    });
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
  }
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
