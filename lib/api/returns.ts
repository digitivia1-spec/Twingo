import type { ReturnManifest } from '@/lib/types/return';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, unwrapMaybe, unwrapRows } from './_supabase';

export interface ReturnRepository {
  list(): Promise<ReturnManifest[]>;
  getById(id: string): Promise<ReturnManifest | null>;
}

const mock: ReturnRepository = {
  async list() {
    return latency(
      store.returns
        .slice()
        .sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    );
  },
  async getById(id) {
    return latency(store.returns.find((r) => r.id === id) ?? null);
  },
};

const supabase: ReturnRepository = {
  async list() {
    const sb = getSupabase();
    return unwrapRows<ReturnManifest>(
      await sb.from('return_manifests').select('*').order('created_at', { ascending: false }),
    );
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<ReturnManifest>(
      await sb.from('return_manifests').select('*').eq('id', id).maybeSingle(),
    );
  },
};

export const returns: ReturnRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
