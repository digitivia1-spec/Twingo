'use client';

import {
  Banknote,
  Bike,
  History,
  Package,
  Receipt,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { Link } from '@/lib/i18n/routing';

/**
 * Reports hub — five sub-reports that mirror the legacy tool's report menu,
 * each opens in its own page so links are shareable.
 */
const REPORTS = [
  { key: 'orders', href: '/reports/orders', icon: Package, tone: 'border-t-primary-700' },
  { key: 'drivers', href: '/reports/drivers', icon: Bike, tone: 'border-t-info' },
  { key: 'income', href: '/reports/income', icon: Receipt, tone: 'border-t-success' },
  { key: 'money', href: '/reports/money', icon: Banknote, tone: 'border-t-warning' },
  { key: 'history', href: '/reports/history', icon: History, tone: 'border-t-fg-muted' },
] as const;

export function ReportsIndex() {
  const t = useTranslations('reports');
  return (
    <>
      <PageHeader
        elementId="reports"
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map(({ key, href, icon: Icon, tone }) => (
          <FeedbackPin key={key} elementId={`reports.card.${key}`}>
            <Link href={href} className="block">
              <Card className={`border-t-[3px] ${tone} transition-shadow hover:shadow-md`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary-700" />
                    {t(`${key}.title` as const)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-fg-muted">
                    {t(`${key}.subtitle` as const)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </FeedbackPin>
        ))}
      </div>
    </>
  );
}
