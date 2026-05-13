'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { clientRates } from '@/lib/api/client-rates';
import { clients } from '@/lib/api/clients';
import { governorates } from '@/lib/api/governorates';
import type { Client } from '@/lib/types/client';
import type { ClientShippingRate } from '@/lib/types/client-rate';
import type { Governorate } from '@/lib/types/governorate';
import { formatEgp } from '@/lib/format/currency';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

export function RatesList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('');
  const [fromFilter, setFromFilter] = useState<string>('');
  const [toFilter, setToFilter] = useState<string>('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['client-rates'],
    queryFn: () => clientRates.list(),
  });
  const { data: clientList } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clients.list(),
  });
  const { data: govList } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governorates.list(),
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, Client>();
    (clientList ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [clientList]);
  const govMap = useMemo(() => {
    const m = new Map<string, Governorate>();
    (govList ?? []).forEach((g) => m.set(g.id, g));
    return m;
  }, [govList]);

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      clientRates.toggleActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-rates'] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (list ?? []).filter((r) => {
    if (merchantFilter && r.client_id !== merchantFilter) return false;
    if (fromFilter && r.from_governorate_id !== fromFilter) return false;
    if (toFilter && r.to_governorate_id !== toFilter) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    const c = clientMap.get(r.client_id);
    return (
      (c?.name.ar.toLowerCase().includes(n) ?? false) ||
      (c?.name.en.toLowerCase().includes(n) ?? false) ||
      (r.notes?.toLowerCase().includes(n) ?? false)
    );
  });

  const activeCount = (list ?? []).filter((r) => r.is_active).length;
  const merchantCount = new Set((list ?? []).map((r) => r.client_id)).size;
  const averagePrice =
    list && list.length > 0
      ? Math.round(list.reduce((a, r) => a + r.base_price, 0) / list.length)
      : 0;

  const columns: DataTableColumn<ClientShippingRate>[] = [
    {
      id: 'merchant',
      header: t('rates.columns.merchant'),
      cell: (r) => {
        const c = clientMap.get(r.client_id);
        return c ? (
          <span className="font-semibold">{pickLocale(c.name, locale)}</span>
        ) : (
          r.client_id
        );
      },
    },
    {
      id: 'lane',
      header: `${t('rates.columns.from')} → ${t('rates.columns.to')}`,
      cell: (r) => {
        const from = govMap.get(r.from_governorate_id);
        const to = govMap.get(r.to_governorate_id);
        return (
          <span className="inline-flex items-center gap-1 text-[11px]">
            <Badge tone="neutral">
              {from ? pickLocale(from.name, locale) : r.from_governorate_id}
            </Badge>
            <ArrowRight className="h-3 w-3 text-fg-subtle rtl:rotate-180" />
            <Badge tone="info">
              {to ? pickLocale(to.name, locale) : r.to_governorate_id}
            </Badge>
          </span>
        );
      },
    },
    {
      id: 'tier',
      header: t('rates.columns.tier'),
      cell: (r) =>
        t('rates.tier', {
          min: r.weight_tier.min_kg,
          max: r.weight_tier.max_kg,
        }),
      width: '110px',
    },
    {
      id: 'basePrice',
      header: t('rates.columns.basePrice'),
      cell: (r) => (
        <span className="font-bold">{formatEgp(r.base_price, locale)}</span>
      ),
      width: '120px',
    },
    {
      id: 'codPct',
      header: t('rates.columns.codPct'),
      cell: (r) =>
        r.cod_handling_fee_percent
          ? `${r.cod_handling_fee_percent}%`
          : <span className="text-fg-subtle">—</span>,
      width: '90px',
    },
    {
      id: 'fragile',
      header: t('rates.columns.fragile'),
      cell: (r) =>
        r.fragile_surcharge
          ? formatEgp(r.fragile_surcharge, locale)
          : <span className="text-fg-subtle">—</span>,
      width: '110px',
      defaultHidden: true,
    },
    {
      id: 'status',
      header: t('rates.columns.status'),
      cell: (r) => (
        <Badge tone={r.is_active ? 'success' : 'neutral'}>
          {t(`rates.status.${r.is_active ? 'active' : 'inactive'}` as const)}
        </Badge>
      ),
      width: '90px',
    },
    {
      id: 'actions',
      header: t('rates.columns.actions'),
      cell: (r) => (
        <FeedbackPin elementId="rates.row.toggle">
          <Button
            size="xs"
            variant={r.is_active ? 'secondary' : 'success'}
            disabled={toggle.isPending}
            onClick={() =>
              toggle.mutate({ id: r.id, is_active: !r.is_active })
            }
          >
            {t(
              `rates.actions.${r.is_active ? 'deactivate' : 'activate'}` as const,
            )}
          </Button>
        </FeedbackPin>
      ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="rates"
        title={t('rates.title')}
        subtitle={t('rates.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="rates.kpi.total"
          label={t('rates.kpi.total')}
          value={list?.length ?? 0}
          tone="primary"
        />
        <KpiCard
          elementId="rates.kpi.active"
          label={t('rates.kpi.active')}
          value={activeCount}
          tone="success"
        />
        <KpiCard
          elementId="rates.kpi.merchants"
          label={t('rates.kpi.merchants')}
          value={merchantCount}
          tone="info"
        />
        <KpiCard
          elementId="rates.kpi.averagePrice"
          label={t('rates.kpi.averagePrice')}
          value={formatEgp(averagePrice, locale)}
          tone="warning"
        />
      </div>

      <FilterBar
        elementId="rates.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('rates.filters.search')}
      >
        <FeedbackPin elementId="rates.filters.merchant">
          <div className="min-w-[180px]">
            <Select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
            >
              <option value="">{t('rates.filters.allMerchants')}</option>
              {(clientList ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {pickLocale(c.name, locale)}
                </option>
              ))}
            </Select>
          </div>
        </FeedbackPin>
        <div className="min-w-[160px]">
          <Select
            value={fromFilter}
            onChange={(e) => setFromFilter(e.target.value)}
          >
            <option value="">{t('rates.filters.allFrom')}</option>
            {(govList ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {pickLocale(g.name, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Select
            value={toFilter}
            onChange={(e) => setToFilter(e.target.value)}
          >
            <option value="">{t('rates.filters.allTo')}</option>
            {(govList ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                {pickLocale(g.name, locale)}
              </option>
            ))}
          </Select>
        </div>
      </FilterBar>

      <DataTable
        elementId="rates.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
