import type {
  OrderStatus,
  OrderType,
  PickupReviewStatus,
  SubmissionSource,
  VehicleType,
} from './enums';
import type {
  AuditFields,
  Bilingual,
  Contact,
  EgyptianAddress,
  SoftDelete,
} from './shared';

/**
 * Reason codes that disambiguate why a status was set.
 * Replaces the legacy "47-status sprawl" pattern from tuyingo.com.
 * Free-form note still allowed alongside the code.
 */
export const PICKUP_REASON_CODES = [
  'not_home',
  'wrong_number',
  'address_wrong',
  'customer_refused',
  'package_damaged',
  'holiday',
  'weather',
  'out_of_zone',
  'customer_rescheduled',
  'merchant_cancelled',
  'phone_off',
  'other',
] as const;
export type PickupReasonCode = (typeof PICKUP_REASON_CODES)[number];

export interface PickupStatusEvent {
  status: OrderStatus;
  timestamp: string;
  user_id?: string;
  note?: string;
  reason_code?: PickupReasonCode;
}

export interface Pickup extends AuditFields, SoftDelete {
  id: string;
  code: string;
  reference_code?: string;
  client_id: string;
  branch_id: string;

  /** Optional — defaults to 'forward' in the UI when missing. */
  order_type?: OrderType;
  /** Optional — defaults to 'admin_create' when missing. */
  submission_source?: SubmissionSource;
  /**
   * When set to 'pending_review', the pickup shows up in the New Orders
   * queue and is NOT eligible for dispatch until an ops user approves it.
   */
  review_status?: PickupReviewStatus;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;

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
