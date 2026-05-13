import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { PickupImport } from '@/components/modules/pickup/PickupImport';
import { isLocale } from '@/lib/i18n/config';

export default async function PickupImportPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('pickup.import');
  return (
    <PageShell title={t('title')}>
      <PickupImport />
    </PageShell>
  );
}
