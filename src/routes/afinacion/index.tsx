import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { afinacionArticle } from '~/content/afinacion';
import { ArticleView } from '~/routes/_lib/article-view';
import { Toc } from '~/routes/_components/toc';
import { Progress } from '~/routes/_components/progress';
import styles from './afinacion.module.css?inline';

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <>
      <Progress />
      <Toc sections={afinacionArticle.sections} />
      <ArticleView article={afinacionArticle} />
    </>
  );
});

export const head: DocumentHead = {
  title: 'Afinación — Bandola Llanera',
  meta: [
    {
      name: 'description',
      content: 'Afinación más común, variantes documentadas y notas pedagógicas para la bandola llanera.',
    },
  ],
};
