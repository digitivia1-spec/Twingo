import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { ProvincesList } from '@/components/modules/provinces/ProvincesList';
import { isLocale } from '@/lib/i18n/config';

export default async function ProvincesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('provinces');
  return (
    <PageShell title={t('title')}>
      <ProvincesList />
    </PageShell>
  );
}
