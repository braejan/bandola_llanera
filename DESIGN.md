---
name: Bandola Llanera
description: Web para aprender la bandola llanera ancestral.
colors:
  ground: "#b7410e"
  accent: "#e8a33d"
  ink: "#1a1410"
  paper: "#f5ebd8"
  paper-tint: "#efe1c6"
  ink-tint: "#4a3d34"
  ink-on-paper: "#2b211a"
  digitation: "#c0392b"
typography:
  display:
    fontFamily: "Rye, Alfa Slab One, Georgia, serif"
    fontSize: "clamp(1.85rem, 2.4vw + 0.6rem, 3rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "0.01em"
  body:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
  mode:
    fontFamily: "Rye, Alfa Slab One, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.6vw + 0.7rem, 2.25rem)"
    fontWeight: 400
  cta:
    fontFamily: "Rye, Alfa Slab One, Georgia, serif"
    fontSize: "clamp(1.25rem, 1.2vw + 0.5rem, 1.85rem)"
    fontWeight: 400
  label:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    letterSpacing: "0.08em"
  note:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
  heritage:
    fontFamily: "IBM Plex Sans, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(0.85rem, 0.4vw + 0.65rem, 1.05rem)"
    fontWeight: 500
rounded:
  focus: "2px"
spacing:
  s1: "0.25rem"
  s2: "0.5rem"
  s3: "0.75rem"
  s4: "1rem"
  s5: "1.5rem"
  s6: "2rem"
  s7: "3rem"
  s8: "4rem"
  s9: "5rem"
  s10: "6rem"
components:
  cta-primary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ground}"
    typography: "{typography.cta}"
    padding: "0.75rem 2rem"
  cta-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
  audio-toggle:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    padding: "0.5rem 0.75rem"
  audio-toggle-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  mode-button-active:
    textColor: "{colors.ground}"
---

# Design System: Bandola Llanera

## Overview

**Creative North Star: "The Festival del Joropo Cartell"**

A llanero festival poster is not a UI; it is a printed field that owns the wall it hangs on. This system carries that grammar onto the web: every surface is a committed graphic artifact, not a collection of cards. The landing is a single poster — one viewport, top to bottom, no nav, no footer, no second scroll. The visitor does not browse; they arrive, see the bandola, touch the diapason, and follow the printed path to the next step.

The palette is saturated folk-modern, not muted editorial: a deep terracotta ground, a warm marigold accent, a near-black silhouette, and an off-white paper. Wood-type display carries the voice; a workhorse sans carries the body. The bandola is hand-rendered as a flat woodcut, not a photograph. The diapason is a real fretboard with the canonical A3–D4–A4–E5 tuning and the real mayor, menor, and armónica scale notes — the differentiator is the instrument itself, demonstrated on the first viewport, not described in a feature card.

**Key Characteristics:**
- A poster is a page, not a hero. One viewport, one composition, no scroll past the fold.
- The bandola is a woodcut silhouette, not a stock photo. Authored as inline SVG, not imported.
- The diapason is the proof. It is interactive on the first viewport, with switchable scales.
- The scale switcher is typography, not a control. Three wood-type words, the active one in the dominant ground.
- The audio is a labeled placeholder. No fabricated recordings until real audio exists.
- Spanish throughout. No English copy on any surface.
- The student menu is the printed header of the broadsheet — a flat Rye/IBM Plex strip listing Inicio / Joropo / Camino. It is the student's stable way back; it does not become a chrome layer that competes with the poster.

## Colors

A four-color saturated folk-modern palette. The terracotta is the poster's ground; the marigold is the only warm accent; the near-black is the silhouette and the printed lines; the off-white is the paper that hosts interactive elements.

### Primary
- **Terracotta Ground** (`#b7410e`): The dominant background of every surface. Owns the wall, the way a Festival del Joropo cartell owns its wall. Used for `html` background, the page ground, the active scale word, and the CTA text on paper.

### Secondary
- **Warm Marigold** (`#e8a33d`): The single warm accent on the poster. Marks scale notes on the fretboard (the cell highlight), the tonic dot inside the tonic cell, and the CTA hover background. Used sparingly — it earns attention by being the only warm field on the page.

