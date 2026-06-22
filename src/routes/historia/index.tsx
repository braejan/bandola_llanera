import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { historiaArticle } from '~/content/historia';
import styles from './historia.module.css';

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <article class="article" data-testid="historia-article">
      <header class="header">
        <h1 data-testid="historia-h1">{historiaArticle.title}</h1>
        <p class="subtitle">{historiaArticle.subtitle}</p>
      </header>

      {historiaArticle.sections.map((section) => (
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
                <p key={i} style={{ fontSize: '0.88rem', fontStyle: 'italic' }}>
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

export const head: DocumentHead = {
  title: 'Historia — Bandola Llanera',
  meta: [
    {
      name: 'description',
      content: 'Historia de la bandola llanera ancestral y tradicional.',
    },
  ],
};
