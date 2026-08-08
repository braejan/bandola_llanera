import { component$, useStylesScoped$ } from "@builder.io/qwik";

/**
 * Footer — broadsheet colophon.
 *
 * A documented exception to DESIGN.md's original "no footer, no
 * second viewport" rule (REQ-landing-footer-6, amended in T-1): a
 * single printed credit band below the poster, crediting Witsaba /
 * braejan. It respects the poster's own grammar — paper background,
 * a single 2px ink border-top (no border on the other sides), square
 * corners, no shadow, no gradient — so it reads as the next line of
 * the same broadsheet, not a separate marketing footer.
 *
 * Static content only: no props, no signals, no click handlers. The
 * only interactive elements are 4 plain external links.
 */
export const Footer = component$(() => {
  useStylesScoped$(STYLES);

  return (
    <footer class="broadsheet-footer" role="contentinfo">
      <p class="footer__credit">
        Creado por <code class="footer__handle">braejan</code> desde los
        llanos de Casanare 🇨🇴 con 💛💙❤️ para estudiantes de la bandola
        llanera
      </p>

      <nav class="footer__links" aria-label="Enlaces del proyecto">
        <a
          href="https://witsaba.com"
          target="_blank"
          rel="noopener"
          aria-label="Sitio de Witsaba"
        >
          Witsaba
        </a>
        <a
          href="https://github.com/braejan"
          target="_blank"
          rel="noopener"
          aria-label="GitHub de Braejan"
          class="footer__icon-link"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0.5C5.6 0.5 0.5 5.6 0.5 12c0 5.1 3.3 9.4 7.9 11 0.6 0.1 0.8-0.3 0.8-0.6 0-0.3 0-1.1 0-2.1-3.2 0.7-3.9-1.5-3.9-1.5-0.5-1.3-1.3-1.7-1.3-1.7-1.1-0.7 0.1-0.7 0.1-0.7 1.2 0.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 0.1-0.8 0.4-1.3 0.7-1.6-2.6-0.3-5.3-1.3-5.3-5.7 0-1.3 0.5-2.3 1.2-3.1-0.1-0.3-0.5-1.5 0.1-3.1 0 0 1-0.3 3.3 1.2 1-0.3 2-0.4 3-0.4s2 0.1 3 0.4c2.3-1.5 3.3-1.2 3.3-1.2 0.7 1.6 0.2 2.8 0.1 3.1 0.8 0.8 1.2 1.9 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7 0.4 0.4 0.8 1.1 0.8 2.2 0 1.6 0 2.9 0 3.3 0 0.3 0.2 0.7 0.8 0.6 4.6-1.5 7.9-5.9 7.9-11C23.5 5.6 18.4 0.5 12 0.5z" />
          </svg>
        </a>
        <a
          href="https://linkedin.com/in/braejan"
          target="_blank"
          rel="noopener"
          aria-label="LinkedIn de Braejan"
          class="footer__icon-link"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M20.4 20.4h-3.6v-5.6c0-1.4 0-3.1-1.9-3.1-1.9 0-2.2 1.5-2.2 3v5.7H9.1V9h3.5v1.6h0.1c0.5-0.9 1.7-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.2zM5.3 7.4c-1.1 0-2-0.9-2-2s0.9-2 2-2 2 0.9 2 2-0.9 2-2 2zM7.1 20.4H3.5V9h3.6v11.4zM22.2 0H1.8C0.8 0 0 0.8 0 1.8v20.4C0 23.2 0.8 24 1.8 24h20.4c1 0 1.8-0.8 1.8-1.8V1.8C24 0.8 23.2 0 22.2 0z" />
          </svg>
        </a>
        <a
          href="https://github.com/braejan/bandola_llanera"
          target="_blank"
          rel="noopener"
          aria-label="Código fuente en GitHub"
        >
          Código fuente
        </a>
      </nav>

      <p class="footer__copyright">© 2026 Witsaba</p>
    </footer>
  );
});

const STYLES = `
  .broadsheet-footer {
    width: 100%;
    box-sizing: border-box;
    background: var(--color-paper);
    color: var(--color-ink);
    border-top: 2px solid var(--color-ink);
    border-left: none;
    border-right: none;
    border-bottom: none;
    border-radius: 0;
    box-shadow: none;
    background-image: none;
    padding: var(--space-5) var(--space-4);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .footer__credit {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-heritage);
    font-weight: 500;
    color: var(--color-ink-on-paper);
    flex: 1 1 auto;
    min-width: 220px;
  }

  .footer__handle {
    font-family: ui-monospace, "SFMono-Regular", "Menlo", "Consolas", monospace;
    font-size: 0.92em;
  }

  .footer__links {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .footer__links a {
    display: inline-flex;
    align-items: center;
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.04em;
    transition: color var(--motion-fast) var(--ease-printed);
  }

  .footer__links a:hover,
  .footer__links a:focus-visible {
    color: var(--color-ground);
  }

  .footer__icon-link svg {
    display: block;
  }

  .footer__copyright {
    margin: 0;
    font-family: var(--font-body);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-ink-tint);
    text-align: right;
  }

  @media (prefers-reduced-motion: reduce) {
    .footer__links a {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    .broadsheet-footer {
      flex-direction: column;
      align-items: stretch;
      text-align: center;
      padding: var(--space-3) var(--space-2);
    }
    .footer__credit {
      text-align: center;
      min-width: 0;
    }
    .footer__links {
      justify-content: center;
      flex-wrap: wrap;
    }
    .footer__copyright {
      text-align: center;
    }
  }
`;
