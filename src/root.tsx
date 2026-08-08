import { component$ } from "@builder.io/qwik";
import { isDev } from "@builder.io/qwik";
import { QwikCityProvider, RouterOutlet } from "@builder.io/qwik-city";
import { RouterHead } from "./components/router-head/router-head";

import "./global.css";

const DIRECTION_CONTRACT = `<!--
THESIS: The landing is a poster — one committed graphic artifact that owns the first viewport the way a Festival del Joropo cartell owns a wall. It refuses the music-app default of "soft cream, oversized pastel instrument, single CTA" by treating the bandola as a printed hero, not a stock photo.

OWN-WORLD: Saturated folk-modern palette (deep terracotta ground, warm marigold accent, near-black bandola silhouette). Wood-type display for the headline. Geometric printed frame around the diapason, not a UI card. Hand-rendered bandola as the hero. Scale switcher as a row of typographic modes — Mayor, Menor, Armónica — set in wood-type, the active one in the dominant ground.

STORY: Visitor arrives, sees a poster, reads the headline, sees the bandola, sees the diapason, switches the scale (first interaction), feels the differentiator, clicks Empezar el camino, enters the guided path.

FIRST VIEWPORT: Top to bottom — short wood-type headline; hand-rendered bandola as the hero; interactive diapason (4 strings labeled A3–D4–A4–E5); scale switcher (three wood-type words); primary action Empezar el camino; one-line heritage copy. No nav, no footer, no cards. The poster is the page.

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
