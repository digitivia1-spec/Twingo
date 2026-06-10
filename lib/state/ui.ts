'use client';

import { create } from 'zustand';

interface UiState {
  /** Desktop-only: narrow icon rail vs. full-width sidebar. */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (collapsed: boolean) => void;
  /** Mobile-only: off-canvas sidebar drawer open/closed. */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  /** Interactive guided tour overlay. */
  tourOpen: boolean;
  startTour: () => void;
  stopTour: () => void;
}

export const useUi = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebar: (collapsed) => set({ sidebarCollapsed: collapsed }),
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
  tourOpen: false,
  startTour: () => set({ tourOpen: true }),
  stopTour: () => set({ tourOpen: false }),
}));
