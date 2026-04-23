import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { PickupDetail } from '@/components/modules/pickup/PickupDetail';
import { isLocale } from '@/lib/i18n/config';

export default async function PickupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('pickup');
  return (
    <PageShell title={t('detail.pageTitle')}>
      <PickupDetail id={id} />
    </PageShell>
  );
}
