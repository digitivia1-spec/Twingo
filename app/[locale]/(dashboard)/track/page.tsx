import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { TrackForm } from '@/components/modules/track/TrackForm';
import { isLocale } from '@/lib/i18n/config';

export default async function TrackEntryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('track');
  return (
    <PageShell title={t('title')}>
      <TrackForm />
    </PageShell>
  );
}
