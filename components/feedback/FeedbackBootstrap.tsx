'use client';

/**
 * Initialises Sentry + the feedback widget on the client.
 *
 * We init here (not in sentry.client.config.ts) because we skip the Sentry
 * Next.js build plugin in CI when SENTRY_AUTH_TOKEN is absent, which means
 * sentry.client.config.ts never auto-loads in production. Doing it here
 * guarantees Sentry is ready the moment the layout mounts.
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
      if (cancelled) return;

      // Init Sentry once. getClient() returns undefined if not yet init.
      if (!Sentry.getClient()) {
        Sentry.init({
          dsn: DSN,
          tracesSampleRate: 0.1,
          integrations: [
            Sentry.feedbackIntegration({
              colorScheme: 'light',
              isEmailRequired: false,
              isNameRequired: false,
              showBranding: false,
              autoInject: true, // Sentry creates the floating button
              enableScreenshot: true,
              buttonLabel: t('buttonLabel'),
              formTitle: t('formTitle'),
              submitButtonLabel: t('submit'),
              messageLabel: t('messageLabel'),
              messagePlaceholder: t('messagePlaceholder'),
              nameLabel: t('nameLabel'),
              emailLabel: t('emailLabel'),
              successMessageText: t('success'),
              themeLight: {
                foreground: '#0f172a',
                background: '#ffffff',
                accentForeground: '#ffffff',
                accentBackground: '#1d4ed8',
                successColor: '#15803d',
                errorColor: '#b91c1c',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              },
            }),
          ],
          beforeSend(event) {
            if (event.type === 'feedback' && event.tags) {
              event.tags.feedback = 'true';
            }
            return event;
          },
        });
      }

      Sentry.setTag('locale', locale);
      Sentry.setTag('feedback', 'true');
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, t]);

  return null;
}
