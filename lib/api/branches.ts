import type { Branch } from '@/lib/types/branch';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, store } from './_store';

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
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async update() { throw NOT_IMPLEMENTED; },
};

export const branches: BranchRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
