import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { DistrictsList } from '@/components/modules/districts/DistrictsList';
import { isLocale } from '@/lib/i18n/config';

export default async function DistrictsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('districts');
  return (
    <PageShell title={t('title')}>
      <DistrictsList />
    </PageShell>
  );
}
