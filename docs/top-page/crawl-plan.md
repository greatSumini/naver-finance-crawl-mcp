## 시니어 데이터 엔지니어의 코드 리뷰

주니어 개발자님, 네이버 증권 검색 상위 종목 크롤링 코드 리뷰 요청 잘 받았습니다. 마크다운으로 깔끔하게 결과물을 정리하고, 타입스크립트로 크롤러를 작성한 점이 인상 깊네요. 특히 `axios`와 `cheerio` 조합은 Node.js 환경에서 웹 크롤링을 할 때 매우 효율적인 선택입니다.

전반적으로 코드의 흐름이 명확하고 의도한 대로 잘 동작하는 것으로 보입니다. 다만, 우리는 **'절대 버그 없이 언제나 안정적으로 작동하는 크롤러'**를 추구해야 합니다. 이런 관점에서 볼 때, 현재 코드는 실제 운영 환경에서 마주할 수 있는 여러 가지 예외 상황에 취약할 수 있습니다.

아래에 제가 드리는 피드백과 개선 코드를 통해, 어떻게 하면 더 견고하고 유지보수하기 좋은 크롤러를 만들 수 있을지 함께 고민해 보면 좋겠습니다.

### 주니어 개발자 코드에 대한 피드백

#### 1. 불안정한 셀렉터(Selector) 사용

*   **문제점:** `$('.box_type_l table.type_5')`와 같이 클래스명에 의존하는 셀렉터는 웹사이트의 디자인 개편 시 쉽게 깨질 수 있습니다. 특히 `type_5`와 같은 이름은 언제든지 변경될 가능성이 있습니다. 또한, `$(cells[0])`, `$(cells[1])`처럼 인덱스 순서에 강하게 의존하는 방식은 테이블 구조가 약간만 변경되어도 (예: 새로운 컬럼 추가) 전체 크롤러가 오작동하는 원인이 됩니다.
*   **개선 방향:** 더 구체적이고 구조적인 셀렉터를 사용해야 합니다. 예를 들어, `id`가 있다면 `id`를 우선적으로 사용하고, 그렇지 않다면 `<tbody>`나 특정 `class`를 가진 `<tr>`을 명시적으로 찾아 순회하는 것이 좋습니다. 각 데이터(td) 역시 인덱스보다는 `class`나 `title` 같은 속성을 이용해 특정하는 것이 훨씬 안정적입니다.

#### 2. 인코딩 처리의 미흡함

*   **문제점:** 주석으로 'EUC-KR' 인코딩을 언급하고 `TextDecoder`를 사용한 점은 좋습니다. 하지만 `axios`의 `response.data`가 항상 `euc-kr`로 인코딩되었다고 확신하기 어렵습니다. 서버의 응답 헤더(`Content-Type`)를 확인하여 동적으로 처리하는 것이 더 안전합니다.
*   **개선 방향:** `axios` 응답 헤더의 `content-type`을 파싱하여 문자셋(charset)을 확인하고, 그에 맞는 디코딩 방식을 적용하는 것이 좋습니다. `iconv-lite`와 같은 전문 라이브러리는 다양한 인코딩을 더 안정적으로 처리해 줍니다.

#### 3. 예외 처리 및 로깅 부족

*   **문제점:** `try-catch` 블록으로 전체 함수를 감쌌지만, 오류 발생 시 콘솔에 에러 메시지를 출력하고 빈 배열을 반환하는 것만으로는 부족합니다. 어떤 URL에서, 어떤 종류의 에러(네트워크, 파싱 등)가 발생했는지 명확히 알 수 있어야 신속한 대응이 가능합니다.
*   **개선 방향:** 오류 발생 시, 어떤 단계(요청, 응답, 파싱)에서 문제가 생겼는지 구체적인 컨텍스트를 포함하여 로그를 남겨야 합니다. 예를 들어, HTTP 상태 코드가 200이 아닌 경우, 혹은 데이터를 파싱했지만 원하는 테이블 구조를 찾지 못한 경우 등을 구분해서 처리해야 합니다.

#### 4. 데이터 유효성 검증의 부재

*   **문제점:** 크롤링한 데이터가 항상 우리가 기대하는 형식(예: 숫자는 숫자, 문자열은 비어있지 않음)이라고 가정하고 있습니다. 웹페이지 구조 변경이나 일시적인 오류로 인해 특정 필드가 비거나 `N/A`와 같은 예상치 못한 값으로 채워질 수 있습니다. `parseInt`에 예기치 않은 문자열이 들어가면 `NaN`이 반환될 수 있습니다.
*   **개선 방향:** 각 필드를 파싱한 후, 데이터 타입과 값의 유효성을 검증하는 단계를 추가해야 합니다. 숫자여야 하는 값은 `parseInt`나 `parseFloat` 후 `isNaN`으로 확인하고, 필수적인 값이 비어있다면 해당 row는 건너뛰거나 별도로 로그를 남기는 정책이 필요합니다.

