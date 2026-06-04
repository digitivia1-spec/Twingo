'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail, MapPin, Package, Upload, Wallet } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar, FilterPill } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { Link } from '@/lib/i18n/routing';
import { branches } from '@/lib/api/branches';
import { clients } from '@/lib/api/clients';
import { codDues } from '@/lib/api/cod-dues';
import { pickups } from '@/lib/api/pickups';
import type { Branch } from '@/lib/types/branch';
import type { Client } from '@/lib/types/client';
import { formatEgp } from '@/lib/format/currency';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

type ActiveFilter = 'all' | 'active' | 'inactive';

export function ClientsList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');

  const { data: list, isLoading } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clients.list(),
  });
  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });
  const { data: dues } = useQuery({
    queryKey: ['cod-dues'],
    queryFn: () => codDues.list(),
  });
  const { data: pk } = useQuery({
    queryKey: ['pickups-all'],
    queryFn: () => pickups.list({ page: 1, page_size: 1000 }),
  });

  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchList]);

  /** Per-merchant: outstanding (un-paid) COD net amount, summed across due rows. */
  const codOwedByClient = useMemo(() => {
    const m = new Map<string, number>();
    (dues ?? [])
      .filter((d) => d.status !== 'paid')
      .forEach((d) =>
        m.set(d.client_id, (m.get(d.client_id) ?? 0) + Math.max(0, d.net_amount_due)),
      );
    return m;
  }, [dues]);

  /** Per-merchant: live order count. */
  const ordersByClient = useMemo(() => {
    const m = new Map<string, number>();
    (pk?.rows ?? []).forEach((p) =>
      m.set(p.client_id, (m.get(p.client_id) ?? 0) + 1),
    );
    return m;
  }, [pk]);

  const filtered = (list ?? []).filter((c) => {
    if (activeFilter === 'active' && !c.is_active) return false;
    if (activeFilter === 'inactive' && c.is_active) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      c.name.ar.toLowerCase().includes(n) ||
      c.name.en.toLowerCase().includes(n) ||
      c.phone_primary.includes(n) ||
      (c.email?.toLowerCase().includes(n) ?? false)
    );
  });

  const totalActive = (list ?? []).filter((c) => c.is_active).length;
  const totalOrders = (pk?.rows ?? []).length;
  const totalCodOwed = Array.from(codOwedByClient.values()).reduce(
    (a, b) => a + b,
    0,
  );
  // Onboarded recently = last 30 days (Cairo time approximation via ISO date string compare).
  const cutoff = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const newCount = (list ?? []).filter((c) => c.created_at >= cutoff).length;

  const columns: DataTableColumn<Client>[] = [
    {
      id: 'name',
      header: t('clients.columns.name'),
      cell: (c) => (
        <div className="flex flex-col">
          <span className="font-semibold">{pickLocale(c.name, locale)}</span>
          {c.business_name && (
            <span className="text-[11px] text-fg-muted">
              {pickLocale(c.business_name, locale)}
            </span>
          )}
        </div>
      ),
      width: '220px',
    },
    {
      id: 'phone',
      header: t('clients.columns.phone'),
      cell: (c) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(c.phone_primary)}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'email',
      header: t('clients.columns.email'),
      cell: (c) =>
        c.email ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-fg-muted">
            <Mail className="h-3 w-3" />
            {c.email}
          </span>
        ) : (
          '—'
        ),
      defaultHidden: true,
    },
    {
      id: 'branch',
      header: t('clients.columns.branch'),
      cell: (c) => {
        const b = branchMap.get(c.preferred_branch_id);
        return b ? (
          <span className="inline-flex items-center gap-1 text-[11px]">
            <MapPin className="h-3 w-3 text-fg-subtle" />
            {pickLocale(b.name, locale)}
          </span>
        ) : (
          '—'
        );
      },
    },
    {
      id: 'orders',
      header: t('clients.columns.orders'),
      cell: (c) => (
        <span className="font-bold text-primary-700">
          {ordersByClient.get(c.id) ?? c.total_orders ?? 0}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'codOwed',
      header: t('clients.columns.codOwed'),
      cell: (c) => {
        const owed = codOwedByClient.get(c.id) ?? 0;
        return owed > 0 ? (
          <span className="font-bold text-warning">
            {formatEgp(owed, locale)}
          </span>
        ) : (
          <span className="text-fg-subtle">—</span>
        );
      },
      width: '130px',
    },
    {
      id: 'frequency',
      header: t('clients.columns.frequency'),
      cell: (c) => t(`clients.frequency.${c.payment_terms.frequency}` as const),
      defaultHidden: true,
    },
    {
      id: 'method',
      header: t('clients.columns.method'),
      cell: (c) =>
        t(`paymentMethods.${c.payment_terms.method}` as const),
      defaultHidden: true,
    },
    {
      id: 'status',
      header: t('clients.columns.status'),
      cell: (c) => (
        <Badge tone={c.is_active ? 'success' : 'neutral'}>
          {t(`clients.status.${c.is_active ? 'active' : 'inactive'}` as const)}
        </Badge>
      ),
      width: '90px',
    },
    {
      id: 'actions',
      header: t('clients.columns.actions'),
      cell: (c) => (
        <div className="flex items-center gap-1">
          <FeedbackPin elementId="clients.row.orders">
            <Link
              href={`/pickup?client_id=${c.id}`}
              className="inline-flex items-center gap-1 rounded-lg bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-bold text-[#475569] transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <Package className="h-3 w-3" />
              {t('clients.actions.viewOrders')}
            </Link>
          </FeedbackPin>
          <FeedbackPin elementId="clients.row.balance">
            <Link
              href={`/cod?client_id=${c.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold text-fg-muted transition-colors hover:bg-primary-50 hover:text-primary-700"
            >
              <Wallet className="h-3 w-3" />
              {t('clients.actions.viewBalance')}
            </Link>
          </FeedbackPin>
        </div>
      ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="clients"
        title={t('clients.title')}
        subtitle={t('clients.subtitle')}
        actions={
          <FeedbackPin elementId="clients.header.import">
            <Link href="clients/import">
              <Button variant="secondary" size="md">
                <Upload className="h-3.5 w-3.5" />
                {t('common.import')}
              </Button>
            </Link>
          </FeedbackPin>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="clients.kpi.total"
          label={t('clients.kpi.total')}
          value={totalActive}
          tone="primary"
        />
        <KpiCard
          elementId="clients.kpi.totalOrders"
          label={t('clients.kpi.totalOrders')}
          value={totalOrders}
          tone="info"
        />
        <KpiCard
          elementId="clients.kpi.codOwed"
          label={t('clients.kpi.codOwed')}
          value={formatEgp(totalCodOwed, locale)}
          tone="warning"
        />
        <KpiCard
          elementId="clients.kpi.newThisMonth"
          label={t('clients.kpi.newThisMonth')}
          value={newCount}
          tone="success"
        />
      </div>

      <FilterBar
        elementId="clients.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('clients.filters.search')}
      >
        <FilterPill
          elementId="clients.filters.all"
          active={activeFilter === 'all'}
          onClick={() => setActiveFilter('all')}
        >
          {t('clients.filters.all')}
        </FilterPill>
        <FilterPill
          elementId="clients.filters.active"
          active={activeFilter === 'active'}
          onClick={() => setActiveFilter('active')}
        >
          {t('clients.filters.active')}
        </FilterPill>
        <FilterPill
          elementId="clients.filters.inactive"
          active={activeFilter === 'inactive'}
          onClick={() => setActiveFilter('inactive')}
        >
          {t('clients.filters.inactive')}
        </FilterPill>
      </FilterBar>

      <DataTable
        elementId="clients.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
