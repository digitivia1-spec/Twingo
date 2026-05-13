'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';

/**
 * Shared date-range control used by all reports.
 * Lifts state to the parent so each report owns its own filter.
 */
export function DateRangeControl({
  elementId,
  from,
  to,
  onChange,
}: {
  elementId: string;
  from: string;
  to: string;
  onChange: (next: { from: string; to: string }) => void;
}) {
  const t = useTranslations('reports.common');
  return (
    <FeedbackPin elementId={elementId}>
      <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius)] border border-border bg-surface p-3 shadow-sm">
        <div className="space-y-1">
          <Label>{t('from')}</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => onChange({ from: e.target.value, to })}
            dir="ltr"
          />
        </div>
        <div className="space-y-1">
          <Label>{t('to')}</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => onChange({ from, to: e.target.value })}
            dir="ltr"
          />
        </div>
      </div>
    </FeedbackPin>
  );
}

/** ISO date string for "N days ago" — useful as a default. */
export function daysAgoISO(n: number): string {
  return new Date(Date.now() - n * 86400 * 1000).toISOString().slice(0, 10);
}

/** Today as ISO date. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
