'use client';

import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebar: (collapsed: boolean) => void;
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
  tourOpen: false,
  startTour: () => set({ tourOpen: true }),
  stopTour: () => set({ tourOpen: false }),
}));
