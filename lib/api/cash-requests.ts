import type { CashRequestStatus, PaymentMethod } from '@/lib/types/enums';
import type { CashRequest } from '@/lib/types/cash-request';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nowIso, store } from './_store';

export interface CashRequestFilters {
  status?: CashRequestStatus[];
  client_id?: string;
  search?: string;
}

export interface ApproveInput {
  approved_by: string;
}

export interface RejectInput {
  rejected_by: string;
  reason: string;
}

export interface MarkPaidInput {
  paid_by: string;
  payment_method: PaymentMethod;
  payment_reference?: string;
  cod_due_id?: string;
}

export interface CashRequestRepository {
  list(filters?: CashRequestFilters): Promise<CashRequest[]>;
  getById(id: string): Promise<CashRequest | null>;
  approve(id: string, input: ApproveInput): Promise<CashRequest>;
  reject(id: string, input: RejectInput): Promise<CashRequest>;
  markPaid(id: string, input: MarkPaidInput): Promise<CashRequest>;
}

const mock: CashRequestRepository = {
  async list(filters = {}) {
    let rows = store.cashRequests.slice();
    if (filters.status && filters.status.length > 0) {
      rows = rows.filter((r) => filters.status!.includes(r.status));
    }
    if (filters.client_id) {
      rows = rows.filter((r) => r.client_id === filters.client_id);
    }
    if (filters.search) {
      const n = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.code.toLowerCase().includes(n) ||
          r.client_id.toLowerCase().includes(n),
      );
    }
    return latency(
      rows.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    );
  },
  async getById(id) {
    return latency(store.cashRequests.find((r) => r.id === id) ?? null);
  },
  async approve(id, input) {
    const r = store.cashRequests.find((x) => x.id === id);
    if (!r) throw new Error(`Cash request not found: ${id}`);
    if (r.status !== 'pending') {
      throw new Error(`Cannot approve a request in status "${r.status}"`);
    }
    r.status = 'approved';
    r.approved_at = nowIso();
    r.approved_by = input.approved_by;
    r.updated_at = nowIso();
    return latency(r);
  },
  async reject(id, input) {
    const r = store.cashRequests.find((x) => x.id === id);
    if (!r) throw new Error(`Cash request not found: ${id}`);
    if (r.status !== 'pending') {
      throw new Error(`Cannot reject a request in status "${r.status}"`);
    }
    r.status = 'rejected';
    r.rejection_reason = input.reason;
    r.approved_by = input.rejected_by;
    r.updated_at = nowIso();
    return latency(r);
  },
  async markPaid(id, input) {
    const r = store.cashRequests.find((x) => x.id === id);
    if (!r) throw new Error(`Cash request not found: ${id}`);
    if (r.status !== 'approved') {
      throw new Error(
        `Mark-paid requires an approved request — current: "${r.status}"`,
      );
    }
    r.status = 'paid';
    r.paid_at = nowIso();
    r.paid_by = input.paid_by;
    r.payment_reference = input.payment_reference;
    r.cod_due_id = input.cod_due_id;
    r.updated_at = nowIso();
    return latency(r);
  },
};

const supabase: CashRequestRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async approve() { throw NOT_IMPLEMENTED; },
  async reject() { throw NOT_IMPLEMENTED; },
  async markPaid() { throw NOT_IMPLEMENTED; },
};

export const cashRequests: CashRequestRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
