# Finance Crawl

A Node.js-based web crawler built with TypeScript, Axios, and Cheerio.

## Features

- **TypeScript Support**: Fully typed with strict mode enabled
- **Modular Architecture**: Extensible base crawler class for custom implementations
- **HTML Parsing**: Cheerio-based HTML parsing with helper utilities
- **HTTP Requests**: Axios-based HTTP client with retry logic
- **Testing**: Vitest with unit, integration, and E2E tests
- **Code Quality**: ESLint and Prettier for code consistency
- **Build System**: TypeScript compilation with declaration files

## Project Structure

```
src/
├── crawlers/           # Crawler implementations
│   ├── baseCrawler.ts  # Base class for all crawlers
│   ├── exampleCrawler.ts # Example crawler implementation
│   └── index.ts
├── utils/              # Utility functions
│   ├── request.ts      # HTTP client with retry logic
│   ├── parser.ts       # HTML parsing helper
│   └── index.ts
├── types/              # TypeScript type definitions
│   └── index.ts
└── index.ts            # Main entry point

tests/
├── unit/               # Unit tests
├── integration/        # Integration tests
└── e2e/                # E2E tests
```

## Installation

```bash
pnpm install
```

## Available Scripts

### Development & Build

```bash
# Type check
pnpm typecheck

# Lint code
pnpm lint
pnpm lint:fix

# Run tests
pnpm test
pnpm test:ui        # UI mode
pnpm test:coverage  # With coverage report

# Build project
pnpm build

# Watch mode
pnpm dev
```

## Usage

### Basic Crawler Example

```typescript
import { ExampleCrawler } from './src/crawlers/exampleCrawler.js';

const crawler = new ExampleCrawler({
  timeout: 10000,
  retries: 3,
});

const result = await crawler.crawl('https://example.com');
console.log(result);
```

### Create Custom Crawler

```typescript
import { BaseCrawler } from './src/crawlers/baseCrawler.js';
import { CrawlResult } from './src/types/index.js';

class MyCrawler extends BaseCrawler {
  async crawl(url: string): Promise<CrawlResult> {
    const html = await this.fetchHtml(url);
    const parser = this.parseHtml(html);

    const data = parser.parseStructure('div.item', {
      title: 'h2',
      price: 'span.price',
    });

    return {
      url,
      data,
      timestamp: new Date(),
      statusCode: 200,
    };
  }
}
```

### HTML Parsing

```typescript
import { HtmlParser } from './src/utils/parser.js';

const html = '<h1>Hello</h1><p>World</p>';
const parser = new HtmlParser(html);

// Get text from elements
const title = parser.getFirstText('h1');
console.log(title); // "Hello"

// Get attributes
const links = parser.getAttributes('a[href]', 'href');

// Parse structured data
const items = parser.parseStructure('div.item', {
  name: 'h2',
  description: 'p',
});
```

## Configuration Files

- **tsconfig.json**: TypeScript compiler options
- **vitest.config.ts**: Vitest test runner configuration
- **.eslintrc.json**: ESLint rules configuration
- **.prettierrc.json**: Prettier formatting rules

## Dependencies

### Production
- `axios`: HTTP client library
- `cheerio`: jQuery-like HTML parsing

### Development
- `typescript`: TypeScript compiler
- `vitest`: Unit testing framework
- `@typescript-eslint/*`: TypeScript linting
- `eslint`: Code linting
- `prettier`: Code formatting
- `tsx`: TypeScript executor

## Testing

The project includes comprehensive tests covering:
- Unit tests for utilities and base classes
- Integration tests for crawler functionality
- E2E tests for complete workflows

Run tests with:
```bash
pnpm test          # Run all tests
pnpm test:ui       # Interactive UI
pnpm test:coverage # With coverage report
```

## License

MIT
