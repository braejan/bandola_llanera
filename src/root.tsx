import { component$ } from "@builder.io/qwik";
import { isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

const DIRECTION_CONTRACT = `<!--
THESIS: The landing is a poster — one committed graphic artifact that owns the first viewport the way a Festival del Joropo cartell owns a wall. It refuses the music-app default of "soft cream, oversized pastel instrument, single CTA" by treating the bandola as a printed hero, not a stock photo.

OWN-WORLD: Saturated folk-modern palette (deep terracotta ground, warm marigold accent, near-black bandola silhouette). Wood-type display for the headline. Geometric printed frame around the diapason, not a UI card. Hand-rendered bandola as the hero. Scale switcher as a row of typographic modes — Mayor, Menor, Armónica — set in wood-type, the active one in the dominant ground.

STORY: Visitor arrives, sees a poster, reads the headline, sees the bandola, clicks Toca tu primera cuerda to jump straight to the diapason, switches the scale (first interaction), tries Verificar afinación or Tocar escala to hear the instrument play itself, feels the differentiator, scrolls to the broadsheet footer crediting Witsaba/braejan.

FIRST VIEWPORT: Top to bottom — short wood-type headline; hand-rendered bandola as the hero; primary action Toca tu primera cuerda; interactive diapason (4 strings labeled A3–D4–A4–E5); scale switcher (three wood-type words) with the Verificar afinación and Tocar escala action buttons and a manual-mode hint; one-line heritage copy. No nav, no card grid — a single broadsheet footer colophon closes the composition below the poster.

FORM: Modern joropo festival poster / llanero identity program. Assigned direction (candidate 7). Seed key: bandola-llanera-landing. Mode: persuade.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
-->`;

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        {!isDev && (
          <link
            rel="manifest"
            href={`${import.meta.env.BASE_URL}manifest.json`}
          />
        )}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Rye&display=swap"
        />
        <RouterHead />
      </head>
      <body lang="es">
        <div
          hidden
          aria-hidden="true"
          data-direction-contract="bandola-llanera-landing"
          dangerouslySetInnerHTML={DIRECTION_CONTRACT}
        />
        <RouterOutlet />
      </body>
    </QwikCityProvider>
  );
});