### Functional (not decorative)
- **Digitation Red** (`#c0392b`): The fifth color, functional only. Marks the scale circles on the strings and the fingering numerals in the diapason. Never used decoratively, never on the poster ground, never as a surface fill. It exists to carry "where to play" and "which finger."
- **Open-String Blue** (`#245a8f`): A sixth functional color, scoped ONLY to `ChordFretboard`'s chord-tone circle when it sits on fret 0 (an open string, played "al aire" — not fretted). Marks "natural, not digited" as a different signal from a fretted chord tone (marigold), never the reverse. Never used decoratively, never on the poster ground, never as a surface fill, never inside the diapason (which differentiates its own open strings with a text label, not a circle).

### Neutral
- **Near-Black Ink** (`#1a1410`): The bandola silhouette, the printed frame borders, the fret wires, the string lines, the tuning pegs, the headstock, the body fill, the text on paper, and the borders of every container. The structural color.
- **Off-White Paper** (`#f5ebd8`): The interior of the diapason frame, the controls frame that hosts the scale switcher, the CTA background, and the audio toggle background. Where interactive elements live; the quiet field that makes the terracotta sing. Also the note-label color on the red digitation circle (light on red for legibility).
- **Paper Tint** (`#efe1c6`): A dimmed paper, reserved for secondary text on paper surfaces when a less-prominent label is needed.
- **Ink Tint** (`#4a3d34`): A dimmed ink, used for fret numbers and non-scale note labels on the paper fretboard.
- **Ink on Paper** (`#2b211a`): A slightly lifted ink for body text on paper when full ink is too heavy.

### Named Rules
**The Four Poster Colors + Functional Digitation.** The four poster colors (terracotta, marigold, ink, paper) carry the surface. Digitation red is a functional fifth color, used only for the digitation markers (scale circles on the strings, fingering numerals) inside the diapason. Open-string blue is a functional sixth color, used only for `ChordFretboard`'s fret-0 chord-tone circle. Neither ever decorates a surface, never replaces a poster color, and never appears outside its one named context.

**The Active-Ink Rule.** The active scale word renders in the ground color (terracotta), not in a new color. The active state is the page speaking, not a control changing.

## Typography

**Display Font:** Rye (with Alfa Slab One and Georgia as fallbacks)
**Body Font:** IBM Plex Sans (with Helvetica Neue and Arial as fallbacks)

**Character:** Rye is a wood-type display face — heavy, slabby, with the character of a 19th-century poster. It carries the voice. IBM Plex Sans is a workhorse sans with humanist warmth; it carries the body and the labels without competing for attention. The pairing is poster-plus-broadsheet: the display shouts the offer, the body explains it.

### Hierarchy
- **Display** (Rye 400, `clamp(1.85rem, 2.4vw + 0.6rem, 3rem)`, line-height 1.05): The headline. One per surface. Set in the dominant voice.
- **Mode** (Rye 400, `clamp(1.5rem, 1.6vw + 0.7rem, 2.25rem)`): The three scale words (Mayor / Menor / Armónica). Set as the switcher, the active one in the ground color.
- **CTA** (Rye 400, `clamp(1.25rem, 1.2vw + 0.5rem, 1.85rem)`): The primary action. Set in the same display face, on paper, with an ink border.
- **Body** (IBM Plex Sans 500, 16px, line-height 1.5): Heritage lines, lede paragraphs. Max measure ~56ch.
- **Label** (IBM Plex Sans 500, 0.8125rem, letter-spacing 0.08em, uppercase): Captions, the audio toggle, fret numbers. Set in uppercase with wide tracking, the way a printed caption sits beneath an image.
- **Note** (IBM Plex Sans 600, 0.875rem): Fret note labels (A, B, C♯, etc.) on the diapason. The note glyphs are the only typographic element that uses Unicode accidentals (♯); the rest of the system is straight ASCII.
- **Heritage** (IBM Plex Sans 500, `clamp(0.85rem, 0.4vw + 0.65rem, 1.05rem)`): The one-line heritage copy beneath the CTA. The quietest text on the page; it honors the llanero origin without becoming a caption.

