'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { stock } from '@/lib/api/stock';
import { users } from '@/lib/api/users';
import type { StockItem } from '@/lib/types/stock';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function UnlockModal({
  item,
  onClose,
}: {
  item: StockItem | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [approver, setApprover] = useState('');

  const { data: managers } = useQuery({
    queryKey: ['managers'],
    queryFn: () => users.list({ role: 'manager' }),
    enabled: !!item,
  });

  const mutation = useMutation({
    mutationFn: () =>
      item
        ? stock.unlock(item.id, {
            unlocked_by: 'u_youssef_wh',
            unlock_reason: { ar: reason, en: reason },
            approver_id: approver,
          })
        : Promise.reject(new Error('No item selected')),
    onSuccess: () => {
      toast.success(t('stock.unlock.unlocked'));
      qc.invalidateQueries({ queryKey: ['stock'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      onClose();
      setReason('');
      setApprover('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      className="max-w-[520px]"
    >
      <DialogHeader>
        <DialogTitle>{t('stock.unlock.title')}</DialogTitle>
      </DialogHeader>

      {item && (
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-muted p-3 text-xs">
            <div className="font-mono font-bold text-primary-700">
              {item.sku}
            </div>
            <div className="mt-0.5 text-fg">
              {pickLocale(item.name, locale)}
            </div>
          </div>

          {item.locked_reason && (
            <div className="rounded-lg border border-danger bg-danger-bg/40 p-3 text-xs">
              <div className="text-[10px] font-bold text-danger">
                {t('stock.unlock.reasonDisplay')}
              </div>
              <div className="mt-1 text-fg">
                {pickLocale(item.locked_reason, locale)}
              </div>
            </div>
          )}

          <FeedbackPin elementId="stock.unlockModal.reason">
            <div>
              <Label required>{t('stock.unlock.unlockReason')}</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </FeedbackPin>

          <FeedbackPin elementId="stock.unlockModal.approver">
            <div>
              <Label required>{t('stock.unlock.approver')}</Label>
              <Select
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
              >
                <option value="" disabled>
                  —
                </option>
                {(managers ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {pickLocale(m.name, locale)}
                  </option>
                ))}
              </Select>
            </div>
          </FeedbackPin>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <FeedbackPin elementId="stock.unlockModal.submit">
          <Button
            variant="warning"
            size="md"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !reason || !approver}
          >
            🔓 {t('stock.actions.unlock')}
          </Button>
        </FeedbackPin>
      </DialogFooter>
    </Dialog>
  );
}
