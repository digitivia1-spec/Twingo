'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';
import { clients } from '@/lib/api/clients';
import { codDues } from '@/lib/api/cod-dues';
import type { Client } from '@/lib/types/client';
import type { CodDue } from '@/lib/types/cod-due';
import { formatEgp } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { formatInt } from '@/lib/format/numbers';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';
import { DateRangeControl, daysAgoISO, todayISO } from './DateRangeControl';

export function MoneyReport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [range, setRange] = useState({ from: daysAgoISO(30), to: todayISO() });

  const { data: dues, isLoading } = useQuery({
    queryKey: ['cod-dues'],
    queryFn: () => codDues.list(),
  });
  const { data: clientList } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clients.list(),
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, Client>();
    (clientList ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [clientList]);

  const inRange = useMemo(
    () =>
      (dues ?? []).filter(
        (d) =>
          d.accrual_period_end >= range.from &&
          d.accrual_period_start <= range.to,
      ),
    [dues, range],
  );

  const totals = useMemo(() => {
    let collected = 0;
    let paidOut = 0;
    let pending = 0;
    let disputed = 0;
    for (const d of inRange) {
      collected += d.gross_cod_collected;
      if (d.status === 'paid') paidOut += d.net_amount_due;
      else if (d.status === 'disputed') disputed += d.net_amount_due;
      else pending += Math.max(0, d.net_amount_due);
    }
    return { collected, paidOut, pending, disputed };
  }, [inRange]);

  const columns: DataTableColumn<CodDue>[] = [
    {
      id: 'code',
      header: t('reports.money.columns.code'),
      cell: (d) => (
        <span className="font-mono text-xs font-bold text-primary-700">
          {d.code}
        </span>
      ),
      width: '120px',
    },
    {
      id: 'merchant',
      header: t('reports.money.columns.merchant'),
      cell: (d) => {
        const c = clientMap.get(d.client_id);
        return c ? pickLocale(c.name, locale) : d.client_id;
      },
    },
    {
      id: 'period',
      header: t('reports.money.columns.period'),
      cell: (d) =>
        `${formatDate(d.accrual_period_start, locale)} – ${formatDate(
          d.accrual_period_end,
          locale,
        )}`,
      width: '180px',
    },
    {
      id: 'orders',
      header: t('reports.money.columns.orders'),
      cell: (d) => formatInt(d.orders_count, locale),
      width: '80px',
    },
    {
      id: 'gross',
      header: t('reports.money.columns.gross'),
      cell: (d) => formatEgp(d.gross_cod_collected, locale),
      width: '130px',
    },
    {
      id: 'fees',
      header: t('reports.money.columns.fees'),
      cell: (d) => (
        <span className="text-fg-muted">
          {formatEgp(d.shipping_fees_deducted, locale)}
        </span>
      ),
      width: '130px',
      defaultHidden: true,
    },
    {
      id: 'net',
      header: t('reports.money.columns.net'),
      cell: (d) => (
        <span className="font-bold text-primary-700">
          {formatEgp(d.net_amount_due, locale)}
        </span>
      ),
      width: '130px',
    },
    {
      id: 'status',
      header: t('reports.money.columns.status'),
      cell: (d) => <StatusBadge kind="cod" status={d.status} />,
      width: '110px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="reports.money"
        title={t('reports.money.title')}
        subtitle={t('reports.money.subtitle')}
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
        elementId="reports.money.range"
        from={range.from}
        to={range.to}
        onChange={setRange}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="reports.money.kpi.collected"
          label={t('reports.money.kpi.collected')}
          value={isLoading ? '…' : formatEgp(totals.collected, locale)}
          tone="primary"
        />
        <KpiCard
          elementId="reports.money.kpi.paidOut"
          label={t('reports.money.kpi.paidOut')}
          value={isLoading ? '…' : formatEgp(totals.paidOut, locale)}
          tone="success"
        />
        <KpiCard
          elementId="reports.money.kpi.pending"
          label={t('reports.money.kpi.pending')}
          value={isLoading ? '…' : formatEgp(totals.pending, locale)}
          tone="warning"
        />
        <KpiCard
          elementId="reports.money.kpi.disputed"
          label={t('reports.money.kpi.disputed')}
          value={isLoading ? '…' : formatEgp(totals.disputed, locale)}
          tone="danger"
        />
      </div>

      <DataTable
        elementId="reports.money.table"
        columns={columns}
        rows={inRange}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
