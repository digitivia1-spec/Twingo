'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Minimal headless dialog built on the native <dialog> element.
 * RTL-safe: all spacing uses logical properties.
 */
interface DialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: React.ReactNode;
  className?: string;
  /** Hide the default close icon if you want a custom footer-only dialog. */
  hideClose?: boolean;
  ariaLabel?: string;
}

export function Dialog({
  open,
  onOpenChange,
  children,
  className,
  hideClose,
  ariaLabel,
}: DialogProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  // Close on Esc + click outside.
  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={ref}
        className={cn(
          'relative z-10 w-full max-w-[600px] rounded-[var(--radius)] bg-surface p-6 shadow-lg',
          className,
        )}
      >
        {!hideClose && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute end-3 top-3 rounded-md p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-base font-bold text-fg', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-fg-muted', className)} {...props} />
  );
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mt-6 flex items-center justify-between gap-2',
        className,
      )}
      {...props}
    />
  );
}
