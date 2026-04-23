import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { PickupCreate } from '@/components/modules/pickup/PickupCreate';
import { isLocale } from '@/lib/i18n/config';

export default async function PickupCreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('pickup');
  return (
    <PageShell title={t('create.title')}>
      <PickupCreate />
    </PageShell>
  );
}
