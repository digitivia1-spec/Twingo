import type { ClientApprovalStatus } from '@/lib/types/enums';
import type { Client } from '@/lib/types/client';
import { DATA_SOURCE } from './source';
import { latency, nowIso, store } from './_store';
import {
  getSupabase,
  nowIso as sbNow,
  sanitizeSearch,
  unwrapMaybe,
  unwrapRows,
} from './_supabase';

/**
 * A client is treated as approved if `approval_status` is missing
 * (legacy seed data) or explicitly 'approved'. Pending/rejected merchants
 * never appear in the main directory.
 */
export function effectiveApprovalStatus(c: Client): ClientApprovalStatus {
  return c.approval_status ?? 'approved';
}

export interface ClientRepository {
  list(filter?: {
    search?: string;
    branch_id?: string;
    approval_status?: ClientApprovalStatus;
  }): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  approve(id: string, approved_by: string): Promise<Client>;
  reject(id: string, rejected_by: string, reason: string): Promise<Client>;
}

const mock: ClientRepository = {
  async list(filter) {
    let rows = store.clients.slice();
    if (filter?.approval_status) {
      rows = rows.filter(
        (c) => effectiveApprovalStatus(c) === filter.approval_status,
      );
    } else {
      // Default: only show approved merchants in the main directory.
      rows = rows.filter((c) => effectiveApprovalStatus(c) === 'approved');
    }
    if (filter?.branch_id)
      rows = rows.filter((c) => c.preferred_branch_id === filter.branch_id);
    if (filter?.search) {
      const needle = filter.search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.ar.toLowerCase().includes(needle) ||
          c.name.en.toLowerCase().includes(needle) ||
          c.phone_primary.includes(needle),
      );
    }
    return latency(rows);
  },
  async getById(id) {
    return latency(store.clients.find((c) => c.id === id) ?? null);
  },
  async approve(id, approved_by) {
    const c = store.clients.find((x) => x.id === id);
    if (!c) throw new Error(`Client not found: ${id}`);
    c.approval_status = 'approved';
    c.approved_at = nowIso();
    c.approved_by = approved_by;
    c.is_active = true;
    c.updated_at = nowIso();
    return latency(c);
  },
  async reject(id, rejected_by, reason) {
    const c = store.clients.find((x) => x.id === id);
    if (!c) throw new Error(`Client not found: ${id}`);
    c.approval_status = 'rejected';
    c.approved_by = rejected_by;
    c.rejection_reason = reason;
    c.is_active = false;
    c.updated_at = nowIso();
    return latency(c);
  },
};

const supabase: ClientRepository = {
  async list(filter) {
    const sb = getSupabase();
    let q = sb.from('clients').select('*').is('deleted_at', null);
    // A null approval_status is treated as 'approved' (legacy/seed rows).
    const wanted = filter?.approval_status ?? 'approved';
    if (wanted === 'approved') {
      q = q.or('approval_status.is.null,approval_status.eq.approved');
    } else {
      q = q.eq('approval_status', wanted);
    }
    if (filter?.branch_id) q = q.eq('preferred_branch_id', filter.branch_id);
    if (filter?.search) {
      const n = sanitizeSearch(filter.search);
      q = q.or(
        `name->>ar.ilike.*${n}*,name->>en.ilike.*${n}*,phone_primary.ilike.*${n}*`,
      );
    }
    return unwrapRows<Client>(await q.order('created_at', { ascending: false }));
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<Client>(
      await sb.from('clients').select('*').eq('id', id).maybeSingle(),
    );
  },
  async approve(id, approved_by) {
    const sb = getSupabase();
    const c = unwrapMaybe<Client>(
      await sb
        .from('clients')
        .update({
          approval_status: 'approved',
          approved_at: sbNow(),
          approved_by,
          is_active: true,
          updated_at: sbNow(),
        })
        .eq('id', id)
        .select('*')
        .maybeSingle(),
    );
    if (!c) throw new Error(`Client not found: ${id}`);
    return c;
  },
  async reject(id, rejected_by, reason) {
    const sb = getSupabase();
    const c = unwrapMaybe<Client>(
      await sb
        .from('clients')
        .update({
          approval_status: 'rejected',
          approved_by: rejected_by,
          rejection_reason: reason,
          is_active: false,
          updated_at: sbNow(),
        })
        .eq('id', id)
        .select('*')
        .maybeSingle(),
    );
    if (!c) throw new Error(`Client not found: ${id}`);
    return c;
  },
};

export const clients: ClientRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
