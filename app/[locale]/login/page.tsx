import { setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/lib/i18n/config';
import { LoginForm } from '@/components/auth/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  return <LoginForm />;
}
