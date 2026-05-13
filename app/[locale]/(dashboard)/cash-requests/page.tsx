import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { CashRequestsList } from '@/components/modules/cash-requests/CashRequestsList';
import { isLocale } from '@/lib/i18n/config';

export default async function CashRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('cashRequests');
  return (
    <PageShell title={t('title')}>
      <CashRequestsList />
    </PageShell>
  );
}
