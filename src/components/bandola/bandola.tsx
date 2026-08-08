import { component$ } from "@builder.io/qwik";

/**
 * Hand-rendered bandola llanera — inline SVG silhouette in near-black ink.
 * Body on the left, neck and headstock on the right, 4 strings clearly visible.
 * Soundhole and tuning pegs are negative space (ground color shows through),
 * giving the instrument a stencil/woodcut printed feel.
 */
export const Bandola = component$(() => {
  return (
    <svg
      class="bandola-svg"
      viewBox="0 0 820 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Silueta de bandola llanera con cuatro cuerdas y clavijero."
      preserveAspectRatio="xMidYMid meet"
    >
      <title>Bandola llanera</title>
      <desc>
        Ilustración en silueta de una bandola llanera: cuerpo pequeño a la
        izquierda, mástil al centro, clavijero a la derecha con cuatro
        clavijas, boca circular y cuatro cuerdas.
      </desc>

      <defs>
        {/* Reusable strings */}
        <g id="bandola-strings">
          <line x1="302" y1="138" x2="640" y2="138" />
          <line x1="302" y1="158" x2="640" y2="158" />
          <line x1="302" y1="176" x2="640" y2="176" />
          <line x1="302" y1="192" x2="640" y2="192" />
        </g>
      </defs>

      {/* Body — compact, rounded oval shape (small-bodied chordophone). */}
      <path
        d="M 285,85
           C 240,82 190,98 150,124
           C 112,148 82,180 70,212
           C 58,244 70,272 105,284
           C 142,296 188,294 230,286
           C 270,278 296,260 302,236
           C 308,214 308,184 308,154
           C 308,124 304,100 285,85 Z"
        fill="var(--color-ink)"
      />

      {/* Neck — slightly trapezoidal, narrower at the body, wider at the headstock */}
      <path
        d="M 302,138 L 660,120 L 660,200 L 302,192 Z"
        fill="var(--color-ink)"
      />

      {/* Headstock — distinct flat paddle shape, broader than the neck */}
      <path
        d="M 660,92
           L 770,84
           C 788,84 794,94 793,110
           L 793,210
           C 794,226 788,236 770,236
           L 660,228
           C 645,226 640,216 640,200
           L 640,120
           C 640,104 645,94 660,92 Z"
        fill="var(--color-ink)"
      />

      {/* Soundhole — negative space, ground color (terracotta) shows through */}
      <circle
        cx="150"
        cy="198"
        r="32"
        fill="var(--color-ground)"
      />
      <circle
        cx="150"
        cy="198"
        r="32"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="2"
      />

      {/* Bridge — small dark rectangle on the body where strings anchor */}
      <rect
        x="246"
        y="188"
        width="48"
        height="9"
        fill="var(--color-ink)"
      />

      {/* Frets — six thin terracotta lines crossing the neck */}
      <g
        stroke="var(--color-ground)"
        stroke-width="1.6"
        stroke-linecap="round"
      >
        <line x1="365" y1="120" x2="365" y2="210" />
        <line x1="425" y1="120" x2="425" y2="210" />
        <line x1="485" y1="120" x2="485" y2="210" />
        <line x1="540" y1="120" x2="540" y2="210" />
        <line x1="590" y1="120" x2="590" y2="210" />
        <line x1="635" y1="120" x2="635" y2="210" />
      </g>

      {/* Strings — four terracotta lines from bridge to headstock */}
      <g
        stroke="var(--color-ground)"
        stroke-width="1.2"
        stroke-linecap="round"
      >
        <use href="#bandola-strings" />
      </g>

      {/* Nut — at the junction of neck and headstock */}
      <rect
        x="658"
        y="117"
        width="6"
        height="86"
        fill="var(--color-ground)"
      />

      {/* Tuning pegs — four small circles on the headstock */}
      <g>
        <circle cx="710" cy="110" r="9" fill="var(--color-ground)" />
        <circle cx="710" cy="148" r="9" fill="var(--color-ground)" />
        <circle cx="710" cy="186" r="9" fill="var(--color-ground)" />
        <circle cx="710" cy="220" r="9" fill="var(--color-ground)" />
      </g>

      {/* Tailpiece pin at the bottom of the body — small accent */}
      <circle cx="296" cy="262" r="3" fill="var(--color-ground)" />
    </svg>
  );
});
