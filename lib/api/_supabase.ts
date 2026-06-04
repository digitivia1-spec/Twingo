/**
 * Shared Supabase client for the `supabase` data source.
 *
 * The repositories in this folder run in the browser (they're imported by
 * `'use client'` components and read `NEXT_PUBLIC_*`). So we use the anon key
 * plus a signed-in session and rely on RLS for row scoping. The service-role
 * key is NEVER used here — it only belongs in server-only files.
 *
 * The client is created lazily so that importing this module in `mock` mode
 * (where the env vars are empty) never throws.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Supabase env missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

/** Throw on a Supabase error, otherwise return the data as T[]. */
export function unwrapRows<T>(res: { data: unknown; error: { message: string } | null }): T[] {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T[];
}

/** Throw on error, return the single row or null (use with `.maybeSingle()`). */
export function unwrapMaybe<T>(res: { data: unknown; error: { message: string } | null }): T | null {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? null) as T | null;
}

/** Throw on error, return the single row (use with `.single()`). */
export function unwrapOne<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Escape PostgREST `or()` reserved characters in a user search term. */
export function sanitizeSearch(s: string): string {
  return s.replace(/[(),*]/g, ' ').trim();
}
