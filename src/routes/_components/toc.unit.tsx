import { describe, it, expect } from 'vitest';
import { renderToString } from '@builder.io/qwik/server';
import { JSDOM } from 'jsdom';
import { historiaArticle } from '~/content/historia';

// Helper: render <Toc> with the provided sections for SSR + JSDOM assertions.
async function renderToc(sections: typeof historiaArticle.sections): Promise<Document> {
  const { Toc } = await import('./toc');
  const result = await renderToString(<Toc sections={sections} />, {
    containerTagName: 'div',
  });
  const dom = new JSDOM(result.html);
  return dom.window.document;
}

describe('Toc component (REQ-M-006)', () => {
  it('renders exactly N anchors (one per section)', async () => {
    const doc = await renderToc(historiaArticle.sections);
    const anchors = doc.querySelectorAll('a');
    expect(anchors).toHaveLength(historiaArticle.sections.length);
  });

  it('each anchor href equals "#{section.id}"', async () => {
    const doc = await renderToc(historiaArticle.sections);
    const anchors = doc.querySelectorAll('a');
    for (let i = 0; i < anchors.length; i++) {
      const expected = `#${historiaArticle.sections[i]!.id}`;
      expect(anchors[i]?.getAttribute('href')).toBe(expected);
    }
  });

  it('each anchor text equals section.title', async () => {
    const doc = await renderToc(historiaArticle.sections);
    const anchors = doc.querySelectorAll('a');
    for (let i = 0; i < anchors.length; i++) {
      expect(anchors[i]?.textContent?.trim()).toBe(
        historiaArticle.sections[i]!.title,
      );
    }
  });

  it('renders a <nav> (or role=navigation) landmark', async () => {
    const doc = await renderToc(historiaArticle.sections);
    // Either <nav> or any element with role="navigation" counts.
    const nav = doc.querySelector('nav, [role="navigation"]');
    expect(nav).not.toBeNull();
  });

  it('preserves the order of sections', async () => {
    const doc = await renderToc(historiaArticle.sections);
    const anchors = doc.querySelectorAll('a');
    const titles = Array.from(anchors).map((a) => a.textContent?.trim());
    expect(titles).toEqual(historiaArticle.sections.map((s) => s.title));
  });
});
