# Naver Finance Crawl MCP

[![npm version](https://badge.fury.io/js/naver-finance-crawl-mcp.svg)](https://www.npmjs.com/package/naver-finance-crawl-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

MCP (Model Context Protocol) server for crawling Korean stock market data from Naver Finance.

A Node.js-based web crawler built with TypeScript, Axios, and Cheerio, with MCP server support for AI assistants.

## Features

- **crawl-top-stocks**: Fetch the most searched stocks from Naver Finance with real-time data
- **crawl-stock-detail**: Get comprehensive stock information by 6-digit stock code
- **MCP Server Support**: Full integration with AI assistants via Model Context Protocol
- **HTTP & STDIO Transports**: Flexible transport options for different use cases
- **Korean Encoding Support**: Proper handling of Korean characters (EUC-KR)
- **TypeScript Support**: Fully typed with strict mode enabled
- **Modular Architecture**: Extensible base crawler class for custom implementations
- **HTML Parsing**: Cheerio-based HTML parsing with helper utilities
- **HTTP Requests**: Axios-based HTTP client with retry logic
- **Testing**: Vitest with unit, integration, and E2E tests
- **Code Quality**: ESLint and Prettier for code consistency

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

### NPM

```bash
npm install -g naver-finance-crawl-mcp
```

### Smithery

To install Naver Finance Crawl MCP Server for any client automatically via [Smithery](https://smithery.ai):

```bash
npx -y @smithery/cli@latest install naver-finance-crawl-mcp --client <CLIENT_NAME>
```

Available clients: `cursor`, `claude`, `vscode`, `windsurf`, `cline`, `zed`, etc.

**Example for Cursor:**

```bash
npx -y @smithery/cli@latest install naver-finance-crawl-mcp --client cursor
```

This will automatically configure the MCP server in your chosen client.

### Development Setup

```bash
pnpm install
```

## MCP Client Integration

Naver Finance Crawl MCP can be integrated with various AI coding assistants and IDEs that support the Model Context Protocol (MCP).

### Requirements

- Node.js >= v18.0.0
- An MCP-compatible client (Cursor, Claude Code, VS Code, Windsurf, etc.)

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Add the following configuration to your `~/.cursor/mcp.json` file:

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

**With HTTP transport:**

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp", "--transport", "http", "--port", "5000"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command:

```sh
claude mcp add naver-finance -- npx -y naver-finance-crawl-mcp
```

Or with HTTP transport:

```sh
claude mcp add naver-finance -- npx -y naver-finance-crawl-mcp --transport http --port 5000
```

</details>

<details>
<summary><b>Install in VS Code</b></summary>

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

```json
"mcp": {
  "servers": {
    "naver-finance": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file:

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Cline</b></summary>

1. Open **Cline**
2. Click the hamburger menu icon (☰) to enter the **MCP Servers** section
3. Choose **Remote Servers** tab
4. Click the **Edit Configuration** button
5. Add naver-finance to `mcpServers`:

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Open Claude Desktop developer settings and edit your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Zed</b></summary>

Add this to your Zed `settings.json`:

```json
{
  "context_servers": {
    "naver-finance": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file:

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "npx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

<details>
<summary><b>Using with Bun</b></summary>

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "bunx",
      "args": ["-y", "naver-finance-crawl-mcp"]
    }
  }
}
```

</details>

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

# Start MCP server (STDIO transport)
pnpm start

# Start MCP server (HTTP transport)
pnpm start --transport http --port 5000

# Start HTTP REST API server
pnpm start:http
```

## Usage

### Running the MCP Server

**STDIO Transport (default):**

```bash
naver-finance-crawl-mcp
```

**HTTP Transport:**

```bash
naver-finance-crawl-mcp --transport http --port 5000
```

The server provides two MCP tools that can be used by LLMs:
- `crawl_top_stocks`: Fetches the most searched stocks from Naver Finance
- `crawl_stock_detail`: Fetches detailed information for a specific stock by its 6-digit code

### Available Tools

Naver Finance Crawl MCP provides the following tools that can be used by LLMs:

#### crawl_top_stocks

Crawl top searched stocks from Naver Finance. Returns a list of the most searched stocks with their codes, names, current prices, and change rates.

**Parameters:** None

**Example Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "code": "005930",
      "name": "삼성전자",
      "currentPrice": "71,000",
      "changeRate": "+2.50%"
    }
  ],
  "timestamp": "2025-01-29T12:00:00.000Z"
}
```

#### crawl_stock_detail

Crawl detailed information for a specific stock by its 6-digit code. Returns comprehensive data including company info, stock prices, trading volume, and financial metrics.

**Parameters:**
- `stockCode` (string, required): 6-digit stock code (e.g., "005930" for Samsung Electronics)

**Example Request:**
```json
{
  "stockCode": "005930"
}
```

**Example Response:**
```json
{
  "success": true,
  "stockCode": "005930",
  "data": {
    "companyName": "삼성전자",
    "currentPrice": "71,000",
    "changeRate": "+2.50%",
    "tradingVolume": "1,234,567",
    "marketCap": "423조원"
  },
  "metadata": {
    "url": "https://finance.naver.com/item/main.naver?code=005930",
    "statusCode": 200,
    "timestamp": "2025-01-29T12:00:00.000Z"
  }
}
```

### Usage Examples

#### Example 1: Get top searched stocks

**In Cursor/Claude Code:**
```
Get the top searched stocks from Naver Finance
```

**The tool will return:**
- List of most searched stocks
- Stock codes, names, current prices
- Price change rates
- Timestamp of the data

#### Example 2: Get detailed stock information

**In Cursor/Claude Code:**
```
Get detailed information for Samsung Electronics (stock code: 005930)
```

**The tool will return:**
- Company name and stock code
- Current price and change rate
- Trading volume
- Market capitalization
- Additional financial metrics

#### Example 3: Analyze stock trends

**In Cursor/Claude Code:**
```
First, show me the top searched stocks.
Then, fetch detailed information for the top 3 stocks.
Analyze which stocks show the most significant price changes.
```

### Using as a Library

You can also use the crawlers directly in your Node.js applications:

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

## Docker Usage

### Build Docker Image

```bash
docker build -t naver-finance-crawl-mcp .
```

### Run with Docker

**With STDIO transport:**

```bash
docker run -i --rm naver-finance-crawl-mcp
```

**With HTTP transport:**

```bash
docker run -d -p 5000:5000 \
  --name naver-finance \
  naver-finance-crawl-mcp \
  node dist/mcp-server.js --transport http --port 5000
