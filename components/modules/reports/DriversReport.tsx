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
import { branches } from '@/lib/api/branches';
import { driverShifts } from '@/lib/api/driver-shifts';
import { users } from '@/lib/api/users';
import type { Branch } from '@/lib/types/branch';
import type { User } from '@/lib/types/user';
import { formatEgp } from '@/lib/format/currency';
import { formatInt } from '@/lib/format/numbers';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';
import { DateRangeControl, daysAgoISO, todayISO } from './DateRangeControl';

interface DriverStats {
  driver: User;
  shifts: number;
  assigned: number;
  delivered: number;
  returned: number;
  cancelled: number;
  refused: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
}

export function DriversReport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [range, setRange] = useState({ from: daysAgoISO(30), to: todayISO() });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['driver-shifts'],
    queryFn: () => driverShifts.list(),
  });
  const { data: driversList } = useQuery({
    queryKey: ['users', 'driver'],
    queryFn: () => users.list({ role: 'driver' }),
  });
  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchList]);

  /** Aggregate shifts in range, indexed by driver. */
  const perDriver = useMemo<DriverStats[]>(() => {
    const inRange = (shifts ?? []).filter(
      (s) => s.shift_date >= range.from && s.shift_date <= range.to,
    );
    const driverIndex = new Map<string, User>();
    (driversList ?? []).forEach((u) => driverIndex.set(u.id, u));

    const map = new Map<string, DriverStats>();
    for (const s of inRange) {
      const driver = driverIndex.get(s.driver_id);
      if (!driver) continue;
      const stat = map.get(s.driver_id) ?? {
        driver,
        shifts: 0,
        assigned: 0,
        delivered: 0,
        returned: 0,
        cancelled: 0,
        refused: 0,
        expectedCash: 0,
        actualCash: 0,
        variance: 0,
      };
      stat.shifts += 1;
      stat.assigned += s.orders_assigned;
      stat.delivered += s.orders_delivered;
      stat.returned += s.orders_returned;
      stat.cancelled += s.orders_cancelled;
      stat.refused += s.orders_refused;
      stat.expectedCash += s.expected_cash;
      stat.actualCash += s.actual_cash;
      stat.variance += s.variance;
      map.set(s.driver_id, stat);
    }
    return [...map.values()].sort((a, b) => b.delivered - a.delivered);
  }, [shifts, driversList, range]);

  const totals = useMemo(() => {
    return perDriver.reduce(
      (acc, d) => ({
        assigned: acc.assigned + d.assigned,
        delivered: acc.delivered + d.delivered,
        expectedCash: acc.expectedCash + d.expectedCash,
        variance: acc.variance + d.variance,
      }),
      { assigned: 0, delivered: 0, expectedCash: 0, variance: 0 },
    );
  }, [perDriver]);

  const overallSuccess = totals.assigned
    ? Math.round((totals.delivered / totals.assigned) * 100)
    : 0;

  const columns: DataTableColumn<DriverStats>[] = [
    {
      id: 'driver',
      header: t('reports.drivers.columns.driver'),
      cell: (d) => (
        <div className="flex flex-col">
          <span className="font-semibold">
            {pickLocale(d.driver.name, locale)}
          </span>
          <span className="font-mono text-[10px] text-fg-muted">
            {d.driver.driver_code ?? '—'}
          </span>
        </div>
      ),
    },
    {
      id: 'branch',
      header: t('reports.drivers.columns.branch'),
      cell: (d) => {
        const b = d.driver.branch_id ? branchMap.get(d.driver.branch_id) : null;
        return b ? pickLocale(b.name, locale) : '—';
      },
    },
    {
      id: 'shifts',
      header: t('reports.drivers.columns.shifts'),
      cell: (d) => formatInt(d.shifts, locale),
      width: '80px',
    },
    {
      id: 'assigned',
      header: t('reports.drivers.columns.assigned'),
      cell: (d) => formatInt(d.assigned, locale),
      width: '90px',
    },
    {
      id: 'delivered',
      header: t('reports.drivers.columns.delivered'),
      cell: (d) => (
        <span className="font-bold text-success">
          {formatInt(d.delivered, locale)}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'successRate',
      header: t('reports.drivers.columns.successRate'),
      cell: (d) => {
        const pct = d.assigned
          ? Math.round((d.delivered / d.assigned) * 100)
          : 0;
        const tone =
          pct >= 85 ? 'text-success' : pct >= 70 ? 'text-warning' : 'text-danger';
        return <span className={`font-bold ${tone}`}>{pct}%</span>;
      },
      width: '110px',
    },
    {
      id: 'returned',
      header: t('reports.drivers.columns.returned'),
      cell: (d) => formatInt(d.returned, locale),
      width: '90px',
      defaultHidden: true,
    },
    {
      id: 'expectedCash',
      header: t('reports.drivers.columns.expectedCash'),
      cell: (d) => formatEgp(d.expectedCash, locale),
      width: '130px',
      defaultHidden: true,
    },
    {
      id: 'variance',
      header: t('reports.drivers.columns.variance'),
      cell: (d) => {
        const tone =
          Math.abs(d.variance) >= 10000
            ? 'text-danger font-bold'
            : d.variance === 0
              ? 'text-success'
              : 'text-warning';
        return <span className={tone}>{formatEgp(d.variance, locale)}</span>;
      },
      width: '130px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="reports.drivers"
        title={t('reports.drivers.title')}
        subtitle={t('reports.drivers.subtitle')}
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
        elementId="reports.drivers.range"
        from={range.from}
        to={range.to}
        onChange={setRange}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="reports.drivers.kpi.drivers"
          label={t('reports.drivers.kpi.drivers')}
          value={perDriver.length}
          tone="primary"
        />
        <KpiCard
          elementId="reports.drivers.kpi.totalDeliveries"
          label={t('reports.drivers.kpi.totalDeliveries')}
          value={formatInt(totals.delivered, locale)}
          sub={`${overallSuccess}% ${t('reports.orders.kpi.successRate')}`}
          tone="success"
        />
        <KpiCard
          elementId="reports.drivers.kpi.expectedCash"
          label={t('reports.drivers.kpi.expectedCash')}
          value={formatEgp(totals.expectedCash, locale)}
          tone="info"
        />
        <KpiCard
          elementId="reports.drivers.kpi.totalVariance"
          label={t('reports.drivers.kpi.totalVariance')}
          value={formatEgp(totals.variance, locale)}
          tone={Math.abs(totals.variance) >= 10000 ? 'danger' : 'warning'}
        />
      </div>

      <DataTable
        elementId="reports.drivers.table"
        columns={columns}
        rows={perDriver}
        isLoading={isLoading}
        rowKey={(r) => r.driver.id}
      />
    </>
  );
}
