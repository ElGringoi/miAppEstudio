import { describe, expect, it } from 'vitest';
import { inlineMd, renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('escapa el HTML antes de formatear (se usa con dangerouslySetInnerHTML)', () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;script&gt;');
  });

  it('negrita, cursiva y código', () => {
    expect(inlineMd('**a** _b_ `c`')).toBe('<strong>a</strong> <em>b</em> <code style="background:rgba(0,0,0,0.12);border-radius:3px;padding:1px 5px;font-family:monospace;font-size:0.87em">c</code>');
  });

  it('listas y títulos', () => {
    const html = renderMarkdown('# Título\n- uno\n- dos');
    expect(html).toContain('<h1');
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html.endsWith('</ul>')).toBe(true);
  });
});
