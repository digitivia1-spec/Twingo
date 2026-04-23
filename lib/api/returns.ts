import type { ReturnManifest } from '@/lib/types/return';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

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
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
};

export const returns: ReturnRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
