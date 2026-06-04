import type { City } from '@/lib/types/city';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, sanitizeSearch, unwrapMaybe, unwrapRows } from './_supabase';

export interface CityRepository {
  list(filter?: {
    governorate_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<City[]>;
  getById(id: string): Promise<City | null>;
}

const mock: CityRepository = {
  async list(filter) {
    let rows = store.cities.slice();
    if (filter?.governorate_id)
      rows = rows.filter((c) => c.governorate_id === filter.governorate_id);
    if (typeof filter?.is_active === 'boolean')
      rows = rows.filter((c) => c.is_active === filter.is_active);
    if (filter?.search) {
      const n = filter.search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.ar.toLowerCase().includes(n) ||
          c.name.en.toLowerCase().includes(n) ||
          c.code.toLowerCase().includes(n),
      );
    }
    return latency(
      rows.sort((a, b) => a.display_order - b.display_order),
    );
  },
  async getById(id) {
    return latency(store.cities.find((c) => c.id === id) ?? null);
  },
};

const supabase: CityRepository = {
  async list(filter) {
    const sb = getSupabase();
    let q = sb.from('cities').select('*');
    if (filter?.governorate_id) q = q.eq('governorate_id', filter.governorate_id);
    if (typeof filter?.is_active === 'boolean') q = q.eq('is_active', filter.is_active);
    if (filter?.search) {
      const n = sanitizeSearch(filter.search);
      q = q.or(`name->>ar.ilike.*${n}*,name->>en.ilike.*${n}*,code.ilike.*${n}*`);
    }
    return unwrapRows<City>(await q.order('display_order'));
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<City>(
      await sb.from('cities').select('*').eq('id', id).maybeSingle(),
    );
  },
};

export const cities: CityRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