### Named Rules
**The Wood-Type Voice Rule.** Rye (or Alfa Slab One as a fallback) is the display face. No system display faces (Impact, Arial Black, platform sans) as the display voice — they read as system, not as a poster.

**The Body Stays Workhorse Rule.** IBM Plex Sans (or any humanist workhorse) carries the body, labels, and notes. The display does not bleed into the body. Rye is for the headline, the mode words, and the CTA — never for body copy.

## Layout

A single column, poster-style. The poster is the page: one viewport (`height: 100vh`, `overflow: hidden`), centered, with a max width of 960px. No sidebar. No grid of cards. No second scroll.

Vertical rhythm, top to bottom:
1. Headline (centered, wood-type display).
2. Bandola hero (centered, max-width 680px).
3. Caption (centered, small uppercase label).
4. Diapason (full width of the poster inner, paper field with ink border).
5. Scale switcher + audio toggle (controls frame, paper field, centered).
6. CTA (centered, paper block with ink border).
7. Heritage line (centered, max-width 56ch).

The spacing scale is a 0.25rem base, stepping to 6rem for the largest gaps. The poster's internal gap is `clamp(0.5rem, 1.2vw, 0.75rem)`, tighter than the outer padding to keep the composition compact.

**Responsive.** At ≤640px, the controls column-stack (modes vertical, audio below), the diapason scales down with tighter cell aspect ratio, the bandola scales to viewport width, and the wood-type headline scales down via `clamp()`. The single-column topology holds at every breakpoint.

## Elevation & Depth

**No shadows.** This system is flat and printed. Depth is conveyed by the ink-on-paper relationship: a 2px ink border marks a field as a printed frame, not a card; the terracotta-on-paper relationship marks active states. There is no `box-shadow` anywhere — no ambient glow, no lifted surface, no soft drop.

The 2px ink border is the only depth device. It reads as a printed frame, not as a UI chrome.

### Named Rules
**The Flat-Printed Rule.** Surfaces are flat at rest. The 2px ink border is structural, not decorative. If a future surface needs to convey hierarchy, it does so with the ink-on-paper relationship, not with a shadow.

## Shapes

**No rounded corners.** The world is printed. Corners are square. The only `border-radius` in the system is `2px` on the focus-visible outline (a small concession to legibility, not a shape language).

The recurring form is the **printed frame**: a 2px solid ink border with a small inset padding (4–6px), hosting a paper-toned interior. The diapason, the controls frame, the CTA, and the audio toggle all use this frame. The frame is the shape.

The bandola's own form is a hand-rendered woodcut — a teardrop body, a rectangular neck, a flat paddle headstock. Future illustrations in this world are authored as inline SVG in the same flat woodcut style; no gradients, no shadows, no stock geometry.

## Components

### Poster (the page)
- **Shape:** square corners, no radius. 2px ink border is not used on the poster itself; the poster is the ground.
- **Background:** terracotta (`--color-ground`).
- **Layout:** single column, top to bottom, one viewport, no scroll.
- **Responsive:** stacks vertically on mobile, headline scales down, bandola and diapason scale to viewport width.

### Bandola (hero illustration)
- **Shape:** hand-rendered inline SVG. Teardrop body, rectangular neck, flat paddle headstock, four strings, six frets, four tuning pegs, circular soundhole as negative space.
- **Fill:** solid near-black (`--color-ink`). Frets, strings, and tuning pegs are terracotta (the ground shows through).
- **Caption:** "CUATRO CUERDAS. AFINACIÓN A3 – D4 – G4 – B4." in the label style.

