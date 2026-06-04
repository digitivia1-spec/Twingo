import type { PriceListEntry } from '@/lib/types/price';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, unwrapRows } from './_supabase';

export interface PriceFilters {
  from_governorate_id?: string;
  to_governorate_id?: string;
}

export interface PriceRepository {
  list(filters?: PriceFilters): Promise<PriceListEntry[]>;
}

const mock: PriceRepository = {
  async list(filters = {}) {
    let rows = store.prices.slice();
    if (filters.from_governorate_id)
      rows = rows.filter(
        (p) => p.from_governorate_id === filters.from_governorate_id,
      );
    if (filters.to_governorate_id)
      rows = rows.filter(
        (p) => p.to_governorate_id === filters.to_governorate_id,
      );
    return latency(rows);
  },
};

const supabase: PriceRepository = {
  async list(filters = {}) {
    const sb = getSupabase();
    let q = sb.from('price_list_entries').select('*');
    if (filters.from_governorate_id) q = q.eq('from_governorate_id', filters.from_governorate_id);
    if (filters.to_governorate_id) q = q.eq('to_governorate_id', filters.to_governorate_id);
    return unwrapRows<PriceListEntry>(await q);
  },
};

export const prices: PriceRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
