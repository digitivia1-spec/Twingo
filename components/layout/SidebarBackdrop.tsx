'use client';

import { useUi } from '@/lib/state/ui';
import { cn } from '@/lib/utils';

/**
 * Dimmed overlay shown behind the off-canvas sidebar drawer on mobile.
 * Tapping it closes the drawer. Hidden entirely at md+ where the sidebar
 * is part of the normal flex layout.
 */
export function SidebarBackdrop() {
  const { drawerOpen, closeDrawer } = useUi();

  return (
    <div
      onClick={closeDrawer}
      aria-hidden={!drawerOpen}
      className={cn(
        'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden',
        drawerOpen
          ? 'opacity-100'
          : 'pointer-events-none opacity-0',
      )}
    />
  );
}
