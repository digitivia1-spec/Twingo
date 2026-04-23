'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { ReconcileModal } from './ReconcileModal';
import { driverShifts } from '@/lib/api/driver-shifts';
import { users } from '@/lib/api/users';
import { branches } from '@/lib/api/branches';
import type { DriverShift } from '@/lib/types/driver-shift';
import type { User } from '@/lib/types/user';
import type { Branch } from '@/lib/types/branch';
import type { Locale } from '@/lib/i18n/config';
import { formatEgp } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { pickLocale } from '@/lib/utils';

export function FinanceList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const branchId = searchParams.get('branch') ?? undefined;
  const [search, setSearch] = useState('');
  const [reconcileFor, setReconcileFor] = useState<DriverShift | null>(null);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ['shifts', branchId],
    queryFn: () => driverShifts.list({ branch_id: branchId }),
  });
  const { data: drivers } = useQuery({
    queryKey: ['drivers-all'],
    queryFn: () => users.list({ role: 'driver' }),
  });
  const { data: branchesList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  const driverMap = useMemo(() => {
    const m = new Map<string, User>();
    (drivers ?? []).forEach((d) => m.set(d.id, d));
    return m;
  }, [drivers]);
  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchesList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchesList]);

  const filtered = (shifts ?? []).filter((s) => {
    if (!search) return true;
    const d = driverMap.get(s.driver_id);
    const n = search.toLowerCase();
    return (
      d?.name.ar.toLowerCase().includes(n) ||
      d?.name.en.toLowerCase().includes(n) ||
      d?.driver_code?.toLowerCase().includes(n) ||
      s.shift_date.includes(n)
    );
  });

  const totalToCollect = filtered.reduce((a, s) => a + s.expected_cash, 0);
  const collected = filtered.reduce((a, s) => a + s.actual_cash, 0);
  const balance = totalToCollect - collected;

  const approveMutation = useMutation({
    mutationFn: (shift: DriverShift) =>
      driverShifts.approve(shift.id, 'u_nagui'),
    onSuccess: () => {
      toast.success('✓');
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const payOutMutation = useMutation({
    mutationFn: (shift: DriverShift) =>
      driverShifts.payOut(shift.id, 'u_nour_finance'),
    onSuccess: () => {
      toast.success('✓');
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const disputeMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      driverShifts.dispute(id, reason, 'u_nagui'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const columns: DataTableColumn<DriverShift>[] = [
    {
      id: 'driver',
      header: t('finance.columns.driver'),
      cell: (s) => {
        const d = driverMap.get(s.driver_id);
        return d ? pickLocale(d.name, locale) : s.driver_id;
      },
    },
    {
      id: 'driverCode',
      header: t('finance.columns.driverCode'),
      cell: (s) => (
        <span className="font-mono text-[11px] text-primary-700">
          {driverMap.get(s.driver_id)?.driver_code ?? '—'}
        </span>
      ),
      width: '80px',
    },
    {
      id: 'branch',
      header: t('finance.columns.branch'),
      cell: (s) => {
        const b = branchMap.get(s.branch_id);
        return b ? pickLocale(b.name, locale) : '—';
      },
    },
    {
      id: 'shiftDate',
      header: t('finance.columns.shiftDate'),
      cell: (s) => formatDate(s.shift_date, locale),
      width: '110px',
    },
    {
      id: 'orders',
      header: t('finance.columns.orders'),
      cell: (s) => (
        <span className="text-[11px]">
          {s.orders_assigned} · ↓{s.orders_delivered} · ↺{s.orders_returned}
        </span>
      ),
      width: '120px',
    },
    {
      id: 'totalCod',
      header: t('finance.columns.totalCod'),
      cell: (s) => formatEgp(s.expected_cash, locale),
      width: '110px',
    },
    {
      id: 'cashCollected',
      header: t('finance.columns.cashCollected'),
      cell: (s) => formatEgp(s.actual_cash, locale),
      width: '120px',
    },
    {
      id: 'variance',
      header: t('finance.columns.variance'),
      cell: (s) => (
        <span
          className={
            s.variance === 0
              ? 'text-fg-muted'
              : Math.abs(s.variance) > 5000
                ? 'font-bold text-danger'
                : 'text-warning'
          }
        >
          {formatEgp(s.variance, locale)}
        </span>
      ),
      width: '100px',
    },
    {
      id: 'status',
      header: t('finance.columns.status'),
      cell: (s) => <StatusBadge kind="finance" status={s.status} />,
      width: '110px',
    },
    {
      id: 'action',
      header: t('finance.columns.action'),
      cell: (s) => (
        <div className="flex items-center gap-1">
          {s.status === 'pending' && (
            <FeedbackPin elementId="finance.row.reconcile">
              <Button
                size="sm"
                variant="success"
                onClick={() => setReconcileFor(s)}
              >
                {t('finance.actions.reconcile')}
              </Button>
            </FeedbackPin>
          )}
          {s.status === 'reconciled' && (
            <FeedbackPin elementId="finance.row.approve">
              <Button
                size="sm"
                variant="warning"
                onClick={() => approveMutation.mutate(s)}
              >
                {t('finance.actions.approve')}
              </Button>
            </FeedbackPin>
          )}
          {s.status === 'approved' && (
            <FeedbackPin elementId="finance.row.payOut">
              <Button
                size="sm"
                variant="primary"
                onClick={() => payOutMutation.mutate(s)}
              >
                {t('finance.actions.payOut')}
              </Button>
            </FeedbackPin>
          )}
          {s.status === 'paid_out' && (
            <span className="text-[11px] font-semibold text-success">
              {t('finance.actions.settled')}
            </span>
          )}
          <FeedbackPin elementId="finance.row.dispute">
            <Dropdown
              align="end"
              trigger={
                <Button variant="ghost" size="sm" aria-label="more">
                  ⋯
                </Button>
              }
            >
              <DropdownItem
                onClick={() =>
                  disputeMutation.mutate({
                    id: s.id,
                    reason: 'Marked disputed via UI',
                  })
                }
              >
                <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                {t('finance.actions.markDisputed')}
              </DropdownItem>
            </Dropdown>
          </FeedbackPin>
        </div>
      ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="finance"
        title={t('finance.title')}
        subtitle={t('finance.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="finance.kpi.totalToCollect"
          label={t('finance.kpi.totalToCollect')}
          value={formatEgp(totalToCollect, locale)}
          tone="primary"
        />
        <KpiCard
          elementId="finance.kpi.collected"
          label={t('finance.kpi.collected')}
          value={formatEgp(collected, locale)}
          tone="success"
        />
        <KpiCard
          elementId="finance.kpi.balance"
          label={t('finance.kpi.balance')}
          value={formatEgp(balance, locale)}
          tone={balance > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <FilterBar
        elementId="finance.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('common.search')}
      />

      <DataTable
        elementId="finance.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      <ReconcileModal
        shift={reconcileFor}
        driver={
          reconcileFor ? (driverMap.get(reconcileFor.driver_id) ?? null) : null
        }
        branch={
          reconcileFor ? (branchMap.get(reconcileFor.branch_id) ?? null) : null
        }
        onClose={() => setReconcileFor(null)}
      />
    </>
  );
}
