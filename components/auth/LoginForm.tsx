'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { getSupabase } from '@/lib/api/_supabase';
import { DATA_SOURCE } from '@/lib/api/source';

const T = {
  ar: {
    title: 'تسجيل الدخول',
    subtitle: 'نظام توينجو لإدارة الشحن',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'دخول',
    submitting: 'جارٍ الدخول…',
    error: 'فشل تسجيل الدخول — تحقق من البيانات.',
    mockNote: 'الوضع التجريبي مفعّل — لا حاجة لتسجيل الدخول.',
  },
  en: {
    title: 'Sign in',
    subtitle: 'Twinjo shipping management',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    submitting: 'Signing in…',
    error: 'Sign-in failed — check your credentials.',
    mockNote: 'Demo (mock) mode is on — no sign-in required.',
  },
} as const;

export function LoginForm() {
  const locale = useLocale() === 'en' ? 'en' : 'ar';
  const t = T[locale];
  const router = useRouter();
  const home = locale === 'en' ? '/en' : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const sb = getSupabase();
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) {
        setError(t.error);
        setBusy(false);
        return;
      }
      router.replace(home);
    } catch {
      setError(t.error);
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-lg font-extrabold text-white shadow-md">
            T
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">{t.title}</h1>
            <p className="text-xs text-gray-500">{t.subtitle}</p>
          </div>
        </div>

        {DATA_SOURCE === 'mock' ? (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t.mockNote}</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.email}</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                dir="ltr"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t.password}</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                dir="ltr"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-gradient-primary py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {busy ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
