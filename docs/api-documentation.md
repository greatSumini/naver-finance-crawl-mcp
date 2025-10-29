# Finance Crawler API Documentation

네이버 증권 데이터를 크롤링하는 REST API 서버입니다.

## 시작하기

### 서버 실행

```bash
# 개발 모드 (자동 재시작)
pnpm dev

# 프로덕션 빌드
pnpm build
pnpm start
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

환경 변수 `PORT`로 포트를 변경할 수 있습니다:

```bash
PORT=8080 pnpm dev
```

## API 엔드포인트

### 1. Health Check

서버 상태를 확인합니다.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-29T12:00:00.000Z"
}
```

**Example:**

```bash
curl http://localhost:3000/health
```

---

### 2. 단일 종목 조회

지정한 종목 코드의 주식 정보를 조회합니다.

**Endpoint:** `GET /api/stock/:code`

**Parameters:**

- `code` (string, required): 6자리 종목 코드 (예: 005930)

**Response:**

```json
{
  "success": true,
  "data": {
    "company": {
      "name": "삼성전자",
      "code": "005930",
      "market": "코스피"
    },
    "quote": {
      "date": "2025.10.29 기준(KRX 장마감)",
      "currentPrice": 70000,
      "changeValue": -1000,
      "changeRate": -1.41,
      "prevClose": 71000,
      "open": 70500,
      "high": 71500,
      "low": 69800,
      "volume": 12345678,
      "tradeValueMillion": 867890
    },
    "investment": {
      "marketCap": "417조 6,501억",
      "marketCapRank": "코스피 1위",
      "listedShares": 5969783000,
      "foreignerRatio": 52.34,
      "high52w": 85000,
      "low52w": 65000,
      "per": "15.23",
      "eps": 4598,
      "pbr": "1.2",
      "bps": 58330,
      "dividendYield": "2.5%",
      "industryPer": "12.5배"
    }
  },
  "metadata": {
    "stockCode": "005930",
    "url": "https://finance.naver.com/item/coinfo.naver?code=005930",
    "timestamp": "2025-10-29T12:00:00.000Z",
    "statusCode": 200
  }
}
```

**Error Responses:**

**400 Bad Request** - 잘못된 종목 코드

```json
{
  "error": "Invalid stock code",
  "message": "Stock code must be exactly 6 digits",
  "example": "005930"
}
```

**404 Not Found** - 종목을 찾을 수 없음

```json
{
  "error": "Stock not found",
  "message": "No stock data found for code: 999999",
  "code": "999999"
}
```

**500 Internal Server Error** - 서버 오류

```json
{
  "error": "Internal server error",
  "message": "Failed to fetch data from Naver Finance"
}
```

**Examples:**

```bash
# 삼성전자 (005930)
curl http://localhost:3000/api/stock/005930

# 두산에너빌리티 (034020)
curl http://localhost:3000/api/stock/034020

# SK하이닉스 (000660)
curl http://localhost:3000/api/stock/000660

# NAVER (035420)
curl http://localhost:3000/api/stock/035420
```

---

### 3. 여러 종목 조회

여러 종목의 정보를 한 번에 조회합니다.

**Endpoint:** `POST /api/stocks`

**Request Body:**

```json
{
  "codes": ["005930", "000660", "035420"]
}
```

**Parameters:**

- `codes` (array of strings, required): 6자리 종목 코드 배열
  - 최소 1개, 최대 10개

**Response:**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "stockCode": "005930",
      "success": true,
      "data": {
        "company": {
          "name": "삼성전자",
          "code": "005930",
          "market": "코스피"
        },
        "quote": { ... },
        "investment": { ... }
      },
      "metadata": {
        "url": "https://finance.naver.com/item/coinfo.naver?code=005930",
        "timestamp": "2025-10-29T12:00:00.000Z",
        "statusCode": 200
      }
    },
    {
      "stockCode": "000660",
      "success": true,
      "data": { ... },
      "metadata": { ... }
    },
    {
      "stockCode": "035420",
      "success": true,
      "data": { ... },
      "metadata": { ... }
    }
  ]
}
```

**Error Responses:**

**400 Bad Request** - 잘못된 요청

```json
{
  "error": "Invalid request",
  "message": "codes must be an array",
  "example": { "codes": ["005930", "000660"] }
}
```

```json
{
  "error": "Invalid request",
  "message": "Maximum 10 stock codes allowed per request"
}
```

```json
{
  "error": "Invalid stock codes",
  "message": "All stock codes must be exactly 6 digits",
  "invalidCodes": ["12345", "abcdef"]
}
```

**Examples:**

```bash
# 여러 종목 조회
curl -X POST http://localhost:3000/api/stocks \
  -H "Content-Type: application/json" \
  -d '{"codes": ["005930", "000660", "035420"]}'

# 단일 종목도 배열로 조회 가능
curl -X POST http://localhost:3000/api/stocks \
  -H "Content-Type: application/json" \
  -d '{"codes": ["034020"]}'
