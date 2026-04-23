import type { VehicleType } from '@/lib/types/enums';
import type { Bilingual } from '@/lib/types/shared';

export const VEHICLE_META: Record<
  VehicleType,
  { emoji: string; label: Bilingual }
> = {
  tagamoa_van: {
    emoji: '🚙',
    label: { ar: 'عربية التجمع', en: 'Tagamoa Van' },
  },
  october_van: {
    emoji: '🚗',
    label: { ar: 'عربية أكتوبر', en: 'October Van' },
  },
  motorcycle: {
    emoji: '🛵',
    label: { ar: 'موتوسيكل', en: 'Motorcycle' },
  },
};
