# Naver Finance Crawler

네이버 증권 페이지에서 주식 데이터를 안정적으로 크롤링하는 크롤러입니다.

## 특징

### 1. 안정적인 셀렉터 전략

- **텍스트 앵커링 기법**: 순서 기반 셀렉터(`nth-child`) 대신 "전일", "시가", "거래량" 등의 텍스트 레이블을 기준으로 데이터를 추출합니다.
- **구조 변경 대응**: HTML 구조가 변경되어도 레이블이 유지되는 한 크롤러가 정상 작동합니다.

### 2. 견고한 데이터 처리

- **Null 처리**: 데이터를 찾지 못하거나 파싱에 실패한 경우 `null`을 반환하여 '값이 없음'을 명확히 표현합니다.
- **타입 안정성**: TypeScript 인터페이스로 데이터 구조를 명확히 정의했습니다.
- **숫자 파싱**: 쉼표, 단위 등을 자동으로 제거하고 숫자로 변환합니다.

### 3. 유지보수성

- **셀렉터 분리**: 모든 셀렉터를 별도 객체로 관리하여 유지보수가 용이합니다.
- **클래스 구조**: BaseCrawler를 상속받아 일관된 인터페이스를 제공합니다.

## 사용법

### 기본 사용

```typescript
import { NaverFinanceCrawler } from './src/crawlers/naverFinanceCrawler.js';

const crawler = new NaverFinanceCrawler();

// 주식 코드로 URL 생성
const url = NaverFinanceCrawler.buildUrl('005930'); // 삼성전자

// 크롤링 수행
const result = await crawler.crawl(url);
const data = result.data;

console.log(data.company.name); // "삼성전자"
console.log(data.quote.currentPrice); // 70000
```

### 여러 종목 크롤링

```typescript
const stockCodes = ['005930', '000660', '035420'];
const urls = stockCodes.map((code) => NaverFinanceCrawler.buildUrl(code));

const results = await crawler.crawlMultiple(urls);
```

### 옵션 설정

```typescript
const crawler = new NaverFinanceCrawler({
  timeout: 10000, // 타임아웃 (밀리초)
  retries: 3, // 재시도 횟수
  headers: {
    'User-Agent': 'Custom User Agent',
  },
});
```

## 데이터 구조

### StockData

```typescript
interface StockData {
  company: {
    name: string | null; // 회사명
    code: string | null; // 종목코드
    market: string | null; // 시장 (KOSPI/KOSDAQ)
  };
  quote: {
    date: string | null; // 날짜
    currentPrice: number | null; // 현재가
    changeValue: number | null; // 전일대비
    changeRate: number | null; // 등락률
    prevClose: number | null; // 전일 종가
    open: number | null; // 시가
    high: number | null; // 고가
    low: number | null; // 저가
    volume: number | null; // 거래량
    tradeValueMillion: number | null; // 거래대금 (백만원)
  };
  investment: {
    marketCap: string | null; // 시가총액
    marketCapRank: string | null; // 시가총액 순위
    listedShares: number | null; // 상장주식수
    foreignerRatio: number | null; // 외국인소진율
    high52w: number | null; // 52주 최고
    low52w: number | null; // 52주 최저
    per: number | string | null; // PER (N/A 가능)
    eps: number | null; // EPS
    pbr: number | string | null; // PBR (N/A 가능)
    bps: number | null; // BPS
    dividendYield: number | string | null; // 배당수익률
    industryPer: number | string | null; // 동일업종 PER
  };
}
```

## URL 형식

```
https://finance.naver.com/item/coinfo.naver?code=XXXXXX
```

- `XXXXXX`: 6자리 종목코드 (예: 005930)

## 헬퍼 메서드

### `validateUrl(url: string): boolean`

URL이 유효한 네이버 증권 URL인지 검증합니다.

```typescript
NaverFinanceCrawler.validateUrl(
  'https://finance.naver.com/item/coinfo.naver?code=005930',
); // true
```

### `buildUrl(stockCode: string): string`

주식 코드로 URL을 생성합니다.

```typescript
NaverFinanceCrawler.buildUrl('005930');
// "https://finance.naver.com/item/coinfo.naver?code=005930"
```

## 에러 처리

크롤러는 다음과 같은 상황을 안전하게 처리합니다:

1. **네트워크 오류**: 재시도 로직으로 일시적인 네트워크 문제를 처리합니다.
2. **데이터 누락**: 데이터를 찾지 못한 경우 `null`을 반환합니다.
3. **파싱 실패**: 숫자 파싱에 실패한 경우 `null`을 반환합니다.
4. **잘못된 HTML**: HTML이 예상과 다른 경우에도 에러 없이 `null` 값으로 처리합니다.

## 테스트

16개의 단위 테스트로 다음을 검증합니다:

- URL 유효성 검증
- 회사 정보 추출
- 시세 정보 추출 (앵커링)
- 투자 정보 추출
- 숫자 파싱
- 에러 처리
- null 처리

```bash
npm test -- naverFinanceCrawler
```

## 구현 원칙

이 크롤러는 시니어 엔지니어의 피드백을 반영하여 다음 원칙을 준수합니다:

1. **안정성 우선**: 순서 기반 셀렉터 대신 텍스트 앵커링 사용
2. **명확한 null 처리**: 데이터 누락과 실제 0 값 구분
3. **유지보수성**: 셀렉터와 로직 분리
4. **타입 안정성**: TypeScript로 데이터 구조 명확히 정의
5. **견고한 파싱**: 다양한 형식의 데이터를 안전하게 처리

## 향후 개선 방향

### API 크롤링

현재 구현은 정적 HTML을 파싱합니다. 더 안정적인 방법은:

1. 브라우저 개발자 도구(F12)의 네트워크 탭에서 API 요청 확인
2. `polling.finance.naver.com`으로 가는 API를 직접 호출
3. JSON 형식의 정형화된 데이터를 받아 처리

이 방식은 HTML 구조 변경에 영향을 받지 않는 가장 이상적인 크롤링 방법입니다.

### 헤드리스 브라우저

동적 컨텐츠가 필요한 경우 Puppeteer나 Playwright를 사용하여 JavaScript 렌더링 후 크롤링할 수 있습니다.

## 예제 실행

```bash
# TypeScript 컴파일
npm run build

# 예제 실행
node examples/naver-finance-example.js
```

## 라이센스

이 프로젝트는 교육 목적으로 작성되었습니다. 네이버 증권의 이용약관을 준수하여 사용하시기 바랍니다.
