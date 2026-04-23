import { useTranslations } from 'next-intl';
import { VEHICLE_META } from '@/lib/constants/vehicles';
import type { VehicleType } from '@/lib/types/enums';

export function VehicleIcon({
  type,
  showLabel = true,
}: {
  type: VehicleType;
  showLabel?: boolean;
}) {
  const t = useTranslations('vehicles');
  const meta = VEHICLE_META[type];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span aria-hidden>{meta.emoji}</span>
      {showLabel && <span>{t(type)}</span>}
    </span>
  );
}
