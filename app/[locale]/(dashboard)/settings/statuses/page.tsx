import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { StatusTaxonomy } from '@/components/modules/settings/StatusTaxonomy';
import { isLocale } from '@/lib/i18n/config';

export default async function StatusTaxonomyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('settings.statuses');
  return (
    <PageShell title={t('title')}>
      <StatusTaxonomy />
    </PageShell>
  );
}
