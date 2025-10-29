import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';

// 설정 값들을 상수로 분리하여 관리 용이성을 높임
const CRAWL_CONFIG = {
  URL: 'https://finance.naver.com/sise/lastsearch2.naver',
  HEADERS: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  },
  TARGET_TABLE_SELECTOR: 'div.box_type_l table.type_5',
  TARGET_ROW_SELECTOR: 'tr:has(td.no)', // 'no' 클래스를 가진 td가 있는 tr만 선택
};

// 데이터 구조 정의
export interface TopStockData {
  rank: number;
  code: string; // 종목 코드 추가
  name: string;
  searchRatio: string;
  currentPrice: number;
  priceChange: number; // '전일비'는 숫자 데이터로 파싱
  changeRate: string;
  volume: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  per: number | null; // N/A 값 처리를 위해 null 허용
  roe: number | null; // N/A 값 처리를 위해 null 허용
}

/**
 * 주어진 문자열을 파싱하여 숫자로 변환합니다.
 * 변환 실패 시 null을 반환하여 데이터의 신뢰성을 높입니다.
 * @param text - 변환할 텍스트
 * @returns 변환된 숫자 또는 null
 */
function safeParseFloat(text: string): number | null {
  const cleanedText = text.trim().replace(/,/g, '');
  if (cleanedText === 'N/A' || cleanedText === '') return null;
  const num = parseFloat(cleanedText);
  return isNaN(num) ? null : num;
}

/**
 * 네이버 증권의 검색 상위 종목 데이터를 안정적으로 크롤링하는 함수
 */
export async function crawlTopSearchedStocksRobust(): Promise<TopStockData[]> {
  try {
    // 1. HTTP 요청 단계: 명확한 User-Agent 설정 및 타임아웃 추가
    console.log(`[Request] ${CRAWL_CONFIG.URL} 페이지 요청 시작`);
    const response: AxiosResponse<Buffer> = await axios.get(CRAWL_CONFIG.URL, {
      headers: CRAWL_CONFIG.HEADERS,
      responseType: 'arraybuffer', // Buffer 형태로 받아 인코딩을 직접 처리
      timeout: 5000, // 5초 타임아웃 설정
    });

    if (response.status !== 200) {
      console.error(`[Request Error] HTTP 상태 코드 ${response.status} 반환`);
      return [];
    }
    console.log(`[Request Success] 페이지 요청 성공`);

    // 2. 디코딩 단계: iconv-lite를 사용한 안정적인 디코딩
    const html = iconv.decode(response.data, 'euc-kr');

    // 3. 파싱 단계: Cheerio로 HTML 로드
    const $ = cheerio.load(html);
    const stockList: TopStockData[] = [];

    // 4. 데이터 추출 단계: 더 견고한 셀렉터 사용 및 상세한 예외 처리
    const stockTable = $(CRAWL_CONFIG.TARGET_TABLE_SELECTOR);
    if (stockTable.length === 0) {
      console.error('[Parsing Error] 목표 테이블을 찾을 수 없습니다. 셀렉터를 확인하세요.');
      return [];
    }

    const rows = stockTable.find(CRAWL_CONFIG.TARGET_ROW_SELECTOR);
    console.log(`[Parsing] ${rows.length}개의 종목 데이터를 찾았습니다.`);

    rows.each((index, element) => {
      const cells = $(element).find('td');
      const rowNum = index + 1;

      try {
        // 5. 데이터 유효성 검증 및 타입 변환
        const rankText = $(cells[0]).text().trim();
        const nameElement = $(cells[1]).find('a');
        const nameText = nameElement.text().trim();

        // 종목 코드 추출 (링크의 href에서 code 파라미터 추출)
        const href = nameElement.attr('href') || '';
        const codeMatch = href.match(/code=(\d{6})/);
        const code = codeMatch ? codeMatch[1] : '';

        if (!rankText || !nameText || !code) {
          throw new Error('필수 항목(순위, 종목명, 종목코드)이 비어있습니다.');
        }

        // 전일비 데이터에서 상승/하락 부호 처리
        const priceChangeElement = $(cells[4]);
        const priceChangeSign = priceChangeElement.find('em.bu_pdn').length > 0 ? -1 : 1;
        const priceChangeValue = safeParseFloat(priceChangeElement.text());

        const stockData: TopStockData = {
          rank: parseInt(rankText, 10),
          code,
          name: nameText,
          searchRatio: $(cells[2]).text().trim(),
          currentPrice: safeParseFloat($(cells[3]).text()) ?? 0,
          priceChange: (priceChangeValue ?? 0) * priceChangeSign,
          changeRate: $(cells[5]).text().trim(),
          volume: safeParseFloat($(cells[6]).text()) ?? 0,
          openPrice: safeParseFloat($(cells[7]).text()) ?? 0,
          highPrice: safeParseFloat($(cells[8]).text()) ?? 0,
          lowPrice: safeParseFloat($(cells[9]).text()) ?? 0,
          per: safeParseFloat($(cells[10]).text()),
          roe: safeParseFloat($(cells[11]).text()),
        };

        stockList.push(stockData);
      } catch (error) {
        // 특정 행에서 오류 발생 시, 로그를 남기고 다음 행으로 진행
        console.warn(
          `[Row Parsing Error] ${rowNum}번째 행 처리 중 오류 발생:`,
          error instanceof Error ? error.message : error,
        );
      }
    });

    console.log(`[Success] 총 ${stockList.length}개 종목 크롤링 완료`);
    return stockList;
  } catch (error) {
    // 6. 포괄적인 오류 처리 및 로깅
    if (axios.isAxiosError(error)) {
      console.error(`[Network Error] 크롤링 중 네트워크 오류 발생: ${error.message}`);
    } else {
      console.error(`[Unknown Error] 크롤링 중 알 수 없는 오류 발생:`, error);
    }
    return [];
  }
}
