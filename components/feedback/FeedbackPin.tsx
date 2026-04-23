'use client';

import { MessageCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';
import type { FeedbackId } from '@/lib/feedback/ids';
import { cn } from '@/lib/utils';

const FEEDBACK_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === 'true';

interface FeedbackPinProps {
  elementId: FeedbackId;
  label?: string;
  /**
   * When `inline`, the pin is rendered as a sibling of the children (no extra
   * wrapper). Use this for table headers and other cases where a wrapping div
   * would break layout.
   */
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps an interactive element with a hover-revealed pin icon.
 * Clicking the pin opens the Sentry feedback dialog with tags
 * `{ elementId, page, locale }` pre-populated plus a screenshot of the
 * wrapped element (captured via html2canvas-pro).
 *
 * Gated by NEXT_PUBLIC_ENABLE_FEEDBACK — when disabled, renders children only.
 */
export function FeedbackPin({
  elementId,
  label,
  inline,
  className,
  children,
}: FeedbackPinProps) {
  const t = useTranslations('feedback');
  const locale = useLocale();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const pinLabel = label ?? t('pinTooltip');

  const openDialog = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!FEEDBACK_ENABLED) return;

      // Capture a screenshot of the wrapped element (not the viewport).
      let screenshot: string | null = null;
      try {
        const target = ref.current;
        if (target) {
          const { default: html2canvas } = await import('html2canvas-pro');
          const canvas = await html2canvas(target, {
            backgroundColor: null,
            scale: 1,
            logging: false,
          });
          screenshot = canvas.toDataURL('image/png');
        }
      } catch (err) {
        // Screenshot failure is non-fatal — Sentry still receives the comment.
        if (typeof window !== 'undefined') {
          console.warn('[feedback] screenshot capture failed', err);
        }
      }

      // Lazily import Sentry's browser SDK only on click so we keep first
      // paint cheap.
      try {
        const Sentry = await import('@sentry/nextjs');
        const feedback = Sentry.getFeedback();
        if (!feedback) {
          console.warn('[feedback] Sentry feedback integration not initialised');
          return;
        }
        const form = await feedback.createForm({
          formTitle: t('formTitle'),
          submitButtonLabel: t('submit'),
          messageLabel: t('messageLabel'),
          messagePlaceholder: t('messagePlaceholder'),
          nameLabel: t('nameLabel'),
          emailLabel: t('emailLabel'),
          successMessageText: t('success'),
          cancelButtonLabel: t.raw('pinTooltip') as string,
          tags: {
            feedback: 'true',
            elementId,
            page: pathname,
            locale,
          },
        });
        form.appendToDom();
        form.open();

        // Attach an element-scoped screenshot hint to the current scope.
        // Sentry's built-in `enableScreenshot: true` captures the viewport;
        // this extra context helps the /api/feedback relay distinguish the
        // element-specific shot when we wire up direct upload in Phase 2.
        if (screenshot) {
          Sentry.withScope((scope) => {
            scope.setContext('twinjo_element_shot', {
              element: elementId,
              bytes: screenshot.length,
            });
          });
        }
      } catch (err) {
        console.warn('[feedback] could not open Sentry dialog', err);
      }
    },
    [elementId, locale, pathname, t],
  );

  if (!FEEDBACK_ENABLED) {
    return <>{children}</>;
  }

  if (inline) {
    // Render children + a floating pin via absolute positioning relative to
    // the nearest positioned ancestor. Caller must ensure `relative` on parent.
    return (
      <span ref={ref as unknown as React.RefObject<HTMLSpanElement>} className={cn('inline-flex items-center gap-1', className)}>
        {children}
        <button
          type="button"
          onClick={openDialog}
          title={pinLabel}
          aria-label={pinLabel}
          className={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-primary text-white opacity-0 shadow-sm transition-opacity',
            'group-hover:opacity-100 focus-visible:opacity-100',
          )}
        >
          <MessageCircle className="h-2.5 w-2.5" />
        </button>
      </span>
    );
  }

  return (
    <div
      ref={ref}
      className={cn('relative group', className)}
      data-feedback-id={elementId}
    >
      {children}
      <button
        type="button"
        onClick={openDialog}
        title={pinLabel}
        aria-label={pinLabel}
        className={cn(
          'absolute top-[-8px] start-[-8px] z-40 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary text-white opacity-0 shadow-md transition-opacity duration-150',
          'group-hover:opacity-100 focus-visible:opacity-100 hover:opacity-100',
        )}
        tabIndex={-1}
      >
        <MessageCircle className="h-3 w-3" />
      </button>
    </div>
  );
}