### Diapason (interactive fretboard)
- **Frame:** 2px ink border, 6px inset, paper background.
- **Rendered as a real instrument neck, not a grid of boxed cells.** The fretboard is a continuous paper surface. The trastes (frets) are the vertical separators — thin ink lines drawn as the right borders of the fret cells (every fret cell except the last). The nut is the left border of the headstock. No rectangular cell fills, no individual cell borders.
- **Orientation:** horizontal neck, headstock at the right end (aligned with the headstock of the bandola image above), body end (high frets) at the left. Fret columns read 7→0 left to right. String rows read A3 (top) → D4 → A4 → E5 (bottom) — the conventional tablature order, low to high top to bottom.
- **Strings (real-size simulation):** each string is a horizontal line drawn on top of the fretboard, with its real gauge and material:
  - **A3 (top)** — 3.5px, **ink** (`--color-ink`). The strong metal bordón.
  - **D4** — 2.5px, **ink**. A little smaller, but metallic.
  - **A4** — 1.5px, **ink-tint** (`--color-ink-tint`). Nylon prima.
  - **E5 (bottom)** — 1px, **ink-tint**. Thinnest nylon prima.
  The thickness gradient + ink/ink-tint split carries both size and material: metal strings are full ink and thicker, nylon strings are ink-tint and thinner. The strings span from the left edge of the fretboard to the nut; they do not enter the headstock.
- **Trastes:** 1.5px vertical ink lines between fret positions, drawn as right borders on fret cells 7 through 1. Fret 0 has no right border (its right separator is the nut on the headstock). The strings pass over the trastes at the intersections, the way a real string vibrates over a metal fret bar.
- **In-scale notes:** a red digitation circle (`--color-digitation`, `#c0392b`) with an ink outline, sitting on the string at the fret position. The note name sits centered on the circle in the paper color (light on red for legibility). The circle IS the in-scale signal — no cell background, no other cell marker.
- **Non-scale notes:** a paper-knockout label on the string at the fret position (ink-tint text with a small paper background). The paper knockout interrupts the string line so the letter is readable, the way a real tablature labels a played position.
- **Tonic (open A on strings A3 and A4, at fret 0 / the nut):** the red circle on the string at the nut, with the paper-colored "A" centered on it. The nut + the red circle carry the tonic semantic on a real instrument — no extra cell marker, no marigold dot.
- **No fingering numerals on the landing.** The diapason carries pitch and position (via the red circle and the note label); fingering is reserved for the guided path.
- **Z-order (low → high):** paper frame → trastes (cell right borders) → string line → red digitation circle → note label.
- **Fret-num ruler:** a thin reference line below the neck with the column numbers 7, 6, 5, 4, 3, 2, 1, 0, aligned with the columns. A spacer under the headstock column.
- **Transition:** 320ms ease-out on the red circle's fill and border (and the in-scale note's color) when the mode changes. Reduced-motion respected.

### Scale Switcher
- **Frame:** 2px ink border, paper background, sits below the diapason.
- **Layout:** three mode buttons (Mayor / Menor / Armónica) in Rye, with the audio toggle to the right. At ≤640px, the modes column-stack and the audio moves below.
- **Default mode:** Mayor.
- **Active state:** the active word renders in terracotta (the ground color) with an ink underline; inactive words are ink.
- **Hover/focus:** a faint ink rule scales in from the left under the word.

### Audio Toggle (labeled placeholder)
- **Frame:** 1px ink border, paper background, paper text.
- **Label:** "Audio de muestra (placeholder)" with a small dot glyph (CSS, not an icon).
- **On state:** ink background, paper text.
- **Underlying element:** an empty `<audio data-placeholder="true">` with no `src`. No fabricated recording.

### Primary CTA
- **Shape:** paper background, ink text, 2px ink border, no radius.
- **Typography:** Rye at the CTA size.
- **Hover/focus:** marigold background, ink text.
- **Behavior:** navigates to the next route (`/camino` on the landing).

## Do's and Don'ts

### Do:
- **Do** treat every surface as a printed field. One viewport, one composition, no scroll past the fold.
- **Do** use the four-color palette exactly. Terracotta ground, marigold accent, ink silhouette, paper interactive field.
- **Do** author illustrations as flat woodcut inline SVG. No photographs, no gradients, no stock geometry.
- **Do** use Rye for the display voice (headline, mode words, CTA) and IBM Plex Sans for everything else.
- **Do** keep the diapason musically correct. A3–D4–A4–E5 tuning, real mayor/menor/armónica scale notes, no simplifications.
- **Do** label the audio as a placeholder. An empty `<audio data-placeholder="true">` is correct until a real recording exists.
- **Do** use the 2px ink border as the only depth device. No shadows.

## Motion

