'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, Inbox, UserPlus, HandCoins, Wallet, Package } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { Dropdown } from '@/components/ui/dropdown';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { activity, type ActivityKind } from '@/lib/api/activity';
import type { Locale } from '@/lib/i18n/config';

const KIND_ICON: Record<ActivityKind, typeof Package> = {
  pickup: Package,
  cash_request: HandCoins,
  cod_due: Wallet,
  client: UserPlus,
};

/** Relative "x ago" — bilingual, coarse-grained (mins / hours / days). */
function relative(iso: string, isAr: boolean): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return isAr ? 'الآن' : 'now';
  if (m < 60) return isAr ? `منذ ${m} د` : `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return isAr ? `منذ ${h} س` : `${h}h ago`;
  const d = Math.round(h / 24);
  return isAr ? `منذ ${d} ي` : `${d}d ago`;
}

export function NotificationsBell() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const isAr = locale !== 'en';

  const { data: counts } = useQuery({
    queryKey: ['activity-counts'],
    queryFn: () => activity.pendingCounts(),
    refetchInterval: 60_000,
  });
  const { data: recent } = useQuery({
    queryKey: ['activity-recent', locale],
    queryFn: () => activity.recent(locale, 12),
    refetchInterval: 60_000,
  });

  const total = counts?.total ?? 0;

  const attention: { key: string; href: string; icon: typeof Package; count: number }[] = [
    { key: 'newOrders', href: '/new-orders', icon: Inbox, count: counts?.newOrders ?? 0 },
    { key: 'pendingClients', href: '/clients/pending', icon: UserPlus, count: counts?.pendingClients ?? 0 },
    { key: 'cashRequests', href: '/cash-requests', icon: HandCoins, count: counts?.cashRequests ?? 0 },
    { key: 'cod', href: '/cod', icon: Wallet, count: counts?.codDues ?? 0 },
  ];

  return (
    <FeedbackPin elementId="topbar.notifications">
      <Dropdown
        align="end"
        className="w-[340px] max-w-[90vw] p-0"
        trigger={
          <button
            type="button"
            className="relative rounded-md p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg"
            aria-label={t('notifications.title')}
          >
            <Bell className="h-5 w-5" />
            {total > 0 && (
              <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {total > 99 ? '99+' : total}
              </span>
            )}
          </button>
        }
      >
        <div className="border-b border-border px-3 py-2 text-xs font-bold text-fg">
          {t('notifications.title')}
        </div>

        <div className="px-2 py-2">
          <div className="mb-1 px-1 text-[10px] font-bold uppercase text-fg-subtle">
            {t('notifications.needsAttention')}
          </div>
          <div className="grid grid-cols-2 gap-1">
            {attention.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.key}
                  href={a.href}
                  className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5 text-[11px] hover:bg-primary-50 hover:text-primary-700"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{t(`nav.${a.key}` as const)}</span>
                  </span>
                  <span
                    className={
                      a.count > 0
                        ? 'rounded-full bg-warning/15 px-1.5 font-bold text-warning'
                        : 'text-fg-subtle'
                    }
                  >
                    {a.count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border px-2 py-2">
          <div className="mb-1 px-1 text-[10px] font-bold uppercase text-fg-subtle">
            {t('notifications.recent')}
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {recent && recent.length > 0 ? (
              recent.map((item) => {
                const Icon = KIND_ICON[item.kind];
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-hover"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
                    <span className="flex-1 truncate text-[11px] font-semibold">
                      {item.title}
                    </span>
                    <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-bold text-fg-muted">
                      {t(`notifications.status.${item.status}` as const)}
                    </span>
                    <span className="shrink-0 text-[9px] text-fg-subtle">
                      {relative(item.timestamp, isAr)}
                    </span>
                  </Link>
                );
              })
            ) : (
              <p className="px-2 py-3 text-center text-[11px] text-fg-subtle">
                {t('notifications.empty')}
              </p>
            )}
          </div>
        </div>
      </Dropdown>
    </FeedbackPin>
  );
}
