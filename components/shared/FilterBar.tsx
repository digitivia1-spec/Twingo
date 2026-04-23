'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';

export interface FilterBarProps {
  elementId: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  elementId,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-[var(--radius)] border border-border bg-surface p-3 shadow-sm',
        className,
      )}
    >
      <FeedbackPin elementId={`${elementId}.search`} className="flex-1 min-w-[220px]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="ps-8"
          />
        </div>
      </FeedbackPin>
      {children}
    </div>
  );
}

export function FilterPill({
  elementId,
  active,
  onClick,
  children,
}: {
  elementId: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <FeedbackPin elementId={elementId}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors',
          active
            ? 'border-primary-700 bg-primary-700 text-white'
            : 'border-border bg-surface text-fg-muted hover:border-primary-500 hover:text-primary-700',
        )}
      >
        {children}
      </button>
    </FeedbackPin>
  );
}
