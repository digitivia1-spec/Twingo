import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { DriversList } from '@/components/modules/drivers/DriversList';
import { isLocale } from '@/lib/i18n/config';

export default async function DriversPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('drivers');
  return (
    <PageShell title={t('title')}>
      <DriversList />
    </PageShell>
  );
}
