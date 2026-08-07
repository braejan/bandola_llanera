import { component$ } from '@builder.io/qwik';

interface SkipLinkProps {
  /** ID of the target element to skip to. */
  readonly targetId: string;
}

/**
 * Visually-hidden skip link that becomes visible on focus. The first focusable
 * element in the layout shell — keyboard users Tab here first.
 *
 * REQ-M-001 / REQ-M-008.
 */
export const SkipLink = component$<SkipLinkProps>((props) => {
  return (
    <a class="skip-link" href={`#${props.targetId}`}>
      Saltar al contenido
    </a>
  );
});
