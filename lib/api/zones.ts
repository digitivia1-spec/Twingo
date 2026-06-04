import type { Zone } from '@/lib/types/zone';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, sanitizeSearch, unwrapMaybe, unwrapRows } from './_supabase';

export interface ZoneRepository {
  list(filter?: {
    branch_id?: string;
    governorate_id?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<Zone[]>;
  getById(id: string): Promise<Zone | null>;
}

const mock: ZoneRepository = {
  async list(filter) {
    let rows = store.zones.slice();
    if (filter?.branch_id)
      rows = rows.filter((z) => z.branch_ids.includes(filter.branch_id!));
    if (filter?.governorate_id)
      rows = rows.filter((z) =>
        z.governorate_ids.includes(filter.governorate_id!),
      );
    if (typeof filter?.is_active === 'boolean')
      rows = rows.filter((z) => z.is_active === filter.is_active);
    if (filter?.search) {
      const n = filter.search.toLowerCase();
      rows = rows.filter(
        (z) =>
          z.name.ar.toLowerCase().includes(n) ||
          z.name.en.toLowerCase().includes(n) ||
          z.code.toLowerCase().includes(n),
      );
    }
    return latency(rows);
  },
  async getById(id) {
    return latency(store.zones.find((z) => z.id === id) ?? null);
  },
};

const supabase: ZoneRepository = {
  async list(filter) {
    const sb = getSupabase();
    let q = sb.from('zones').select('*');
    if (filter?.branch_id) q = q.contains('branch_ids', [filter.branch_id]);
    if (filter?.governorate_id) q = q.contains('governorate_ids', [filter.governorate_id]);
    if (typeof filter?.is_active === 'boolean') q = q.eq('is_active', filter.is_active);
    if (filter?.search) {
      const n = sanitizeSearch(filter.search);
      q = q.or(`name->>ar.ilike.*${n}*,name->>en.ilike.*${n}*,code.ilike.*${n}*`);
    }
    return unwrapRows<Zone>(await q);
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<Zone>(
      await sb.from('zones').select('*').eq('id', id).maybeSingle(),
    );
  },
};

export const zones: ZoneRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
