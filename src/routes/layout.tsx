import { component$, Slot } from '@builder.io/qwik';
import { SideMenu } from '~/components/side-menu/side-menu';

export default component$(() => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SideMenu />
      <main
        style={{
          flex: '1',
          padding: 'var(--space-5) var(--space-5)',
          maxWidth: 'calc(var(--measure) + var(--space-6))',
        }}
      >
        <Slot />
      </main>
    </div>
  );
});
