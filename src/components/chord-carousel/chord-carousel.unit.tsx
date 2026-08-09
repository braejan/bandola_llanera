/**
 * Strict TDD — ChordCarousel component tests.
 *
 * Fully controlled: this harness owns `activeIndex` itself (mirroring
 * how the /acordes route will own it) and updates it from
 * `onNavigate$`, so assertions can check BOTH what the component
 * requested (the navigate log) and what the DOM shows once the parent
 * applies that request (transform, aria-hidden, aria-selected).
 */
import { $, component$, useContextProvider, useSignal } from "@builder.io/qwik";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";

vi.mock("../../audio/play-midi-note", () => ({
  playMidiNote: vi.fn().mockResolvedValue(null),
  AUDIO_UNAVAILABLE_MESSAGE:
    "Audio no disponible. Toca una nota para intentarlo de nuevo.",
}));

vi.mock("../../audio/play-chord", () => ({
  playChord: vi.fn().mockResolvedValue(undefined),
  AUDIO_UNAVAILABLE_MESSAGE:
    "Audio no disponible. Toca una nota para intentarlo de nuevo.",
}));

import { ChordCarousel } from "./chord-carousel";
import { AudioStatusContext } from "../../audio/audio-status-context";
import { getCircleById, type Chord } from "../../music/chords";

const CIRCLE = getCircleById("joropo-re-mayor")!;
const CHORDS: readonly Chord[] = CIRCLE.chords; // [la-con-septima, re-mayor, sol-mayor-cuarta]

const TestHarness = component$<{
  initialIndex?: number;
  disabled?: boolean;
}>(({ initialIndex = 0, disabled }) => {
  const audioStatus = useSignal("");
  useContextProvider(AudioStatusContext, audioStatus);
  const activeIndex = useSignal(initialIndex);
  const navigateLog = useSignal<number[]>([]);
  return (
    <>
      <p data-testid="active-index">{activeIndex.value}</p>
      <p data-testid="navigate-log">{navigateLog.value.join(",")}</p>
      <ChordCarousel
        chords={CHORDS}
        activeIndex={activeIndex.value}
        disabled={disabled}
        onNavigate$={$((i: number) => {
          navigateLog.value = [...navigateLog.value, i];
          activeIndex.value = i;
        })}
      />
    </>
  );
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ChordCarousel — renders all 3 slides, one active", () => {
  it("renders exactly 3 slides and 3 progress ticks", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness />);
    expect(screen.querySelectorAll(".chord-carousel__slide").length).toBe(3);
    expect(screen.querySelectorAll(".chord-carousel__tick").length).toBe(3);
  });

  it("only the active slide is not aria-hidden, and its tick is aria-selected", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness initialIndex={1} />);
    const slides = Array.from(screen.querySelectorAll(".chord-carousel__slide"));
    expect(slides[0].getAttribute("aria-hidden")).toBe("true");
    expect(slides[1].getAttribute("aria-hidden")).toBeNull();
    expect(slides[2].getAttribute("aria-hidden")).toBe("true");

    const ticks = Array.from(screen.querySelectorAll(".chord-carousel__tick"));
    expect(ticks[0].getAttribute("aria-selected")).toBe("false");
    expect(ticks[1].getAttribute("aria-selected")).toBe("true");
    expect(ticks[2].getAttribute("aria-selected")).toBe("false");
  });

  it("shows the chord's role label and big name for each slide", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness />);
    const roles = Array.from(
      screen.querySelectorAll(".chord-carousel__role"),
    ).map((el) => el.textContent);
    expect(roles).toEqual(["Dominante", "Tónica", "Subdominante"]);

    const names = Array.from(
      screen.querySelectorAll(".chord-carousel__chord-name"),
    ).map((el) => el.textContent);
    expect(names).toEqual(["A7", "D", "G"]);
  });

  it("translates the track by -activeIndex * 100%", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness initialIndex={2} />);
    const track = screen.querySelector(".chord-carousel__track") as HTMLElement;
    expect(track.style.transform).toBe("translateX(-200%)");
  });

  it("renders one ChordFretboard per slide", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness />);
    expect(screen.querySelectorAll(".chord-fretboard").length).toBe(3);
  });
});

