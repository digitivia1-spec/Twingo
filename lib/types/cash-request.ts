import type { CashRequestStatus, PaymentMethod } from './enums';
import type { AuditFields } from './shared';

/**
 * Merchant-initiated cash withdrawal request — mirrors the
 * `/dashboard/cash_requests` queue from the legacy tool.
 *
 * Lifecycle: pending → approved → paid (or pending → rejected).
 * On paid, optionally linked to a CodDue settlement record.
 */
export interface CashRequest extends AuditFields {
  id: string;
  code: string;
  client_id: string;

  /** piasters (EGP × 100) */
  requested_amount: number;
  requested_method: PaymentMethod;
  bank_account?: string;
  /** Free-form merchant note: "weekly payout", "urgent", etc. */
  comment?: string;

  status: CashRequestStatus;

  // Approval
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;

  // Payout
  paid_at?: string;
  paid_by?: string;
  payment_reference?: string;
  /** Optional cross-link to the COD settlement that fulfilled this request. */
  cod_due_id?: string;
}
