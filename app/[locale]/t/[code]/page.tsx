import { setRequestLocale } from 'next-intl/server';
import { PublicTracking } from '@/components/modules/track/PublicTracking';
import { isLocale } from '@/lib/i18n/config';

// Dynamic — always fetch the latest state for the AWB.
export const dynamic = 'force-dynamic';

/**
 * Public, no-auth, no-chrome consumer tracking page.
 * Routed at /t/{code} (e.g. /t/PK-1024 — short URL friendly for SMS).
 * Inherits QueryProvider from the locale layout, so we don't wrap again.
 */
export default async function PublicTrackPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  return <PublicTracking code={decodeURIComponent(code)} fullPage />;
}
