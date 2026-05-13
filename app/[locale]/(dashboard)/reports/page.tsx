import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { ReportsIndex } from '@/components/modules/reports/ReportsIndex';
import { isLocale } from '@/lib/i18n/config';

export default async function ReportsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('reports');
  return (
    <PageShell title={t('title')}>
      <ReportsIndex />
    </PageShell>
  );
}
