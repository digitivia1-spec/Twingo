import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { ClientsList } from '@/components/modules/clients/ClientsList';
import { isLocale } from '@/lib/i18n/config';

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('clients');
  return (
    <PageShell title={t('title')}>
      <ClientsList />
    </PageShell>
  );
}
