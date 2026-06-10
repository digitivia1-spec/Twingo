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
  Store,
  Bike,
  Users,
  Search,
  Inbox,
  UserPlus,
  HandCoins,
  MapPinned,
  Globe2,
  Layers,
  Ticket,
  Receipt,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Compass,
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePathname } from '@/lib/i18n/routing';
import { Link } from '@/lib/i18n/routing';
import { useUi } from '@/lib/state/ui';
import { cn } from '@/lib/utils';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { getSupabase } from '@/lib/api/_supabase';
import { DATA_SOURCE } from '@/lib/api/source';

const NAV = [
  { key: 'dashboard', href: '/', icon: Home },
  { key: 'pickup', href: '/pickup', icon: PackageCheck },
  { key: 'newOrders', href: '/new-orders', icon: Inbox },
  { key: 'pendingClients', href: '/clients/pending', icon: UserPlus },
  { key: 'cashRequests', href: '/cash-requests', icon: HandCoins },
  { key: 'clients', href: '/clients', icon: Store },
  { key: 'drivers', href: '/drivers', icon: Bike },
  { key: 'users', href: '/users', icon: Users },
  { key: 'finance', href: '/finance', icon: Banknote },
  { key: 'cod', href: '/cod', icon: Wallet },
  { key: 'branches', href: '/branches', icon: Building2 },
  { key: 'stock', href: '/stock', icon: Warehouse },
  { key: 'prices', href: '/prices', icon: Tag },
  { key: 'rates', href: '/rates', icon: Receipt },
  { key: 'awbCodes', href: '/awb-codes', icon: Ticket },
  { key: 'returns', href: '/returns', icon: Undo2 },
  { key: 'provinces', href: '/provinces', icon: Map },
  { key: 'cities', href: '/cities', icon: MapPinned },
  { key: 'districts', href: '/districts', icon: Layers },
  { key: 'zones', href: '/zones', icon: Globe2 },
  { key: 'reports', href: '/reports', icon: BarChart3 },
  { key: 'statusTaxonomy', href: '/settings/statuses', icon: Settings },
  { key: 'track', href: '/track', icon: Search },
] as const;

export function Sidebar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, drawerOpen, closeDrawer } = useUi();

  // Mobile drawer: close on navigation and on Escape.
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  return (
    <aside
      className={cn(
        'z-50 flex flex-col bg-primary-900 text-white',
        // Mobile (<md): fixed off-canvas drawer that slides in from the
        // inline-start edge. RTL-aware via logical `start` + rtl: transform.
        'fixed inset-y-0 start-0 w-[240px] max-w-[82vw] transition-transform duration-200 ease-out',
        drawerOpen
          ? 'translate-x-0'
          : '-translate-x-full rtl:translate-x-full',
        // Desktop (md+): in-flow flex child with the collapse width toggle.
        'md:static md:max-w-none md:translate-x-0 md:shrink-0 md:rtl:translate-x-0 md:transition-[width]',
        sidebarCollapsed ? 'md:w-[58px]' : 'md:w-[220px]',
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
        <TourButton collapsed={sidebarCollapsed} />
        <LocaleToggle collapsed={sidebarCollapsed} />
        <LogoutButton collapsed={sidebarCollapsed} />
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden w-full items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-2.5 py-1.5 text-[11px] font-bold text-white/80 hover:bg-[#334155] hover:text-white md:flex"
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

function TourButton({ collapsed }: { collapsed: boolean }) {
  const locale = useLocale();
  const startTour = useUi((s) => s.startTour);
  const label = locale === 'en' ? 'Take a tour' : 'جولة إرشادية';
  return (
    <FeedbackPin elementId="sidebar.tour" className="block">
      <button
        type="button"
        onClick={startTour}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-2.5 py-1.5 text-[11px] font-bold text-white/80 hover:bg-primary-600 hover:text-white"
        aria-label={label}
        title={label}
      >
        <Compass className="h-4 w-4" />
        {!collapsed && <span>{label}</span>}
      </button>
    </FeedbackPin>
  );
}

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const locale = useLocale();
  if (DATA_SOURCE !== 'supabase') return null;
  async function logout() {
    try {
      await getSupabase().auth.signOut();
    } finally {
      router.replace(locale === 'en' ? '/en/login' : '/login');
    }
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e293b] px-2.5 py-1.5 text-[11px] font-bold text-white/80 hover:bg-red-600/80 hover:text-white"
      aria-label={locale === 'en' ? 'Sign out' : 'تسجيل الخروج'}
      title={locale === 'en' ? 'Sign out' : 'تسجيل الخروج'}
    >
      <LogOut className="h-4 w-4" />
      {!collapsed && <span>{locale === 'en' ? 'Sign out' : 'خروج'}</span>}
    </button>
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
