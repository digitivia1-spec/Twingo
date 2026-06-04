'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getSupabase } from '@/lib/api/_supabase';
import { DATA_SOURCE } from '@/lib/api/source';

/**
 * Client-side auth guard for the dashboard segment. In `supabase` mode it
 * requires a signed-in session and redirects to `/login` otherwise. In `mock`
 * mode it's a transparent pass-through so local dev needs no auth.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();
  const loginPath = locale === 'en' ? '/en/login' : '/login';
  const [ready, setReady] = useState(DATA_SOURCE === 'mock');

  useEffect(() => {
    if (DATA_SOURCE === 'mock') return;
    const sb = getSupabase();
    let active = true;

    sb.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      else router.replace(loginPath);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session) router.replace(loginPath);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, loginPath]);

  if (!ready) {
    return (
      <div className="grid h-dvh place-items-center text-sm text-gray-400">…</div>
    );
  }
  return <>{children}</>;
}
