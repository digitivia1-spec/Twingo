import type { OrderStatus, VehicleType } from '@/lib/types/enums';
import type { Pickup } from '@/lib/types/pickup';
import type { Paginated } from '@/lib/types/shared';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nextSequence, nowIso, store } from './_store';

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
  page?: number;
  page_size?: number;
  sort_by?: keyof Pickup;
  sort_dir?: 'asc' | 'desc';
}

export type PickupCreateInput = Omit<
  Pickup,
  'id' | 'code' | 'created_at' | 'updated_at' | 'status_history' | 'status'
> & { status?: OrderStatus };

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
  softDelete(id: string): Promise<void>;
}

function matchesFilters(pickup: Pickup, f: PickupFilters): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(pickup.status))
    return false;
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

  async softDelete(id) {
    const pickup = store.pickups.find((p) => p.id === id);
    if (!pickup) throw new Error(`Pickup not found: ${id}`);
    pickup.deleted_at = nowIso();
    return latency(undefined);
  },
};

const supabase: PickupRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async create() { throw NOT_IMPLEMENTED; },
  async update() { throw NOT_IMPLEMENTED; },
  async dispatch() { throw NOT_IMPLEMENTED; },
  async cancel() { throw NOT_IMPLEMENTED; },
  async softDelete() { throw NOT_IMPLEMENTED; },
};

export const pickups: PickupRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
