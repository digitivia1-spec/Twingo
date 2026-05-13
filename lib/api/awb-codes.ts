import type { AwbStatus } from '@/lib/types/enums';
import type { AwbCode } from '@/lib/types/awb';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nowIso, store } from './_store';

export interface AwbFilters {
  branch_id?: string;
  status?: AwbStatus[];
  search?: string;
}

export interface GenerateBatchInput {
  branch_id: string;
  count: number;
  generated_by: string;
}

export interface AwbRepository {
  list(filters?: AwbFilters): Promise<AwbCode[]>;
  getById(id: string): Promise<AwbCode | null>;
  /** Reserve a single available AWB for a pickup-to-be. */
  reserveOne(
    branch_id: string,
    reserved_by: string,
    reserved_for_pickup_id?: string,
  ): Promise<AwbCode>;
  /** Void an AWB code. Allowed from available or reserved (not used). */
  voidOne(id: string, voided_by: string, reason: string): Promise<AwbCode>;
  /** Generate a fresh batch of AWBs for a branch. */
  generateBatch(input: GenerateBatchInput): Promise<AwbCode[]>;
}

const mock: AwbRepository = {
  async list(filters = {}) {
    let rows = store.awbCodes.slice();
    if (filters.branch_id)
      rows = rows.filter((a) => a.branch_id === filters.branch_id);
    if (filters.status && filters.status.length > 0)
      rows = rows.filter((a) => filters.status!.includes(a.status));
    if (filters.search) {
      const n = filters.search.toLowerCase();
      rows = rows.filter((a) => a.code.toLowerCase().includes(n));
    }
    return latency(rows.sort((a, b) => b.sequence - a.sequence));
  },

  async getById(id) {
    return latency(store.awbCodes.find((a) => a.id === id) ?? null);
  },

  async reserveOne(branch_id, reserved_by, reserved_for_pickup_id) {
    const available = store.awbCodes
      .filter(
        (a) => a.branch_id === branch_id && a.status === 'available',
      )
      .sort((a, b) => a.sequence - b.sequence)[0];
    if (!available) {
      throw new Error(
        `No available AWB codes for branch ${branch_id} — generate a new batch.`,
      );
    }
    available.status = 'reserved';
    available.reserved_at = nowIso();
    available.reserved_by = reserved_by;
    available.reserved_for_pickup_id = reserved_for_pickup_id;
    available.updated_at = nowIso();
    return latency(available);
  },

  async voidOne(id, voided_by, reason) {
    const awb = store.awbCodes.find((a) => a.id === id);
    if (!awb) throw new Error(`AWB not found: ${id}`);
    if (awb.status === 'used') {
      throw new Error(`Cannot void a used AWB (${awb.code}).`);
    }
    if (awb.status === 'voided') {
      throw new Error(`AWB ${awb.code} is already voided.`);
    }
    awb.status = 'voided';
    awb.voided_at = nowIso();
    awb.voided_by = voided_by;
    awb.voided_reason = reason;
    awb.updated_at = nowIso();
    return latency(awb);
  },

  async generateBatch({ branch_id, count, generated_by }) {
    if (count <= 0 || count > 5000) {
      throw new Error('Batch count must be between 1 and 5000.');
    }
    const branch = store.branches.find((b) => b.id === branch_id);
    if (!branch) throw new Error(`Branch not found: ${branch_id}`);

    const last = store.awbCodes
      .filter((a) => a.branch_id === branch_id)
      .reduce((m, a) => Math.max(m, a.sequence), 0);
    const start = last + 1;
    const batchId = `batch_${branch.code.toLowerCase()}_${nowIso()}`;
    const next: AwbCode[] = [];
    for (let i = 0; i < count; i++) {
      const seq = start + i;
      next.push({
        id: `awb_${seq}`,
        code: `${branch.code}-${seq}`,
        sequence: seq,
        branch_id,
        status: 'available',
        batch_id: batchId,
        generated_by,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
    store.awbCodes.push(...next);
    return latency(next);
  },
};

const supabase: AwbRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async reserveOne() { throw NOT_IMPLEMENTED; },
  async voidOne() { throw NOT_IMPLEMENTED; },
  async generateBatch() { throw NOT_IMPLEMENTED; },
};

export const awbCodes: AwbRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
