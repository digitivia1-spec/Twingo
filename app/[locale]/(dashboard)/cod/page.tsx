import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { CodList } from '@/components/modules/cod/CodList';
import { isLocale } from '@/lib/i18n/config';

export default async function CodPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('cod');
  return (
    <PageShell title={t('title')}>
      <CodList />
    </PageShell>
  );
}
