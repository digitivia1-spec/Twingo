'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { branches } from '@/lib/api/branches';
import type { Branch } from '@/lib/types/branch';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

/**
 * Branch selector bound to `?branch=<id>` in the URL.
 * All list pages read the branch filter from the URL so deep-links work.
 */
export function BranchSelector() {
  const t = useTranslations('topbar');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('branch') ?? 'all';
  const [list, setList] = useState<Branch[]>([]);

  useEffect(() => {
    branches.list().then(setList);
  }, []);

  const selected = list.find((b) => b.id === current);
  const label = selected
    ? pickLocale(selected.name, locale)
    : t('branchAll');

  function pick(branchId: string | 'all') {
    const params = new URLSearchParams(searchParams.toString());
    if (branchId === 'all') params.delete('branch');
    else params.set('branch', branchId);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold text-primary-700 hover:bg-primary-100"
          aria-label={t('branchLabel')}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      }
      align="end"
    >
      <DropdownItem onClick={() => pick('all')}>{t('branchAll')}</DropdownItem>
      <DropdownSeparator />
      {list.map((branch) => (
        <DropdownItem key={branch.id} onClick={() => pick(branch.id)}>
          {pickLocale(branch.name, locale)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}
