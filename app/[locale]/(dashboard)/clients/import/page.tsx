import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { ClientsImport } from '@/components/modules/clients/ClientsImport';
import { isLocale } from '@/lib/i18n/config';

export default async function ClientsImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('pickup.clientsImport');
  return (
    <PageShell title={t('title')}>
      <ClientsImport />
    </PageShell>
  );
}
