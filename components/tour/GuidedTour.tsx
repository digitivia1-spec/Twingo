'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLocale } from 'next-intl';
import { X } from 'lucide-react';
import { useRouter, usePathname } from '@/lib/i18n/routing';
import { useUi } from '@/lib/state/ui';
import { getTourSteps } from '@/lib/tour/content';
import type { Locale } from '@/lib/i18n/config';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const POPOVER_WIDTH = 320;
const CARD_EST_HEIGHT = 190;

/**
 * Interactive guided tour: a spotlight + step popover layered over the app.
 * Steps may navigate between routes and anchor to elements (matched via the
 * existing data-feedback-id attributes); a missing anchor degrades to a
 * centered card so the walkthrough never dead-ends. Launched from the sidebar.
 */
export function GuidedTour() {
  const locale = useLocale() as Locale;
  const isAr = locale !== 'en';
  const router = useRouter();
  const pathname = usePathname();
  const { tourOpen, stopTour } = useUi();
  const steps = useMemo(() => getTourSteps(locale), [locale]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const close = useCallback(() => {
    stopTour();
    setRect(null);
  }, [stopTour]);

  // Reset to the first step whenever the tour opens.
  useEffect(() => {
    if (tourOpen) setIndex(0);
  }, [tourOpen]);

  // Locate (and if needed navigate to) the current step's target.
  useEffect(() => {
    if (!tourOpen) return;
    const step = steps[index];
    if (!step) return;

    if (step.href && pathname !== step.href) {
      router.push(step.href);
      return; // re-runs once pathname updates
    }
    if (!step.selector) {
      setRect(null);
      return;
    }

    let cancelled = false;
    let tries = 0;
    const measure = (el: Element) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    };
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(step.selector!);
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
        setTimeout(() => {
          if (!cancelled) setRect(measure(el));
        }, 180);
        return;
      }
      if (tries++ < 30) setTimeout(tick, 60);
      else setRect(null); // graceful fallback to a centered card
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [tourOpen, index, pathname, router, steps]);

  // Keep the spotlight glued to the target on scroll / resize.
  useEffect(() => {
    if (!tourOpen) return;
    const step = steps[index];
    if (!step?.selector) return;
    const reposition = () => {
      const el = document.querySelector(step.selector!);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
    };
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [tourOpen, index, steps]);

  // Esc closes.
  useEffect(() => {
    if (!tourOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourOpen, close]);

  if (!tourOpen) return null;
  const step = steps[index];
  if (!step) return null;

  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  let popStyle: CSSProperties;
  if (rect) {
    const placeBelow = rect.top + rect.height + 16 + CARD_EST_HEIGHT < vh;
    const left = Math.min(Math.max(12, rect.left), vw - POPOVER_WIDTH - 12);
    popStyle = placeBelow
      ? { top: rect.top + rect.height + 16, left }
      : { top: Math.max(12, rect.top - 16 - CARD_EST_HEIGHT), left };
  } else {
    popStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  }

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      {rect ? (
        <>
          {/* Transparent layer blocks page interaction; dim comes from the ring's box-shadow. */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
          <div
            className="pointer-events-none absolute rounded-lg border-2 border-white transition-all duration-200"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-slate-900/55" />
      )}

      <div
        className="absolute w-[320px] max-w-[90vw] rounded-xl border border-primary-200 bg-surface p-4 shadow-2xl"
        style={popStyle}
      >
        <button
          type="button"
          onClick={close}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          className="absolute end-2 top-2 rounded-full p-1 text-fg-subtle hover:bg-surface-hover hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary-600">
          {isAr ? `خطوة ${index + 1} من ${steps.length}` : `Step ${index + 1} of ${steps.length}`}
        </div>
        <h2 className="mb-1 pe-5 text-sm font-extrabold text-fg">{step.title}</h2>
        <p className="text-[13px] leading-relaxed text-fg-muted">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="text-[11px] font-semibold text-fg-subtle hover:text-fg"
          >
            {isAr ? 'تخطّي' : 'Skip'}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-fg hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
            >
              {isAr ? 'السابق' : 'Back'}
            </button>
            <button
              type="button"
              onClick={() => (isLast ? close() : setIndex((i) => i + 1))}
              className="rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:opacity-95"
            >
              {isLast ? (isAr ? 'إنهاء' : 'Finish') : isAr ? 'التالي' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
