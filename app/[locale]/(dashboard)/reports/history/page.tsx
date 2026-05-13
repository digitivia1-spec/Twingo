import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { HistoryReport } from '@/components/modules/reports/HistoryReport';
import { isLocale } from '@/lib/i18n/config';

export default async function HistoryReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('reports.history');
  return (
    <PageShell title={t('title')}>
      <HistoryReport />
    </PageShell>
  );
}
