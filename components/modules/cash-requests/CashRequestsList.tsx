'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, X } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { cashRequests } from '@/lib/api/cash-requests';
import { clients } from '@/lib/api/clients';
import type { CashRequest } from '@/lib/types/cash-request';
import type { Client } from '@/lib/types/client';
import {
  CASH_REQUEST_STATUSES,
  PAYMENT_METHODS,
  type CashRequestStatus,
  type PaymentMethod,
} from '@/lib/types/enums';
import { formatEgp } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

const TONE: Record<
  CashRequestStatus,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
  paid: 'success',
};
const REVIEWER = 'u_finance_lead';
const THIS_MONTH = new Date().toISOString().slice(0, 7); // YYYY-MM

export function CashRequestsList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CashRequestStatus | 'all'>(
    'all',
  );
  const [rejecting, setRejecting] = useState<CashRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paying, setPaying] = useState<CashRequest | null>(null);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bank_transfer');
  const [payRef, setPayRef] = useState('');

  const { data: list, isLoading } = useQuery({
    queryKey: ['cash-requests'],
    queryFn: () => cashRequests.list(),
  });
  const { data: clientList } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clients.list(),
  });

  const clientMap = useMemo(() => {
    const m = new Map<string, Client>();
    (clientList ?? []).forEach((c) => m.set(c.id, c));
    return m;
  }, [clientList]);

  const approve = useMutation({
    mutationFn: (id: string) =>
      cashRequests.approve(id, { approved_by: REVIEWER }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-requests'] });
      toast.success(t('cashRequests.approved'));
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cashRequests.reject(id, { rejected_by: REVIEWER, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-requests'] });
      toast.success(t('cashRequests.rejected'));
      setRejecting(null);
      setRejectReason('');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const markPaid = useMutation({
    mutationFn: (input: {
      id: string;
      method: PaymentMethod;
      reference: string;
    }) =>
      cashRequests.markPaid(input.id, {
        paid_by: REVIEWER,
        payment_method: input.method,
        payment_reference: input.reference || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cash-requests'] });
      toast.success(t('cashRequests.payModal.paid'));
      setPaying(null);
      setPayRef('');
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : 'Error'),
  });

  const filtered = (list ?? []).filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    const c = clientMap.get(r.client_id);
    return (
      r.code.toLowerCase().includes(n) ||
      (c?.name.ar.toLowerCase().includes(n) ?? false) ||
      (c?.name.en.toLowerCase().includes(n) ?? false)
    );
  });

  const pendingCount = (list ?? []).filter((r) => r.status === 'pending').length;
  const approvedCount = (list ?? []).filter((r) => r.status === 'approved').length;
  const paidThisMonth = (list ?? [])
    .filter((r) => r.status === 'paid' && (r.paid_at ?? '').startsWith(THIS_MONTH))
    .reduce((a, r) => a + r.requested_amount, 0);
  const totalPending = (list ?? [])
    .filter((r) => r.status === 'pending' || r.status === 'approved')
    .reduce((a, r) => a + r.requested_amount, 0);

  const columns: DataTableColumn<CashRequest>[] = [
    {
      id: 'code',
      header: t('cashRequests.columns.code'),
      cell: (r) => (
        <span className="font-mono text-xs font-bold text-primary-700">
          {r.code}
        </span>
      ),
      width: '110px',
    },
    {
      id: 'merchant',
      header: t('cashRequests.columns.merchant'),
      cell: (r) => {
        const c = clientMap.get(r.client_id);
        return c ? pickLocale(c.name, locale) : r.client_id;
      },
    },
    {
      id: 'amount',
      header: t('cashRequests.columns.amount'),
      cell: (r) => (
        <span className="font-bold">
          {formatEgp(r.requested_amount, locale)}
        </span>
      ),
      width: '130px',
    },
    {
      id: 'method',
      header: t('cashRequests.columns.method'),
      cell: (r) => t(`paymentMethods.${r.requested_method}` as const),
      width: '120px',
    },
    {
      id: 'comment',
      header: t('cashRequests.columns.comment'),
      cell: (r) =>
        r.comment ? (
          <span className="text-[11px] text-fg-muted">{r.comment}</span>
        ) : (
          '—'
        ),
      defaultHidden: true,
    },
    {
      id: 'status',
      header: t('cashRequests.columns.status'),
      cell: (r) => (
        <Badge tone={TONE[r.status]}>
          {t(`cashRequests.status.${r.status}` as const)}
        </Badge>
      ),
      width: '100px',
    },
    {
      id: 'submitted',
      header: t('cashRequests.columns.submitted'),
      cell: (r) => (
        <span className="text-[11px] text-fg-muted">
          {formatDateTime(r.created_at, locale)}
        </span>
      ),
      width: '150px',
      defaultHidden: true,
    },
    {
      id: 'actions',
      header: t('cashRequests.columns.actions'),
      cell: (r) => (
        <div className="flex items-center gap-1">
          {r.status === 'pending' && (
            <>
              <FeedbackPin elementId="cashRequests.row.approve">
                <Button
                  size="xs"
                  variant="success"
                  onClick={() => approve.mutate(r.id)}
                  disabled={approve.isPending}
                >
                  <Check className="h-3 w-3" />
                  {t('cashRequests.actions.approve')}
                </Button>
              </FeedbackPin>
              <FeedbackPin elementId="cashRequests.row.reject">
                <Button
                  size="xs"
                  variant="destructive"
                  onClick={() => setRejecting(r)}
                >
                  <X className="h-3 w-3" />
                  {t('cashRequests.actions.reject')}
                </Button>
              </FeedbackPin>
            </>
          )}
          {r.status === 'approved' && (
            <FeedbackPin elementId="cashRequests.row.markPaid">
              <Button
                size="xs"
                variant="primary"
                onClick={() => {
                  setPaying(r);
                  setPayMethod(r.requested_method);
                }}
              >
                <CreditCard className="h-3 w-3" />
                {t('cashRequests.actions.markPaid')}
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
        elementId="cashRequests"
        title={t('cashRequests.title')}
        subtitle={t('cashRequests.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          elementId="cashRequests.kpi.pending"
          label={t('cashRequests.kpi.pending')}
          value={pendingCount}
          tone="warning"
        />
        <KpiCard
          elementId="cashRequests.kpi.approved"
          label={t('cashRequests.kpi.approved')}
          value={approvedCount}
          tone="info"
        />
        <KpiCard
          elementId="cashRequests.kpi.paidThisMonth"
          label={t('cashRequests.kpi.paidThisMonth')}
          value={formatEgp(paidThisMonth, locale)}
          tone="success"
        />
        <KpiCard
          elementId="cashRequests.kpi.totalRequested"
          label={t('cashRequests.kpi.totalRequested')}
          value={formatEgp(totalPending, locale)}
          tone="primary"
        />
      </div>

      <FilterBar
        elementId="cashRequests.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('cashRequests.filters.search')}
      >
        <FilterPill
          elementId="cashRequests.filters.all"
          active={statusFilter === 'all'}
          onClick={() => setStatusFilter('all')}
        >
          {t('cashRequests.filters.all')}
        </FilterPill>
        {CASH_REQUEST_STATUSES.map((s) => (
          <FilterPill
            key={s}
            elementId={`cashRequests.filters.${s}`}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          >
            {t(`cashRequests.filters.${s}` as const)}
          </FilterPill>
        ))}
      </FilterBar>

      <DataTable
        elementId="cashRequests.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />

      {/* Reject modal */}
      <Dialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
      >
        <DialogHeader>
          <DialogTitle>{t('cashRequests.rejectModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-fg-muted">
            {rejecting && (
              <>
                <span className="font-mono">{rejecting.code}</span>
                {' · '}
                {formatEgp(rejecting.requested_amount, locale)}
              </>
            )}
          </p>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={t('cashRequests.rejectModal.reasonPlaceholder')}
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
            {t('cashRequests.rejectModal.submit')}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Mark-paid modal */}
      <Dialog open={!!paying} onOpenChange={(o) => !o && setPaying(null)}>
        <DialogHeader>
          <DialogTitle>{t('cashRequests.payModal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-fg-muted">
            {paying && (
              <>
                <span className="font-mono">{paying.code}</span>
                {' · '}
                {formatEgp(paying.requested_amount, locale)}
              </>
            )}
          </p>
          <div className="space-y-1">
            <Label>{t('cashRequests.payModal.method')}</Label>
            <Select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`paymentMethods.${m}` as const)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>{t('cashRequests.payModal.reference')}</Label>
            <Input
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. TXN-9921"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setPaying(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            disabled={markPaid.isPending}
            onClick={() =>
              paying &&
              markPaid.mutate({
                id: paying.id,
                method: payMethod,
                reference: payRef.trim(),
              })
            }
          >
            {t('cashRequests.payModal.submit')}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
