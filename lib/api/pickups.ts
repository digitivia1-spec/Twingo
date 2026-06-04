import type {
  OrderStatus,
  OrderType,
  PickupReviewStatus,
  VehicleType,
} from '@/lib/types/enums';
import type { Pickup, PickupReasonCode } from '@/lib/types/pickup';
import type { Paginated } from '@/lib/types/shared';
import { DATA_SOURCE } from './source';
import { latency, nextSequence, nowIso, store } from './_store';
import {
  getSupabase,
  nowIso as sbNow,
  unwrapMaybe,
  unwrapOne,
  unwrapRows,
} from './_supabase';
import type { PickupStatusEvent } from '@/lib/types/pickup';

export interface PickupFilters {
  status?: OrderStatus[];
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  last_activity_from?: string;
  search?: string;
  reference_code?: string;
  collection?: 'collected' | 'not_collected';
  client_id?: string;
  driver_id?: string;
  /** Filter by one or more order types (forward, exchange, refund, …). */
  order_type?: OrderType[];
  /**
   * Filter by review state. Defaults to "exclude pending_review" so
   * unapproved merchant submissions don't show up in the main list.
   * Pass 'pending_review' to drive the New Orders queue.
   */
  review_status?: PickupReviewStatus | 'all';
  page?: number;
  page_size?: number;
  sort_by?: keyof Pickup;
  sort_dir?: 'asc' | 'desc';
}

export type PickupCreateInput = Omit<
  Pickup,
  'id' | 'code' | 'created_at' | 'updated_at' | 'status_history' | 'status'
> & { status?: OrderStatus; order_type?: OrderType };

export interface PickupRepository {
  list(filters?: PickupFilters): Promise<Paginated<Pickup>>;
  getById(id: string): Promise<Pickup | null>;
  create(input: PickupCreateInput): Promise<Pickup>;
  update(id: string, patch: Partial<Pickup>): Promise<Pickup>;
  dispatch(
    id: string,
    vehicle: VehicleType,
    driver_id: string,
    user_id?: string,
  ): Promise<Pickup>;
  cancel(id: string, reason: string, user_id?: string): Promise<Pickup>;
  /**
   * Change the pickup's status with a structured reason code. Pushes an
   * entry onto status_history. Used from the PickupDetail status modal.
   */
  changeStatus(
    id: string,
    next: OrderStatus,
    input: {
      reason_code?: PickupReasonCode;
      note?: string;
      user_id?: string;
    },
  ): Promise<Pickup>;
  /** Approve a merchant-submitted pickup so it becomes dispatchable. */
  approveReview(id: string, reviewed_by: string): Promise<Pickup>;
  /** Reject a merchant-submitted pickup. */
  rejectReview(
    id: string,
    reviewed_by: string,
    reason: string,
  ): Promise<Pickup>;
  softDelete(id: string): Promise<void>;
}

function matchesFilters(pickup: Pickup, f: PickupFilters): boolean {
  // Review-status gate: by default, omit pickups awaiting ops review from
  // every list except the explicit New Orders queue.
  const requestedReview = f.review_status ?? 'default';
  const actualReview = pickup.review_status ?? 'approved';
  if (requestedReview === 'default') {
    if (actualReview === 'pending_review' || actualReview === 'rejected')
      return false;
  } else if (requestedReview !== 'all' && actualReview !== requestedReview) {
    return false;
  }
  if (f.status && f.status.length > 0 && !f.status.includes(pickup.status))
    return false;
  if (f.order_type && f.order_type.length > 0) {
    const effective = pickup.order_type ?? 'forward';
    if (!f.order_type.includes(effective)) return false;
  }
  if (f.branch_id && pickup.branch_id !== f.branch_id) return false;
  if (f.client_id && pickup.client_id !== f.client_id) return false;
  if (f.driver_id && pickup.driver_id !== f.driver_id) return false;
  if (f.reference_code && pickup.reference_code !== f.reference_code)
    return false;
  if (f.date_from && pickup.created_at < f.date_from) return false;
  if (f.date_to && pickup.created_at > f.date_to) return false;
  if (f.last_activity_from && pickup.updated_at < f.last_activity_from)
    return false;
  if (f.collection) {
    const collected = pickup.status === 'delivered';
    if (f.collection === 'collected' && !collected) return false;
    if (f.collection === 'not_collected' && collected) return false;
  }
  if (f.search) {
    const n = f.search.toLowerCase();
    const hit =
      pickup.code.toLowerCase().includes(n) ||
      pickup.recipient.phone_primary.includes(n) ||
      pickup.recipient.name.ar.toLowerCase().includes(n) ||
      pickup.recipient.name.en.toLowerCase().includes(n);
    if (!hit) return false;
  }
  return true;
}

