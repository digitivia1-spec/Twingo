'use client';

import { useQuery } from '@tanstack/react-query';
import { users } from '@/lib/api/users';
import type { User } from '@/lib/types/user';

/**
 * The signed-in staff member. In `supabase` mode this is the authenticated
 * user (looked up via auth_id); in `mock` mode it resolves to the highest-
 * privilege seed user so the app is fully explorable locally.
 *
 * Used to attribute actions (status history, approvals, payouts) to the real
 * actor and to gate management UI by role.
 */
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ['current-user'],
    queryFn: () => users.getCurrent(),
    staleTime: 5 * 60 * 1000,
  });
}
