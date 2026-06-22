import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { historiaArticle } from '~/content/historia';

export default component$(() => {
  return (
    <article>
      <header>
        <h1>{historiaArticle.title}</h1>
        <p style={{ fontStyle: 'italic', color: 'var(--color-muted)' }}>
          {historiaArticle.subtitle}
        </p>
      </header>

      {historiaArticle.sections.map((section) => (
        <section key={section.id} id={section.id} style={{ marginTop: 'var(--space-5)' }}>
          <h2>{section.title}</h2>
          {section.body.map((para, idx) => {
            if (para.kind === 'p') {
              return <p key={idx}>{para.text}</p>;
            }
            if (para.kind === 'em') {
              return (
                <p key={idx}>
                  <em>{para.text}</em>
                </p>
              );
            }
            // footnote ref in body
            return (
              <p key={idx}>
                <sup>[{para.ref}]</sup>
              </p>
            );
          })}

          {section.porConfirmar.length > 0 && (
            <aside
              style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                background: 'rgba(139, 111, 63, 0.08)',
                borderLeft: '3px solid var(--color-por-confirmar)',
                fontSize: '0.9rem',
              }}
              aria-label="Por confirmar"
            >
              <strong>Por confirmar:</strong>
              <ul>
                {section.porConfirmar.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </aside>
          )}

          <p style={{ fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
            Fuente:{' '}
            <a href={section.source.url} target="_blank" rel="noreferrer noopener">
              {section.source.label}
            </a>
          </p>
        </section>
      ))}

      {historiaArticle.footnotes.length > 0 && (
        <footer style={{ marginTop: 'var(--space-6)' }}>
          <h3>Notas</h3>
          <ol>
            {historiaArticle.footnotes.map((note, i) => (
              <li key={i} id={`footnote-${i + 1}`}>
                {note}
              </li>
            ))}
          </ol>
        </footer>
      )}
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
