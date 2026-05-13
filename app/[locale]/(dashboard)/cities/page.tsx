import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { CitiesList } from '@/components/modules/cities/CitiesList';
import { isLocale } from '@/lib/i18n/config';

export default async function CitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('cities');
  return (
    <PageShell title={t('title')}>
      <CitiesList />
    </PageShell>
  );
}
