import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { Link, type DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  useStylesScoped$(STYLES);

  return (
    <main class="camino" aria-label="El camino de la bandola">
      <article class="camino-inner">
        <h1 class="title font-display">El camino</h1>
        <p class="lede">
          Próximamente. El recorrido guiado — afinación, escalas y acordes —
          se está trazando. Mientras tanto, vuelve al cartel y conoce la
          bandola.
        </p>
        <Link href="/" class="back font-display">
          Volver al cartel
        </Link>
      </article>
    </main>
  );
});

export const head: DocumentHead = {
  title: "El camino — La Bandola Llanera",
  meta: [
    {
      name: "description",
      content:
        "El recorrido guiado para aprender bandola llanera estará disponible próximamente.",
    },
  ],
};

const STYLES = `
  .camino {
    min-height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: var(--color-ground);
    color: var(--color-paper);
    padding: var(--space-6);
  }

  .camino-inner {
    width: 100%;
    max-width: 640px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-5);
  }

  .title {
    font-family: var(--font-display);
    font-size: var(--fs-display);
    line-height: 1.05;
    color: var(--color-paper);
    margin: 0;
  }

  .lede {
    font-family: var(--font-body);
    font-size: var(--fs-heritage);
    font-weight: 500;
    color: var(--color-paper);
    margin: 0;
    max-width: 48ch;
  }

  .back {
    display: inline-block;
    margin-top: var(--space-3);
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

  .back:hover,
  .back:focus-visible {
    background: var(--color-accent);
    color: var(--color-ink);
  }
`;