```

---

## 데이터 구조

### Company (회사 정보)

| Field  | Type   | Description      | Example    |
| ------ | ------ | ---------------- | ---------- |
| name   | string | 회사명           | "삼성전자" |
| code   | string | 종목 코드        | "005930"   |
| market | string | 시장 (코스피/코스닥) | "코스피"   |

### Quote (시세 정보)

| Field               | Type   | Description        | Example                     |
| ------------------- | ------ | ------------------ | --------------------------- |
| date                | string | 기준 일시          | "2025.10.29 기준(KRX 장마감)" |
| currentPrice        | number | 현재가 (원)        | 70000                       |
| changeValue         | number | 전일대비 (원)      | -1000                       |
| changeRate          | number | 등락률 (%)         | -1.41                       |
| prevClose           | number | 전일 종가 (원)     | 71000                       |
| open                | number | 시가 (원)          | 70500                       |
| high                | number | 고가 (원)          | 71500                       |
| low                 | number | 저가 (원)          | 69800                       |
| volume              | number | 거래량 (주)        | 12345678                    |
| tradeValueMillion   | number | 거래대금 (백만원)  | 867890                      |

### Investment (투자 정보)

| Field           | Type          | Description               | Example          |
| --------------- | ------------- | ------------------------- | ---------------- |
| marketCap       | string        | 시가총액                  | "417조 6,501억"  |
| marketCapRank   | string        | 시가총액 순위             | "코스피 1위"     |
| listedShares    | number        | 상장주식수 (주)           | 5969783000       |
| foreignerRatio  | number        | 외국인소진율 (%)          | 52.34            |
| high52w         | number        | 52주 최고가 (원)          | 85000            |
| low52w          | number        | 52주 최저가 (원)          | 65000            |
| per             | string/number | PER (배)                  | "15.23" or "N/A" |
| eps             | number        | EPS (원)                  | 4598             |
| pbr             | string/number | PBR (배)                  | "1.2" or "N/A"   |
| bps             | number        | BPS (원)                  | 58330            |
| dividendYield   | string/number | 배당수익률                | "2.5%" or "N/A"  |
| industryPer     | string/number | 동일업종 PER              | "12.5배"         |

> **Note:** `null` 값은 해당 데이터를 찾을 수 없거나 파싱에 실패한 경우입니다.

---

## 인코딩

모든 응답은 **UTF-8**로 인코딩됩니다. 네이버 증권 페이지는 EUC-KR을 사용하지만, API 서버에서 자동으로 UTF-8로 변환합니다.

따라서 한글 회사명, 시장명 등이 모두 정상적으로 표시됩니다.

---

## 에러 처리

API는 다음과 같은 HTTP 상태 코드를 반환합니다:

- `200 OK`: 성공
- `400 Bad Request`: 잘못된 요청 (유효하지 않은 종목 코드 등)
- `404 Not Found`: 종목을 찾을 수 없음 또는 존재하지 않는 엔드포인트
- `500 Internal Server Error`: 서버 내부 오류

모든 에러 응답은 다음 형식을 따릅니다:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "additionalField": "Additional context (optional)"
}
```

---

## Rate Limiting

현재 Rate Limiting은 구현되어 있지 않습니다.

프로덕션 환경에서는 다음을 고려하세요:
- 요청 빈도 제한
- IP 기반 제한
- API 키 인증

---

## 주요 종목 코드 예시

| 종목명           | 코드   | 시장   |
| ---------------- | ------ | ------ |
| 삼성전자         | 005930 | 코스피 |
| SK하이닉스       | 000660 | 코스피 |
| NAVER            | 035420 | 코스피 |
| 카카오           | 035720 | 코스피 |
| 현대차           | 005380 | 코스피 |
| 기아             | 000270 | 코스피 |
| 두산에너빌리티   | 034020 | 코스피 |
| 삼성바이오로직스 | 207940 | 코스피 |
| LG에너지솔루션   | 373220 | 코스피 |
| 셀트리온         | 068270 | 코스피 |

---

## 기술 스택

- **Node.js** - 런타임
- **Express** - 웹 프레임워크
- **TypeScript** - 타입 안정성
- **Axios** - HTTP 클라이언트
- **Cheerio** - HTML 파싱
- **iconv-lite** - 인코딩 변환 (EUC-KR → UTF-8)

---

## 로컬 개발

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행 (자동 재시작)
pnpm dev

# 테스트 실행
pnpm test

# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

---

## 제한 사항

1. **정적 HTML 크롤링**: 현재 구현은 정적 HTML을 파싱합니다. 실시간 시세는 JavaScript API를 통해 갱신되므로, 정확한 실시간 데이터를 원한다면 Naver의 실시간 API를 사용해야 합니다.

2. **크롤링 안정성**: 웹사이트 구조가 변경되면 크롤러가 동작하지 않을 수 있습니다. 텍스트 앵커링 기법을 사용하여 안정성을 높였지만, 완벽하게 방지할 수는 없습니다.

3. **법적 고려사항**: 네이버 증권의 이용약관을 준수하여 사용하시기 바랍니다. 과도한 요청은 IP 차단의 원인이 될 수 있습니다.

---

## 향후 개선 방향

- [ ] Rate limiting 추가
- [ ] 캐싱 메커니즘 (Redis 등)
- [ ] 실시간 시세 API 통합
- [ ] WebSocket 지원 (실시간 업데이트)
- [ ] API 키 인증
- [ ] Swagger/OpenAPI 문서
- [ ] Docker 컨테이너화
- [ ] 로깅 및 모니터링

---

## 라이센스

MIT

---

## 문의

이슈나 개선 제안은 GitHub Issues를 통해 제출해주세요.
