import { component$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { Landing } from './_components/landing';

export default component$(() => {
  return <Landing />;
});

export const head: DocumentHead = {
  title: 'Bandola Llanera',
  meta: [
    {
      name: 'description',
      content: 'Sitio informativo sobre la bandola llanera ancestral y tradicional.',
    },
  ],
};
