import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { PickupReasonCode } from '@/lib/types/pickup';

/**
 * Compact, warning-toned badge for a structured reason on a status event.
 * Renders nothing when no code is supplied — caller can pass through optimistic.
 */
export function ReasonCodeBadge({
  code,
}: {
  code?: PickupReasonCode;
}) {
  const t = useTranslations('reasonCodes');
  if (!code) return null;
  return <Badge tone="warning">{t(code)}</Badge>;
}
