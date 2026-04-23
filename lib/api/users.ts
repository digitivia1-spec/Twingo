import type { UserRole } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

export interface UserRepository {
  list(filter?: { role?: UserRole; branch_id?: string }): Promise<User[]>;
  getById(id: string): Promise<User | null>;
}

const mock: UserRepository = {
  async list(filter) {
    let rows = store.users.slice();
    if (filter?.role) rows = rows.filter((u) => u.role === filter.role);
    if (filter?.branch_id)
      rows = rows.filter((u) => u.branch_id === filter.branch_id);
    return latency(rows);
  },
  async getById(id) {
    return latency(store.users.find((u) => u.id === id) ?? null);
  },
};

const supabase: UserRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
};

export const users: UserRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
