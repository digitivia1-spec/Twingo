import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Staff user + permission management — server-only.
 *
 * Creating an auth login requires the GoTrue Admin API, which needs the
 * service-role key. That key MUST stay server-side, so all of it lives here:
 *
 *   POST   → create an auth.users login + linked public.users row
 *   PATCH  → update a user (role/branch/name/phone), reset password, or
 *            (de)activate (which also bans/unbans the auth login)
 *
 * Every request is authorised against the CALLER's role (super_admin/admin),
 * verified from their bearer token — RLS is a second line of defence, not the
 * only one. We never trust the client's claim about who they are.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MANAGER_ROLES = ['super_admin', 'admin'] as const;
const VALID_ROLES = ['super_admin', 'admin', 'manager', 'warehouse', 'driver', 'finance', 'support'];

/** A near-permanent ban used to lock out a deactivated login. */
const BAN_FOREVER = '876600h'; // ~100 years

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Server misconfigured: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface Caller {
  sb: SupabaseClient;
  id: string;
  role: string;
}

/** Resolve + authorise the caller, or return a NextResponse error to short-circuit. */
async function authorise(req: NextRequest): Promise<Caller | NextResponse> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  let sb: SupabaseClient;
  try {
    sb = serviceClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error.' },
      { status: 500 },
    );
  }
  const { data: auth, error } = await sb.auth.getUser(token);
  if (error || !auth?.user) {
    return NextResponse.json({ error: 'Invalid session.' }, { status: 401 });
  }
  const { data: row } = await sb
    .from('users')
    .select('id, role')
    .eq('auth_id', auth.user.id)
    .maybeSingle();
  if (!row || !MANAGER_ROLES.includes(row.role)) {
    return NextResponse.json(
      { error: 'Only admins can manage users.' },
      { status: 403 },
    );
  }
  return { sb, id: row.id, role: row.role };
}

function slugId(name: { ar?: string; en?: string }, email: string): string {
  const base = (name.en || name.ar || email.split('@')[0] || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return `u_${base || 'user'}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function POST(req: NextRequest) {
  const caller = await authorise(req);
  if (caller instanceof NextResponse) return caller;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const name = (body.name ?? {}) as { ar?: string; en?: string };
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const phone = String(body.phone ?? '').trim();
  const role = String(body.role ?? '');
  const branch_id = body.branch_id ? String(body.branch_id) : null;

  if (!name.ar && !name.en) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  if (!VALID_ROLES.includes(role))
    return NextResponse.json({ error: `Invalid role "${role}".` }, { status: 400 });
  if (role === 'super_admin' && caller.role !== 'super_admin')
    return NextResponse.json({ error: 'Only a super admin can create a super admin.' }, { status: 403 });

  const { sb } = caller;

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created?.user) {
    return NextResponse.json(
      { error: createErr?.message ?? 'Failed to create login.' },
      { status: 400 },
    );
  }
  const authId = created.user.id;

  const fullName = { ar: name.ar || name.en || '', en: name.en || name.ar || '' };
  const id = slugId(fullName, email);
  const { data: row, error: insertErr } = await sb
    .from('users')
    .insert({
      id,
      auth_id: authId,
      name: fullName,
      phone,
      email,
      role,
      branch_id,
      is_active: true,
      driver_code: body.driver_code ? String(body.driver_code) : null,
      vehicle_type: body.vehicle_type ? String(body.vehicle_type) : null,
      national_id: body.national_id ? String(body.national_id) : null,
      license_number: body.license_number ? String(body.license_number) : null,
      created_by: caller.id,
    })
    .select('*')
    .single();

  if (insertErr || !row) {
    // Roll back the orphaned auth login so a retry can reuse the email.
    await sb.auth.admin.deleteUser(authId).catch(() => {});
    return NextResponse.json(
      { error: insertErr?.message ?? 'Failed to create user record.' },
      { status: 400 },
    );
  }

  return NextResponse.json({ user: row });
}

export async function PATCH(req: NextRequest) {
  const caller = await authorise(req);
  if (caller instanceof NextResponse) return caller;
  const { sb } = caller;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const id = String(body.id ?? '');
  if (!id) return NextResponse.json({ error: 'Missing user id.' }, { status: 400 });

  const { data: existing } = await sb
    .from('users')
    .select('id, auth_id, role')
    .eq('id', id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const nextRole = body.role !== undefined ? String(body.role) : undefined;
  if (nextRole && !VALID_ROLES.includes(nextRole))
    return NextResponse.json({ error: `Invalid role "${nextRole}".` }, { status: 400 });
  if (
    (nextRole === 'super_admin' || existing.role === 'super_admin') &&
    caller.role !== 'super_admin'
  ) {
    return NextResponse.json(
      { error: 'Only a super admin can manage a super admin.' },
      { status: 403 },
    );
  }

  // Auth-side changes (password / email / ban) need the auth_id.
  const password = body.password !== undefined ? String(body.password) : undefined;
  const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : undefined;
  const isActive = body.is_active !== undefined ? Boolean(body.is_active) : undefined;

  if (isActive === false && id === caller.id) {
    return NextResponse.json({ error: 'You cannot deactivate your own account.' }, { status: 400 });
  }
  if (password !== undefined && password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  if (existing.auth_id && (password !== undefined || email !== undefined || isActive !== undefined)) {
    const authPatch: Record<string, unknown> = {};
    if (password !== undefined) authPatch.password = password;
    if (email !== undefined) authPatch.email = email;
    if (isActive !== undefined) authPatch.ban_duration = isActive ? 'none' : BAN_FOREVER;
    const { error: authErr } = await sb.auth.admin.updateUserById(existing.auth_id, authPatch);
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  // public.users patch (skip password — that's auth-only).
  const patch: Record<string, unknown> = { updated_by: caller.id, updated_at: new Date().toISOString() };
  if (body.name !== undefined) {
    const n = body.name as { ar?: string; en?: string };
    patch.name = { ar: n.ar || n.en || '', en: n.en || n.ar || '' };
  }
  if (body.phone !== undefined) patch.phone = String(body.phone).trim();
  if (email !== undefined) patch.email = email;
  if (nextRole !== undefined) patch.role = nextRole;
  if (body.branch_id !== undefined) patch.branch_id = body.branch_id ? String(body.branch_id) : null;
  if (isActive !== undefined) patch.is_active = isActive;
  if (body.driver_code !== undefined) patch.driver_code = body.driver_code ? String(body.driver_code) : null;
  if (body.vehicle_type !== undefined) patch.vehicle_type = body.vehicle_type ? String(body.vehicle_type) : null;
  if (body.national_id !== undefined) patch.national_id = body.national_id ? String(body.national_id) : null;
  if (body.license_number !== undefined)
    patch.license_number = body.license_number ? String(body.license_number) : null;

  const { data: row, error: updErr } = await sb
    .from('users')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (updErr || !row) {
    return NextResponse.json({ error: updErr?.message ?? 'Update failed.' }, { status: 400 });
  }
  return NextResponse.json({ user: row });
}
