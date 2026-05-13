'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { VehicleIcon } from '@/components/shared/VehicleIcon';
import { Badge } from '@/components/ui/badge';
import { driverShifts } from '@/lib/api/driver-shifts';
import { branches } from '@/lib/api/branches';
import { users } from '@/lib/api/users';
import type { Branch } from '@/lib/types/branch';
import type { DriverShift } from '@/lib/types/driver-shift';
import type { User } from '@/lib/types/user';
import { formatDate } from '@/lib/format/date';
import { formatEgp } from '@/lib/format/currency';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

const TODAY = new Date().toISOString().slice(0, 10);

export function DriversList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['users', 'driver'],
    queryFn: () => users.list({ role: 'driver' }),
  });
  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });
  const { data: shifts } = useQuery({
    queryKey: ['driver-shifts'],
    queryFn: () => driverShifts.list(),
  });

  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchList]);

  /** Most-recent shift per driver. */
  const lastShiftByDriver = useMemo(() => {
    const m = new Map<string, DriverShift>();
    (shifts ?? []).forEach((s) => {
      const prev = m.get(s.driver_id);
      if (!prev || s.shift_date > prev.shift_date) {
        m.set(s.driver_id, s);
      }
    });
    return m;
  }, [shifts]);

  const todayShiftCount = (shifts ?? []).filter(
    (s) => s.shift_date === TODAY,
  ).length;
  const varianceFlagged = (shifts ?? []).filter(
    (s) => Math.abs(s.variance) >= 10000, // ≥ 100 EGP variance
  ).length;
  const activeCount = (list ?? []).filter((u) => u.is_active).length;

  const filtered = (list ?? []).filter((u) => {
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      u.name.ar.toLowerCase().includes(n) ||
      u.name.en.toLowerCase().includes(n) ||
      (u.driver_code?.toLowerCase().includes(n) ?? false) ||
      u.phone.includes(n)
    );
  });

  const columns: DataTableColumn<User>[] = [
    {
      id: 'code',
      header: t('drivers.columns.code'),
      cell: (u) =>
        u.driver_code ? (
          <span className="font-mono text-xs font-bold text-primary-700">
            {u.driver_code}
          </span>
        ) : (
          '—'
        ),
      width: '90px',
    },
    {
      id: 'name',
      header: t('drivers.columns.name'),
      cell: (u) => (
        <span className="font-semibold">{pickLocale(u.name, locale)}</span>
      ),
    },
    {
      id: 'phone',
      header: t('drivers.columns.phone'),
      cell: (u) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(u.phone)}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'vehicle',
      header: t('drivers.columns.vehicle'),
      cell: (u) =>
        u.vehicle_type ? <VehicleIcon type={u.vehicle_type} /> : '—',
    },
    {
      id: 'branch',
      header: t('drivers.columns.branch'),
      cell: (u) => {
        if (!u.branch_id) return '—';
        const b = branchMap.get(u.branch_id);
        return b ? pickLocale(b.name, locale) : '—';
      },
    },
    {
      id: 'lastShift',
      header: t('drivers.columns.lastShift'),
      cell: (u) => {
        const s = lastShiftByDriver.get(u.id);
        return s ? (
          formatDate(s.shift_date, locale)
        ) : (
          <span className="text-[11px] text-fg-subtle">
            {t('drivers.noShift')}
          </span>
        );
      },
      width: '110px',
    },
    {
      id: 'delivered',
      header: t('drivers.columns.delivered'),
      cell: (u) => {
        const s = lastShiftByDriver.get(u.id);
        return s ? (
          <span className="font-semibold">
            {s.orders_delivered}/{s.orders_assigned}
          </span>
        ) : (
          '—'
        );
      },
      width: '90px',
    },
    {
      id: 'variance',
      header: t('drivers.columns.variance'),
      cell: (u) => {
        const s = lastShiftByDriver.get(u.id);
        if (!s) return '—';
        const tone =
          Math.abs(s.variance) >= 10000
            ? 'danger'
            : s.variance === 0
              ? 'success'
              : 'warning';
        return (
          <span
            className={
              tone === 'danger'
                ? 'font-bold text-danger'
                : tone === 'warning'
                  ? 'font-semibold text-warning'
                  : 'text-success'
            }
          >
            {formatEgp(s.variance, locale)}
          </span>
        );
      },
      defaultHidden: true,
    },
    {
      id: 'status',
      header: t('drivers.columns.status'),
      cell: (u) => (
        <Badge tone={u.is_active ? 'success' : 'neutral'}>
          {t(`drivers.status.${u.is_active ? 'active' : 'inactive'}` as const)}
        </Badge>
      ),
      width: '90px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="drivers"
        title={t('drivers.title')}
        subtitle={t('drivers.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="drivers.kpi.total"
          label={t('drivers.kpi.total')}
          value={list?.length ?? 0}
          tone="primary"
        />
        <KpiCard
          elementId="drivers.kpi.active"
          label={t('drivers.kpi.active')}
          value={activeCount}
          tone="success"
        />
        <KpiCard
          elementId="drivers.kpi.shiftsToday"
          label={t('drivers.kpi.shiftsToday')}
          value={todayShiftCount}
          tone="info"
        />
        <KpiCard
          elementId="drivers.kpi.varianceFlagged"
          label={t('drivers.kpi.varianceFlagged')}
          value={varianceFlagged}
          tone="danger"
        />
      </div>

      <FilterBar
        elementId="drivers.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('drivers.filters.search')}
      />

      <DataTable
        elementId="drivers.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
