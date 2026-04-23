import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Undo2 } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { isLocale } from '@/lib/i18n/config';

export default async function ReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('returns');
  return (
    <PageShell title={t('title')}>
      <PageHeader
        elementId="returns"
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <FeedbackPin elementId="returns.comingSoon">
        <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border bg-surface py-20 text-center">
          <Undo2 className="h-10 w-10 text-fg-subtle" />
          <div className="text-base font-bold text-fg">↩️ {t('title')}</div>
          <p className="max-w-sm text-xs text-fg-muted">{t('comingSoon')}</p>
        </div>
      </FeedbackPin>
    </PageShell>
  );
}