Every transition in the system is a printed gesture — short, ease-out, no spring. Motion tokens live on `:root` so every component reads the same scale, and the `prefers-reduced-motion: reduce` media query collapses all of them to 0.001ms in one global rule.

| Token | Value | Used by |
|---|---|---|
| `--motion-fast` | 200ms | hover/focus color swaps on buttons (CTA, action buttons) |
| `--motion-medium` | 320ms | existing scale-switcher ink rule + color transitions (no change) |
| `--motion-click` | 400ms | `.fret--playing` pulse and `.fret--ghost` ring fade on click |
| `--motion-sequence` | 500ms | inter-note delay in `playScaleSequence` (120 BPM quarter-note) |
| `--motion-tuning` | 700ms | inter-string delay in `playTuningCheck` (sympathetic bus tail decay) |
| `--ease-printed` | ease-out | every new transition (matches the existing 200ms/320ms ease-out) |

Reduced-motion: the existing global `@media (prefers-reduced-motion: reduce)` rule in `global.css` collapses every `animation-duration` and `transition-duration` to 0.001ms. Components add a per-component media-query block as belt-and-suspenders.

## Components (continued)

### Footer (broadsheet colophon)
- **Shape:** paper background, 2px solid ink border-top only, square corners, no shadow, no gradient. The single depth device is the printed frame.
- **Typography:** IBM Plex Sans 500 (heritage scale), ink-on-paper for the credit, ink-tint for the copyright.
- **Content:**
  - Credit line: `Hecho por Braejan de Witsaba con amor — para estudiantes de bandola llanera`.
  - Links: `https://witsaba.com`, `https://github.com/braejan`, `https://linkedin.com/in/braejan`, repo URL. Every link `target="_blank" rel="noopener"`.
  - Copyright: `© 2026 Witsaba` — label scale, uppercase, letter-spacing 0.08em.
- **Layout:** desktop row (credit left, links center, copyright right); ≤640px column stack with the copyright centered.
- **Rationale:** the existing "no nav bar, footer, or second viewport" rule is amended to permit a single broadsheet colophon below the poster. The poster already scrolls past the fold (12-tone key selector + linear scale reference + playable diapason); the footer is the natural conclusion, not a separate surface.

### StudentMenu (persistent header strip)
- **Shape:** paper background, 2px solid ink border-bottom only, square corners, no shadow, no gradient — the same printed-band grammar as the Footer, but printed over the TOP of the poster instead of under it.
- **Typography:** Rye (display), `letter-spacing: 0.02em`, matching the CTA's wood-type voice.
- **Content:** exactly three items, fixed order — `Inicio` (`/`), `Joropo` (`/joropo`), `Camino` (`/camino`) — each a Qwik City `<Link>`.
- **Active state:** the item whose route matches the current pathname gets `aria-current="page"` and the active visual treatment (ground-color border-bottom accent); non-active items carry no `aria-current` attribute at all.
- **Layout:** single row at every viewport; wraps onto a second line at `≤640px` instead of collapsing into a hamburger or drawer — the strip is never hidden.
- **Placement:** rendered in `src/routes/layout.tsx` BEFORE `<Slot />`, so it is a DOM sibling of every route's `<main>`, never a descendant — it is the header of the broadsheet, not a second viewport of the poster.
- **Rationale:** the existing "no nav bar, footer, or second viewport" rule is amended a second time (after the Footer) to permit this persistent strip. It gives the student a stable way back to Inicio/Joropo/Camino without becoming a chrome layer that competes with the poster.

### Tuning-Check button
- **Shape:** paper background, 1px ink border, square corners, no shadow. Same CTA-paper grammar scaled to the label.
- **Typography:** IBM Plex Sans 500, 0.8125rem, letter-spacing 0.08em, uppercase.
- **Behavior:** clicking triggers `playTuningCheck` which plucks A3 → D4 → A4 → E5 at 700ms via `playMidiNote`. Each pluck pulses the matching open-string headstock cell (`.fret--playing` for ~400ms).
- **Disabled state:** while a tuning or scale sequence plays, the button is disabled (text ink-tint, cursor not-allowed, no hover transition).
- **Cancel:** a second click aborts the in-flight sequence via `AbortSignal` — no orphan tail, no overlap.

