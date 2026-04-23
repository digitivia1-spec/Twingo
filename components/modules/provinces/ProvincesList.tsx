'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { governorates } from '@/lib/api/governorates';
import type { Governorate } from '@/lib/types/governorate';

export function ProvincesList() {
  const t = useTranslations();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governorates.list(),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      governorates.toggleActive(id, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['governorates'] }),
  });

  const columns: DataTableColumn<Governorate>[] = [
    {
      id: 'nameAr',
      header: t('provinces.columns.nameAr'),
      cell: (g) => g.name.ar,
    },
    {
      id: 'nameEn',
      header: t('provinces.columns.nameEn'),
      cell: (g) => g.name.en,
    },
    {
      id: 'code',
      header: t('provinces.columns.code'),
      cell: (g) => (
        <span className="font-mono text-[11px] text-primary-700">{g.code}</span>
      ),
      width: '80px',
    },
    {
      id: 'coverage',
      header: t('provinces.columns.coverage'),
      cell: (g) => (
        <FeedbackPin elementId="provinces.row.toggle">
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={g.is_active}
              onChange={() =>
                toggle.mutate({ id: g.id, is_active: !g.is_active })
              }
            />
            {g.is_active ? '✓' : '✗'}
          </label>
        </FeedbackPin>
      ),
      width: '110px',
      togglable: false,
    },
  ];

  return (
    <>
      <PageHeader
        elementId="provinces"
        title={t('provinces.title')}
        subtitle={t('provinces.subtitle')}
      />
      <DataTable
        elementId="provinces.table"
        columns={columns}
        rows={data ?? []}
        isLoading={isLoading}
        rowKey={(g) => g.id}
      />
    </>
  );
}
