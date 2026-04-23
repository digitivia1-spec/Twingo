import type { OrderStatus, VehicleType } from './enums';
import type {
  AuditFields,
  Bilingual,
  Contact,
  EgyptianAddress,
  SoftDelete,
} from './shared';

export interface PickupStatusEvent {
  status: OrderStatus;
  timestamp: string;
  user_id?: string;
  note?: string;
}

export interface Pickup extends AuditFields, SoftDelete {
  id: string;
  code: string;
  reference_code?: string;
  client_id: string;
  branch_id: string;

  // Recipient
  recipient: Contact;
  delivery_address: EgyptianAddress;

  // Package
  description: Bilingual;
  weight_kg: number;
  pieces_count: number;
  is_fragile: boolean;
  allow_open_package: boolean;

  // Money (piasters — EGP × 100)
  cod_amount: number;
  shipping_fee: number;

  // Dispatch
  status: OrderStatus;
  vehicle_type?: VehicleType;
  driver_id?: string;
  dispatched_at?: string;
  expected_delivery_date?: string;
  delivered_at?: string;

  // Lifecycle
  status_history: PickupStatusEvent[];

  // Notes
  internal_notes?: string;
  driver_notes?: string;
  customer_notes?: string;
}
