import type { UserRole, VehicleType } from '@/lib/types/enums';
import type { Bilingual } from '@/lib/types/shared';
import type { User } from '@/lib/types/user';
import { DATA_SOURCE } from './source';
import { latency, nowIso, store } from './_store';
import { getSupabase, unwrapMaybe, unwrapRows } from './_supabase';

export interface UserCreateInput {
  name: Bilingual;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  branch_id?: string | null;
  driver_code?: string;
  vehicle_type?: VehicleType;
  national_id?: string;
  license_number?: string;
}

export type UserUpdateInput = Partial<Omit<UserCreateInput, 'password' | 'email'>> & {
  email?: string;
  password?: string;
  is_active?: boolean;
};

export interface UserRepository {
  list(filter?: { role?: UserRole; branch_id?: string }): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  /** The signed-in staff member (drives role-gated UI). */
  getCurrent(): Promise<User | null>;
  /** Create an auth login + linked staff record (admin only). */
  create(input: UserCreateInput): Promise<User>;
  /** Update role/branch/contact, reset password, or (de)activate (admin only). */
  update(id: string, patch: UserUpdateInput): Promise<User>;
  deactivate(id: string): Promise<User>;
  reactivate(id: string): Promise<User>;
  resetPassword(id: string, password: string): Promise<User>;
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
  async getCurrent() {
    // No auth in mock mode — assume the highest-privilege seed user so the
    // management UI is fully explorable locally.
    return latency(
      store.users.find((u) => u.role === 'super_admin') ?? store.users[0] ?? null,
    );
  },
  async create(input) {
    const base = (input.name.en || input.name.ar || input.email)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);
    const user: User = {
      id: `u_${base || 'user'}_${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      phone: input.phone,
      email: input.email,
      role: input.role,
      branch_id: input.branch_id ?? undefined,
      is_active: true,
      driver_code: input.driver_code,
      vehicle_type: input.vehicle_type,
      national_id: input.national_id,
      license_number: input.license_number,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    store.users.unshift(user);
    return latency(user);
  },
  async update(id, patch) {
    const user = store.users.find((u) => u.id === id);
    if (!user) throw new Error(`User not found: ${id}`);
    const { password: _password, ...rest } = patch;
    Object.assign(user, rest, { updated_at: nowIso() });
    if (rest.branch_id === null) user.branch_id = undefined;
    return latency(user);
  },
  async deactivate(id) {
    return mock.update(id, { is_active: false });
  },
  async reactivate(id) {
    return mock.update(id, { is_active: true });
  },
  async resetPassword(id) {
    const user = store.users.find((u) => u.id === id);
    if (!user) throw new Error(`User not found: ${id}`);
    return latency(user);
  },
};

/** Call the server-only admin route, attaching the caller's access token. */
async function adminFetch(method: 'POST' | 'PATCH', body: unknown): Promise<User> {
  const sb = getSupabase();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Not authenticated.');
  const res = await fetch('/api/admin/users', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { user?: User; error?: string };
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status}).`);
  return json.user as User;
}

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
  async getCurrent() {
    const sb = getSupabase();
    const { data } = await sb.auth.getUser();
    if (!data?.user) return null;
    return unwrapMaybe<User>(
      await sb.from('users').select('*').eq('auth_id', data.user.id).maybeSingle(),
    );
  },
  async create(input) {
    return adminFetch('POST', input);
  },
  async update(id, patch) {
    return adminFetch('PATCH', { id, ...patch });
  },
  async deactivate(id) {
    return adminFetch('PATCH', { id, is_active: false });
  },
  async reactivate(id) {
    return adminFetch('PATCH', { id, is_active: true });
  },
  async resetPassword(id, password) {
    return adminFetch('PATCH', { id, password });
  },
};

export const users: UserRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
