import { describe, it, expect } from 'vitest';
import { HtmlParser } from '../../src/utils/parser.js';

describe('HtmlParser', () => {
  const sampleHtml = `
    <html>
      <body>
        <div class="item">
          <h1>Title 1</h1>
          <a href="https://example.com">Link 1</a>
        </div>
        <div class="item">
          <h1>Title 2</h1>
          <a href="https://example.org">Link 2</a>
        </div>
      </body>
    </html>
  `;

  it('should extract text from elements', () => {
    const parser = new HtmlParser(sampleHtml);
    const titles = parser.getText('h1');

    expect(titles).toEqual(['Title 1', 'Title 2']);
  });

  it('should extract attributes from elements', () => {
    const parser = new HtmlParser(sampleHtml);
    const links = parser.getAttributes('a', 'href');

    expect(links).toEqual(['https://example.com', 'https://example.org']);
  });

  it('should get first text element', () => {
    const parser = new HtmlParser(sampleHtml);
    const firstTitle = parser.getFirstText('h1');

    expect(firstTitle).toBe('Title 1');
  });

  it('should get first attribute', () => {
    const parser = new HtmlParser(sampleHtml);
    const firstLink = parser.getFirstAttribute('a', 'href');

    expect(firstLink).toBe('https://example.com');
  });

  it('should parse structure correctly', () => {
    const parser = new HtmlParser(sampleHtml);
    const items = parser.parseStructure('div.item', {
      title: 'h1',
      link: 'a',
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      title: 'Title 1',
      link: 'Link 1',
    });
    expect(items[1]).toEqual({
      title: 'Title 2',
      link: 'Link 2',
    });
  });

  it('should return empty array for non-existent selectors', () => {
    const parser = new HtmlParser(sampleHtml);
    const results = parser.getText('.non-existent');

    expect(results).toEqual([]);
  });

  it('should return null for non-existent first element', () => {
    const parser = new HtmlParser(sampleHtml);
    const result = parser.getFirstText('.non-existent');

    expect(result).toBeNull();
  });
});
