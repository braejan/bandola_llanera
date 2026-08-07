import { component$ } from '@builder.io/qwik';
import type { ArticleSection } from '~/content/historia';

interface TocProps {
  readonly sections: ReadonlyArray<ArticleSection>;
}

/**
 * Table of contents for an article. One anchor per section, in section order.
 * Anchors use each section's existing id (no schema change).
 *
 * REQ-M-006.
 */
export const Toc = component$<TocProps>((props) => {
  return (
    <nav class="toc" aria-label="Tabla de contenidos">
      <ol>
        {props.sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>{section.title}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
});
