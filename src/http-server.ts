import express, { Request, Response, NextFunction, Express } from 'express';
import { NaverFinanceCrawler } from './crawlers/naverFinanceCrawler.js';
import { StockData } from './types/index.js';
import { crawlTopSearchedStocksRobust } from './crawlers/TopStocksCrawler.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// JSON 파싱 미들웨어
app.use(express.json());

// 크롤러 인스턴스 생성
const crawler = new NaverFinanceCrawler({
  timeout: 10000,
  retries: 3,
});

/**
 * 헬스체크 엔드포인트
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * 검색 상위 종목 및 상세 정보 크롤링 API
 * GET /api/stock/top
 *
 * @returns 최상위 인기 종목 리스트와 각 종목의 상세 정보
 */
app.get('/api/stock/top', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. 최상위 인기 종목 리스트 크롤링
    console.log('[Top Stocks] 검색 상위 종목 크롤링 시작...');
    const topStocks = await crawlTopSearchedStocksRobust();

    if (topStocks.length === 0) {
      res.status(404).json({
        error: 'No data found',
        message: '검색 상위 종목 데이터를 찾을 수 없습니다.',
      });
      return;
    }

    console.log(`[Top Stocks] ${topStocks.length}개 종목 발견, 상세 정보 크롤링 시작...`);

    // 2. 각 종목의 code를 추출하여 NaverFinanceCrawler로 상세 정보 크롤링
    const stockCodes = topStocks.map((stock) => stock.code);
    const urls = stockCodes.map((code) => NaverFinanceCrawler.buildUrl(code));

    // 3. 병렬 크롤링 수행
    const detailedResults = await crawler.crawlMultiple(urls);

    // 4. 결과 조합: top stocks 기본 정보 + 상세 정보
    const combinedData = topStocks.map((topStock, index) => {
      const detailedResult = detailedResults[index];
      return {
        // 검색 상위 종목 기본 정보
        rank: topStock.rank,
        searchRatio: topStock.searchRatio,
        // 상세 크롤링 정보
        success: detailedResult.data !== null,
        stockCode: topStock.code,
        detailedData: detailedResult.data as StockData,
        metadata: {
          url: detailedResult.url,
          timestamp: detailedResult.timestamp,
          statusCode: detailedResult.statusCode,
        },
      };
    });

    console.log(`[Top Stocks] 총 ${combinedData.length}개 종목 상세 정보 크롤링 완료`);

    // 5. 성공 응답
    res.json({
      success: true,
      count: combinedData.length,
      data: combinedData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 주식 정보 크롤링 API
 * GET /api/stock/:code
 *
 * @param code - 6자리 종목 코드 (예: 005930)
 * @returns StockData
 */
app.get('/api/stock/:code', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;

    // 유효성 검증: 6자리 숫자인지 확인
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({
        error: 'Invalid stock code',
        message: 'Stock code must be exactly 6 digits',
        example: '005930',
      });
      return;
    }

    // URL 생성
    const url = NaverFinanceCrawler.buildUrl(code);

    // 크롤링 수행
    const result = await crawler.crawl(url);
    const data = result.data as StockData;

    // 데이터가 비어있는지 확인
    if (!data.company.name) {
      res.status(404).json({
        error: 'Stock not found',
        message: `No stock data found for code: ${code}`,
        code,
      });
      return;
    }

    // 성공 응답
    res.json({
      success: true,
      data,
      metadata: {
        stockCode: code,
        url: result.url,
        timestamp: result.timestamp,
        statusCode: result.statusCode,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 여러 종목 크롤링 API
 * POST /api/stocks
 *
 * @body codes - 종목 코드 배열 (예: ["005930", "000660"])
 * @returns StockData[]
 */
app.post('/api/stocks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { codes } = req.body;

    // 유효성 검증
    if (!Array.isArray(codes)) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'codes must be an array',
        example: { codes: ['005930', '000660'] },
      });
      return;
    }

    if (codes.length === 0) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'codes array cannot be empty',
      });
      return;
    }

    if (codes.length > 10) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Maximum 10 stock codes allowed per request',
      });
      return;
    }

    // 각 코드 유효성 검증
    const invalidCodes = codes.filter((code: string) => !/^\d{6}$/.test(code));
    if (invalidCodes.length > 0) {
      res.status(400).json({
        error: 'Invalid stock codes',
        message: 'All stock codes must be exactly 6 digits',
        invalidCodes,
      });
      return;
    }

    // URL 생성
    const urls = codes.map((code: string) => NaverFinanceCrawler.buildUrl(code));

    // 크롤링 수행
    const results = await crawler.crawlMultiple(urls);

    // 응답 데이터 생성
    const responseData = results.map((result, index) => ({
      stockCode: codes[index],
      success: result.data !== null,
      data: result.data as StockData,
      metadata: {
        url: result.url,
        timestamp: result.timestamp,
        statusCode: result.statusCode,
      },
    }));

    res.json({
      success: true,
      count: results.length,
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 에러 핸들링 미들웨어
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  });
});

/**
 * 404 핸들러
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: [
      'GET /health',
      'GET /api/stock/:code',
      'GET /api/stock/top',
      'POST /api/stocks',
    ],
  });
});

/**
 * 서버 시작
 */
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   Finance Crawler API Server                  ║
║   Status: Running                              ║
║   Port: ${PORT}                                    ║
║   Time: ${new Date().toISOString()}  ║
╚════════════════════════════════════════════════╝

Available endpoints:
  • GET  /health          - Health check
  • GET  /api/stock/:code - Get single stock data
  • GET  /api/stock/top   - Get top searched stocks with details
  • POST /api/stocks      - Get multiple stocks data

Example:
  curl http://localhost:${PORT}/api/stock/005930
  curl http://localhost:${PORT}/api/stock/top
`);
});

/**
 * 종료 시그널 처리
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;
