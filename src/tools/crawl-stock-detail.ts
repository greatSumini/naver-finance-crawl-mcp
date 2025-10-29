import { z } from 'zod';
import { NaverFinanceCrawler } from '../crawlers/naverFinanceCrawler.js';

export const crawlStockDetailTool = {
  name: 'crawl_stock_detail',
  description: 'Crawl detailed information for a specific stock by its 6-digit code. Returns comprehensive data including company info, stock prices, trading volume, and financial metrics.',
  inputSchema: z.object({
    stockCode: z.string().regex(/^\d{6}$/).describe('6-digit stock code (e.g., "005930" for Samsung Electronics)'),
  }),
  handler: async ({ stockCode }: { stockCode: string }) => {
    try {
      const crawler = new NaverFinanceCrawler({
        timeout: 10000,
        retries: 3,
      });

      const url = NaverFinanceCrawler.buildUrl(stockCode);
      const result = await crawler.crawl(url);

      if (!result.data) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Stock not found or failed to crawl',
                stockCode,
                metadata: {
                  url: result.url,
                  statusCode: result.statusCode,
                  timestamp: result.timestamp,
                },
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              stockCode,
              data: result.data,
              metadata: {
                url: result.url,
                statusCode: result.statusCode,
                timestamp: result.timestamp,
              },
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error occurred',
              stockCode,
            }, null, 2),
          },
        ],
      };
    }
  },
};
