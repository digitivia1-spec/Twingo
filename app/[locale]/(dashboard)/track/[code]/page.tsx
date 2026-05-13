import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { PublicTracking } from '@/components/modules/track/PublicTracking';
import { isLocale } from '@/lib/i18n/config';

/**
 * Operator-facing AWB tracking detail. Same component as the public page,
 * but rendered inside the dashboard chrome.
 */
export default async function TrackDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('track');
  return (
    <PageShell title={`${t('title')} — ${decodeURIComponent(code)}`}>
      <PublicTracking code={decodeURIComponent(code)} fullPage={false} />
    </PageShell>
  );
}
