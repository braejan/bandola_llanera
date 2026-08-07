import { component$, useStylesScoped$ } from '@builder.io/qwik';
import { type DocumentHead } from '@builder.io/qwik-city';
import { historiaArticle } from '~/content/historia';
import { ArticleView } from '~/routes/_lib/article-view';
import { Toc } from '~/routes/_components/toc';
import { Progress } from '~/routes/_components/progress';
import styles from './historia.module.css?inline';

export default component$(() => {
  useStylesScoped$(styles);

  return (
    <>
      <Progress />
      <Toc sections={historiaArticle.sections} />
      <ArticleView article={historiaArticle} />
    </>
  );
});

export const head: DocumentHead = {
  title: 'Historia — Bandola Llanera',
  meta: [
    {
      name: 'description',
      content: 'Historia de la bandola llanera ancestral y tradicional.',
    },
  ],
};
