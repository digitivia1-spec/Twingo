import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { PickupList } from '@/components/modules/pickup/PickupList';
import { isLocale } from '@/lib/i18n/config';

export default async function PickupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('pickup');
  return (
    <PageShell title={t('title')}>
      <PickupList />
    </PageShell>
  );
}
