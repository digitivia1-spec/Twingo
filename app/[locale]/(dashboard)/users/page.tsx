import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageShell } from '@/components/layout/PageShell';
import { UsersList } from '@/components/modules/users/UsersList';
import { isLocale } from '@/lib/i18n/config';

export default async function UsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (isLocale(locale)) setRequestLocale(locale);
  const t = await getTranslations('users');
  return (
    <PageShell title={t('title')}>
      <UsersList />
    </PageShell>
  );
}
