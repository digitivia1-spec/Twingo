import type { AuditFields, Bilingual } from './shared';

/**
 * Delivery coverage zone — coarser than a governorate (often spans several)
 * and tied to one or more operating branches. Drives pricing tiers and
 * driver-route assignment.
 */
export interface Zone extends AuditFields {
  id: string;
  name: Bilingual;
  code: string;
  /** Governorates that fall inside this zone. */
  governorate_ids: string[];
  /** Branches that operate this zone. */
  branch_ids: string[];
  /** Optional UI tint for map overlays + filter chips (hex). */
  color?: string;
  is_active: boolean;
}
