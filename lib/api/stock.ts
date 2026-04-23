import type { StockStatus } from '@/lib/types/enums';
import type { StockItem, StockMovement } from '@/lib/types/stock';
import type { Bilingual } from '@/lib/types/shared';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nextSequence, nowIso, store } from './_store';

export interface StockFilters {
  status?: StockStatus[];
  branch_id?: string;
  search?: string;
  qty_min?: number;
  qty_max?: number;
  last_movement_from?: string;
  client_id?: string;
}

export interface UnlockInput {
  unlocked_by: string;
  unlock_reason: Bilingual;
  approver_id: string;
}

export interface TransferInput {
  to_branch_id: string;
  quantity: number;
  expected_arrival_date?: string;
  driver_id?: string;
  user_id: string;
}

export interface StockRepository {
  list(filters?: StockFilters): Promise<StockItem[]>;
  getById(id: string): Promise<StockItem | null>;
  unlock(id: string, input: UnlockInput): Promise<StockItem>;
  transfer(id: string, input: TransferInput): Promise<StockItem>;
  receive(id: string, user_id: string): Promise<StockItem>;
  listMovements(itemId?: string): Promise<StockMovement[]>;
}

function match(item: StockItem, f: StockFilters): boolean {
  if (item.deleted_at) return false;
  if (f.status && f.status.length > 0 && !f.status.includes(item.status))
    return false;
  if (f.branch_id && item.branch_id !== f.branch_id) return false;
  if (f.client_id && item.client_id !== f.client_id) return false;
  if (typeof f.qty_min === 'number' && item.quantity < f.qty_min) return false;
  if (typeof f.qty_max === 'number' && item.quantity > f.qty_max) return false;
  if (f.last_movement_from && item.last_movement_at < f.last_movement_from)
    return false;
  if (f.search) {
    const n = f.search.toLowerCase();
    const hit =
      item.sku.toLowerCase().includes(n) ||
      item.name.ar.toLowerCase().includes(n) ||
      item.name.en.toLowerCase().includes(n);
    if (!hit) return false;
  }
  return true;
}

const mock: StockRepository = {
  async list(filters = {}) {
    const rows = store.stock.filter((i) => match(i, filters));
    return latency(rows);
  },
  async getById(id) {
    return latency(store.stock.find((i) => i.id === id) ?? null);
  },
  async unlock(id, input) {
    const item = store.stock.find((i) => i.id === id);
    if (!item) throw new Error(`Stock item not found: ${id}`);
    if (item.status !== 'locked')
      throw new Error(`Item not locked. Current: ${item.status}`);
    item.status = 'available';
    item.unlocked_at = nowIso();
    item.unlocked_by = input.unlocked_by;
    item.unlock_reason = input.unlock_reason;
    item.last_movement_at = nowIso();
    item.updated_at = nowIso();
    store.movements.push({
      id: nextSequence('sm', store.movements),
      stock_item_id: id,
      type: 'unlock',
      to_branch_id: item.branch_id,
      quantity: item.quantity,
      user_id: input.unlocked_by,
      reason: input.unlock_reason,
      timestamp: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    return latency(item);
  },
  async transfer(id, input) {
    const item = store.stock.find((i) => i.id === id);
    if (!item) throw new Error(`Stock item not found: ${id}`);
    if (item.branch_id === input.to_branch_id)
      throw new Error('Source and destination branches must differ.');
    if (item.quantity < input.quantity)
      throw new Error(
        `Insufficient quantity. Have ${item.quantity}, requested ${input.quantity}.`,
      );
    const fromBranch = item.branch_id;
    item.quantity -= input.quantity;
    item.last_movement_at = nowIso();
    item.updated_at = nowIso();

    // Create a new in-transit item for the destination branch
    const newItem: StockItem = {
      ...item,
      id: nextSequence('st', store.stock),
      branch_id: input.to_branch_id,
      quantity: input.quantity,
      status: 'in_transit',
      last_movement_at: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.stock.push(newItem);

    store.movements.push({
      id: nextSequence('sm', store.movements),
      stock_item_id: newItem.id,
      type: 'transfer',
      from_branch_id: fromBranch,
      to_branch_id: input.to_branch_id,
      quantity: input.quantity,
      user_id: input.user_id,
      timestamp: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    return latency(newItem);
  },
  async receive(id, user_id) {
    const item = store.stock.find((i) => i.id === id);
    if (!item) throw new Error(`Stock item not found: ${id}`);
    if (item.status !== 'in_transit')
      throw new Error(`Item not in transit. Current: ${item.status}`);
    item.status = 'available';
    item.last_movement_at = nowIso();
    item.updated_at = nowIso();
    store.movements.push({
      id: nextSequence('sm', store.movements),
      stock_item_id: id,
      type: 'intake',
      to_branch_id: item.branch_id,
      quantity: item.quantity,
      user_id,
      timestamp: nowIso(),
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    return latency(item);
  },
  async listMovements(itemId) {
    const rows = itemId
      ? store.movements.filter((m) => m.stock_item_id === itemId)
      : store.movements.slice();
    return latency(rows.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1)));
  },
};

const supabase: StockRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async unlock() { throw NOT_IMPLEMENTED; },
  async transfer() { throw NOT_IMPLEMENTED; },
  async receive() { throw NOT_IMPLEMENTED; },
  async listMovements() { throw NOT_IMPLEMENTED; },
};

export const stock: StockRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
