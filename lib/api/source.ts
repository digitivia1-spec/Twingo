/**
 * Central switch: which data backend is active.
 * Read from NEXT_PUBLIC_DATA_SOURCE at build time.
 */
export const DATA_SOURCE: 'mock' | 'supabase' =
  (process.env.NEXT_PUBLIC_DATA_SOURCE as 'mock' | 'supabase') ?? 'mock';

export const NOT_IMPLEMENTED = new Error(
  '[twinjo] Supabase backend not implemented yet — Phase 3 work. Set NEXT_PUBLIC_DATA_SOURCE=mock.',
);
