import { z } from 'zod';
import { crawlTopSearchedStocksRobust } from '../crawlers/TopStocksCrawler.js';

export const crawlTopStocksTool = {
  name: 'crawl_top_stocks',
  description: 'Crawl top searched stocks from Naver Finance. Returns a list of the most searched stocks with their codes, names, current prices, and change rates.',
  inputSchema: z.object({}),
  handler: async () => {
    try {
      const topStocks = await crawlTopSearchedStocksRobust();

      if (topStocks.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'No top stocks data found',
                data: [],
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
              count: topStocks.length,
              data: topStocks,
              timestamp: new Date().toISOString(),
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
              data: [],
            }, null, 2),
          },
        ],
      };
    }
  },
};
