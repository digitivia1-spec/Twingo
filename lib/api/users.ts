import type { UserRole } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, unwrapMaybe, unwrapRows } from './_supabase';

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
  async list(filter) {
    const sb = getSupabase();
    let q = sb.from('users').select('*').is('deleted_at', null);
    if (filter?.role) q = q.eq('role', filter.role);
    if (filter?.branch_id) q = q.eq('branch_id', filter.branch_id);
    return unwrapRows<User>(await q);
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<User>(
      await sb.from('users').select('*').eq('id', id).maybeSingle(),
    );
  },
};

export const users: UserRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
