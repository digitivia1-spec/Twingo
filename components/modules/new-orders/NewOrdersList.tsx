'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
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
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { clients } from '@/lib/api/clients';
import { pickups } from '@/lib/api/pickups';
import type { Client } from '@/lib/types/client';
import type { Pickup } from '@/lib/types/pickup';
import { formatEgp } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

const TODAY = new Date().toISOString().slice(0, 10);
const REVIEWER = 'u_ops_reviewer'; // Mock — wire to current-user once auth lands.

export function NewOrdersList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState<Pickup | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingPage, isLoading } = useQuery({
    queryKey: ['pickups-pending-review'],
    queryFn: () =>
      pickups.list({
        review_status: 'pending_review',
        page: 1,
        page_size: 200,
      }),
  });

  const { data: clientList } = useQuery({
    queryKey: ['clients-all-incl-pending'],
    queryFn: () => clients.list({ approval_status: 'approved' }),
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, Client>();
    (clientList ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [clientList]);

  const approve = useMutation({
    mutationFn: (id: string) => pickups.approveReview(id, REVIEWER),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups-pending-review'] });
      qc.invalidateQueries({ queryKey: ['pickups-all'] });
      toast.success(t('newOrders.approved'));
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      pickups.rejectReview(id, REVIEWER, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pickups-pending-review'] });
      toast.success(t('newOrders.rejectModal.rejected'));
      setRejecting(null);
      setRejectReason('');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const rows = pendingPage?.rows ?? [];

  const filtered = rows.filter((p) => {
    if (!search) return true;
    const n = search.toLowerCase();
    const c = clientMap.get(p.client_id);
    return (
      p.code.toLowerCase().includes(n) ||
      p.recipient.phone_primary.includes(n) ||
      p.recipient.name.ar.toLowerCase().includes(n) ||
      p.recipient.name.en.toLowerCase().includes(n) ||
      (c?.name.ar.toLowerCase().includes(n) ?? false) ||
      (c?.name.en.toLowerCase().includes(n) ?? false)
    );
  });

  const todaySubmissions = rows.filter((p) =>
    p.created_at.startsWith(TODAY),
  ).length;
  const merchantsThisWeek = new Set(rows.map((p) => p.client_id)).size;
  const codTotal = rows.reduce((a, p) => a + p.cod_amount, 0);

  const columns: DataTableColumn<Pickup>[] = [
    {
      id: 'code',
      header: t('newOrders.columns.code'),
      cell: (p) => (
        <span className="font-mono text-xs font-bold text-primary-700">
          {p.code}
        </span>
      ),
      width: '110px',
    },
    {
      id: 'merchant',
      header: t('newOrders.columns.merchant'),
      cell: (p) => {
        const c = clientMap.get(p.client_id);
        return c ? pickLocale(c.name, locale) : p.client_id;
      },
    },
    {
      id: 'source',
      header: t('newOrders.columns.source'),
      cell: (p) => (
        <Badge tone="info">
          {t(`sources.${p.submission_source ?? 'admin_create'}` as const)}
        </Badge>
      ),
      width: '130px',
    },
    {
      id: 'type',
      header: t('newOrders.columns.type'),
      cell: (p) => (
        <span className="text-[11px]">
          {t(`orderTypes.${p.order_type ?? 'forward'}` as const)}
        </span>
      ),
      width: '110px',
      defaultHidden: true,
    },
    {
      id: 'recipient',
      header: t('newOrders.columns.recipient'),
      cell: (p) => pickLocale(p.recipient.name, locale),
    },
    {
      id: 'phone',
      header: t('newOrders.columns.phone'),
      cell: (p) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(p.recipient.phone_primary)}
        </span>
      ),
      width: '130px',
    },
    {
      id: 'destination',
      header: t('newOrders.columns.destination'),
      cell: (p) => p.delivery_address.district,
    },
    {
      id: 'cod',
      header: t('newOrders.columns.cod'),
      cell: (p) => (
        <span className="font-bold">{formatEgp(p.cod_amount, locale)}</span>
      ),
      width: '110px',
    },
    {
      id: 'submitted',
      header: t('newOrders.columns.submitted'),
      cell: (p) => (
        <span className="text-[11px] text-fg-muted">
          {formatDateTime(p.created_at, locale)}
        </span>
      ),
      width: '140px',
      defaultHidden: true,
    },
    {
      id: 'actions',
      header: t('newOrders.columns.actions'),
      cell: (p) => (
        <div className="flex items-center gap-1">
          <FeedbackPin elementId="newOrders.row.approve">
            <Button
              size="xs"
              variant="success"
              onClick={() => approve.mutate(p.id)}
              disabled={approve.isPending}
            >
              <Check className="h-3 w-3" />
              {t('newOrders.actions.approve')}
            </Button>
          </FeedbackPin>
          <FeedbackPin elementId="newOrders.row.reject">
            <Button
              size="xs"
              variant="destructive"
              onClick={() => setRejecting(p)}
            >
              <X className="h-3 w-3" />
              {t('newOrders.actions.reject')}
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
        elementId="newOrders"
        title={t('newOrders.title')}
        subtitle={t('newOrders.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="newOrders.kpi.pending"
          label={t('newOrders.kpi.pending')}
          value={rows.length}
          tone="warning"
        />
        <KpiCard
          elementId="newOrders.kpi.today"
          label={t('newOrders.kpi.today')}
          value={todaySubmissions}
          tone="info"
        />
        <KpiCard
          elementId="newOrders.kpi.merchants"
          label={t('newOrders.kpi.merchants')}
          value={merchantsThisWeek}
          tone="primary"
        />
        <KpiCard
          elementId="newOrders.kpi.value"
          label={t('newOrders.kpi.value')}
          value={formatEgp(codTotal, locale)}
          tone="success"
        />
      </div>

      <FilterBar
        elementId="newOrders.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('newOrders.filters.search')}
      />

      <DataTable
        elementId="newOrders.table"
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
          <DialogTitle>{t('newOrders.rejectModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-fg-muted">
            {rejecting && <span className="font-mono">{rejecting.code}</span>}
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('newOrders.rejectModal.reasonPlaceholder')}
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
            {t('newOrders.rejectModal.submit')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
