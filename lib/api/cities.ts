import type { City } from '@/lib/types/city';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

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
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
};

export const cities: CityRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
