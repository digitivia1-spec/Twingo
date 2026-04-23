'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { stock } from '@/lib/api/stock';
import type { StockItem } from '@/lib/types/stock';
import type { Branch } from '@/lib/types/branch';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function TransferModal({
  item,
  branches,
  onClose,
}: {
  item: StockItem | null;
  branches: Branch[];
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [toBranch, setToBranch] = useState('');
  const [qty, setQty] = useState('1');
  const [arrival, setArrival] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      item
        ? stock.transfer(item.id, {
            to_branch_id: toBranch,
            quantity: Number(qty),
            expected_arrival_date: arrival || undefined,
            user_id: 'u_nagui',
          })
        : Promise.reject(new Error('No item selected')),
    onSuccess: () => {
      toast.success(t('stock.transfer.transferred'));
      qc.invalidateQueries({ queryKey: ['stock'] });
      onClose();
      setToBranch('');
      setQty('1');
      setArrival('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      className="max-w-[480px]"
    >
      <DialogHeader>
        <DialogTitle>{t('stock.transfer.title')}</DialogTitle>
      </DialogHeader>

      {item && (
        <div className="space-y-3">
          <div className="rounded-lg bg-surface-muted p-3 text-xs">
            <div className="font-mono font-bold text-primary-700">
              {item.sku}
            </div>
            <div className="mt-0.5 text-fg">
              {pickLocale(item.name, locale)}
            </div>
          </div>

          <div>
            <Label>{t('stock.transfer.fromBranch')}</Label>
            <Input
              readOnly
              value={
                branches.find((b) => b.id === item.branch_id)
                  ? pickLocale(
                      branches.find((b) => b.id === item.branch_id)!.name,
                      locale,
                    )
                  : ''
              }
            />
          </div>

          <FeedbackPin elementId="stock.transferModal.destination">
            <div>
              <Label required>{t('stock.transfer.toBranch')}</Label>
              <Select
                value={toBranch}
                onChange={(e) => setToBranch(e.target.value)}
              >
                <option value="" disabled>
                  —
                </option>
                {branches
                  .filter((b) => b.id !== item.branch_id)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {pickLocale(b.name, locale)}
                    </option>
                  ))}
              </Select>
            </div>
          </FeedbackPin>

          <FeedbackPin elementId="stock.transferModal.quantity">
            <div>
              <Label required>{t('stock.transfer.quantity')}</Label>
              <Input
                type="number"
                min={1}
                max={item.quantity}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                dir="ltr"
              />
              <p className="mt-1 text-[10px] text-fg-subtle">
                {t('stock.columns.quantity')}: {item.quantity}
              </p>
            </div>
          </FeedbackPin>

          <div>
            <Label>{t('stock.transfer.arrival')}</Label>
            <Input
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              dir="ltr"
            />
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <FeedbackPin elementId="stock.transferModal.submit">
          <Button
            variant="primary"
            size="md"
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              !toBranch ||
              !qty ||
              Number(qty) < 1
            }
          >
            {t('common.submit')}
          </Button>
        </FeedbackPin>
      </DialogFooter>
    </Dialog>
  );
}
