'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';
import { clients } from '@/lib/api/clients';
import { pickups } from '@/lib/api/pickups';
import type { Client } from '@/lib/types/client';
import { formatEgp } from '@/lib/format/currency';
import { formatInt } from '@/lib/format/numbers';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';
import { DateRangeControl, daysAgoISO, todayISO } from './DateRangeControl';

interface MerchantIncome {
  client: Client;
  orders: number;
  shippingRevenue: number;
  codHandled: number;
}

export function IncomeReport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [range, setRange] = useState({ from: daysAgoISO(30), to: todayISO() });

  const { data, isLoading } = useQuery({
    queryKey: ['income-report', range],
    queryFn: () =>
      pickups.list({
        date_from: range.from + 'T00:00:00Z',
        date_to: range.to + 'T23:59:59Z',
        status: ['delivered'],
        page: 1,
        page_size: 5000,
      }),
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

  /**
   * "Income" = shipping_fee summed across delivered pickups in range.
   * COD handled is a secondary KPI — it's not revenue, but it's what
   * the merchant is owed back. Both views useful on the same page.
   */
  const aggregated = useMemo<MerchantIncome[]>(() => {
    const map = new Map<string, MerchantIncome>();
    for (const p of data?.rows ?? []) {
      const c = clientMap.get(p.client_id);
      if (!c) continue;
      const acc = map.get(p.client_id) ?? {
        client: c,
        orders: 0,
        shippingRevenue: 0,
        codHandled: 0,
      };
      acc.orders += 1;
      acc.shippingRevenue += p.shipping_fee;
      acc.codHandled += p.cod_amount;
      map.set(p.client_id, acc);
    }
    return [...map.values()].sort(
      (a, b) => b.shippingRevenue - a.shippingRevenue,
    );
  }, [data, clientMap]);

  const totals = aggregated.reduce(
    (acc, m) => ({
      orders: acc.orders + m.orders,
      revenue: acc.revenue + m.shippingRevenue,
      cod: acc.cod + m.codHandled,
    }),
    { orders: 0, revenue: 0, cod: 0 },
  );

  const columns: DataTableColumn<MerchantIncome>[] = [
    {
      id: 'merchant',
      header: t('reports.income.columns.merchant'),
      cell: (m) => (
        <span className="font-semibold">{pickLocale(m.client.name, locale)}</span>
      ),
    },
    {
      id: 'orders',
      header: t('reports.income.columns.orders'),
      cell: (m) => formatInt(m.orders, locale),
      width: '90px',
    },
    {
      id: 'revenue',
      header: t('reports.income.columns.revenue'),
      cell: (m) => (
        <span className="font-bold text-success">
          {formatEgp(m.shippingRevenue, locale)}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'avgPerOrder',
      header: t('reports.income.columns.avgPerOrder'),
      cell: (m) => formatEgp(Math.round(m.shippingRevenue / m.orders), locale),
      width: '130px',
    },
    {
      id: 'codHandled',
      header: t('reports.income.columns.codHandled'),
      cell: (m) => (
        <span className="text-fg-muted">{formatEgp(m.codHandled, locale)}</span>
      ),
      width: '140px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="reports.income"
        title={t('reports.income.title')}
        subtitle={t('reports.income.subtitle')}
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
        elementId="reports.income.range"
        from={range.from}
        to={range.to}
        onChange={setRange}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="reports.income.kpi.revenue"
          label={t('reports.income.kpi.revenue')}
          value={isLoading ? '…' : formatEgp(totals.revenue, locale)}
          tone="success"
        />
        <KpiCard
          elementId="reports.income.kpi.orders"
          label={t('reports.income.kpi.orders')}
          value={isLoading ? '…' : formatInt(totals.orders, locale)}
          tone="primary"
        />
        <KpiCard
          elementId="reports.income.kpi.codHandled"
          label={t('reports.income.kpi.codHandled')}
          value={isLoading ? '…' : formatEgp(totals.cod, locale)}
          tone="info"
        />
      </div>

      <DataTable
        elementId="reports.income.table"
        columns={columns}
        rows={aggregated}
        isLoading={isLoading}
        rowKey={(r) => r.client.id}
      />
    </>
  );
}
