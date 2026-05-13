import type { AuditFields } from './shared';

/**
 * Per-merchant override of the global PriceListEntry on a from→to lane.
 * Mirrors the legacy tool's `/client_shipping_cost/{id}` per-client pricing.
 *
 * Pricing precedence at calculation time:
 *  1. ClientShippingRate (if active and lane matches)
 *  2. PriceListEntry (global default)
 */
export interface ClientShippingRate extends AuditFields {
  id: string;
  client_id: string;
  from_governorate_id: string;
  to_governorate_id: string;
  weight_tier: {
    min_kg: number;
    max_kg: number;
  };
  /** piasters — EGP × 100 */
  base_price: number;
  /** Optional percentage on top of COD value (0–100). */
  cod_handling_fee_percent?: number;
  /** piasters — added when the pickup is_fragile. */
  fragile_surcharge?: number;
  is_active: boolean;
  notes?: string;
}
