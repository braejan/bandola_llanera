import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

import { Bandola } from "../components/bandola/bandola";
import { ScaleSwitcher } from "../components/scale-switcher/scale-switcher";
import { Footer } from "../components/footer/footer";

export default component$(() => {
  useStylesScoped$(STYLES);

  return (
    <>
      <main class="poster" aria-label="Cartel de la Bandola Llanera">
        <article class="poster-inner">
          <header class="poster-header">
            <h1 class="headline font-display">La Bandola Llanera</h1>
          </header>

          <figure class="bandola-wrap" aria-hidden="false">
            <Bandola />
            <figcaption class="bandola-caption">
              Cuatro cuerdas. Afinación A3 – D4 – A4 – E5.
            </figcaption>
          </figure>

          <Link
            href="#diapason"
            class="cta cta--top font-display"
            data-testid="cta-top"
          >
            Toca tu primera cuerda
          </Link>

          <ScaleSwitcher />

          <p class="heritage">
            La bandola, instrumento del folclore llanero de Colombia y
            Venezuela.
          </p>
        </article>
      </main>

      <Footer />
    </>
  );
});

export const head: DocumentHead = {
  title: "La Bandola Llanera — aprende el instrumento ancestral del Llano",
  meta: [
    {
      name: "description",
      content:
        "Toca tu primera cuerda — aprende bandola llanera con la afinación A3 – D4 – A4 – E5, escalas mayor, menor y armónica, y un diapason interactivo.",
    },
    {
      name: "theme-color",
      content: "#b7410e",
    },
  ],
};

const STYLES = `
  .poster {
    /* The poster is the page. At least one screen tall, but allows
       scrolling when the content (header, bandola, scale switcher,
       scale reference, diapason, CTA, heritage) is taller than the
       viewport. The original "no scroll past the fold" principle
       from DESIGN.md holds for the LANDING; the new scale system
       + 12-tone key selector + scale reference made the content
       exceed one viewport on smaller screens. Scrolling is the
       honest fix. */
    min-height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    background: var(--color-ground);
    color: var(--color-paper);
    padding: clamp(var(--space-2), 1vw, var(--space-3));
    box-sizing: border-box;
  }

  .poster-inner {
    width: 100%;
    max-width: 960px;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: clamp(var(--space-2), 1.2vw, var(--space-3));
    padding-bottom: var(--space-4);
  }

  .poster-header {
    text-align: center;
    width: 100%;
  }

  .headline {
    font-family: var(--font-display);
    font-size: var(--fs-display);
    line-height: 1.05;
    margin: 0;
    color: var(--color-paper);
    letter-spacing: 0.01em;
  }

  .bandola-wrap {
    width: 100%;
    max-width: 600px;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .bandola-svg {
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

  /* The CTA — Toca tu primera cuerda. Same CTA scale as before
     (Rye, clamp(1.25rem, 1.2vw + 0.5rem, 1.85rem) via --fs-cta, paper
     bg, ink border, no shadow, no radius) — only the copy, target,
     and position moved: it now sits between the bandola figure and
     the ScaleSwitcher so it is visible in the first viewport and
     names the concrete first move (REQ-landing-cta-1..3). */
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
      background-color 200ms ease-out,
      color 200ms ease-out;
  }

  .cta--top {
    margin-top: var(--space-3);
  }

  .cta:hover,
  .cta:focus-visible {
    background: var(--color-accent);
    color: var(--color-ink);
  }

  .heritage {
    font-family: var(--font-body);
    font-size: var(--fs-heritage);
    color: var(--color-paper);
    text-align: center;
    margin: 0;
    max-width: 56ch;
    font-weight: 500;
  }

  /* Narrow viewports: the poster stacks the same way, but breathes. */
  @media (max-width: 640px) {
    .poster {
      padding: var(--space-3) var(--space-2);
    }
    .poster-inner {
      gap: var(--space-3);
    }
    .bandola-caption {
      letter-spacing: 0.05em;
    }
  }
`;
