'use client';

import { useQuery } from '@tanstack/react-query';
import { Edit2, Phone } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BranchEditModal } from './BranchEditModal';
import { branches } from '@/lib/api/branches';
import { pickups } from '@/lib/api/pickups';
import { stock } from '@/lib/api/stock';
import type { Branch } from '@/lib/types/branch';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function BranchesGrid() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [editing, setEditing] = useState<Branch | null>(null);

  const { data: list } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });
  const { data: pk } = useQuery({
    queryKey: ['pickups-all'],
    queryFn: () => pickups.list({ page: 1, page_size: 500 }),
  });
  const { data: st } = useQuery({
    queryKey: ['stock-all'],
    queryFn: () => stock.list(),
  });

  function statsFor(b: Branch) {
    const orders = (pk?.rows ?? []).filter((p) => p.branch_id === b.id).length;
    const items = (st ?? []).filter((s) => s.branch_id === b.id);
    const units = items.reduce((a, s) => a + s.quantity, 0);
    const locked = items.filter((s) => s.status === 'locked').length;
    return { orders, units, locked };
  }

  return (
    <>
      <PageHeader
        elementId="branches"
        title={t('branches.title')}
        subtitle={t('branches.subtitle')}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(list ?? []).map((b) => {
          const stats = statsFor(b);
          return (
            <FeedbackPin key={b.id} elementId="branches.card">
              <Card className="overflow-hidden border-t-[3px] border-t-primary-700">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{pickLocale(b.name, locale)}</CardTitle>
                      <p className="mt-1 text-xs text-fg-muted">
                        {b.address}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-fg-muted">
                        <Phone className="h-3 w-3" />
                        {b.phone}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setEditing(b)}
                    >
                      <Edit2 className="h-3 w-3" />
                      {t('common.edit')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
                  <div>
                    <div className="text-xl font-extrabold text-primary-700">
                      {stats.orders}
                    </div>
                    <div className="text-[10px] text-fg-muted">
                      {t('branches.stats.orders')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-success">
                      {stats.units}
                    </div>
                    <div className="text-[10px] text-fg-muted">
                      {t('branches.stats.stock')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-danger">
                      {stats.locked}
                    </div>
                    <div className="text-[10px] text-fg-muted">
                      {t('branches.stats.locked')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FeedbackPin>
          );
        })}
      </div>

      <BranchEditModal
        branch={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}
