import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { OrderType } from '@/lib/types/enums';

/**
 * Tone mapping by intent:
 *  - forward / pickup → info (normal forward flow)
 *  - exchange / refund / return_to_shipper / partial_returned → warning (rework)
 *  - damage / lost → danger (exception)
 *  - transit / partial_receive / return_warehouse / item_with_driver → neutral
 */
const TONE: Record<
  OrderType,
  'success' | 'warning' | 'danger' | 'info' | 'neutral'
> = {
  forward: 'info',
  pickup: 'info',
  exchange: 'warning',
  refund: 'warning',
  return_to_shipper: 'warning',
  partial_returned: 'warning',
  damage: 'danger',
  lost: 'danger',
  transit: 'neutral',
  partial_receive: 'neutral',
  return_warehouse: 'neutral',
  item_with_driver: 'neutral',
};

export function OrderTypeBadge({
  type,
}: {
  /** Defaults to 'forward' when omitted — matches the data layer default. */
  type?: OrderType;
}) {
  const t = useTranslations('orderTypes');
  const effective = type ?? 'forward';
  return <Badge tone={TONE[effective]}>{t(effective)}</Badge>;
}
