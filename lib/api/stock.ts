import type { StockStatus } from '@/lib/types/enums';
import type { StockItem, StockMovement } from '@/lib/types/stock';
import type { Bilingual } from '@/lib/types/shared';
import { DATA_SOURCE } from './source';
import { latency, nextSequence, nowIso, store } from './_store';
import { getSupabase, nowIso as sbNow, unwrapMaybe, unwrapRows } from './_supabase';

/** Mirror of _store.nextSequence but against a Supabase table. */
async function nextId(table: string, prefix: string): Promise<string> {
  const sb = getSupabase();
  const rows = unwrapRows<{ id: string }>(await sb.from(table).select('id'));
  const max = rows.reduce((acc, r) => {
    const n = Number(r.id.replace(`${prefix}_`, '').replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}_${String(max + 1).padStart(4, '0')}`;
}

async function fetchStock(id: string): Promise<StockItem> {
  const sb = getSupabase();
  const item = unwrapMaybe<StockItem>(
    await sb.from('stock_items').select('*').eq('id', id).maybeSingle(),
  );
  if (!item) throw new Error(`Stock item not found: ${id}`);
  return item;
}

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
  async list(filters = {}) {
    const sb = getSupabase();
    let q = sb.from('stock_items').select('*').is('deleted_at', null);
    if (filters.status && filters.status.length > 0) q = q.in('status', filters.status);
    if (filters.branch_id) q = q.eq('branch_id', filters.branch_id);
    if (filters.client_id) q = q.eq('client_id', filters.client_id);
    if (typeof filters.qty_min === 'number') q = q.gte('quantity', filters.qty_min);
    if (typeof filters.qty_max === 'number') q = q.lte('quantity', filters.qty_max);
    if (filters.last_movement_from) q = q.gte('last_movement_at', filters.last_movement_from);
    if (filters.search) {
      const n = filters.search.replace(/[(),*]/g, ' ').trim();
      q = q.or(`sku.ilike.*${n}*,name->>ar.ilike.*${n}*,name->>en.ilike.*${n}*`);
    }
    return unwrapRows<StockItem>(await q);
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<StockItem>(
      await sb.from('stock_items').select('*').eq('id', id).maybeSingle(),
    );
  },
  async unlock(id, input) {
    const sb = getSupabase();
    const item = await fetchStock(id);
    if (item.status !== 'locked') throw new Error(`Item not locked. Current: ${item.status}`);
    const ts = sbNow();
    const updated = unwrapMaybe<StockItem>(
      await sb
        .from('stock_items')
        .update({
          status: 'available',
          unlocked_at: ts,
          unlocked_by: input.unlocked_by,
          unlock_reason: input.unlock_reason,
          last_movement_at: ts,
          updated_at: ts,
        })
        .eq('id', id)
        .select('*')
        .maybeSingle(),
    );
    await sb.from('stock_movements').insert({
      id: await nextId('stock_movements', 'sm'),
      stock_item_id: id,
      type: 'unlock',
      to_branch_id: item.branch_id,
      quantity: item.quantity,
      user_id: input.unlocked_by,
      reason: input.unlock_reason,
      timestamp: ts,
    });
    return updated as StockItem;
  },
  async transfer(id, input) {
    const sb = getSupabase();
    const item = await fetchStock(id);
    if (item.branch_id === input.to_branch_id)
      throw new Error('Source and destination branches must differ.');
    if (item.quantity < input.quantity)
      throw new Error(
        `Insufficient quantity. Have ${item.quantity}, requested ${input.quantity}.`,
      );
    const ts = sbNow();
    await sb
      .from('stock_items')
      .update({ quantity: item.quantity - input.quantity, last_movement_at: ts, updated_at: ts })
      .eq('id', id);

    const newId = await nextId('stock_items', 'st');
    const { id: _omit, created_at: _c, updated_at: _u, ...rest } = item;
    void _omit;
    void _c;
    void _u;
    const newItem = unwrapMaybe<StockItem>(
      await sb
        .from('stock_items')
        .insert({
          ...rest,
          id: newId,
          branch_id: input.to_branch_id,
          quantity: input.quantity,
          status: 'in_transit',
          last_movement_at: ts,
        })
        .select('*')
        .maybeSingle(),
    );
    await sb.from('stock_movements').insert({
      id: await nextId('stock_movements', 'sm'),
      stock_item_id: newId,
      type: 'transfer',
      from_branch_id: item.branch_id,
      to_branch_id: input.to_branch_id,
      quantity: input.quantity,
      user_id: input.user_id,
      timestamp: ts,
    });
    return newItem as StockItem;
  },
  async receive(id, user_id) {
    const sb = getSupabase();
    const item = await fetchStock(id);
    if (item.status !== 'in_transit')
      throw new Error(`Item not in transit. Current: ${item.status}`);
    const ts = sbNow();
    const updated = unwrapMaybe<StockItem>(
      await sb
        .from('stock_items')
        .update({ status: 'available', last_movement_at: ts, updated_at: ts })
        .eq('id', id)
        .select('*')
        .maybeSingle(),
    );
    await sb.from('stock_movements').insert({
      id: await nextId('stock_movements', 'sm'),
      stock_item_id: id,
      type: 'intake',
      to_branch_id: item.branch_id,
      quantity: item.quantity,
      user_id,
      timestamp: ts,
    });
    return updated as StockItem;
  },
  async listMovements(itemId) {
    const sb = getSupabase();
    let q = sb.from('stock_movements').select('*');
    if (itemId) q = q.eq('stock_item_id', itemId);
    return unwrapRows<StockMovement>(await q.order('timestamp', { ascending: false }));
  },
};

export const stock: StockRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
