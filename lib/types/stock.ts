import type { StockMovementType, StockStatus } from './enums';
import type { AuditFields, Bilingual, SoftDelete } from './shared';

export interface StockItem extends AuditFields, SoftDelete {
  id: string;
  sku: string;
  name: Bilingual;
  description?: Bilingual;
  category?: string;

  branch_id: string;
  quantity: number;
  unit: 'piece' | 'box' | 'kg';

  status: StockStatus;

  // Lock details
  locked_at?: string;
  locked_by?: string;
  locked_reason?: Bilingual;
  unlocked_at?: string;
  unlocked_by?: string;
  unlock_reason?: Bilingual;

  // Reservation
  reserved_for_pickup_id?: string;
  reserved_at?: string;

  // Movement
  last_movement_at: string;

  // Optional
  client_id?: string;
  barcode?: string;
  thumbnail_url?: string;
}

export interface StockMovement extends AuditFields {
  id: string;
  stock_item_id: string;
  type: StockMovementType;
  from_branch_id?: string;
  to_branch_id?: string;
  quantity: number;
  reason?: Bilingual;
  user_id: string;
  timestamp: string;
  related_pickup_id?: string;
}
