import type { CodStatus, PaymentMethod } from '@/lib/types/enums';
import type { CodDue } from '@/lib/types/cod-due';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nowIso, store } from './_store';

export interface CodDueFilters {
  status?: CodStatus[];
  client_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  payment_method?: PaymentMethod;
  search?: string;
}

export interface PayOutInput {
  payment_method: PaymentMethod;
  payment_reference?: string;
  amount: number;
  paid_by: string;
  send_whatsapp: boolean;
  notes?: string;
}

export interface CodDueRepository {
  list(filters?: CodDueFilters): Promise<CodDue[]>;
  getById(id: string): Promise<CodDue | null>;
  schedule(id: string, payout_date: string, method: PaymentMethod): Promise<CodDue>;
  payOut(id: string, input: PayOutInput): Promise<CodDue>;
  dispute(id: string, reason: string, user_id: string): Promise<CodDue>;
}

const mock: CodDueRepository = {
  async list(filters = {}) {
    let rows = store.codDues.slice();
    if (filters.status && filters.status.length > 0)
      rows = rows.filter((d) => filters.status!.includes(d.status));
    if (filters.client_id)
      rows = rows.filter((d) => d.client_id === filters.client_id);
    if (filters.date_from)
      rows = rows.filter((d) => d.accrual_period_start >= filters.date_from!);
    if (filters.date_to)
      rows = rows.filter((d) => d.accrual_period_end <= filters.date_to!);
    if (typeof filters.amount_min === 'number')
      rows = rows.filter((d) => d.net_amount_due >= filters.amount_min!);
    if (typeof filters.amount_max === 'number')
      rows = rows.filter((d) => d.net_amount_due <= filters.amount_max!);
    if (filters.payment_method)
      rows = rows.filter((d) => d.payment_method === filters.payment_method);
    return latency(rows.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)));
  },
  async getById(id) {
    return latency(store.codDues.find((d) => d.id === id) ?? null);
  },
  async schedule(id, payout_date, method) {
    const d = store.codDues.find((x) => x.id === id);
    if (!d) throw new Error(`COD due not found: ${id}`);
    d.status = 'scheduled';
    d.scheduled_payout_date = payout_date;
    d.payment_method = method;
    d.updated_at = nowIso();
    return latency(d);
  },
  async payOut(id, input) {
    const d = store.codDues.find((x) => x.id === id);
    if (!d) throw new Error(`COD due not found: ${id}`);
    d.status = 'paid';
    d.payment_method = input.payment_method;
    d.payment_reference = input.payment_reference;
    d.paid_at = nowIso();
    d.paid_by = input.paid_by;
    if (input.send_whatsapp) {
      d.whatsapp_sent_at = nowIso();
      d.whatsapp_template_used = 'cod_payout_confirmation_ar';
    }
    d.updated_at = nowIso();
    return latency(d);
  },
  async dispute(id, reason, _user_id) {
    const d = store.codDues.find((x) => x.id === id);
    if (!d) throw new Error(`COD due not found: ${id}`);
    d.status = 'disputed';
    d.deductions_notes = reason;
    d.updated_at = nowIso();
    return latency(d);
  },
};

const supabase: CodDueRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async schedule() { throw NOT_IMPLEMENTED; },
  async payOut() { throw NOT_IMPLEMENTED; },
  async dispute() { throw NOT_IMPLEMENTED; },
};

export const codDues: CodDueRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
