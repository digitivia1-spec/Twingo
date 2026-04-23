import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { DashboardContent } from '@/components/modules/dashboard/DashboardContent';
import { isLocale } from '@/lib/i18n/config';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('dashboard');
  return (
    <PageShell title={t('title')}>
      <DashboardContent />
    </PageShell>
  );
}
