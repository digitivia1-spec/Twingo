import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { BranchesGrid } from '@/components/modules/branches/BranchesGrid';
import { isLocale } from '@/lib/i18n/config';

export default async function BranchesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('branches');
  return (
    <PageShell title={t('title')}>
      <BranchesGrid />
    </PageShell>
  );
}
