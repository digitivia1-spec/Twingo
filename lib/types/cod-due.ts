import type { CodStatus, PaymentMethod } from './enums';
import type { AuditFields } from './shared';

export interface CodDue extends AuditFields {
  id: string;
  code: string;
  client_id: string;
  /** YYYY-MM-DD */
  accrual_period_start: string;
  accrual_period_end: string;

  // Source pickups
  pickup_ids: string[];
  orders_count: number;

  // Money (piasters)
  gross_cod_collected: number;
  shipping_fees_deducted: number;
  other_deductions: number;
  deductions_notes?: string;
  net_amount_due: number;

  // Payment
  status: CodStatus;
  scheduled_payout_date?: string;
  payment_method?: PaymentMethod;
  payment_reference?: string;
  paid_at?: string;
  paid_by?: string;

  // WhatsApp notification
  whatsapp_sent_at?: string;
  whatsapp_template_used?: string;
}
