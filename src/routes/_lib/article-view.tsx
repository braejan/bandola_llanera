import { component$ } from '@builder.io/qwik';
import type { Article } from '~/content/historia';

/**
 * Generic, data-driven article renderer. Extracts the section/callout/footnote/
 * source logic from `src/routes/historia/index.tsx` so it can be reused for
 * `/historia/`, `/afinacion/`, and any future typed article.
 *
 * INV-1: the Article interface stays typed `ReadonlyArray<Paragraph>` with the
 *        Source allowlist, so the renderer doesn't need to know about specific
 *        articles or URLs.
 * REQ-M-006 / REQ-M-007.
 */
export const ArticleView = component$<{ readonly article: Article }>((props) => {
  const a = props.article;
  return (
    <article class="article" data-testid="historia-article">
      <header class="header">
        <h1 data-testid="historia-h1">{a.title}</h1>
        <p class="subtitle">{a.subtitle}</p>
      </header>

      {a.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          class="section"
          data-testid={`historia-section-${section.id}`}
        >
          <h2>{section.title}</h2>

          {section.body.map((para, idx) => {
            if (para.kind === 'p') {
              return <p key={idx}>{para.text}</p>;
            }
            return (
              <p key={idx}>
                <em>{para.text}</em>
              </p>
            );
          })}

          {section.porConfirmar.length > 0 && (
            <aside class="callout" aria-label="Por confirmar" data-testid="callout">
              <strong>Por confirmar:</strong>
              <ul>
                {section.porConfirmar.map((c, i) => (
                  <li key={i}>{c.text}</li>
                ))}
              </ul>
            </aside>
          )}

          {section.footnotes && section.footnotes.length > 0 && (
            <div class="footnotes-section" data-testid="footnotes">
              {section.footnotes.map((note, i) => (
                <p key={i} class="footnote">
                  <sup>[{i + 1}]</sup> {note}
                </p>
              ))}
            </div>
          )}

          <p class="source" data-testid="source">
            Fuente:{' '}
            <a href={section.source.url} target="_blank" rel="noreferrer noopener">
              {section.source.label}
            </a>
          </p>
        </section>
      ))}
    </article>
  );
});
