import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { OrdersReport } from '@/components/modules/reports/OrdersReport';
import { isLocale } from '@/lib/i18n/config';

export default async function OrdersReportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('reports.orders');
  return (
    <PageShell title={t('title')}>
      <OrdersReport />
    </PageShell>
  );
}
