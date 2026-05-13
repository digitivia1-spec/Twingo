'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar, FilterPill } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { awbCodes } from '@/lib/api/awb-codes';
import { branches } from '@/lib/api/branches';
import type { AwbCode } from '@/lib/types/awb';
import type { Branch } from '@/lib/types/branch';
import { AWB_STATUSES, type AwbStatus } from '@/lib/types/enums';
import { formatDateTime } from '@/lib/format/date';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

const TONE: Record<
  AwbStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  available: 'success',
  reserved: 'warning',
  used: 'info',
  voided: 'danger',
};

const TODAY = new Date().toISOString().slice(0, 10);
const ACTING_USER = 'u_ops_reviewer';

export function AwbCodesList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AwbStatus | 'all'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('');

  // Generate batch modal
  const [generateOpen, setGenerateOpen] = useState(false);
  const [batchBranchId, setBatchBranchId] = useState<string>('');
  const [batchCount, setBatchCount] = useState<string>('100');

  // Void modal
  const [voiding, setVoiding] = useState<AwbCode | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['awb-codes'],
    queryFn: () => awbCodes.list(),
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

  const generate = useMutation({
    mutationFn: () => {
      const count = parseInt(batchCount, 10);
      if (!batchBranchId) throw new Error('Pick a branch.');
      if (!Number.isFinite(count) || count <= 0) {
        throw new Error('Enter a valid count.');
      }
      return awbCodes.generateBatch({
        branch_id: batchBranchId,
        count,
        generated_by: ACTING_USER,
      });
    },
    onSuccess: () => {
      toast.success(t('awbCodes.generate.done'));
      qc.invalidateQueries({ queryKey: ['awb-codes'] });
      setGenerateOpen(false);
      setBatchCount('100');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const voidCode = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      awbCodes.voidOne(id, ACTING_USER, reason),
    onSuccess: () => {
      toast.success(t('awbCodes.voidModal.done'));
      qc.invalidateQueries({ queryKey: ['awb-codes'] });
      setVoiding(null);
      setVoidReason('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (list ?? []).filter((a) => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (branchFilter && a.branch_id !== branchFilter) return false;
    if (!search) return true;
    return a.code.toLowerCase().includes(search.toLowerCase());
  });

  const counts = useMemo(() => {
    const c = { available: 0, reserved: 0, used_today: 0, voided: 0 };
    (list ?? []).forEach((a) => {
      if (a.status === 'available') c.available++;
      else if (a.status === 'reserved') c.reserved++;
      else if (a.status === 'used' && (a.used_at ?? '').startsWith(TODAY))
        c.used_today++;
      else if (a.status === 'voided') c.voided++;
    });
    return c;
  }, [list]);

  /**
   * Preview the next code range for the chosen branch + count.
   * Helps ops verify before they mint a 5,000-strong batch.
   */
  const previewRange = useMemo(() => {
    if (!batchBranchId) return null;
    const branch = branchMap.get(batchBranchId);
    if (!branch) return null;
    const count = parseInt(batchCount, 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    const last = (list ?? [])
      .filter((a) => a.branch_id === batchBranchId)
      .reduce((m, a) => Math.max(m, a.sequence), 0);
    return {
      from: `${branch.code}-${last + 1}`,
      to: `${branch.code}-${last + count}`,
    };
  }, [batchBranchId, batchCount, list, branchMap]);

  const columns: DataTableColumn<AwbCode>[] = [
    {
      id: 'code',
      header: t('awbCodes.columns.code'),
      cell: (a) => (
        <span className="font-mono text-xs font-bold text-primary-700">
          {a.code}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'branch',
      header: t('awbCodes.columns.branch'),
      cell: (a) => {
        const b = branchMap.get(a.branch_id);
        return b ? pickLocale(b.name, locale) : a.branch_id;
      },
    },
    {
      id: 'status',
      header: t('awbCodes.columns.status'),
      cell: (a) => (
        <Badge tone={TONE[a.status]}>
          {t(`awbCodes.status.${a.status}` as const)}
        </Badge>
      ),
      width: '110px',
    },
    {
      id: 'linkedPickup',
      header: t('awbCodes.columns.linkedPickup'),
      cell: (a) =>
        a.used_for_pickup_id ?? a.reserved_for_pickup_id ?? (
          <span className="text-fg-subtle">—</span>
        ),
    },
    {
      id: 'batch',
      header: t('awbCodes.columns.batch'),
      cell: (a) => (
        <span className="font-mono text-[10px] text-fg-muted">
          {a.batch_id}
        </span>
      ),
      defaultHidden: true,
    },
    {
      id: 'generated',
      header: t('awbCodes.columns.generated'),
      cell: (a) => (
        <span className="text-[11px] text-fg-muted">
          {formatDateTime(a.created_at, locale)}
        </span>
      ),
      width: '150px',
      defaultHidden: true,
    },
    {
      id: 'actions',
      header: t('awbCodes.columns.actions'),
      cell: (a) =>
        a.status === 'available' || a.status === 'reserved' ? (
          <FeedbackPin elementId="awbCodes.row.void">
            <Button
              size="xs"
              variant="destructive"
              onClick={() => setVoiding(a)}
            >
              <X className="h-3 w-3" />
              {t('awbCodes.actions.void')}
            </Button>
          </FeedbackPin>
        ) : (
          <span className="text-[11px] text-fg-subtle">—</span>
        ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="awbCodes"
        title={t('awbCodes.title')}
        subtitle={t('awbCodes.subtitle')}
        actions={
          <FeedbackPin elementId="awbCodes.generateBtn">
            <Button
              variant="primary"
              size="md"
              onClick={() => setGenerateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('awbCodes.actions.generate')}
            </Button>
          </FeedbackPin>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="awbCodes.kpi.available"
          label={t('awbCodes.kpi.available')}
          value={counts.available}
          tone="success"
        />
        <KpiCard
          elementId="awbCodes.kpi.reserved"
          label={t('awbCodes.kpi.reserved')}
          value={counts.reserved}
          tone="warning"
        />
        <KpiCard
          elementId="awbCodes.kpi.usedToday"
          label={t('awbCodes.kpi.usedToday')}
          value={counts.used_today}
          tone="info"
        />
        <KpiCard
          elementId="awbCodes.kpi.voided"
          label={t('awbCodes.kpi.voided')}
          value={counts.voided}
          tone="danger"
        />
      </div>

      <FilterBar
        elementId="awbCodes.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('awbCodes.filters.search')}
      >
        <div className="min-w-[160px]">
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">{t('awbCodes.filters.allBranches')}</option>
            {(branchList ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {pickLocale(b.name, locale)} ({b.code})
              </option>
            ))}
          </Select>
        </div>
        <FilterPill
          elementId="awbCodes.filters.all"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        >
          {t('awbCodes.filters.all')}
        </FilterPill>
        {AWB_STATUSES.map((s) => (
          <FilterPill
            key={s}
            elementId={`awbCodes.filters.${s}`}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          >
            {t(`awbCodes.filters.${s}` as const)}
          </FilterPill>
        ))}
      </FilterBar>

      <DataTable
        elementId="awbCodes.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      {/* Generate batch modal */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogHeader>
          <DialogTitle>{t('awbCodes.generate.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label required>{t('awbCodes.generate.branch')}</Label>
            <Select
              value={batchBranchId}
              onChange={(e) => setBatchBranchId(e.target.value)}
            >
              <option value="">—</option>
              {(branchList ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {pickLocale(b.name, locale)} ({b.code})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label required>{t('awbCodes.generate.count')}</Label>
            <Input
              type="number"
              min={1}
              max={5000}
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              dir="ltr"
            />
            <p className="text-[10px] text-fg-subtle">
              {t('awbCodes.generate.countHint')}
            </p>
          </div>
          {previewRange && (
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 text-[11px] font-bold text-primary-700">
              {t('awbCodes.generate.preview', previewRange)}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setGenerateOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={
              !batchBranchId ||
              !parseInt(batchCount, 10) ||
              generate.isPending
            }
            onClick={() => generate.mutate()}
          >
            {t('awbCodes.generate.submit')}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Void modal */}
      <Dialog
        open={!!voiding}
        onOpenChange={(o) => !o && setVoiding(null)}
      >
        <DialogHeader>
          <DialogTitle>{t('awbCodes.voidModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-fg-muted">
            {voiding && <span className="font-mono">{voiding.code}</span>}
          </p>
          <Textarea
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder={t('awbCodes.voidModal.reasonPlaceholder')}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setVoiding(null);
              setVoidReason('');
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={!voidReason.trim() || voidCode.isPending}
            onClick={() =>
              voiding &&
              voidCode.mutate({ id: voiding.id, reason: voidReason.trim() })
            }
          >
            {t('awbCodes.voidModal.submit')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
