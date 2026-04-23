'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { pickups } from '@/lib/api/pickups';
import { stock } from '@/lib/api/stock';
import { driverShifts } from '@/lib/api/driver-shifts';
import { codDues } from '@/lib/api/cod-dues';
import { users } from '@/lib/api/users';
import { formatEgp } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';
import { formatInt } from '@/lib/format/numbers';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function DashboardContent() {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const { data: dash } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const [pk, st, cd, drs] = await Promise.all([
        pickups.list({ page: 1, page_size: 500 }),
        stock.list(),
        codDues.list(),
        users.list({ role: 'driver' }),
      ]);
      return { pk, st, cd, drs };
    },
  });

  const totalOrders = dash?.pk.total ?? 0;
  const deliveredCod = (dash?.pk.rows ?? [])
    .filter((p) => p.status === 'delivered')
    .reduce((a, p) => a + p.cod_amount, 0);
  const pendingCod = (dash?.cd ?? [])
    .filter((d) => d.status !== 'paid')
    .reduce((a, d) => a + Math.max(0, d.net_amount_due), 0);
  const lockedStock = (dash?.st ?? []).filter((s) => s.status === 'locked');
  const totalUnits = (dash?.st ?? []).reduce((a, s) => a + s.quantity, 0);
  const activeDrivers = (dash?.drs ?? []).filter((d) => d.is_active).length;

  const recent = (dash?.pk.rows ?? []).slice(0, 5);

  return (
    <>
      <PageHeader
        elementId="dashboard"
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          elementId="dashboard.kpi.orders"
          label={t('dashboard.kpi.orders')}
          value={formatInt(totalOrders, locale)}
          tone="primary"
          href="pickup"
        />
        <KpiCard
          elementId="dashboard.kpi.collected"
          label={t('dashboard.kpi.collected')}
          value={formatEgp(deliveredCod, locale)}
          tone="success"
          href="finance"
        />
        <KpiCard
          elementId="dashboard.kpi.pending"
          label={t('dashboard.kpi.pending')}
          value={formatEgp(pendingCod, locale)}
          tone="warning"
          href="cod"
        />
        <KpiCard
          elementId="dashboard.kpi.locked"
          label={t('dashboard.kpi.locked')}
          value={formatInt(lockedStock.length, locale)}
          sub={t('stock.kpi.lockedNeedsAction')}
          tone="danger"
          href="stock?status=locked"
        />
        <KpiCard
          elementId="dashboard.kpi.units"
          label={t('dashboard.kpi.units')}
          value={formatInt(totalUnits, locale)}
          tone="info"
        />
        <KpiCard
          elementId="dashboard.kpi.drivers"
          label={t('dashboard.kpi.drivers')}
          value={formatInt(activeDrivers, locale)}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeedbackPin elementId="dashboard.section.recentPickups">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary-700" />
                {t('dashboard.recentPickups')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recent.map((p) => (
                <FeedbackPin
                  key={p.id}
                  elementId="dashboard.recentRow"
                  className="block"
                >
                  <Link
                    href={`pickup/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-mono text-primary-700">
                        {p.code}
                      </div>
                      <div className="truncate text-xs text-fg-muted">
                        {pickLocale(p.recipient.name, locale)}
                        {' · '}
                        {formatDateTime(p.updated_at, locale)}
                      </div>
                    </div>
                    <StatusBadge kind="order" status={p.status} />
                  </Link>
                </FeedbackPin>
              ))}
            </CardContent>
          </Card>
        </FeedbackPin>

        <FeedbackPin elementId="dashboard.section.lockedWarehouse">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-danger">
                <AlertTriangle className="h-4 w-4" />
                {t('dashboard.lockedWarehouse')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FeedbackPin elementId="dashboard.lockedAlert">
                <div className="rounded-lg border border-danger bg-danger-bg/50 px-3 py-2 text-xs text-danger">
                  {t('dashboard.lockedAlert')}
                </div>
              </FeedbackPin>
              {lockedStock.map((s) => (
                <FeedbackPin
                  key={s.id}
                  elementId="dashboard.lockedRow"
                  className="block"
                >
                  <Link
                    href="stock?status=locked"
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-mono text-primary-700">
                        {s.sku}
                      </div>
                      <div className="truncate text-xs text-fg-muted">
                        {pickLocale(s.name, locale)}
                      </div>
                    </div>
                    <StatusBadge kind="stock" status={s.status} />
                  </Link>
                </FeedbackPin>
              ))}
              {lockedStock.length === 0 && (
                <div className="py-8 text-center text-xs text-fg-subtle">—</div>
              )}
            </CardContent>
          </Card>
        </FeedbackPin>
      </div>
    </>
  );
}
