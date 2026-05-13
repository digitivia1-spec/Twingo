'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { OrderTypeBadge } from '@/components/shared/OrderTypeBadge';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n/routing';
import { clients } from '@/lib/api/clients';
import { pickups } from '@/lib/api/pickups';
import type { Client } from '@/lib/types/client';
import type { Pickup } from '@/lib/types/pickup';
import { formatEgp } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';
import { DateRangeControl, daysAgoISO, todayISO } from './DateRangeControl';

/** Terminal states — pickups in these statuses are "archived". */
const TERMINAL = ['delivered', 'returned', 'cancelled', 'refused'] as const;

export function HistoryReport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [range, setRange] = useState({ from: daysAgoISO(90), to: todayISO() });

  const { data, isLoading } = useQuery({
    queryKey: ['history-report', range],
    queryFn: () =>
      pickups.list({
        date_from: range.from + 'T00:00:00Z',
        date_to: range.to + 'T23:59:59Z',
        status: [...TERMINAL],
        page: 1,
        page_size: 5000,
        review_status: 'all',
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

  const filtered = (data?.rows ?? []).filter((p) => {
    if (!search) return true;
    const n = search.toLowerCase();
    const c = clientMap.get(p.client_id);
    return (
      p.code.toLowerCase().includes(n) ||
      p.recipient.phone_primary.includes(n) ||
      p.recipient.name.ar.toLowerCase().includes(n) ||
      p.recipient.name.en.toLowerCase().includes(n) ||
      (c?.name.ar.toLowerCase().includes(n) ?? false) ||
      (c?.name.en.toLowerCase().includes(n) ?? false)
    );
  });

  const columns: DataTableColumn<Pickup>[] = [
    {
      id: 'code',
      header: t('reports.history.columns.code'),
      cell: (p) => (
        <Link
          href={`/pickup/${p.id}`}
          className="font-mono text-xs font-bold text-primary-700 hover:underline"
        >
          {p.code}
        </Link>
      ),
      width: '110px',
    },
    {
      id: 'merchant',
      header: t('reports.history.columns.merchant'),
      cell: (p) => {
        const c = clientMap.get(p.client_id);
        return c ? pickLocale(c.name, locale) : p.client_id;
      },
    },
    {
      id: 'type',
      header: t('reports.history.columns.type'),
      cell: (p) => <OrderTypeBadge type={p.order_type} />,
      width: '110px',
    },
    {
      id: 'recipient',
      header: t('reports.history.columns.recipient'),
      cell: (p) => pickLocale(p.recipient.name, locale),
    },
    {
      id: 'phone',
      header: t('reports.history.columns.phone'),
      cell: (p) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(p.recipient.phone_primary)}
        </span>
      ),
      width: '130px',
      defaultHidden: true,
    },
    {
      id: 'cod',
      header: t('reports.history.columns.cod'),
      cell: (p) => formatEgp(p.cod_amount, locale),
      width: '110px',
    },
    {
      id: 'status',
      header: t('reports.history.columns.status'),
      cell: (p) => <StatusBadge kind="order" status={p.status} />,
      width: '120px',
    },
    {
      id: 'closed',
      header: t('reports.history.columns.closed'),
      cell: (p) => (
        <span className="text-[11px] text-fg-muted">
          {formatDateTime(p.updated_at, locale)}
        </span>
      ),
      width: '150px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="reports.history"
        title={t('reports.history.title')}
        subtitle={t('reports.history.subtitle')}
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
        elementId="reports.history.range"
        from={range.from}
        to={range.to}
        onChange={setRange}
      />

      <FilterBar
        elementId="reports.history.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('reports.history.filters.search')}
      />

      <DataTable
        elementId="reports.history.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
