import type { PaymentMethod } from './enums';
import type {
  AuditFields,
  Bilingual,
  EgyptianAddress,
  SoftDelete,
} from './shared';

export type PaymentFrequency = 'immediate' | 'weekly' | 'bi_weekly' | 'monthly';

export interface Client extends AuditFields, SoftDelete {
  id: string;
  name: Bilingual;
  business_name?: Bilingual;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
  pickup_address: EgyptianAddress;
  preferred_branch_id: string;
  tax_number?: string;
  commercial_register?: string;
  payment_terms: {
    method: PaymentMethod;
    bank_account?: string;
    frequency: PaymentFrequency;
  };
  total_orders: number;
  /** piasters (EGP × 100) */
  total_cod_owed: number;
  is_active: boolean;
  notes?: string;
}
