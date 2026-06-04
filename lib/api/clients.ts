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

export type ClientCreateInput = Pick<
  Client,
  'name' | 'phone_primary' | 'pickup_address' | 'preferred_branch_id' | 'payment_terms'
> &
  Partial<
    Pick<
      Client,
      | 'business_name'
      | 'phone_secondary'
      | 'email'
      | 'tax_number'
      | 'commercial_register'
      | 'notes'
      | 'is_active'
      | 'approval_status'
    >
  >;

/** Build a stable-ish slug PK from the client's English (fallback Arabic) name. */
function genClientId(name: { ar: string; en: string }): string {
  const base = (name.en || name.ar || 'client')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `cl_${base || 'client'}_${suffix}`;
}

export interface ClientRepository {
  list(filter?: {
    search?: string;
    branch_id?: string;
    approval_status?: ClientApprovalStatus;
  }): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  create(input: ClientCreateInput): Promise<Client>;
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
  async create(input) {
    const client: Client = {
      business_name: input.business_name,
      phone_secondary: input.phone_secondary,
      email: input.email,
      tax_number: input.tax_number,
      commercial_register: input.commercial_register,
      notes: input.notes,
      name: input.name,
      phone_primary: input.phone_primary,
      pickup_address: input.pickup_address,
      preferred_branch_id: input.preferred_branch_id,
      payment_terms: input.payment_terms,
      id: genClientId(input.name),
      total_orders: 0,
      total_cod_owed: 0,
      is_active: input.is_active ?? true,
      approval_status: input.approval_status ?? 'approved',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.clients.unshift(client);
    return latency(client);
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
  async create(input) {
    const sb = getSupabase();
    const row = unwrapMaybe<Client>(
      await sb
        .from('clients')
        .insert({
          id: genClientId(input.name),
          name: input.name,
          business_name: input.business_name ?? null,
          phone_primary: input.phone_primary,
          phone_secondary: input.phone_secondary ?? null,
          email: input.email ?? null,
          pickup_address: input.pickup_address,
          preferred_branch_id: input.preferred_branch_id,
          payment_terms: input.payment_terms,
          tax_number: input.tax_number ?? null,
          commercial_register: input.commercial_register ?? null,
          notes: input.notes ?? null,
          total_orders: 0,
          total_cod_owed: 0,
          is_active: input.is_active ?? true,
          approval_status: input.approval_status ?? 'approved',
          created_at: sbNow(),
          updated_at: sbNow(),
        })
        .select('*')
        .maybeSingle(),
    );
    if (!row) throw new Error('Client insert failed');
    return row;
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
