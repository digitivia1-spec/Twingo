import type { FinanceStatus } from '@/lib/types/enums';
import type { DriverShift } from '@/lib/types/driver-shift';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nowIso, store } from './_store';

export interface DriverShiftFilters {
  status?: FinanceStatus[];
  branch_id?: string;
  driver_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface ReconcileInput {
  actual_cash: number;
  reconciled_by: string;
  variance_reason?: string;
  notes?: string;
}

export interface DriverShiftRepository {
  list(filters?: DriverShiftFilters): Promise<DriverShift[]>;
  getById(id: string): Promise<DriverShift | null>;
  reconcile(id: string, input: ReconcileInput): Promise<DriverShift>;
  approve(id: string, approved_by: string): Promise<DriverShift>;
  payOut(id: string, paid_out_by: string): Promise<DriverShift>;
  dispute(id: string, reason: string, user_id: string): Promise<DriverShift>;
}

function match(s: DriverShift, f: DriverShiftFilters): boolean {
  if (f.status && f.status.length > 0 && !f.status.includes(s.status))
    return false;
  if (f.branch_id && s.branch_id !== f.branch_id) return false;
  if (f.driver_id && s.driver_id !== f.driver_id) return false;
  if (f.date_from && s.shift_date < f.date_from) return false;
  if (f.date_to && s.shift_date > f.date_to) return false;
  return true;
}

const mock: DriverShiftRepository = {
  async list(filters = {}) {
    const rows = store.shifts
      .filter((s) => match(s, filters))
      .slice()
      .sort((a, b) => (a.shift_date > b.shift_date ? -1 : 1));
    return latency(rows);
  },
  async getById(id) {
    return latency(store.shifts.find((s) => s.id === id) ?? null);
  },
  async reconcile(id, input) {
    const s = store.shifts.find((x) => x.id === id);
    if (!s) throw new Error(`Shift not found: ${id}`);
    if (s.status !== 'pending')
      throw new Error(`Shift already in status "${s.status}".`);
    s.actual_cash = input.actual_cash;
    s.variance = input.actual_cash - s.expected_cash;
    s.variance_reason = input.variance_reason;
    s.notes = input.notes;
    s.reconciled_at = nowIso();
    s.reconciled_by = input.reconciled_by;
    s.status = 'reconciled';
    s.updated_at = nowIso();
    return latency(s);
  },
  async approve(id, approved_by) {
    const s = store.shifts.find((x) => x.id === id);
    if (!s) throw new Error(`Shift not found: ${id}`);
    if (s.status !== 'reconciled')
      throw new Error(`Shift not reconciled. Current: ${s.status}`);
    if (approved_by === s.reconciled_by)
      throw new Error('Dual-control: approver must differ from reconciler.');
    s.approved_at = nowIso();
    s.approved_by = approved_by;
    s.status = 'approved';
    s.updated_at = nowIso();
    return latency(s);
  },
  async payOut(id, paid_out_by) {
    const s = store.shifts.find((x) => x.id === id);
    if (!s) throw new Error(`Shift not found: ${id}`);
    if (s.status !== 'approved')
      throw new Error(`Shift not approved. Current: ${s.status}`);
    s.paid_out_at = nowIso();
    s.paid_out_by = paid_out_by;
    s.status = 'paid_out';
    s.updated_at = nowIso();
    return latency(s);
  },
  async dispute(id, reason, _user_id) {
    const s = store.shifts.find((x) => x.id === id);
    if (!s) throw new Error(`Shift not found: ${id}`);
    s.status = 'disputed';
    s.dispute_reason = reason;
    s.updated_at = nowIso();
    return latency(s);
  },
};

const supabase: DriverShiftRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async reconcile() { throw NOT_IMPLEMENTED; },
  async approve() { throw NOT_IMPLEMENTED; },
  async payOut() { throw NOT_IMPLEMENTED; },
  async dispute() { throw NOT_IMPLEMENTED; },
};

export const driverShifts: DriverShiftRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
