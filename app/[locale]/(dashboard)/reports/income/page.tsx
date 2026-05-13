import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { IncomeReport } from '@/components/modules/reports/IncomeReport';
import { isLocale } from '@/lib/i18n/config';

export default async function IncomeReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('reports.income');
  return (
    <PageShell title={t('title')}>
      <IncomeReport />
    </PageShell>
  );
}
