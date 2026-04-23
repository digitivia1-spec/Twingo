/**
 * Sentry browser init — runs on every page load when feedback is enabled.
 * See components/feedback/FeedbackBootstrap.tsx for the per-locale chrome.
 */
import * as Sentry from '@sentry/nextjs';

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_FEEDBACK === 'true';
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (ENABLED && DSN) {
  Sentry.init({
    dsn: DSN,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    integrations: [
      // Built-in widget. Chrome is re-labelled per locale in
      // FeedbackBootstrap.tsx after next-intl hydrates.
      Sentry.feedbackIntegration({
        colorScheme: 'light',
        isEmailRequired: false,
        isNameRequired: false,
        showBranding: false,
        autoInject: false, // we call feedback.attachTo(document.body) manually
        enableScreenshot: true,
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
      // Ensure every feedback event is tagged so the /api/feedback webhook
      // can filter.
      if (event.type === 'feedback' && event.tags) {
        event.tags.feedback = 'true';
      }
      return event;
    },
  });
}
