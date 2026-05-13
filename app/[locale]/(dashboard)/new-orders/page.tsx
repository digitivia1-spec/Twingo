import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { NewOrdersList } from '@/components/modules/new-orders/NewOrdersList';
import { isLocale } from '@/lib/i18n/config';

export default async function NewOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('newOrders');
  return (
    <PageShell title={t('title')}>
      <NewOrdersList />
    </PageShell>
  );
}
