'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterPill } from './FilterBar';
import { branches } from '@/lib/api/branches';
import type { Branch } from '@/lib/types/branch';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

/** Horizontal branch-filter pills bound to `?branch=<id>`. */
export function BranchPills({ elementId }: { elementId: string }) {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('branch') ?? 'all';
  const [list, setList] = useState<Branch[]>([]);

  useEffect(() => {
    branches.list().then(setList);
  }, []);

  function pick(id: string | 'all') {
    const params = new URLSearchParams(searchParams.toString());
    if (id === 'all') params.delete('branch');
    else params.set('branch', id);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPill
        elementId={`${elementId}.all`}
        active={current === 'all'}
        onClick={() => pick('all')}
      >
        {t('all')}
      </FilterPill>
      {list.map((b) => (
        <FilterPill
          key={b.id}
          elementId={`${elementId}.${b.code.toLowerCase()}`}
          active={current === b.id}
          onClick={() => pick(b.id)}
        >
          {pickLocale(b.name, locale)}
        </FilterPill>
      ))}
    </div>
  );
}
