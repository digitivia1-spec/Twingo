'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { pickups } from '@/lib/api/pickups';
import {
  ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/types/enums';
import {
  PICKUP_REASON_CODES,
  type Pickup,
  type PickupReasonCode,
} from '@/lib/types/pickup';

/**
 * Statuses where a structured reason_code is required.
 * The remaining statuses ('dispatched', 'out_for_delivery', 'delivered',
 * 'partially_delivered') treat reason as optional.
 */
const REASON_REQUIRED: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'returned',
  'cancelled',
  'refused',
]);

const ACTING_USER = 'u_ops_reviewer';

export function StatusChangeModal({
  pickup,
  open,
  onClose,
}: {
  pickup: Pickup | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations();
  const qc = useQueryClient();

  const [nextStatus, setNextStatus] = useState<OrderStatus>('dispatched');
  const [reasonCode, setReasonCode] = useState<PickupReasonCode | ''>('');
  const [note, setNote] = useState('');

  // Re-prime defaults whenever a new pickup is opened.
  useEffect(() => {
    if (!pickup) return;
    // Sensible default: pick the next status in lifecycle order, otherwise 'delivered'.
    const candidates: OrderStatus[] = [
      'dispatched',
      'out_for_delivery',
      'delivered',
      'returned',
      'cancelled',
      'refused',
    ];
    const idx = candidates.indexOf(pickup.status);
    const nextDefault =
      idx >= 0 && idx < candidates.length - 1
        ? candidates[idx + 1]!
        : 'delivered';
    setNextStatus(nextDefault);
    setReasonCode('');
    setNote('');
  }, [pickup?.id, pickup?.status, pickup]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pickup) throw new Error('No pickup selected');
      return pickups.changeStatus(pickup.id, nextStatus, {
        reason_code: reasonCode || undefined,
        note: note.trim() || undefined,
        user_id: ACTING_USER,
      });
    },
    onSuccess: () => {
      toast.success(t('statusChange.saved'));
      qc.invalidateQueries({ queryKey: ['pickup', pickup?.id] });
      qc.invalidateQueries({ queryKey: ['pickups'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sameStatus = pickup?.status === nextStatus;
  const reasonRequired = REASON_REQUIRED.has(nextStatus);
  const missingReason = reasonRequired && !reasonCode;
  const disabled =
    sameStatus || missingReason || mutation.isPending || !pickup;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogHeader>
        <DialogTitle>{t('statusChange.title')}</DialogTitle>
      </DialogHeader>

      {pickup && (
        <div className="space-y-3">
          <p className="text-xs text-fg-muted">
            <span className="font-mono font-bold text-primary-700">
              {pickup.code}
            </span>
            {' · '}
            {t(`statuses.order.${pickup.status}` as const)}
          </p>

          <FeedbackPin elementId="statusChange.newStatus">
            <div className="space-y-1">
              <Label required>{t('statusChange.newStatus')}</Label>
              <Select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`statuses.order.${s}` as const)}
                  </option>
                ))}
              </Select>
              {sameStatus && (
                <p className="text-[10px] text-danger">
                  {t('statusChange.sameStatus')}
                </p>
              )}
            </div>
          </FeedbackPin>

          <FeedbackPin elementId="statusChange.reason">
            <div className="space-y-1">
              <Label required={reasonRequired}>
                {t('statusChange.reason')}
              </Label>
              <Select
                value={reasonCode}
                onChange={(e) =>
                  setReasonCode(e.target.value as PickupReasonCode | '')
                }
              >
                <option value="">{t('statusChange.reasonPlaceholder')}</option>
                {PICKUP_REASON_CODES.map((r) => (
                  <option key={r} value={r}>
                    {t(`reasonCodes.${r}` as const)}
                  </option>
                ))}
              </Select>
              {missingReason && (
                <p className="text-[10px] text-danger">
                  {t('statusChange.reasonRequired')}
                </p>
              )}
            </div>
          </FeedbackPin>

          <div className="space-y-1">
            <Label>{t('statusChange.note')}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('statusChange.notePlaceholder')}
              rows={3}
            />
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          disabled={disabled}
          onClick={() => mutation.mutate()}
        >
          {t('statusChange.submit')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
