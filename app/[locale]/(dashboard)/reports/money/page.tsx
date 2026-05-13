import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { MoneyReport } from '@/components/modules/reports/MoneyReport';
import { isLocale } from '@/lib/i18n/config';

export default async function MoneyReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('reports.money');
  return (
    <PageShell title={t('title')}>
      <MoneyReport />
    </PageShell>
  );
}
