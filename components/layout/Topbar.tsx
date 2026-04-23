'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useUi } from '@/lib/state/ui';
import { BranchSelector } from '@/components/shared/BranchSelector';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';

export function Topbar({ title }: { title: string }) {
  const t = useTranslations();
  const { toggleSidebar } = useUi();

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-5">
      <FeedbackPin elementId="topbar.toggleSidebar">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg"
          aria-label={t('topbar.toggleSidebar')}
        >
          <Menu className="h-5 w-5" />
        </button>
      </FeedbackPin>

      <h1 className="text-[15px] font-bold text-fg truncate">{title}</h1>

      <div className="flex-1" />

      <FeedbackPin elementId="topbar.branchSelector">
        <BranchSelector />
      </FeedbackPin>

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
