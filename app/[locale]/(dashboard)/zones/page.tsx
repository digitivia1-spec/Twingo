import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { ZonesList } from '@/components/modules/zones/ZonesList';
import { isLocale } from '@/lib/i18n/config';

export default async function ZonesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('zones');
  return (
    <PageShell title={t('title')}>
      <ZonesList />
    </PageShell>
  );
}
