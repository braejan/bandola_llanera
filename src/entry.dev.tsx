/**
 * Dev entry — boots the SSR renderer in dev mode.
 * Used by `vite --mode ssr`.
 */
import { render, type RenderOptions } from '@builder.io/qwik';
import Root from './root';

export default function (opts: RenderOptions) {
  return render(document, <Root />, opts);
}
