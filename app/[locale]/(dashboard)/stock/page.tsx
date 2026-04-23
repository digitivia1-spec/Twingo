import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { StockList } from '@/components/modules/stock/StockList';
import { isLocale } from '@/lib/i18n/config';

export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('stock');
  return (
    <PageShell title={t('title')}>
      <StockList />
    </PageShell>
  );
}
