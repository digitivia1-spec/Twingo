import type { FinanceStatus } from './enums';
import type { AuditFields } from './shared';

export interface DriverShift extends AuditFields {
  id: string;
  driver_id: string;
  branch_id: string;
  /** YYYY-MM-DD */
  shift_date: string;

  // Counts
  orders_assigned: number;
  orders_delivered: number;
  orders_returned: number;
  orders_cancelled: number;
  orders_refused: number;

  // Money (piasters)
  expected_cash: number;
  actual_cash: number;
  variance: number;

  // Reconciliation
  status: FinanceStatus;
  reconciled_at?: string;
  reconciled_by?: string;
  approved_at?: string;
  approved_by?: string;
  paid_out_at?: string;
  paid_out_by?: string;

  // Notes
  variance_reason?: string;
  dispute_reason?: string;
  notes?: string;
}
