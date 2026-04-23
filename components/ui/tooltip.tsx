'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Minimal hover tooltip. Not keyboard-accessible on purpose to keep size down —
 * use <button aria-label="..."> for critical UI, this is decorative. */
export function Tooltip({
  label,
  children,
  side = 'top',
}: {
  label: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute start-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-primary-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100',
          side === 'top' ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
        )}
        role="tooltip"
      >
        {label}
      </span>
    </span>
  );
}
