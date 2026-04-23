import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Cairo (RTL) perf: inline logical-property polyfills are unnecessary on evergreen browsers.
  },
  // Skip ESLint / TS during the production build in CI — we run them as
  // separate workflow steps so the build itself doesn't fail on lint-only
  // issues like @typescript-eslint/no-empty-object-type.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Typecheck runs as a separate step; don't double-fail the build.
    ignoreBuildErrors: false,
  },
  // Silence Sentry bundle instrumentation in dev for faster HMR.
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ingest.sentry.io' },
    ],
  },
};

const sentryOptions = {
  org: process.env.SENTRY_ORG || 'digitivia-pt',
  project: process.env.SENTRY_PROJECT || 'twingo-demo',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
};

const configured = withNextIntl(nextConfig);

// Only wrap with Sentry when an auth token is present — otherwise `next build`
// warns noisily during local dev / initial scaffolding.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(configured, sentryOptions)
  : configured;
