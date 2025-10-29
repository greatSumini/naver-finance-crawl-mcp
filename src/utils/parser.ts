import { CheerioAPI, load } from 'cheerio';

/**
 * HTML 파싱을 수행하는 클래스
 */
export class HtmlParser {
  private $: CheerioAPI;

  constructor(html: string) {
    this.$ = load(html);
  }

  /**
   * CSS 선택자를 사용하여 텍스트 추출
   */
  getText(selector: string): string[] {
    const elements = this.$(selector);
    const texts: string[] = [];

    elements.each((_, element) => {
      const text = this.$(element).text().trim();
      if (text) {
        texts.push(text);
      }
    });

    return texts;
  }

  /**
   * CSS 선택자를 사용하여 속성 값 추출
   */
  getAttributes(selector: string, attribute: string): string[] {
    const elements = this.$(selector);
    const attributes: string[] = [];

    elements.each((_, element) => {
      const attr = this.$(element).attr(attribute);
      if (attr) {
        attributes.push(attr);
      }
    });

    return attributes;
  }

  /**
   * 첫 번째 일치하는 요소의 텍스트 추출
   */
  getFirstText(selector: string): string | null {
    const text = this.$(selector).first().text().trim();
    return text || null;
  }

  /**
   * 첫 번째 일치하는 요소의 속성 값 추출
   */
  getFirstAttribute(selector: string, attribute: string): string | null {
    const attr = this.$(selector).first().attr(attribute);
    return attr || null;
  }

  /**
   * 특정 선택자 내의 모든 하위 요소를 객체로 변환
   */
  parseStructure<T extends Record<string, unknown>>(
    selector: string,
    schema: Record<keyof T, string>,
  ): T[] {
    const results: T[] = [];

    this.$(selector).each((_, element) => {
      const $element = this.$(element);
      const obj: Record<string, unknown> = {};

      for (const [key, cssSelector] of Object.entries(schema)) {
        const text = $element.find(cssSelector).first().text().trim();
        obj[key] = text || null;
      }

      results.push(obj as T);
    });

    return results;
  }

  /**
   * 원본 Cheerio 인스턴스 반환 (고급 사용자용)
   */
  getRawCheerio(): CheerioAPI {
    return this.$;
  }
}
