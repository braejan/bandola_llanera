/**
 * Strict TDD — anim-target pub/sub semantics.
 *
 * The module is DOM-free and Qwik-free so it can be unit-tested
 * without a render. It is the bridge between the audio sequences
 * (T-3, T-4) and the Diapason (T-5..T-7): the audio module
 * publishes `(midi, targetId)` events, and the Diapason subscribes
 * via `useTask$` so every pluck lights up the matching cell.
 *
 * Contract:
 *   - `subscribe(listener)` returns an unsubscribe function.
 *   - `publish(event)` invokes every active listener with the event.
 *   - An exception thrown by one listener does NOT stop other listeners
 *     (try/catch isolation — logged via console.error).
 *   - The listener set is module-level; `publish` is fire-and-forget.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as animTarget from "./anim-target";

describe("anim-target — subscribe / publish", () => {
  beforeEach(() => {
    // Reset the module-level listener set between tests so subscribers
    // from one test do not bleed into another.
    animTarget.__resetAnimTargetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("publishes an event to a subscribed listener", () => {
    const listener = vi.fn();
    const off = animTarget.subscribe(listener);
    try {
      animTarget.publish({ midi: 57, targetId: "tuning-A3" });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ midi: 57, targetId: "tuning-A3" });
    } finally {
      off();
    }
  });

  it("returns an unsubscribe function that stops further events", () => {
    const listener = vi.fn();
    const off = animTarget.subscribe(listener);
    animTarget.publish({ midi: 57, targetId: "x" });
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    animTarget.publish({ midi: 62, targetId: "y" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("delivers events to every active subscriber", () => {
    const a = vi.fn();
    const b = vi.fn();
    const c = vi.fn();
    const offA = animTarget.subscribe(a);
    const offB = animTarget.subscribe(b);
    const offC = animTarget.subscribe(c);
    try {
      animTarget.publish({ midi: 69, targetId: "scale-re-mayor-9" });
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
      expect(c).toHaveBeenCalledTimes(1);
    } finally {
      offA();
      offB();
      offC();
    }
  });

  it("isolates exceptions: a failing listener does not stop siblings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const failing = vi.fn(() => {
      throw new Error("listener A boom");
    });
    const surviving = vi.fn();
    const offA = animTarget.subscribe(failing);
    const offB = animTarget.subscribe(surviving);
    try {
      animTarget.publish({ midi: 57, targetId: "x" });
      expect(failing).toHaveBeenCalledTimes(1);
      expect(surviving).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalled();
    } finally {
      offA();
      offB();
    }
  });

  it("publishing with no subscribers is a no-op (does not throw)", () => {
    expect(() =>
      animTarget.publish({ midi: 76, targetId: "tuning-E5" }),
    ).not.toThrow();
  });

  it("the same function can be subscribed once and unsubscribed once", () => {
    const listener = vi.fn();
    const off = animTarget.subscribe(listener);
    off();
    // A second call to the same unsubscribe is a no-op (idempotent).
    expect(() => off()).not.toThrow();
    animTarget.publish({ midi: 57, targetId: "x" });
    expect(listener).not.toHaveBeenCalled();
  });

  it("publishes preserve the targetId exactly (no mutation, no truncation)", () => {
    const listener = vi.fn();
    const off = animTarget.subscribe(listener);
    try {
      animTarget.publish({ midi: 76, targetId: "scale-re-mayor-9" });
      const evt = listener.mock.calls[0]?.[0];
      expect(evt).toBeDefined();
      expect(evt!.midi).toBe(76);
      expect(evt!.targetId).toBe("scale-re-mayor-9");
    } finally {
      off();
    }
  });
});