describe("ChordCarousel — progress ticks navigate on click", () => {
  it("clicking a tick calls onNavigate$ with that index and updates the DOM", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness />);
    const ticks = Array.from(screen.querySelectorAll(".chord-carousel__tick"));
    await userEvent(ticks[2] as HTMLElement, "click");

    expect(screen.querySelector('[data-testid="navigate-log"]')?.textContent).toBe(
      "2",
    );
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("2");
  });

  it("clicking the already-active tick does not call onNavigate$", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} />);
    const ticks = Array.from(screen.querySelectorAll(".chord-carousel__tick"));
    await userEvent(ticks[0] as HTMLElement, "click");
    expect(
      screen.querySelector('[data-testid="navigate-log"]')?.textContent,
    ).toBe("");
  });
});

describe("ChordCarousel — chevron navigation wraps", () => {
  it('"next" from the last slide (index 2) wraps to index 0', async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={2} />);
    const next = screen.querySelector(
      ".chord-carousel__nav--next",
    ) as HTMLElement;
    await userEvent(next, "click");
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("0");
  });

  it('"prev" from the first slide (index 0) wraps to index 2', async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} />);
    const prev = screen.querySelector(
      ".chord-carousel__nav--prev",
    ) as HTMLElement;
    await userEvent(prev, "click");
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("2");
  });
});

describe("ChordCarousel — keyboard navigation", () => {
  it("ArrowRight on the viewport advances to the next slide", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "keydown", { key: "ArrowRight" });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("1");
  });

  it("ArrowLeft on the viewport goes to the previous slide", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={1} />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "keydown", { key: "ArrowLeft" });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("0");
  });
});

describe("ChordCarousel — swipe/drag gesture", () => {
  it("a leftward drag past the threshold advances to the next slide", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "pointerdown", { clientX: 300 });
    await userEvent(viewport, "pointerup", { clientX: 250 });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("1");
  });

  it("a rightward drag past the threshold goes to the previous slide", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={1} />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "pointerdown", { clientX: 100 });
    await userEvent(viewport, "pointerup", { clientX: 200 });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("0");
  });

  it("a drag shorter than the threshold does not navigate", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "pointerdown", { clientX: 300 });
    await userEvent(viewport, "pointerup", { clientX: 285 });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("0");
  });
});

describe("ChordCarousel — disabled (auto-play in progress)", () => {
  it("disables the progress ticks and chevrons", async () => {
    const { screen, render } = await createDOM();
    await render(<TestHarness disabled />);
    const ticks = Array.from(
      screen.querySelectorAll(".chord-carousel__tick"),
    ) as HTMLButtonElement[];
    for (const tick of ticks) expect(tick.disabled).toBe(true);
    const prev = screen.querySelector(
      ".chord-carousel__nav--prev",
    ) as HTMLButtonElement;
    const next = screen.querySelector(
      ".chord-carousel__nav--next",
    ) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(true);
  });

  it("ignores ArrowRight/ArrowLeft while disabled", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} disabled />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "keydown", { key: "ArrowRight" });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("0");
  });

  it("ignores a drag gesture while disabled", async () => {
    const { screen, render, userEvent } = await createDOM();
    await render(<TestHarness initialIndex={0} disabled />);
    const viewport = screen.querySelector(
      ".chord-carousel__viewport",
    ) as HTMLElement;
    await userEvent(viewport, "pointerdown", { clientX: 300 });
    await userEvent(viewport, "pointerup", { clientX: 100 });
    expect(
      screen.querySelector('[data-testid="active-index"]')?.textContent,
    ).toBe("0");
  });
});
