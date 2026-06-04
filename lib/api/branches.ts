import type { Branch } from '@/lib/types/branch';
import { DATA_SOURCE } from './source';
import { latency, store } from './_store';
import { getSupabase, nowIso, unwrapMaybe, unwrapRows } from './_supabase';

export interface BranchRepository {
  list(): Promise<Branch[]>;
  getById(id: string): Promise<Branch | null>;
  update(id: string, patch: Partial<Branch>): Promise<Branch>;
}

const mock: BranchRepository = {
  async list() {
    return latency(store.branches.slice());
  },
  async getById(id) {
    return latency(store.branches.find((b) => b.id === id) ?? null);
  },
  async update(id, patch) {
    const branch = store.branches.find((b) => b.id === id);
    if (!branch) throw new Error(`Branch not found: ${id}`);
    Object.assign(branch, patch, { updated_at: new Date().toISOString() });
    return latency(branch);
  },
};

const supabase: BranchRepository = {
  async list() {
    const sb = getSupabase();
    return unwrapRows<Branch>(await sb.from('branches').select('*').order('code'));
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<Branch>(
      await sb.from('branches').select('*').eq('id', id).maybeSingle(),
    );
  },
  async update(id, patch) {
    const sb = getSupabase();
    const row = unwrapMaybe<Branch>(
      await sb
        .from('branches')
        .update({ ...patch, updated_at: nowIso() })
        .eq('id', id)
        .select('*')
        .maybeSingle(),
    );
    if (!row) throw new Error(`Branch not found: ${id}`);
    return row;
  },
};

export const branches: BranchRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
