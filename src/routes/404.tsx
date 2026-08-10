/**
 * 404 — extends the established Festival del Joropo Cartell system
 * exactly (terracotta ground, Rye display, IBM Plex body, 2px ink
 * printed-frame, no shadows/gradients/radius, no new tokens). Narrow,
 * precisely-specified request — an extension of the existing poster
 * surface, not a new visual world (impeccable/new-work.md §3), so no
 * concept-seed roll.
 *
 * The bandola shows the damage instead of a generic tech error
 * screen: one string snapped, a paper correction slip pasted over it
 * (via `<Bandola brokenString />` — see that component for why this
 * is a prop on the shared SVG rather than a stacked overlay). The
 * visitor sees the same trusted instrument, notices it's broken,
 * reads why in one line, and returns to the cartel in one click.
 *
 * Qwik City's file-based convention (`src/routes/404.tsx`) inherits
 * `layout.tsx` (StudentMenu stays visible) and is statically emitted
 * as `404.html` at build time.
 */
import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";
import { Bandola } from "../components/bandola/bandola";
import { Footer } from "../components/footer/footer";

export default component$(() => {
  useStylesScoped$(STYLES);

  return (
    <>
      <main class="not-found" aria-label="Página no encontrada">
        <article class="not-found-inner">
          <h1 class="not-found__code font-display">404</h1>

          <p class="not-found__lede">
            Se rompió una cuerda en el camino.
            <br />
            La página que buscas no existe — vuelve al cartel y sigue
            aprendiendo.
          </p>

          <figure class="bandola-wrap" aria-hidden="false">
            <Bandola brokenString />
            <figcaption class="bandola-caption">
              Tres cuerdas. La cuarta, perdida.
            </figcaption>
          </figure>

          <Link href="/" class="cta font-display" data-testid="cta-home">
            Volver al cartel
          </Link>
        </article>
      </main>

      <Footer />
    </>
  );
});

export const head: DocumentHead = {
  title: "Página no encontrada — La Bandola Llanera",
  meta: [
    {
      name: "description",
      content:
        "La página que buscas no existe. Vuelve al cartel de la bandola llanera y sigue aprendiendo afinación, escalas y acordes.",
    },
    {
      name: "robots",
      content: "noindex",
    },
  ],
};

const STYLES = `
  .not-found {
    min-height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-ground);
    color: var(--color-paper);
    padding: clamp(var(--space-3), 2vw, var(--space-6));
    box-sizing: border-box;
  }

  .not-found-inner {
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-4);
  }

  .not-found__code {
    font-family: var(--font-display);
    font-size: var(--fs-display);
    line-height: 1.05;
    margin: 0;
    color: var(--color-paper);
    letter-spacing: 0.01em;
  }

  .not-found__lede {
    font-family: var(--font-body);
    font-size: var(--fs-heritage);
    font-weight: 500;
    color: var(--color-paper);
    text-align: center;
    margin: 0;
    max-width: 48ch;
  }

  .bandola-wrap {
    width: 100%;
    max-width: 460px;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .bandola-wrap :global(.bandola-svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .bandola-caption {
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    color: var(--color-paper);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-align: center;
    margin: 0;
  }

  .cta {
    display: inline-block;
    font-family: var(--font-display);
    font-size: var(--fs-cta);
    color: var(--color-ground);
    background: var(--color-paper);
    padding: var(--space-3) var(--space-6);
    border: var(--frame-border);
    letter-spacing: 0.02em;
    transition:
      background-color var(--motion-fast) var(--ease-printed),
      color var(--motion-fast) var(--ease-printed);
  }

  .cta:hover,
  .cta:focus-visible {
    background: var(--color-accent);
    color: var(--color-ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .cta {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .not-found {
      padding: var(--space-3) var(--space-2);
    }
    .not-found-inner {
      gap: var(--space-3);
    }
  }
`;
