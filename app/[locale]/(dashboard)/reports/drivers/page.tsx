import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { DriversReport } from '@/components/modules/reports/DriversReport';
import { isLocale } from '@/lib/i18n/config';

export default async function DriversReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('reports.drivers');
  return (
    <PageShell title={t('title')}>
      <DriversReport />
    </PageShell>
  );
}
