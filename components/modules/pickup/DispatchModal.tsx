'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { users } from '@/lib/api/users';
import { VEHICLE_META } from '@/lib/constants/vehicles';
import { VEHICLE_TYPES, type VehicleType } from '@/lib/types/enums';
import type { Pickup } from '@/lib/types/pickup';
import type { Locale } from '@/lib/i18n/config';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { pickLocale } from '@/lib/utils';

export function DispatchModal({
  pickup,
  onClose,
  onConfirm,
  isPending,
}: {
  pickup: Pickup | null;
  onClose: () => void;
  onConfirm: (vehicle: VehicleType, driverId: string) => void;
  isPending?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => users.list({ role: 'driver' }),
    enabled: !!pickup,
  });

  function pickDriver(vehicle: VehicleType): string | null {
    const list = drivers ?? [];
    const sameBranch = list.find(
      (d) =>
        d.is_active &&
        d.vehicle_type === vehicle &&
        d.branch_id === pickup?.branch_id,
    );
    if (sameBranch) return sameBranch.id;
    const anyBranch = list.find(
      (d) => d.is_active && d.vehicle_type === vehicle,
    );
    return anyBranch?.id ?? null;
  }

  return (
    <Dialog
      open={!!pickup}
      onOpenChange={(o) => !o && onClose()}
      className="max-w-[440px]"
    >
      <DialogHeader>
        <DialogTitle>{t('pickup.dispatch.confirmTitle')}</DialogTitle>
        <DialogDescription>{t('pickup.dispatch.confirmBody')}</DialogDescription>
      </DialogHeader>

      <div className="my-2 rounded-lg bg-surface-muted p-3 text-xs">
        <div className="font-mono font-bold text-primary-700">
          {pickup?.code}
        </div>
        <div className="mt-0.5 truncate text-fg-muted">
          {pickup &&
            (locale === 'ar'
              ? pickup.delivery_address.full_address_ar
              : pickup.delivery_address.full_address_en ??
                pickup.delivery_address.full_address_ar)}
        </div>
      </div>

      <div className="space-y-2">
        {VEHICLE_TYPES.map((v) => {
          const driverId = pickDriver(v);
          const disabled = !driverId;
          const driver = drivers?.find((d) => d.id === driverId);
          return (
            <FeedbackPin
              key={v}
              elementId={`pickup.dispatchModal.vehicle.${v}` as const}
              className="block"
            >
              <button
                type="button"
                disabled={disabled || isPending}
                onClick={() => driverId && onConfirm(v, driverId)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-3 text-start transition-colors hover:border-primary-500 hover:bg-primary-50 disabled:opacity-50 disabled:pointer-events-none"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    {VEHICLE_META[v].emoji}
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-fg">
                      {t(`vehicles.${v}` as const)}
                    </span>
                    {driver && (
                      <span className="block text-[11px] text-fg-muted">
                        {pickLocale(driver.name, locale)}{' '}
                        {driver.driver_code && `· ${driver.driver_code}`}
                      </span>
                    )}
                  </span>
                </span>
                <span className="text-xs font-bold text-primary-700">→</span>
              </button>
            </FeedbackPin>
          );
        })}
      </div>

      <DialogFooter>
        <Button variant="ghost" size="md" onClick={onClose} disabled={isPending}>
          {t('common.cancel')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