const mock: PickupRepository = {
  async list(filters = {}) {
    let rows = store.pickups.filter((p) => !p.deleted_at && matchesFilters(p, filters));
    // default sort: newest first
    const sortBy = filters.sort_by ?? 'created_at';
    const dir = filters.sort_dir === 'asc' ? 1 : -1;
    rows = rows.slice().sort((a, b) => {
      const av = a[sortBy] as unknown as string | number | undefined;
      const bv = b[sortBy] as unknown as string | number | undefined;
      if (av === bv) return 0;
      return (av ?? '') < (bv ?? '') ? -dir : dir;
    });

    const page = filters.page ?? 1;
    const pageSize = filters.page_size ?? 25;
    const total = rows.length;
    const paged = rows.slice((page - 1) * pageSize, page * pageSize);
    return latency({ rows: paged, total, page, page_size: pageSize });
  },

  async getById(id) {
    return latency(store.pickups.find((p) => p.id === id) ?? null);
  },

  async create(input) {
    const id = nextSequence('pk', store.pickups);
    const codeNum = id.replace('pk_', '').replace(/^0+/, '') || '1';
    const pickup: Pickup = {
      ...input,
      id,
      code: `PK-${codeNum}`,
      status: input.status ?? 'pending',
      status_history: [
        {
          status: input.status ?? 'pending',
          timestamp: nowIso(),
        },
      ],
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.pickups.unshift(pickup);
    return latency(pickup);
  },

  async update(id, patch) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    Object.assign(pickup, patch, { updated_at: nowIso() });
    return latency(pickup);
  },

  async dispatch(id, vehicle, driver_id, user_id) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    if (pickup.status !== 'pending') {
      throw new Error(
        `Cannot dispatch pickup in status "${pickup.status}" — must be pending.`,
      );
    }
    pickup.status = 'dispatched';
    pickup.vehicle_type = vehicle;
    pickup.driver_id = driver_id;
    pickup.dispatched_at = nowIso();
    pickup.updated_at = nowIso();
    pickup.status_history.push({
      status: 'dispatched',
      timestamp: nowIso(),
      user_id,
    });
    return latency(pickup);
  },

  async cancel(id, reason, user_id) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    pickup.status = 'cancelled';
    pickup.updated_at = nowIso();
    pickup.status_history.push({
      status: 'cancelled',
      timestamp: nowIso(),
      user_id,
      note: reason,
    });
    return latency(pickup);
  },

  async changeStatus(id, next, input) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    if (pickup.status === next) {
      throw new Error(
        `Pickup ${pickup.code} is already in status "${next}".`,
      );
    }
    pickup.status = next;
    pickup.updated_at = nowIso();
    if (next === 'delivered') pickup.delivered_at = nowIso();
    pickup.status_history.push({
      status: next,
      timestamp: nowIso(),
      user_id: input.user_id,
      reason_code: input.reason_code,
      note: input.note,
    });
    return latency(pickup);
  },

  async approveReview(id, reviewed_by) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    if (pickup.review_status !== 'pending_review') {
      throw new Error(
        `Pickup ${id} is not pending review (current: ${pickup.review_status ?? 'approved'}).`,
      );
    }
    pickup.review_status = 'approved';
    pickup.reviewed_at = nowIso();
    pickup.reviewed_by = reviewed_by;
    pickup.updated_at = nowIso();
    pickup.status_history.push({
      status: pickup.status,
      timestamp: nowIso(),
      user_id: reviewed_by,
      note: 'Approved by ops',
    });
    return latency(pickup);
  },

  async rejectReview(id, reviewed_by, reason) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    if (pickup.review_status !== 'pending_review') {
      throw new Error(
        `Pickup ${id} is not pending review (current: ${pickup.review_status ?? 'approved'}).`,
      );
    }
    pickup.review_status = 'rejected';
    pickup.reviewed_at = nowIso();
    pickup.reviewed_by = reviewed_by;
    pickup.rejection_reason = reason;
    pickup.status = 'cancelled';
    pickup.updated_at = nowIso();
    pickup.status_history.push({
      status: 'cancelled',
      timestamp: nowIso(),
      user_id: reviewed_by,
      note: `Rejected by ops: ${reason}`,
    });
    return latency(pickup);
  },

  async softDelete(id) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    pickup.deleted_at = nowIso();
    return latency(undefined);
  },
};

