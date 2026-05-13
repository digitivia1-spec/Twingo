import type { District } from '@/lib/types/district';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

export interface DistrictRepository {
  list(filter?: {
    city_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<District[]>;
  getById(id: string): Promise<District | null>;
}

const mock: DistrictRepository = {
  async list(filter) {
    let rows = store.districts.slice();
    if (filter?.city_id)
      rows = rows.filter((d) => d.city_id === filter.city_id);
    if (typeof filter?.is_active === 'boolean')
      rows = rows.filter((d) => d.is_active === filter.is_active);
    if (filter?.search) {
      const n = filter.search.toLowerCase();
      rows = rows.filter(
        (d) =>
          d.name.ar.toLowerCase().includes(n) ||
          d.name.en.toLowerCase().includes(n) ||
          d.code.toLowerCase().includes(n),
      );
    }
    return latency(rows);
  },
  async getById(id) {
    return latency(store.districts.find((d) => d.id === id) ?? null);
  },
};

const supabase: DistrictRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
};

export const districts: DistrictRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
