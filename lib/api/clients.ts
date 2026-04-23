import type { Client } from '@/lib/types/client';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

export interface ClientRepository {
  list(filter?: { search?: string; branch_id?: string }): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
}

const mock: ClientRepository = {
  async list(filter) {
    let rows = store.clients.slice();
    if (filter?.branch_id)
      rows = rows.filter((c) => c.preferred_branch_id === filter.branch_id);
    if (filter?.search) {
      const needle = filter.search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.ar.toLowerCase().includes(needle) ||
          c.name.en.toLowerCase().includes(needle) ||
          c.phone_primary.includes(needle),
      );
    }
    return latency(rows);
  },
  async getById(id) {
    return latency(store.clients.find((c) => c.id === id) ?? null);
  },
};

const supabase: ClientRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
};

export const clients: ClientRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
