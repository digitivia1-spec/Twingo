'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { BranchPills } from '@/components/shared/BranchPills';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { VehicleIcon } from '@/components/shared/VehicleIcon';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { DispatchModal } from './DispatchModal';
import { pickups } from '@/lib/api/pickups';
import { clients } from '@/lib/api/clients';
import { ORDER_STATUSES, type OrderStatus, type VehicleType } from '@/lib/types/enums';
import type { Pickup } from '@/lib/types/pickup';
import type { Client } from '@/lib/types/client';
import type { Locale } from '@/lib/i18n/config';
import { formatDateTime } from '@/lib/format/date';
import { formatEgp } from '@/lib/format/currency';
import { formatWeightKg } from '@/lib/format/numbers';
import { formatEgyptianMobile } from '@/lib/format/phone';
import { pickLocale } from '@/lib/utils';

export function PickupList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const branchId = searchParams.get('branch') ?? undefined;
  const statusParam = searchParams.get('status');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dispatchFor, setDispatchFor] = useState<Pickup | null>(null);

  const statusFilter: OrderStatus[] | undefined =
    statusParam && ORDER_STATUSES.includes(statusParam as OrderStatus)
      ? [statusParam as OrderStatus]
      : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['pickups', { branchId, search, statusFilter, page }],
    queryFn: () =>
      pickups.list({
        branch_id: branchId,
        status: statusFilter,
        search,
        page,
        page_size: 25,
      }),
  });

  const { data: clientsList } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clients.list(),
  });
  const clientMap = useMemo(() => {
    const map = new Map<string, Client>();
    (clientsList ?? []).forEach((c) => map.set(c.id, c));
    return map;
  }, [clientsList]);

  const dispatchMutation = useMutation({
    mutationFn: async ({
      id,
      vehicle,
      driverId,
    }: {
      id: string;
      vehicle: VehicleType;
      driverId: string;
    }) => pickups.dispatch(id, vehicle, driverId, 'u_nagui'),
    onSuccess: () => {
      toast.success(t('pickup.dispatch.toast'));
      qc.invalidateQueries({ queryKey: ['pickups'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setDispatchFor(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function changeStatus(next?: OrderStatus) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next) params.delete('status');
    else params.set('status', next);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const columns: DataTableColumn<Pickup>[] = [
    {
      id: 'code',
      header: t('pickup.columns.code'),
      cell: (row) => (
        <Link
          href={`pickup/${row.id}`}
          className="font-mono font-bold text-primary-700 hover:underline"
        >
          {row.code}
        </Link>
      ),
      width: '110px',
    },
    {
      id: 'client',
      header: t('pickup.columns.client'),
      cell: (row) => {
        const c = clientMap.get(row.client_id);
        return c ? pickLocale(c.name, locale) : '—';
      },
    },
    {
      id: 'phone',
      header: t('pickup.columns.phone'),
      cell: (row) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(row.recipient.phone_primary)}
        </span>
      ),
      defaultHidden: true,
    },
    {
      id: 'address',
      header: t('pickup.columns.address'),
      cell: (row) => (
        <span className="line-clamp-1 text-fg-muted">
          {locale === 'ar'
            ? row.delivery_address.full_address_ar
            : row.delivery_address.full_address_en ??
              row.delivery_address.full_address_ar}
        </span>
      ),
    },
    {
      id: 'weight',
      header: t('pickup.columns.weight'),
      cell: (row) => formatWeightKg(row.weight_kg, locale),
      width: '80px',
    },
    {
      id: 'cod',
      header: t('pickup.columns.cod'),
      cell: (row) => formatEgp(row.cod_amount, locale),
      width: '110px',
    },
    {
      id: 'status',
      header: t('pickup.columns.status'),
      cell: (row) => <StatusBadge kind="order" status={row.status} />,
      width: '110px',
    },
    {
      id: 'vehicle',
      header: t('pickup.columns.vehicle'),
      cell: (row) =>
        row.vehicle_type ? <VehicleIcon type={row.vehicle_type} /> : '—',
      defaultHidden: true,
    },
    {
      id: 'lastActivity',
      header: t('pickup.columns.lastActivity'),
      cell: (row) => (
        <span className="text-[11px] text-fg-muted">
          {formatDateTime(row.updated_at, locale)}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'referenceCode',
      header: t('pickup.columns.referenceCode'),
      cell: (row) => row.reference_code ?? '—',
      defaultHidden: true,
    },
    {
      id: 'dispatch',
      header: t('pickup.columns.dispatch'),
      cell: (row) =>
        row.status === 'pending' ? (
          <FeedbackPin elementId="pickup.row.dispatch">
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDispatchFor(row)}
            >
              {t('pickup.dispatch.button')}
            </Button>
          </FeedbackPin>
        ) : row.status === 'dispatched' ||
          row.status === 'out_for_delivery' ||
          row.status === 'delivered' ? (
          <span className="text-[11px] font-semibold text-success">
            {t('pickup.dispatch.done')}
          </span>
        ) : (
          <span className="text-[11px] text-fg-subtle">—</span>
        ),
      width: '140px',
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="pickup"
        title={t('pickup.title')}
        subtitle={t('pickup.subtitle')}
        actions={
          <FeedbackPin elementId="pickup.header.addNew">
            <Link href="pickup/new">
              <Button variant="primary" size="md">
                <Plus className="h-3.5 w-3.5" />
                {t('common.addNew')}
              </Button>
            </Link>
          </FeedbackPin>
        }
      />

      <BranchPills elementId="pickup.branchPills" />

      <FilterBar
        elementId="pickup.filters"
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder={t('pickup.filters.search')}
      >
        <FeedbackPin elementId="pickup.filters.status">
          <div className="min-w-[160px]">
            <Select
              value={statusParam ?? ''}
              onChange={(e) =>
                changeStatus((e.target.value || undefined) as OrderStatus | undefined)
              }
            >
              <option value="">{t('pickup.filters.status')} · {t('common.all')}</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`statuses.order.${s}` as const)}
                </option>
              ))}
            </Select>
          </div>
        </FeedbackPin>
      </FilterBar>

      <DataTable
        elementId="pickup.table"
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        pagination={
          data
            ? {
                page: data.page,
                pageSize: data.page_size,
                total: data.total,
                onPageChange: setPage,
              }
            : undefined
        }
      />

      <DispatchModal
        pickup={dispatchFor}
        onClose={() => setDispatchFor(null)}
        onConfirm={(vehicle, driverId) =>
          dispatchFor &&
          dispatchMutation.mutate({
            id: dispatchFor.id,
            vehicle,
            driverId,
          })
        }
        isPending={dispatchMutation.isPending}
      />
    </>
  );
}
