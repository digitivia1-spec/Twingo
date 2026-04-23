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
