'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { PayoutModal } from './PayoutModal';
import { codDues } from '@/lib/api/cod-dues';
import { clients } from '@/lib/api/clients';
import type { CodDue } from '@/lib/types/cod-due';
import type { Client } from '@/lib/types/client';
import { formatEgp } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

export function CodList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [payingFor, setPayingFor] = useState<{
    due: CodDue;
    client: Client | null;
  } | null>(null);

  const { data: dues, isLoading } = useQuery({
    queryKey: ['cod-dues'],
    queryFn: () => codDues.list(),
  });
  const { data: clientsList } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clients.list(),
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, Client>();
    (clientsList ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [clientsList]);

  const filtered = (dues ?? []).filter((d) => {
    if (!search) return true;
    const c = clientMap.get(d.client_id);
    const n = search.toLowerCase();
    return (
      d.code.toLowerCase().includes(n) ||
      c?.name.ar.toLowerCase().includes(n) ||
      c?.name.en.toLowerCase().includes(n) ||
      c?.phone_primary.includes(n)
    );
  });

  const dueTotal = filtered
    .filter((d) => d.status !== 'paid')
    .reduce((a, d) => a + Math.max(0, d.net_amount_due), 0);
  const paidTotal = filtered
    .filter((d) => d.status === 'paid')
    .reduce((a, d) => a + d.net_amount_due, 0);
  const pendingClients = new Set(
    filtered.filter((d) => d.status !== 'paid').map((d) => d.client_id),
  ).size;

  const columns: DataTableColumn<CodDue>[] = [
    {
      id: 'client',
      header: t('cod.columns.client'),
      cell: (d) => {
        const c = clientMap.get(d.client_id);
        return c ? pickLocale(c.name, locale) : d.client_id;
      },
    },
    {
      id: 'code',
      header: t('cod.columns.code'),
      cell: (d) => (
        <span className="font-mono text-xs font-bold text-primary-700">
          {d.code}
        </span>
      ),
      width: '110px',
    },
    {
      id: 'phone',
      header: t('cod.columns.phone'),
      cell: (d) => {
        const c = clientMap.get(d.client_id);
        return c ? (
          <span className="font-mono text-[11px]">
            {formatEgyptianMobile(c.phone_primary)}
          </span>
        ) : (
          '—'
        );
      },
      defaultHidden: true,
    },
    {
      id: 'amount',
      header: t('cod.columns.amount'),
      cell: (d) => (
        <span className="font-bold">{formatEgp(d.net_amount_due, locale)}</span>
      ),
      width: '120px',
    },
    {
      id: 'orders',
      header: t('cod.columns.orders'),
      cell: (d) => d.orders_count,
      width: '80px',
    },
    {
      id: 'method',
      header: t('cod.columns.method'),
      cell: (d) =>
        d.payment_method ? t(`paymentMethods.${d.payment_method}` as const) : '—',
      defaultHidden: true,
    },
    {
      id: 'dueDate',
      header: t('cod.columns.dueDate'),
      cell: (d) =>
        d.scheduled_payout_date ? formatDate(d.scheduled_payout_date, locale) : '—',
      width: '110px',
    },
    {
      id: 'status',
      header: t('cod.columns.status'),
      cell: (d) => <StatusBadge kind="cod" status={d.status} />,
      width: '110px',
    },
    {
      id: 'action',
      header: t('cod.columns.action'),
      cell: (d) =>
        d.status !== 'paid' ? (
          <FeedbackPin elementId="cod.row.pay">
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                setPayingFor({
                  due: d,
                  client: clientMap.get(d.client_id) ?? null,
                })
              }
            >
              {t('cod.actions.pay')}
            </Button>
          </FeedbackPin>
        ) : (
          <span className="text-[11px] text-success font-semibold">
            {t('cod.actions.paid')}
          </span>
        ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="cod"
        title={t('cod.title')}
        subtitle={t('cod.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="cod.kpi.due"
          label={t('cod.kpi.due')}
          value={formatEgp(dueTotal, locale)}
          tone="warning"
        />
        <KpiCard
          elementId="cod.kpi.paid"
          label={t('cod.kpi.paid')}
          value={formatEgp(paidTotal, locale)}
          tone="success"
        />
        <KpiCard
          elementId="cod.kpi.pending"
          label={t('cod.kpi.pending')}
          value={pendingClients.toString()}
          tone="danger"
        />
      </div>

      <FilterBar
        elementId="cod.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('common.search')}
      />

      <DataTable
        elementId="cod.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      <PayoutModal
        due={payingFor?.due ?? null}
        client={payingFor?.client ?? null}
        onClose={() => setPayingFor(null)}
      />
    </>
  );
}
