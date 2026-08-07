import { component$ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

/**
 * Default landing page for `/`. Renders site title, a one-sentence orientation,
 * and a single CTA to `/historia/`. Replaces the previous 308 redirect.
 *
 * REQ-M-003.
 */
export const Landing = component$(() => {
  return (
    <section class="landing">
      <h1>Bandola Llanera</h1>
      <p>
        Origen, afinación y contexto orinoquense de un instrumento del joropo.
      </p>
      <p>
        <Link href="/historia/">Comenzar →</Link>
      </p>
    </section>
  );
});
