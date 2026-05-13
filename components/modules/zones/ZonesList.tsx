'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar, FilterPill } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { branches } from '@/lib/api/branches';
import { governorates } from '@/lib/api/governorates';
import { zones } from '@/lib/api/zones';
import type { Branch } from '@/lib/types/branch';
import type { Governorate } from '@/lib/types/governorate';
import type { Zone } from '@/lib/types/zone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

export function ZonesList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState<'all' | 'active' | 'inactive'>(
    'all',
  );

  const { data: list, isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zones.list(),
  });
  const { data: govList } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governorates.list(),
  });
  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  const govMap = useMemo(() => {
    const m = new Map<string, Governorate>();
    (govList ?? []).forEach((g) => m.set(g.id, g));
    return m;
  }, [govList]);
  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchList]);

  const filtered = (list ?? []).filter((z) => {
    if (activeOnly === 'active' && !z.is_active) return false;
    if (activeOnly === 'inactive' && z.is_active) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      z.name.ar.toLowerCase().includes(n) ||
      z.name.en.toLowerCase().includes(n) ||
      z.code.toLowerCase().includes(n)
    );
  });

  const activeCount = (list ?? []).filter((z) => z.is_active).length;
  const engagedBranches = new Set(
    (list ?? []).flatMap((z) => z.branch_ids),
  ).size;

  const columns: DataTableColumn<Zone>[] = [
    {
      id: 'name',
      header: t('zones.columns.name'),
      cell: (z) => (
        <div className="flex items-center gap-2">
          {z.color && (
            <span
              aria-hidden
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: z.color }}
            />
          )}
          <span className="font-semibold">{pickLocale(z.name, locale)}</span>
        </div>
      ),
    },
    {
      id: 'code',
      header: t('zones.columns.code'),
      cell: (z) => (
        <span className="font-mono text-[11px] font-bold text-primary-700">
          {z.code}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'governorates',
      header: t('zones.columns.governorates'),
      cell: (z) => (
        <div className="flex flex-wrap gap-1">
          {z.governorate_ids.map((id) => {
            const g = govMap.get(id);
            return (
              <Badge key={id} tone="neutral">
                {g ? pickLocale(g.name, locale) : id}
              </Badge>
            );
          })}
        </div>
      ),
    },
    {
      id: 'branches',
      header: t('zones.columns.branches'),
      cell: (z) =>
        z.branch_ids.length === 0 ? (
          <span className="text-fg-subtle">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {z.branch_ids.map((id) => {
              const b = branchMap.get(id);
              return (
                <Badge key={id} tone="info">
                  {b ? pickLocale(b.name, locale) : id}
                </Badge>
              );
            })}
          </div>
        ),
    },
    {
      id: 'status',
      header: t('zones.columns.status'),
      cell: (z) => (
        <Badge tone={z.is_active ? 'success' : 'neutral'}>
          {t(`zones.status.${z.is_active ? 'active' : 'inactive'}` as const)}
        </Badge>
      ),
      width: '90px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="zones"
        title={t('zones.title')}
        subtitle={t('zones.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="zones.kpi.total"
          label={t('zones.kpi.total')}
          value={list?.length ?? 0}
          tone="primary"
        />
        <KpiCard
          elementId="zones.kpi.active"
          label={t('zones.kpi.active')}
          value={activeCount}
          tone="success"
        />
        <KpiCard
          elementId="zones.kpi.branches"
          label={t('zones.kpi.branches')}
          value={engagedBranches}
          tone="info"
        />
      </div>

      <FilterBar
        elementId="zones.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('zones.filters.search')}
      >
        <FilterPill
          elementId="zones.filters.all"
          active={activeOnly === 'all'}
          onClick={() => setActiveOnly('all')}
        >
          {t('zones.filters.all')}
        </FilterPill>
        <FilterPill
          elementId="zones.filters.active"
          active={activeOnly === 'active'}
          onClick={() => setActiveOnly('active')}
        >
          {t('zones.filters.active')}
        </FilterPill>
        <FilterPill
          elementId="zones.filters.inactive"
          active={activeOnly === 'inactive'}
          onClick={() => setActiveOnly('inactive')}
        >
          {t('zones.filters.inactive')}
        </FilterPill>
      </FilterBar>

      <DataTable
        elementId="zones.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
