'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { cities } from '@/lib/api/cities';
import { districts } from '@/lib/api/districts';
import { governorates } from '@/lib/api/governorates';
import type { City } from '@/lib/types/city';
import type { District } from '@/lib/types/district';
import type { Governorate } from '@/lib/types/governorate';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

export function CitiesList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [govFilter, setGovFilter] = useState<string>('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: () => cities.list(),
  });
  const { data: govList } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governorates.list(),
  });
  const { data: districtList } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districts.list(),
  });

  const govMap = useMemo(() => {
    const m = new Map<string, Governorate>();
    (govList ?? []).forEach((g) => m.set(g.id, g));
    return m;
  }, [govList]);

  /** Per-city district count. */
  const districtsByCity = useMemo(() => {
    const m = new Map<string, District[]>();
    (districtList ?? []).forEach((d) => {
      const arr = m.get(d.city_id) ?? [];
      arr.push(d);
      m.set(d.city_id, arr);
    });
    return m;
  }, [districtList]);

  const filtered = (list ?? []).filter((c) => {
    if (govFilter && c.governorate_id !== govFilter) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      c.name.ar.toLowerCase().includes(n) ||
      c.name.en.toLowerCase().includes(n) ||
      c.code.toLowerCase().includes(n)
    );
  });

  const activeCount = (list ?? []).filter((c) => c.is_active).length;
  const coveredGovernorates = new Set((list ?? []).map((c) => c.governorate_id))
    .size;

  const columns: DataTableColumn<City>[] = [
    {
      id: 'name',
      header: t('cities.columns.name'),
      cell: (c) => (
        <span className="font-semibold">{pickLocale(c.name, locale)}</span>
      ),
    },
    {
      id: 'code',
      header: t('cities.columns.code'),
      cell: (c) => (
        <span className="font-mono text-[11px] font-bold text-primary-700">
          {c.code}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'governorate',
      header: t('cities.columns.governorate'),
      cell: (c) => {
        const g = govMap.get(c.governorate_id);
        return g ? pickLocale(g.name, locale) : c.governorate_id;
      },
    },
    {
      id: 'districts',
      header: t('cities.columns.districts'),
      cell: (c) => (
        <span className="font-semibold text-primary-700">
          {districtsByCity.get(c.id)?.length ?? 0}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'status',
      header: t('cities.columns.status'),
      cell: (c) => (
        <Badge tone={c.is_active ? 'success' : 'neutral'}>
          {t(`cities.status.${c.is_active ? 'active' : 'inactive'}` as const)}
        </Badge>
      ),
      width: '90px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="cities"
        title={t('cities.title')}
        subtitle={t('cities.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="cities.kpi.total"
          label={t('cities.kpi.total')}
          value={list?.length ?? 0}
          tone="primary"
        />
        <KpiCard
          elementId="cities.kpi.active"
          label={t('cities.kpi.active')}
          value={activeCount}
          tone="success"
        />
        <KpiCard
          elementId="cities.kpi.governorates"
          label={t('cities.kpi.governorates')}
          value={coveredGovernorates}
          tone="info"
        />
      </div>

      <FilterBar
        elementId="cities.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('cities.filters.search')}
      >
        <FeedbackPin elementId="cities.filters.governorate">
          <div className="min-w-[180px]">
            <Select
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
            >
              <option value="">{t('cities.filters.allGovernorates')}</option>
              {(govList ?? []).map((g) => (
                <option key={g.id} value={g.id}>
                  {pickLocale(g.name, locale)}
                </option>
              ))}
            </Select>
          </div>
        </FeedbackPin>
      </FilterBar>

      <DataTable
        elementId="cities.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
