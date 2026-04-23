'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { BranchPills } from '@/components/shared/BranchPills';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { UnlockModal } from './UnlockModal';
import { TransferModal } from './TransferModal';
import { stock } from '@/lib/api/stock';
import { branches } from '@/lib/api/branches';
import { STOCK_STATUSES, type StockStatus } from '@/lib/types/enums';
import type { StockItem } from '@/lib/types/stock';
import type { Branch } from '@/lib/types/branch';
import { formatDate } from '@/lib/format/date';
import { formatInt } from '@/lib/format/numbers';
import { pickLocale, cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function StockList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const branchId = searchParams.get('branch') ?? undefined;
  const statusParam = searchParams.get('status') as StockStatus | null;
  const [search, setSearch] = useState('');
  const [unlockFor, setUnlockFor] = useState<StockItem | null>(null);
  const [transferFor, setTransferFor] = useState<StockItem | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ['stock', { branchId, status: statusParam, search }],
    queryFn: () =>
      stock.list({
        branch_id: branchId,
        status: statusParam ? [statusParam] : undefined,
        search,
      }),
  });
  const { data: branchesList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  const branchMap = useMemo(() => {
    const m = new Map<string, Branch>();
    (branchesList ?? []).forEach((b) => m.set(b.id, b));
    return m;
  }, [branchesList]);

  const all = items ?? [];
  const skus = all.length;
  const available = all.filter((i) => i.status === 'available').length;
  const locked = all.filter((i) => i.status === 'locked').length;
  const totalUnits = all.reduce((a, i) => a + i.quantity, 0);

  const receiveMutation = useMutation({
    mutationFn: (id: string) => stock.receive(id, 'u_youssef_wh'),
    onSuccess: () => {
      toast.success('✓');
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const columns: DataTableColumn<StockItem>[] = [
    {
      id: 'sku',
      header: t('stock.columns.sku'),
      cell: (i) => (
        <span className="font-mono text-xs font-bold text-primary-700">
          {i.sku}
        </span>
      ),
      width: '120px',
    },
    {
      id: 'name',
      header: t('stock.columns.name'),
      cell: (i) => pickLocale(i.name, locale),
    },
    {
      id: 'branch',
      header: t('stock.columns.branch'),
      cell: (i) => {
        const b = branchMap.get(i.branch_id);
        return b ? pickLocale(b.name, locale) : '—';
      },
    },
    {
      id: 'quantity',
      header: t('stock.columns.quantity'),
      cell: (i) => (
        <span
          className={cn(
            'font-extrabold',
            i.quantity === 0
              ? 'text-danger'
              : i.quantity < 5
                ? 'text-warning'
                : 'text-success',
          )}
        >
          {formatInt(i.quantity, locale)}
        </span>
      ),
      width: '90px',
    },
    {
      id: 'status',
      header: t('stock.columns.status'),
      cell: (i) => <StatusBadge kind="stock" status={i.status} />,
      width: '120px',
    },
    {
      id: 'lockReason',
      header: t('stock.columns.lockReason'),
      cell: (i) =>
        i.locked_reason ? pickLocale(i.locked_reason, locale) : '—',
      defaultHidden: false,
    },
    {
      id: 'lastMovement',
      header: t('stock.columns.lastMovement'),
      cell: (i) => (
        <span className="text-[11px] text-fg-muted">
          {formatDate(i.last_movement_at, locale)}
        </span>
      ),
      width: '110px',
    },
    {
      id: 'action',
      header: t('stock.columns.action'),
      cell: (i) => (
        <div className="flex items-center gap-1">
          {i.status === 'locked' && (
            <FeedbackPin elementId="stock.row.unlock">
              <Button
                size="sm"
                variant="warning"
                onClick={() => setUnlockFor(i)}
              >
                🔓 {t('stock.actions.unlock')}
              </Button>
            </FeedbackPin>
          )}
          {(i.status === 'available' || i.status === 'locked') && i.quantity > 0 && (
            <FeedbackPin elementId="stock.row.transfer">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTransferFor(i)}
              >
                ↔ {t('stock.actions.transfer')}
              </Button>
            </FeedbackPin>
          )}
          {i.status === 'in_transit' && (
            <FeedbackPin elementId="stock.row.receive">
              <Button
                size="sm"
                variant="success"
                onClick={() => receiveMutation.mutate(i.id)}
              >
                ✓ {t('stock.actions.receive')}
              </Button>
            </FeedbackPin>
          )}
        </div>
      ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="stock"
        title={t('stock.title')}
        subtitle={t('stock.subtitle')}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          elementId="stock.kpi.totalSkus"
          label={t('stock.kpi.totalSkus')}
          value={formatInt(skus, locale)}
          tone="primary"
        />
        <KpiCard
          elementId="stock.kpi.available"
          label={t('stock.kpi.available')}
          value={formatInt(available, locale)}
          tone="success"
        />
        <KpiCard
          elementId="stock.kpi.locked"
          label={t('stock.kpi.locked')}
          value={formatInt(locked, locale)}
          sub={t('stock.kpi.lockedNeedsAction')}
          tone="danger"
        />
        <KpiCard
          elementId="stock.kpi.totalUnits"
          label={t('stock.kpi.totalUnits')}
          value={formatInt(totalUnits, locale)}
          tone="info"
        />
      </div>

      <BranchPills elementId="stock.branchPills" />

      <FilterBar
        elementId="stock.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('common.search')}
      >
        <FeedbackPin elementId="stock.filters.status">
          <div className="min-w-[160px]">
            <Select
              value={statusParam ?? ''}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                if (!e.target.value) params.delete('status');
                else params.set('status', e.target.value);
                const qs = params.toString();
                window.location.search = qs ? `?${qs}` : '';
              }}
            >
              <option value="">
                {t('stock.columns.status')} · {t('common.all')}
              </option>
              {STOCK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.stock.${s}` as const)}
                </option>
              ))}
            </Select>
          </div>
        </FeedbackPin>
      </FilterBar>

      <DataTable
        elementId="stock.table"
        columns={columns}
        rows={all}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        rowLocked={(r) => r.status === 'locked'}
      />

      <UnlockModal
        item={unlockFor}
        onClose={() => setUnlockFor(null)}
      />
      <TransferModal
        item={transferFor}
        branches={branchesList ?? []}
        onClose={() => setTransferFor(null)}
      />
    </>
  );
}
