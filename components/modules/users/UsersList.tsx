'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { FilterBar, FilterPill } from '@/components/shared/FilterBar';
import { KpiCard } from '@/components/shared/KpiCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { branches } from '@/lib/api/branches';
import { users } from '@/lib/api/users';
import { USER_ROLES, type UserRole } from '@/lib/types/enums';
import type { Branch } from '@/lib/types/branch';
import type { User } from '@/lib/types/user';
import { formatEgyptianMobile } from '@/lib/format/phone';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

/** Tone per role — purely visual. */
const ROLE_TONE: Record<UserRole, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  super_admin: 'danger',
  admin: 'warning',
  manager: 'info',
  warehouse: 'neutral',
  driver: 'success',
  finance: 'info',
};

export function UsersList() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const { data: list, isLoading } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => users.list(),
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

  const filtered = (list ?? []).filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!search) return true;
    const n = search.toLowerCase();
    return (
      u.name.ar.toLowerCase().includes(n) ||
      u.name.en.toLowerCase().includes(n) ||
      u.phone.includes(n) ||
      (u.email?.toLowerCase().includes(n) ?? false)
    );
  });

  const activeCount = (list ?? []).filter((u) => u.is_active).length;

  const columns: DataTableColumn<User>[] = [
    {
      id: 'name',
      header: t('users.columns.name'),
      cell: (u) => (
        <span className="font-semibold">{pickLocale(u.name, locale)}</span>
      ),
    },
    {
      id: 'role',
      header: t('users.columns.role'),
      cell: (u) => (
        <Badge tone={ROLE_TONE[u.role]}>
          {t(`users.roles.${u.role}` as const)}
        </Badge>
      ),
      width: '120px',
    },
    {
      id: 'phone',
      header: t('users.columns.phone'),
      cell: (u) => (
        <span className="font-mono text-[11px]">
          {formatEgyptianMobile(u.phone)}
        </span>
      ),
      width: '140px',
    },
    {
      id: 'email',
      header: t('users.columns.email'),
      cell: (u) => u.email ?? '—',
      defaultHidden: true,
    },
    {
      id: 'branch',
      header: t('users.columns.branch'),
      cell: (u) => {
        if (!u.branch_id) return '—';
        const b = branchMap.get(u.branch_id);
        return b ? pickLocale(b.name, locale) : '—';
      },
    },
    {
      id: 'status',
      header: t('users.columns.status'),
      cell: (u) => (
        <Badge tone={u.is_active ? 'success' : 'neutral'}>
          {t(`users.status.${u.is_active ? 'active' : 'inactive'}` as const)}
        </Badge>
      ),
      width: '90px',
    },
  ];

  return (
    <>
      <PageHeader
        elementId="users"
        title={t('users.title')}
        subtitle={t('users.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <KpiCard
          elementId="users.kpi.total"
          label={t('users.kpi.total')}
          value={list?.length ?? 0}
          tone="primary"
        />
        <KpiCard
          elementId="users.kpi.active"
          label={t('users.kpi.active')}
          value={activeCount}
          tone="success"
        />
      </div>

      <FilterBar
        elementId="users.filters"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('users.filters.search')}
      >
        <FilterPill
          elementId="users.filters.all"
          active={roleFilter === 'all'}
          onClick={() => setRoleFilter('all')}
        >
          {t('users.filters.allRoles')}
        </FilterPill>
        {USER_ROLES.map((r) => (
          <FilterPill
            key={r}
            elementId={`users.filters.role.${r}`}
            active={roleFilter === r}
            onClick={() => setRoleFilter(r)}
          >
            {t(`users.roles.${r}` as const)}
          </FilterPill>
        ))}
      </FilterBar>

      <DataTable
        elementId="users.table"
        columns={columns}
        rows={filtered}
        isLoading={isLoading}
        rowKey={(r) => r.id}
      />
    </>
  );
}
