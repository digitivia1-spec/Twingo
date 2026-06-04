'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { HelpCircle, X } from 'lucide-react';
import { getGuide } from '@/lib/guide/content';

/**
 * A dismissible, per-tab guided explanation. Shows automatically the first
 * time a page is visited (persisted per-route in localStorage) and can be
 * re-opened any time via the "?" button.
 */
export function PageGuide() {
  const pathname = usePathname() || '/';
  const locale = useLocale();
  const guide = getGuide(pathname, locale);
  const isAr = locale !== 'en';
  const storageKey = `twingo.guide.dismissed:${pathname}`;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const dismissed = localStorage.getItem(storageKey);
      setOpen(!dismissed);
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  if (!guide || !mounted) {
    // Still render the toggle so the page always has a help affordance.
    return guide ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 hover:bg-primary-100"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        {isAr ? 'شرح الصفحة' : 'Page guide'}
      </button>
    ) : null;
  }

  function dismiss() {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      /* ignore */
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 hover:bg-primary-100"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        {isAr ? 'شرح الصفحة' : 'Page guide'}
      </button>
    );
  }

  return (
    <div className="relative rounded-xl border border-primary-200 bg-primary-50/70 p-4 pe-10 text-primary-900">
      <button
        type="button"
        onClick={dismiss}
        aria-label={isAr ? 'إغلاق' : 'Dismiss'}
        className="absolute end-2 top-2 rounded-full p-1 text-primary-500 hover:bg-primary-100 hover:text-primary-800"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="mb-1 flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-primary-600" />
        <h2 className="text-sm font-extrabold">{guide.title}</h2>
      </div>
      <p className="text-[13px] leading-relaxed text-primary-800">{guide.body}</p>
      {guide.steps.filter(Boolean).length > 0 && (
        <ol className="mt-2 list-decimal space-y-0.5 text-[12.5px] text-primary-700 ps-5">
          {guide.steps.filter(Boolean).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