async function fetchPickup(id: string): Promise<Pickup> {
  const sb = getSupabase();
  const p = unwrapMaybe<Pickup>(
    await sb.from('pickups').select('*').eq('id', id).maybeSingle(),
  );
  if (!p) throw new Error(`Pickup not found: ${id}`);
  return p;
}

/** Append a status event to the jsonb history AND the normalized mirror table. */
async function pushEvent(
  pickup: Pickup,
  event: PickupStatusEvent,
): Promise<PickupStatusEvent[]> {
  const sb = getSupabase();
  await sb.from('pickup_status_events').insert({
    pickup_id: pickup.id,
    status: event.status,
    timestamp: event.timestamp,
    user_id: event.user_id ?? null,
    note: event.note ?? null,
    reason_code: event.reason_code ?? null,
  });
  return [...(pickup.status_history ?? []), event];
}

const supabase: PickupRepository = {
  async list(filters = {}) {
    const sb = getSupabase();
    let q = sb.from('pickups').select('*', { count: 'exact' }).is('deleted_at', null);

    const requestedReview = filters.review_status ?? 'default';
    if (requestedReview === 'default' || requestedReview === 'approved') {
      q = q.or('review_status.is.null,review_status.eq.approved');
    } else if (requestedReview !== 'all') {
      q = q.eq('review_status', requestedReview);
    }

    if (filters.status && filters.status.length > 0) q = q.in('status', filters.status);
    if (filters.order_type && filters.order_type.length > 0) {
      if (filters.order_type.includes('forward')) {
        q = q.or(`order_type.is.null,order_type.in.(${filters.order_type.join(',')})`);
      } else {
        q = q.in('order_type', filters.order_type);
      }
    }
    if (filters.branch_id) q = q.eq('branch_id', filters.branch_id);
    if (filters.client_id) q = q.eq('client_id', filters.client_id);
    if (filters.driver_id) q = q.eq('driver_id', filters.driver_id);
    if (filters.reference_code) q = q.eq('reference_code', filters.reference_code);
    if (filters.date_from) q = q.gte('created_at', filters.date_from);
    if (filters.date_to) q = q.lte('created_at', filters.date_to);
    if (filters.last_activity_from) q = q.gte('updated_at', filters.last_activity_from);
    if (filters.collection === 'collected') q = q.eq('status', 'delivered');
    if (filters.collection === 'not_collected') q = q.neq('status', 'delivered');
    if (filters.search) {
      const n = filters.search.replace(/[(),*]/g, ' ').trim();
      q = q.or(
        `code.ilike.*${n}*,recipient->>phone_primary.ilike.*${n}*,recipient->name->>ar.ilike.*${n}*,recipient->name->>en.ilike.*${n}*`,
      );
    }

    const sortBy = (filters.sort_by ?? 'created_at') as string;
    q = q.order(sortBy, { ascending: filters.sort_dir === 'asc' });

    const page = filters.page ?? 1;
    const pageSize = filters.page_size ?? 25;
    q = q.range((page - 1) * pageSize, page * pageSize - 1);

    const res = await q;
    const rows = unwrapRows<Pickup>(res);
    return { rows, total: res.count ?? rows.length, page, page_size: pageSize };
  },

  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<Pickup>(
      await sb.from('pickups').select('*').eq('id', id).maybeSingle(),
    );
  },

  async create(input) {
    const sb = getSupabase();
    const status = input.status ?? 'pending';
    const initial: PickupStatusEvent = { status, timestamp: sbNow() };
    const row = unwrapOne<Pickup>(
      await sb
        .from('pickups')
        .insert({ ...input, status, status_history: [initial] })
        .select('*')
        .single(),
    );
    await sb.from('pickup_status_events').insert({
      pickup_id: row.id,
      status,
      timestamp: initial.timestamp,
    });
    return row;
  },

  async update(id, patch) {
    const sb = getSupabase();
    const p = unwrapMaybe<Pickup>(
      await sb
        .from('pickups')
        .update({ ...patch, updated_at: sbNow() })
        .eq('id', id)
        .select('*')
        .maybeSingle(),
    );
    if (!p) throw new Error(`Pickup not found: ${id}`);
    return p;
  },

  async dispatch(id, vehicle, driver_id, user_id) {
    const sb = getSupabase();
    const pickup = await fetchPickup(id);
    if (pickup.status !== 'pending') {
      throw new Error(
        `Cannot dispatch pickup in status "${pickup.status}" — must be pending.`,
      );
    }
    const ts = sbNow();
    const history = await pushEvent(pickup, { status: 'dispatched', timestamp: ts, user_id });
    return unwrapOne<Pickup>(
      await sb
        .from('pickups')
        .update({
          status: 'dispatched',
          vehicle_type: vehicle,
          driver_id,
          dispatched_at: ts,
          updated_at: ts,
          status_history: history,
        })
        .eq('id', id)
        .select('*')
        .single(),
    );
  },

  async cancel(id, reason, user_id) {
    const sb = getSupabase();
    const pickup = await fetchPickup(id);
    const ts = sbNow();
    const history = await pushEvent(pickup, {
      status: 'cancelled',
      timestamp: ts,
      user_id,
      note: reason,
    });
    return unwrapOne<Pickup>(
      await sb
        .from('pickups')
        .update({ status: 'cancelled', updated_at: ts, status_history: history })
        .eq('id', id)
        .select('*')
        .single(),
    );
  },

  async changeStatus(id, next, input) {
    const sb = getSupabase();
    const pickup = await fetchPickup(id);
    if (pickup.status === next) {
      throw new Error(`Pickup ${pickup.code} is already in status "${next}".`);
    }
    const ts = sbNow();
    const history = await pushEvent(pickup, {
      status: next,
      timestamp: ts,
      user_id: input.user_id,
      reason_code: input.reason_code,
      note: input.note,
    });
    const patch: Partial<Pickup> = {
      status: next,
      updated_at: ts,
      status_history: history,
    };
    if (next === 'delivered') patch.delivered_at = ts;
    return unwrapOne<Pickup>(
      await sb.from('pickups').update(patch).eq('id', id).select('*').single(),
    );
  },

  async approveReview(id, reviewed_by) {
    const sb = getSupabase();
    const pickup = await fetchPickup(id);
    if (pickup.review_status !== 'pending_review') {
      throw new Error(
        `Pickup ${id} is not pending review (current: ${pickup.review_status ?? 'approved'}).`,
      );
    }
    const ts = sbNow();
    const history = await pushEvent(pickup, {
      status: pickup.status,
      timestamp: ts,
      user_id: reviewed_by,
      note: 'Approved by ops',
    });
    return unwrapOne<Pickup>(
      await sb
        .from('pickups')
        .update({
          review_status: 'approved',
          reviewed_at: ts,
          reviewed_by,
          updated_at: ts,
          status_history: history,
        })
        .eq('id', id)
        .select('*')
        .single(),
    );
  },

  async rejectReview(id, reviewed_by, reason) {
    const sb = getSupabase();
    const pickup = await fetchPickup(id);
    if (pickup.review_status !== 'pending_review') {
      throw new Error(
        `Pickup ${id} is not pending review (current: ${pickup.review_status ?? 'approved'}).`,
      );
    }
    const ts = sbNow();
    const history = await pushEvent(pickup, {
      status: 'cancelled',
      timestamp: ts,
      user_id: reviewed_by,
      note: `Rejected by ops: ${reason}`,
    });
    return unwrapOne<Pickup>(
      await sb
        .from('pickups')
        .update({
          review_status: 'rejected',
          reviewed_at: ts,
          reviewed_by,
          rejection_reason: reason,
          status: 'cancelled',
          updated_at: ts,
          status_history: history,
        })
        .eq('id', id)
        .select('*')
        .single(),
    );
  },

  async softDelete(id) {
    const sb = getSupabase();
    const res = await sb.from('pickups').update({ deleted_at: sbNow() }).eq('id', id);
    if (res.error) throw new Error(res.error.message);
  },
};

export const pickups: PickupRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
