import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { PendingClientsList } from '@/components/modules/pending-clients/PendingClientsList';
import { isLocale } from '@/lib/i18n/config';

export default async function PendingClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('pendingClients');
  return (
    <PageShell title={t('title')}>
      <PendingClientsList />
    </PageShell>
  );
}
