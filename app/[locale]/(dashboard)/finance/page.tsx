import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { FinanceList } from '@/components/modules/finance/FinanceList';
import { isLocale } from '@/lib/i18n/config';

export default async function FinancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('finance');
  return (
    <PageShell title={t('title')}>
      <FinanceList />
    </PageShell>
  );
}
