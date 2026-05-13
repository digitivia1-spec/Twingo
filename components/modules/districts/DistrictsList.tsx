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

export function DistrictsList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['districts'],
    queryFn: () => districts.list(),
  });
  const { data: cityList } = useQuery({
    queryKey: ['cities'],
    queryFn: () => cities.list(),
  });
  const { data: govList } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governorates.list(),
  });

  const cityMap = useMemo(() => {
    const m = new Map<string, City>();
    (cityList ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [cityList]);
  const govMap = useMemo(() => {
    const m = new Map<string, Governorate>();
    (govList ?? []).forEach((g) => m.set(g.id, g));
    return m;
  }, [govList]);

  const filtered = (list ?? []).filter((d) => {
    if (cityFilter && d.city_id !== cityFilter) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      d.name.ar.toLowerCase().includes(n) ||
      d.name.en.toLowerCase().includes(n) ||
      d.code.toLowerCase().includes(n)
    );
  });

  const activeCount = (list ?? []).filter((d) => d.is_active).length;
  const coveredCities = new Set((list ?? []).map((d) => d.city_id)).size;

  const columns: DataTableColumn<District>[] = [
    {
      id: 'name',
      header: t('districts.columns.name'),
      cell: (d) => (
        <span className="font-semibold">{pickLocale(d.name, locale)}</span>
      ),
    },
    {
      id: 'code',
      header: t('districts.columns.code'),
      cell: (d) => (
        <span className="font-mono text-[11px] font-bold text-primary-700">
          {d.code}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'city',
      header: t('districts.columns.city'),
      cell: (d) => {
        const c = cityMap.get(d.city_id);
        return c ? pickLocale(c.name, locale) : d.city_id;
      },
    },
    {
      id: 'governorate',
      header: t('districts.columns.governorate'),
      cell: (d) => {
        const c = cityMap.get(d.city_id);
        if (!c) return '—';
        const g = govMap.get(c.governorate_id);
        return g ? pickLocale(g.name, locale) : c.governorate_id;
      },
      defaultHidden: true,
    },
    {
      id: 'status',
      header: t('districts.columns.status'),
      cell: (d) => (
        <Badge tone={d.is_active ? 'success' : 'neutral'}>
          {t(
            `districts.status.${d.is_active ? 'active' : 'inactive'}` as const,
          )}
        </Badge>
      ),
      width: '90px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="districts"
        title={t('districts.title')}
        subtitle={t('districts.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="districts.kpi.total"
          label={t('districts.kpi.total')}
          value={list?.length ?? 0}
          tone="primary"
        />
        <KpiCard
          elementId="districts.kpi.active"
          label={t('districts.kpi.active')}
          value={activeCount}
          tone="success"
        />
        <KpiCard
          elementId="districts.kpi.cities"
          label={t('districts.kpi.cities')}
          value={coveredCities}
          tone="info"
        />
      </div>

      <FilterBar
        elementId="districts.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('districts.filters.search')}
      >
        <FeedbackPin elementId="districts.filters.city">
          <div className="min-w-[180px]">
            <Select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">{t('districts.filters.allCities')}</option>
              {(cityList ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {pickLocale(c.name, locale)}
                </option>
              ))}
            </Select>
          </div>
        </FeedbackPin>
      </FilterBar>

      <DataTable
        elementId="districts.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
