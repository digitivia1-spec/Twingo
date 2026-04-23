import type { PriceListEntry } from '@/lib/types/price';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

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
  async list() { throw NOT_IMPLEMENTED; },
};

export const prices: PriceRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
