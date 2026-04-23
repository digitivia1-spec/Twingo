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
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { driverShifts } from '@/lib/api/driver-shifts';
import { formatEgp, parseEgpToPiasters } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { pickLocale } from '@/lib/utils';
import type { DriverShift } from '@/lib/types/driver-shift';
import type { User } from '@/lib/types/user';
import type { Branch } from '@/lib/types/branch';
import type { Locale } from '@/lib/i18n/config';

const LARGE_VARIANCE_EGP = 5000; // 50 EGP in piasters

export function ReconcileModal({
  shift,
  driver,
  branch,
  onClose,
}: {
  shift: DriverShift | null;
  driver: User | null;
  branch: Branch | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [actualCashStr, setActualCashStr] = useState('');
  const [notes, setNotes] = useState('');

  const actualCash = parseEgpToPiasters(actualCashStr) ?? 0;
  const variance = shift ? actualCash - shift.expected_cash : 0;

  const mutation = useMutation({
    mutationFn: () =>
      shift
        ? driverShifts.reconcile(shift.id, {
            actual_cash: actualCash,
            reconciled_by: 'u_nour_finance',
            variance_reason:
              Math.abs(variance) > LARGE_VARIANCE_EGP ? notes : undefined,
            notes,
          })
        : Promise.reject(new Error('No shift selected')),
    onSuccess: () => {
      toast.success(t('finance.reconcile.submitted'));
      qc.invalidateQueries({ queryKey: ['shifts'] });
      onClose();
      setActualCashStr('');
      setNotes('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog
      open={!!shift}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      className="max-w-[560px]"
    >
      <DialogHeader>
        <DialogTitle>{t('finance.reconcile.title')}</DialogTitle>
      </DialogHeader>

      {shift && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-muted p-3 text-xs">
            <div>
              <div className="text-[10px] text-fg-muted">{t('finance.columns.driver')}</div>
              <div className="font-bold">
                {driver ? pickLocale(driver.name, locale) : shift.driver_id}
                {driver?.driver_code && ` · ${driver.driver_code}`}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-fg-muted">{t('finance.columns.branch')}</div>
              <div className="font-bold">
                {branch ? pickLocale(branch.name, locale) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-fg-muted">
                {t('finance.columns.shiftDate')}
              </div>
              <div className="font-bold">
                {formatDate(shift.shift_date, locale)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-fg-muted">
                {t('finance.columns.orders')}
              </div>
              <div className="text-[11px]">
                {shift.orders_assigned} · ↓{shift.orders_delivered} · ↺
                {shift.orders_returned} · ✗{shift.orders_cancelled}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] text-fg-muted">
                {t('finance.reconcile.expectedCash')}
              </div>
              <div className="mt-1 text-lg font-extrabold text-primary-700">
                {formatEgp(shift.expected_cash, locale)}
              </div>
            </div>
            <FeedbackPin elementId="finance.reconcileModal.actualCash">
              <div>
                <Label required>{t('finance.reconcile.actualCash')}</Label>
                <Input
                  value={actualCashStr}
                  onChange={(e) => setActualCashStr(e.target.value)}
                  placeholder="0"
                  dir="ltr"
                  inputMode="decimal"
                />
              </div>
            </FeedbackPin>
          </div>

          <div
            className={
              Math.abs(variance) > LARGE_VARIANCE_EGP
                ? 'rounded-lg border border-danger bg-danger-bg/50 p-3 text-xs text-danger'
                : 'rounded-lg bg-surface-muted p-3 text-xs'
            }
          >
            <div className="text-[10px] text-fg-muted">
              {t('finance.reconcile.variance')}
            </div>
            <div className="mt-1 text-lg font-extrabold">
              {formatEgp(variance, locale)}
            </div>
            {Math.abs(variance) > LARGE_VARIANCE_EGP && (
              <p className="mt-1 font-semibold">
                {t('finance.reconcile.varianceLargeWarning')}
              </p>
            )}
          </div>

          <FeedbackPin elementId="finance.reconcileModal.notes">
            <div>
              <Label>{t('finance.reconcile.notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </FeedbackPin>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <FeedbackPin elementId="finance.reconcileModal.submit">
          <Button
            variant="primary"
            size="md"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !actualCashStr}
          >
            {t('common.submit')}
          </Button>
        </FeedbackPin>
      </DialogFooter>
    </Dialog>
  );
}
