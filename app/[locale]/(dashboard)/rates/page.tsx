import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { RatesList } from '@/components/modules/rates/RatesList';
import { isLocale } from '@/lib/i18n/config';

export default async function RatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('rates');
  return (
    <PageShell title={t('title')}>
      <RatesList />
    </PageShell>
  );
}
