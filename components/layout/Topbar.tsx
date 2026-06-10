'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUi } from '@/lib/state/ui';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { NotificationsBell } from '@/components/layout/NotificationsBell';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';

export function Topbar({ title }: { title: string }) {
  const t = useTranslations();
  const { toggleSidebar, openDrawer } = useUi();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-surface px-3 sm:gap-3 sm:px-5">
      <FeedbackPin elementId="topbar.toggleSidebar">
        {/* Mobile: open the off-canvas drawer. */}
        <button
          type="button"
          onClick={openDrawer}
          className="rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg md:hidden"
          aria-label={t('topbar.toggleSidebar')}
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Desktop: collapse/expand the sidebar rail. */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg md:inline-flex"
          aria-label={t('topbar.toggleSidebar')}
        >
          <Menu className="h-5 w-5" />
        </button>
      </FeedbackPin>

      <h1 className="min-w-0 truncate text-[15px] font-bold text-fg">{title}</h1>

      <div className="flex-1" />

      <FeedbackPin elementId="topbar.branchSelector">
        <BranchSelector />
      </FeedbackPin>

      <NotificationsBell />

      <FeedbackPin elementId="topbar.userAvatar">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-sm font-extrabold text-white"
          aria-label="User"
        >
          {t('topbar.userInitial')}
        </div>
      </FeedbackPin>
    </header>
  );
}
