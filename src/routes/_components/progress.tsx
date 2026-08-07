import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';

/**
 * Reading progress indicator (REQ-M-006).
 *
 * Renders a thin sticky bar at the top of the article. The width is computed
 * by a single IntersectionObserver attached to every <section> inside <main>;
 * the deepest visible section's progress (0–100) drives the width.
 *
 * SSR: renders 0% pre-hydration. The client task only runs after the visible
 * task triggers (cheaper than a scroll listener).
 */
export const Progress = component$(() => {
  const pct = useSignal(0);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const sections = Array.from(
      document.querySelectorAll('main section[id]'),
    ) as HTMLElement[];
    if (sections.length === 0) return;

    const visibility = new Map<HTMLElement, number>();

    const compute = () => {
      let best = 0;
      for (const s of sections) {
        const v = visibility.get(s) ?? 0;
        if (v > best) best = v;
      }
      // Map "deepest visible" ratio to 0–100% by index in the document order.
      let visibleIdx = -1;
      for (let i = 0; i < sections.length; i++) {
        if ((visibility.get(sections[i]!) ?? 0) > 0) {
          visibleIdx = i;
          break;
        }
      }
      if (visibleIdx < 0) {
        // Nothing visible — fall back to scroll position.
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        pct.value = max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;
      } else {
        pct.value = Math.round(((visibleIdx + 1) / sections.length) * 100);
      }
      void best;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visibility.set(e.target as HTMLElement, e.intersectionRatio);
        }
        compute();
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    for (const s of sections) observer.observe(s);
    cleanup(() => observer.disconnect());
  });

  return (
    <div class="progress" role="progressbar" aria-label="Progreso de lectura">
      <div class="progress-fill" style={{ width: `${pct.value}%` }} />
    </div>
  );
});
