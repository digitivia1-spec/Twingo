'use client';

/**
 * Initialises the Sentry feedback widget on the client after first render.
 *
 * We defer Sentry entirely until feedback is enabled so unit tests and
 * ordinary dev runs don't pay the bundle cost.
 */

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === 'true';
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function FeedbackBootstrap() {
  const t = useTranslations('feedback');
  const locale = useLocale();

  useEffect(() => {
    if (!ENABLED || !DSN) return;
    let cancelled = false;

    (async () => {
      const Sentry = await import('@sentry/nextjs');
      // The widget may already be installed by sentry.client.config.ts.
      // Calling getFeedback() lets us re-configure the chrome with locale
      // strings now that next-intl has hydrated.
      const feedback = Sentry.getFeedback();
      if (cancelled || !feedback) return;

      // Attach global tags so every feedback event carries locale context.
      Sentry.setTag('locale', locale);
      Sentry.setTag('feedback', 'true');

      feedback.attachTo(document.body, {
        formTitle: t('formTitle'),
        buttonLabel: t('buttonLabel'),
        submitButtonLabel: t('submit'),
        messageLabel: t('messageLabel'),
        messagePlaceholder: t('messagePlaceholder'),
        nameLabel: t('nameLabel'),
        emailLabel: t('emailLabel'),
        successMessageText: t('success'),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  return null;
}
