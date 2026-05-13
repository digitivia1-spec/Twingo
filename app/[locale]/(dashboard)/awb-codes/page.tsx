import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { AwbCodesList } from '@/components/modules/awb-codes/AwbCodesList';
import { isLocale } from '@/lib/i18n/config';

export default async function AwbCodesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('awbCodes');
  return (
    <PageShell title={t('title')}>
      <AwbCodesList />
    </PageShell>
  );
}
