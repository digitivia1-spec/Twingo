'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { OrderTypeBadge } from '@/components/shared/OrderTypeBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { Link } from '@/lib/i18n/routing';
import { branches } from '@/lib/api/branches';
import { pickups } from '@/lib/api/pickups';
import type { Branch } from '@/lib/types/branch';
import {
  ORDER_STATUSES,
  ORDER_TYPES,
  type OrderStatus,
  type OrderType,
} from '@/lib/types/enums';
import { formatEgp } from '@/lib/format/currency';
import { formatInt } from '@/lib/format/numbers';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';
import { DateRangeControl, daysAgoISO, todayISO } from './DateRangeControl';

export function OrdersReport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [range, setRange] = useState({ from: daysAgoISO(30), to: todayISO() });

  const { data, isLoading } = useQuery({
    queryKey: ['orders-report', range],
    queryFn: () =>
      pickups.list({
        date_from: range.from + 'T00:00:00Z',
        date_to: range.to + 'T23:59:59Z',
        page: 1,
        page_size: 5000,
        review_status: 'all',
      }),
  });

  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchList]);

  const rows = data?.rows ?? [];

  /** Counts and totals computed once on each data refresh. */
  const stats = useMemo(() => {
    const byStatus = new Map<OrderStatus, number>();
    const byType = new Map<OrderType, number>();
    const byBranch = new Map<string, number>();
    let totalCod = 0;
    let collectedCod = 0;
    let delivered = 0;
    for (const p of rows) {
      byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
      const ot = p.order_type ?? 'forward';
      byType.set(ot, (byType.get(ot) ?? 0) + 1);
      byBranch.set(p.branch_id, (byBranch.get(p.branch_id) ?? 0) + 1);
      totalCod += p.cod_amount;
      if (p.status === 'delivered') {
        collectedCod += p.cod_amount;
        delivered++;
      }
    }
    return { byStatus, byType, byBranch, totalCod, collectedCod, delivered };
  }, [rows]);

  const successRate = rows.length
    ? Math.round((stats.delivered / rows.length) * 100)
    : 0;

  return (
    <>
      <PageHeader
        elementId="reports.orders"
        title={t('reports.orders.title')}
        subtitle={t('reports.orders.subtitle')}
        actions={
          <Link href="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              {t('common.back')}
            </Button>
          </Link>
        }
      />

      <DateRangeControl
        elementId="reports.orders.range"
        from={range.from}
        to={range.to}
        onChange={setRange}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="reports.orders.kpi.total"
          label={t('reports.orders.kpi.total')}
          value={isLoading ? '…' : formatInt(rows.length, locale)}
          tone="primary"
        />
        <KpiCard
          elementId="reports.orders.kpi.delivered"
          label={t('reports.orders.kpi.delivered')}
          value={isLoading ? '…' : formatInt(stats.delivered, locale)}
          sub={`${successRate}% ${t('reports.orders.kpi.successRate')}`}
          tone="success"
        />
        <KpiCard
          elementId="reports.orders.kpi.totalCod"
          label={t('reports.orders.kpi.totalCod')}
          value={isLoading ? '…' : formatEgp(stats.totalCod, locale)}
          tone="info"
        />
        <KpiCard
          elementId="reports.orders.kpi.collectedCod"
          label={t('reports.orders.kpi.collectedCod')}
          value={isLoading ? '…' : formatEgp(stats.collectedCod, locale)}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <FeedbackPin elementId="reports.orders.byStatus">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.orders.byStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ORDER_STATUSES.map((s) => {
                const count = stats.byStatus.get(s) ?? 0;
                const pct = rows.length
                  ? Math.round((count / rows.length) * 100)
                  : 0;
                return (
                  <div
                    key={s}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge kind="order" status={s} />
                      <span className="text-[11px] text-fg-muted">
                        {pct}%
                      </span>
                    </div>
                    <span className="font-mono font-bold text-fg">
                      {formatInt(count, locale)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </FeedbackPin>

        <FeedbackPin elementId="reports.orders.byType">
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.orders.byType')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ORDER_TYPES.map((ot) => {
                const count = stats.byType.get(ot) ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={ot}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
                  >
                    <OrderTypeBadge type={ot} />
                    <span className="font-mono font-bold text-fg">
                      {formatInt(count, locale)}
                    </span>
                  </div>
                );
              })}
              {[...stats.byType.values()].every((v) => v === 0) && (
                <p className="text-center text-[11px] text-fg-subtle py-4">
                  {t('common.empty')}
                </p>
              )}
            </CardContent>
          </Card>
        </FeedbackPin>

        <FeedbackPin elementId="reports.orders.byBranch">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t('reports.orders.byBranch')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[...stats.byBranch.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([branchId, count]) => {
                  const branch = branchMap.get(branchId);
                  const pct = rows.length
                    ? Math.round((count / rows.length) * 100)
                    : 0;
                  return (
                    <div
                      key={branchId}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-hover"
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold">
                          {branch ? pickLocale(branch.name, locale) : branchId}
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                          <div
                            className="h-full bg-primary-700"
                            style={{ width: `${pct}%` }}
                            aria-hidden
                          />
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="font-mono font-bold">
                          {formatInt(count, locale)}
                        </div>
                        <div className="text-[10px] text-fg-muted">{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              {stats.byBranch.size === 0 && (
                <p className="text-center text-[11px] text-fg-subtle py-4">
                  {t('common.empty')}
                </p>
              )}
            </CardContent>
          </Card>
        </FeedbackPin>
      </div>
    </>
  );
}