### Auto-Scale button
- **Shape:** identical paper/ink border grammar as Tuning-Check.
- **Typography:** IBM Plex Sans 500, 0.8125rem, letter-spacing 0.08em, uppercase.
- **Behavior:** clicking triggers `playScaleSequence` which iterates the active scale's `pitchClasses` at 500ms via `playMidiNote`. The cromática mode plays all 12 chromatic notes in ascending order.
- **Disabled state:** same as Tuning-Check.
- **Cancel:** second click aborts the in-flight sequence via `AbortSignal`.

### Manual-Mode hint
- **Placement:** below the two action buttons, inside the controls frame of the ScaleSwitcher.
- **Typography:** IBM Plex Sans 500, 0.8125rem, letter-spacing 0.08em, uppercase, ink-tint.
- **Copy:** `Modo manual: toca el diapason`. Visible at every viewport.
- **Purpose:** makes the click-to-play affordance of the diapason discoverable without adding chrome to the instrument itself.

### Click Animation
- **Trigger:** every click on a diapason cell (fret or open string).
- **Visual:** a 400ms pulse on the cell (scale 1 → 1.08 → 1) plus a sound-wave ripple keyframe. In-scale cells only show the pulse; non-scale cells also show the gray ghost ring.
- **Implementation:** CSS-only keyframe + a transient `.fret--playing` class added by the `flash()` helper, removed after 400ms via `setTimeout`. No GSAP / Motion / Framer.
- **Reduced-motion:** the global rule collapses the keyframe to 0.001ms; the `flash()` helper also short-circuits to a no-op when `matchMedia("(prefers-reduced-motion: reduce)").matches`. The audio still plays.

### Gray Ghost Digitation
- **Trigger:** click on a non-scale cell (the note is heard, but it is not part of the active scale).
- **Visual:** a 50%-opacity ink-tint ring (no fill) at the cell center. The note label inside the cell also drops to 60% opacity for the duration of the ghost.
- **Color:** gray (ink-tint) — the visual is "heard but not in scale". Red digitation circles remain uncontested as the scale-only marker.
- **Implementation:** a `<span class="fret__ghost" aria-hidden="true" />` rendered inside every fret cell (always present, opacity 0 by default). The `.fret--ghost` class on the parent cell animates the span's opacity to 0.5 over 400ms and the note label to 0.6.
- **Reduced-motion:** the global rule collapses the keyframe; the class is added and removed in the same tick.

## Do's and Don'ts

### Do:
- **Do** treat every surface as a printed field. One viewport, one composition, no scroll past the fold.
- **Do** use the four-color palette exactly. Terracotta ground, marigold accent, ink silhouette, paper interactive field.
- **Do** author illustrations as flat woodcut inline SVG. No photographs, no gradients, no stock geometry.
- **Do** use Rye for the display voice (headline, mode words, CTA) and IBM Plex Sans for everything else.
- **Do** keep the diapason musically correct. A3–D4–A4–E5 tuning, real mayor/menor/armónica scale notes, no simplifications.
- **Do** label the audio as a placeholder. An empty `<audio data-placeholder="true">` is correct until a real recording exists.
- **Do** use the 2px ink border as the only depth device. No shadows.

### Don't:
- **Don't** add a nav bar, marketing footer, or card grid. Two documented exceptions are permitted: a single broadsheet credits footer below the poster (see Footer component) and a persistent student-menu strip above the poster (see StudentMenu component). Both are rendered in the same paper-on-ink grammar — flat, square corners, 2px ink border, no shadow — and read as printed bands of the same broadsheet, not as chrome.
- **Don't** introduce a fifth color. The four-color palette is the system.
- **Don't** use a system display face (Impact, Arial Black, platform sans) as the display voice.
- **Don't** use a soft shadow, gradient, or glow on any surface. The world is flat and printed.
- **Don't** fabricate photographs, audio, testimonials, customers, benchmarks, or pricing. Label placeholders clearly.
- **Don't** add English copy. The product is Spanish.
- **Don't** simplify the musical content. The tuning and the scale notes are the proof.