```

### Docker Compose Example

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  naver-finance-crawl-mcp:
    build: .
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - NODE_ENV=production
    command: ["node", "dist/mcp-server.js", "--transport", "http", "--port", "5000"]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/mcp', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

Run with Docker Compose:

```bash
docker-compose up -d
```

### Use Docker Image in MCP Clients

Configure your MCP client to use the Docker container:

```json
{
  "mcpServers": {
    "naver-finance": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "naver-finance-crawl-mcp"
      ]
    }
  }
}
```

## Architecture

The project follows a modular architecture:

- **crawlers/**: Crawler implementations
  - `baseCrawler.ts`: Base class for all crawlers
  - `naverFinanceCrawler.ts`: Naver Finance stock detail crawler
  - `TopStocksCrawler.ts`: Top searched stocks crawler
  - `exampleCrawler.ts`: Example crawler implementation
- **tools/**: MCP tool implementations
  - `crawl-top-stocks.ts`: MCP tool for top stocks
  - `crawl-stock-detail.ts`: MCP tool for stock details
- **utils/**: Utility functions
  - `request.ts`: HTTP client with retry logic
  - `parser.ts`: HTML parsing helpers
- **types/**: TypeScript type definitions
- **mcp-server.ts**: MCP server entry point (STDIO/HTTP)
- **http-server.ts**: REST API server entry point

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

greatsumini

## License

MIT
