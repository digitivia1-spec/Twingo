'use client';

import {
  Home,
  PackageCheck,
  Banknote,
  Wallet,
  Building2,
  Warehouse,
  Tag,
  Undo2,
  Map,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from '@/lib/i18n/routing';
import { Link } from '@/lib/i18n/routing';
import { useUi } from '@/lib/state/ui';
import { cn } from '@/lib/utils';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';

const NAV = [
  { key: 'dashboard', href: '/', icon: Home },
  { key: 'pickup', href: '/pickup', icon: PackageCheck },
  { key: 'finance', href: '/finance', icon: Banknote },
  { key: 'cod', href: '/cod', icon: Wallet },
  { key: 'branches', href: '/branches', icon: Building2 },
  { key: 'stock', href: '/stock', icon: Warehouse },
  { key: 'prices', href: '/prices', icon: Tag },
  { key: 'returns', href: '/returns', icon: Undo2 },
  { key: 'provinces', href: '/provinces', icon: Map },
] as const;

export function Sidebar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUi();

  return (
    <aside
      className={cn(
        'flex flex-col bg-primary-900 text-white shrink-0 transition-[width] duration-200 ease-out',
        sidebarCollapsed ? 'w-[58px]' : 'w-[220px]',
      )}
      aria-label="Sidebar"
    >
      <div className="flex items-center gap-3 border-b border-[#1e293b] p-4 min-h-[64px]">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-gradient-primary font-extrabold shadow-md">
          T
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-[15px] font-extrabold leading-tight">
              {t('brand.name')}
            </h1>
            <p className="text-[10px] text-white/60 leading-tight">
              {t('brand.tagline')}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main">
        <ul className="space-y-0.5 px-2">
          {NAV.map((item) => {
            const href = item.href;
            const localizedHref = locale === 'en' ? `/en${href === '/' ? '' : href}` : href;
            const isActive =
              href === '/'
                ? pathname === '/' || pathname === '/en'
                : pathname.endsWith(href);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <FeedbackPin elementId={`nav.${item.key}`} className="block">
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-gradient-sidebar-active text-white font-bold'
                        : 'text-white/80 hover:bg-[#1e293b] hover:text-white',
                      sidebarCollapsed && 'justify-center',
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={sidebarCollapsed ? t(`nav.${item.key}` as const) : undefined}
                  >
                    <Icon className="h-[17px] w-[17px] shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="nav-label truncate">
                        {t(`nav.${item.key}` as const)}
                      </span>
                    )}
                  </Link>
                </FeedbackPin>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#1e293b] p-2 space-y-1">
        <LocaleToggle collapsed={sidebarCollapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-2.5 py-1.5 text-[11px] font-bold text-white/80 hover:bg-[#334155] hover:text-white"
          aria-label="Collapse sidebar"
        >
          {sidebarCollapsed ? (
            // Chevron points inward — logical direction
            <ChevronRight className="h-4 w-4 rtl:rotate-180" />
          ) : (
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
          )}
        </button>
      </div>
    </aside>
  );
}

function LocaleToggle({ collapsed }: { collapsed: boolean }) {
  const t = useTranslations('locale');
  const locale = useLocale();
  const pathname = usePathname();
  const otherLocale = locale === 'ar' ? 'en' : 'ar';
  return (
    <FeedbackPin elementId="sidebar.locale" className="block">
      <Link
        href={pathname}
        locale={otherLocale}
        className={cn(
          'flex items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-2.5 py-1.5 text-[11px] font-bold text-white/80 hover:bg-[#334155] hover:text-white',
        )}
        aria-label={t('switchLabel')}
      >
        {!collapsed ? t('switchTo') : t('switchTo').slice(0, 2)}
      </Link>
    </FeedbackPin>
  );
}
