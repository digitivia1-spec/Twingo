import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Tag } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { isLocale } from '@/lib/i18n/config';

export default async function PricesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('prices');
  return (
    <PageShell title={t('title')}>
      <PageHeader
        elementId="prices"
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <FeedbackPin elementId="prices.comingSoon">
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border bg-surface py-20 text-center">
          <Tag className="h-10 w-10 text-fg-subtle" />
          <div className="text-base font-bold text-fg">🏷️ {t('title')}</div>
          <p className="max-w-sm text-xs text-fg-muted">{t('comingSoon')}</p>
        </div>
      </FeedbackPin>
    </PageShell>
  );
}
