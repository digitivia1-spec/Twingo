import type { Governorate } from '@/lib/types/governorate';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, unwrapOne, unwrapRows } from './_supabase';

export interface GovernorateRepository {
  list(): Promise<Governorate[]>;
  toggleActive(id: string, is_active: boolean): Promise<Governorate>;
}

const mock: GovernorateRepository = {
  async list() {
    return latency(
      store.governorates.slice().sort((a, b) => a.display_order - b.display_order),
    );
  },
  async toggleActive(id, is_active) {
    const g = store.governorates.find((x) => x.id === id);
    if (!g) throw new Error(`Governorate not found: ${id}`);
    g.is_active = is_active;
    return latency(g);
  },
};

const supabase: GovernorateRepository = {
  async list() {
    const sb = getSupabase();
    return unwrapRows<Governorate>(
      await sb.from('governorates').select('*').order('display_order'),
    );
  },
  async toggleActive(id, is_active) {
    const sb = getSupabase();
    return unwrapOne<Governorate>(
      await sb
        .from('governorates')
        .update({ is_active })
        .eq('id', id)
        .select('*')
        .single(),
    );
  },
};

export const governorates: GovernorateRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
