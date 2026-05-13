export const ORDER_STATUSES = [
  'pending',
  'dispatched',
  'out_for_delivery',
  'delivered',
  'partially_delivered',
  'returned',
  'cancelled',
  'refused',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const VEHICLE_TYPES = [
  'tagamoa_van',
  'october_van',
  'motorcycle',
] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const STOCK_STATUSES = [
  'available',
  'locked',
  'in_transit',
  'reserved',
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const FINANCE_STATUSES = [
  'pending',
  'reconciled',
  'approved',
  'paid_out',
  'disputed',
] as const;
export type FinanceStatus = (typeof FINANCE_STATUSES)[number];

export const COD_STATUSES = [
  'pending',
  'scheduled',
  'paid',
  'disputed',
] as const;
export type CodStatus = (typeof COD_STATUSES)[number];

export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'instapay',
  'vodafone_cash',
  'fawry',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const USER_ROLES = [
  'super_admin',
  'admin',
  'manager',
  'warehouse',
  'driver',
  'finance',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const RETURN_STATUSES = [
  'draft',
  'in_transit',
  'delivered_to_merchant',
  'acknowledged',
] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'transfer',
  'intake',
  'outbound',
  'lock',
  'unlock',
  'adjustment',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

/**
 * Order type — the 12 product flavours the existing tool exposes.
 * "forward" is the default normal forward delivery.
 */
export const ORDER_TYPES = [
  'forward',
  'exchange',
  'refund',
  'pickup',
  'return_to_shipper',
  'damage',
  'lost',
  'transit',
  'partial_receive',
  'return_warehouse',
  'item_with_driver',
  'partial_returned',
] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

/**
 * Per-pickup review state used by the New Orders queue.
 * Pickups submitted via the merchant portal land in `pending_review` until
 * an ops user approves or rejects them.
 */
export const PICKUP_REVIEW_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
] as const;
export type PickupReviewStatus = (typeof PICKUP_REVIEW_STATUSES)[number];

/**
 * Origin channel for a pickup — drives reporting and audit.
 */
export const SUBMISSION_SOURCES = [
  'admin_create',
  'merchant_portal',
  'csv_import',
  'shopify',
  'zamit',
  'api',
] as const;
export type SubmissionSource = (typeof SUBMISSION_SOURCES)[number];

/**
 * Merchant onboarding gate. Existing seed data is treated as 'approved'.
 * New self-signups land in 'pending' until ops verifies them.
 */
export const CLIENT_APPROVAL_STATUSES = [
  'pending',
  'approved',
  'rejected',
] as const;
export type ClientApprovalStatus = (typeof CLIENT_APPROVAL_STATUSES)[number];

/**
 * Lifecycle of a merchant-initiated cash withdrawal request.
 *  pending → approved → paid (happy path)
 *  pending → rejected (decline)
 */
export const CASH_REQUEST_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'paid',
] as const;
export type CashRequestStatus = (typeof CASH_REQUEST_STATUSES)[number];
