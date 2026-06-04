import type { FinanceStatus } from '@/lib/types/enums';
import type { DriverShift } from '@/lib/types/driver-shift';
import { DATA_SOURCE } from './source';
import { latency, nowIso, store } from './_store';
import { getSupabase, nowIso as sbNow, unwrapMaybe, unwrapOne, unwrapRows } from './_supabase';

async function fetchShift(id: string): Promise<DriverShift> {
  const sb = getSupabase();
  const s = unwrapMaybe<DriverShift>(
    await sb.from('driver_shifts').select('*').eq('id', id).maybeSingle(),
  );
  if (!s) throw new Error(`Shift not found: ${id}`);
  return s;
}

async function updateShift(id: string, patch: Partial<DriverShift>): Promise<DriverShift> {
  const sb = getSupabase();
  return unwrapOne<DriverShift>(
    await sb
      .from('driver_shifts')
      .update({ ...patch, updated_at: sbNow() })
      .eq('id', id)
      .select('*')
      .single(),
  );
}

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
  async list(filters = {}) {
    const sb = getSupabase();
    let q = sb.from('driver_shifts').select('*');
    if (filters.status && filters.status.length > 0) q = q.in('status', filters.status);
    if (filters.branch_id) q = q.eq('branch_id', filters.branch_id);
    if (filters.driver_id) q = q.eq('driver_id', filters.driver_id);
    if (filters.date_from) q = q.gte('shift_date', filters.date_from);
    if (filters.date_to) q = q.lte('shift_date', filters.date_to);
    return unwrapRows<DriverShift>(await q.order('shift_date', { ascending: false }));
  },
  async getById(id) {
    const sb = getSupabase();
    return unwrapMaybe<DriverShift>(
      await sb.from('driver_shifts').select('*').eq('id', id).maybeSingle(),
    );
  },
  async reconcile(id, input) {
    const s = await fetchShift(id);
    if (s.status !== 'pending') throw new Error(`Shift already in status "${s.status}".`);
    return updateShift(id, {
      actual_cash: input.actual_cash,
      variance: input.actual_cash - s.expected_cash,
      variance_reason: input.variance_reason,
      notes: input.notes,
      reconciled_at: sbNow(),
      reconciled_by: input.reconciled_by,
      status: 'reconciled',
    });
  },
  async approve(id, approved_by) {
    const s = await fetchShift(id);
    if (s.status !== 'reconciled') throw new Error(`Shift not reconciled. Current: ${s.status}`);
    if (approved_by === s.reconciled_by)
      throw new Error('Dual-control: approver must differ from reconciler.');
    return updateShift(id, { approved_at: sbNow(), approved_by, status: 'approved' });
  },
  async payOut(id, paid_out_by) {
    const s = await fetchShift(id);
    if (s.status !== 'approved') throw new Error(`Shift not approved. Current: ${s.status}`);
    return updateShift(id, { paid_out_at: sbNow(), paid_out_by, status: 'paid_out' });
  },
  async dispute(id, reason) {
    return updateShift(id, { status: 'disputed', dispute_reason: reason });
  },
};

export const driverShifts: DriverShiftRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
