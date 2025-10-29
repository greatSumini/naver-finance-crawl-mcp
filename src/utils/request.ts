import axios, { AxiosInstance } from 'axios';
import { CrawlerOptions, HttpResponse } from '../types/index.js';

/**
 * HTTP 요청을 수행하는 클래스
 */
export class HttpClient {
  private client: AxiosInstance;
  private retries: number;

  constructor(options: CrawlerOptions = {}) {
    this.retries = options.retries || 3;
    this.client = axios.create({
      timeout: options.timeout || 10000,
      headers: options.headers || {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
  }

  /**
   * GET 요청 수행
   */
  async get(url: string): Promise<HttpResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await this.client.get(url);
        return {
          status: response.status,
          data: response.data,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error(`Failed to fetch ${url}`);
  }

  /**
   * POST 요청 수행
   */
  async post(url: string, data: unknown): Promise<HttpResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await this.client.post(url, data);
        return {
          status: response.status,
          data: response.data,
          headers: response.headers,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.retries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error(`Failed to post to ${url}`);
  }

  /**
   * 지연 시간을 설정합니다 (밀리초)
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
