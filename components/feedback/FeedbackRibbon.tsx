'use client';

import { useTranslations } from 'next-intl';

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

/** Amber ribbon at the top-end, visible only when feedback is ON and NODE_ENV=development. */
export function FeedbackRibbon() {
  const t = useTranslations('feedback');
  if (!ENABLED || !IS_DEV) return null;
  return (
    <div
      className="pointer-events-none fixed top-2 end-2 z-[500] rounded-full bg-warning px-3 py-1 text-[10px] font-bold text-white shadow-md"
      role="status"
    >
      ⚑ {t('devRibbon')}
    </div>
  );
}