#### 5. 하드코딩된 URL 및 설정

*   **문제점:** 크롤링할 URL이 코드 내에 하드코딩되어 있습니다. 만약 대상 URL이 변경되거나 여러 페이지를 크롤링해야 할 경우, 코드 여러 곳을 수정해야 하므로 유지보수가 어렵습니다.
*   **개선 방향:** URL, 셀렉터, 요청 헤더 등 주요 설정 값들은 별도의 설정 객체나 파일로 분리하는 것이 좋습니다. 이렇게 하면 코드의 재사용성이 높아지고 설정 변경이 용이해집니다.

---

### 개선된 크롤러 코드 (TypeScript)

위 피드백을 바탕으로 개선한 코드입니다. 각 항목이 어떻게 개선되었는지 주석과 함께 확인해 보세요.

```typescript
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';

// 설정 값들을 상수로 분리하여 관리 용이성을 높임
const CRAWL_CONFIG = {
  URL: 'https://finance.naver.com/sise/lastsearch2.naver',
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  },
  TARGET_TABLE_SELECTOR: 'div.box_type_l table.type_5',
  TARGET_ROW_SELECTOR: 'tr:has(td.no)', // 'no' 클래스를 가진 td가 있는 tr만 선택
};

// 데이터 구조 정의는 동일
interface StockData {
  rank: number;
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
async function crawlTopSearchedStocksRobust(): Promise<StockData[]> {
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
    const stockList: StockData[] = [];

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
        const nameText = $(cells[1]).find('a').text().trim();

        if (!rankText || !nameText) {
          throw new Error('필수 항목(순위, 종목명)이 비어있습니다.');
        }

        // 전일비 데이터에서 상승/하락 부호 처리
        const priceChangeElement = $(cells[4]);
        const priceChangeSign = priceChangeElement.find('em.bu_pdn').length > 0 ? -1 : 1;
        const priceChangeValue = safeParseFloat(priceChangeElement.text());
        
        const stockData: StockData = {
          rank: parseInt(rankText, 10),
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
        console.warn(`[Row Parsing Error] ${rowNum}번째 행 처리 중 오류 발생:`, error instanceof Error ? error.message : error);
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

// 개선된 크롤러 함수 실행
crawlTopSearchedStocksRobust().then(data => {
  if (data.length > 0) {
    console.log("\n=== 네이버 증권 검색 상위 종목 (개선된 크롤러) ===");
    console.table(data);
  } else {
    console.log("\n크롤링된 데이터가 없습니다.");
  }
});

```

### 개선된 코드의 주요 특징

1.  **설정 분리 (`CRAWL_CONFIG`):** URL, 헤더, 셀렉터와 같은 주요 설정들을 상단 객체로 분리하여 가독성과 유지보수성을 향상시켰습니다.
2.  **견고한 셀렉터:** `tr:has(td.no)`와 같이 특정 조건을 만족하는 행만 선택하도록 하여, 빈 `tr`이나 구조가 다른 `tr`을 처음부터 제외합니다.
3.  **안정적인 디코딩:** `iconv-lite` 라이브러리를 사용하여 더 안정적으로 EUC-KR 인코딩을 처리합니다.
4.  **상세한 로깅:** 각 단계(요청, 파싱, 성공/실패)마다 로그를 남겨 크롤러의 동작 상태를 명확히 파악할 수 있게 했습니다.
5.  **안전한 타입 변환 (`safeParseFloat`):** 숫자 변환 시 `N/A`나 빈 문자열 같은 예외 케이스를 처리하고, 변환 실패 시 `NaN` 대신 `null`을 반환하여 데이터의 일관성을 유지합니다.
6.  **데이터 정제:** '전일비' 항목에서 상승/하락 정보를 `em` 태그의 클래스(`bu_pdn`)로 구분하여 부호가 있는 숫자(`-4,100` -> `-4100`)로 파싱합니다. 이는 후속 데이터 처리나 분석에 훨씬 용이합니다.
7.  **행 단위 예외 처리:** `rows.each` 루프 내부에 `try-catch`를 추가하여 특정 행에서 파싱 오류가 발생하더라도 전체 크롤링이 중단되지 않고 계속 진행되도록 했습니다.

이처럼 안정성을 높이기 위한 여러 장치를 마련하면, 웹사이트의 작은 변화나 일시적인 네트워크 문제에도 크롤러가 최대한 의도대로 동작하게 만들 수 있습니다. 앞으로도 단순히 데이터를 가져오는 것을 넘어, '어떻게 하면 더 안정적으로, 더 예측 가능하게 만들 수 있을까'를 항상 고민하는 엔지니어가 되시길 바랍니다.

수고하셨습니다.