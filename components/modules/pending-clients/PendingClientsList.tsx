'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { branches } from '@/lib/api/branches';
import { clients } from '@/lib/api/clients';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Branch } from '@/lib/types/branch';
import type { Client } from '@/lib/types/client';
import { formatDateTime } from '@/lib/format/date';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

const TODAY = new Date().toISOString().slice(0, 10);
const WEEK_AGO = new Date(Date.now() - 7 * 86400 * 1000).toISOString();

export function PendingClientsList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState<Client | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['clients-pending'],
    queryFn: () => clients.list({ approval_status: 'pending' }),
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

  const approve = useMutation({
    mutationFn: (id: string) => {
      if (!me?.id) throw new Error('Loading your account — try again.');
      return clients.approve(id, me.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-pending'] });
      qc.invalidateQueries({ queryKey: ['clients-all'] });
      toast.success(t('pendingClients.approved'));
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => {
      if (!me?.id) throw new Error('Loading your account — try again.');
      return clients.reject(id, me.id, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients-pending'] });
      toast.success(t('pendingClients.rejectModal.rejected'));
      setRejecting(null);
      setRejectReason('');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const filtered = (list ?? []).filter((c) => {
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      c.name.ar.toLowerCase().includes(n) ||
      c.name.en.toLowerCase().includes(n) ||
      c.phone_primary.includes(n) ||
      (c.email?.toLowerCase().includes(n) ?? false)
    );
  });

  const todayCount = (list ?? []).filter((c) =>
    (c.approval_requested_at ?? c.created_at).startsWith(TODAY),
  ).length;
  const weekCount = (list ?? []).filter(
    (c) => (c.approval_requested_at ?? c.created_at) >= WEEK_AGO,
  ).length;

  const columns: DataTableColumn<Client>[] = [
    {
      id: 'name',
      header: t('pendingClients.columns.name'),
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
    },
    {
      id: 'phone',
      header: t('pendingClients.columns.phone'),
      cell: (c) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(c.phone_primary)}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'email',
      header: t('pendingClients.columns.email'),
      cell: (c) => c.email ?? '—',
      defaultHidden: true,
    },
    {
      id: 'branch',
      header: t('pendingClients.columns.branch'),
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
      id: 'submitted',
      header: t('pendingClients.columns.submitted'),
      cell: (c) => (
        <span className="text-[11px] text-fg-muted">
          {formatDateTime(c.approval_requested_at ?? c.created_at, locale)}
        </span>
      ),
      width: '150px',
    },
    {
      id: 'actions',
      header: t('pendingClients.columns.actions'),
      cell: (c) => (
        <div className="flex items-center gap-1">
          <FeedbackPin elementId="pendingClients.row.approve">
            <Button
              size="xs"
              variant="success"
              onClick={() => approve.mutate(c.id)}
              disabled={approve.isPending}
            >
              <Check className="h-3 w-3" />
              {t('pendingClients.actions.approve')}
            </Button>
          </FeedbackPin>
          <FeedbackPin elementId="pendingClients.row.reject">
            <Button
              size="xs"
              variant="destructive"
              onClick={() => setRejecting(c)}
            >
              <X className="h-3 w-3" />
              {t('pendingClients.actions.reject')}
            </Button>
          </FeedbackPin>
        </div>
      ),
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="pendingClients"
        title={t('pendingClients.title')}
        subtitle={t('pendingClients.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard
          elementId="pendingClients.kpi.pending"
          label={t('pendingClients.kpi.pending')}
          value={list?.length ?? 0}
          tone="warning"
        />
        <KpiCard
          elementId="pendingClients.kpi.today"
          label={t('pendingClients.kpi.today')}
          value={todayCount}
          tone="info"
        />
        <KpiCard
          elementId="pendingClients.kpi.thisWeek"
          label={t('pendingClients.kpi.thisWeek')}
          value={weekCount}
          tone="primary"
        />
      </div>

      <FilterBar
        elementId="pendingClients.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('pendingClients.filters.search')}
      />

      <DataTable
        elementId="pendingClients.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      <Dialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
      >
        <DialogHeader>
          <DialogTitle>{t('pendingClients.rejectModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-fg-muted">
            {rejecting && pickLocale(rejecting.name, locale)}
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('pendingClients.rejectModal.reasonPlaceholder')}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setRejecting(null);
              setRejectReason('');
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            disabled={!rejectReason.trim() || reject.isPending}
            onClick={() =>
              rejecting &&
              reject.mutate({ id: rejecting.id, reason: rejectReason.trim() })
            }
          >
            {t('pendingClients.rejectModal.submit')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
