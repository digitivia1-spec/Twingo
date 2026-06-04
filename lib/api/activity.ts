/**
 * Lightweight cross-cutting activity + notifications surface.
 *
 * Aggregates "needs attention" counts and a recent-activity timeline across
 * the four ops queues (new orders, pending clients, cash requests, COD dues)
 * so a user can follow a request through its lifecycle without hunting through
 * each page. Built on the existing repositories, so it works in both `mock`
 * and `supabase` modes.
 */
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';
import { pickups } from './pickups';
import { clients } from './clients';
import { cashRequests } from './cash-requests';
import { codDues } from './cod-dues';

export interface PendingCounts {
  newOrders: number;
  pendingClients: number;
  cashRequests: number;
  codDues: number;
  total: number;
}

export type ActivityKind = 'pickup' | 'cash_request' | 'cod_due' | 'client';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  /** Display label (code or client name). */
  title: string;
  /** Current status of the underlying record. */
  status: string;
  /** ISO timestamp of the last change. */
  timestamp: string;
  /** In-app link (locale-prefixed by the caller). */
  href: string;
}

export const activity = {
  /** Counts of items awaiting action, for the notification badge. */
  async pendingCounts(): Promise<PendingCounts> {
    const [newOrdersPage, pendingClients, pendingCash, pendingCod] = await Promise.all([
      pickups.list({ review_status: 'pending_review', page: 1, page_size: 1 }),
      clients.list({ approval_status: 'pending' }),
      cashRequests.list({ status: ['pending'] }),
      codDues.list({ status: ['pending'] }),
    ]);
    const newOrders = newOrdersPage.total;
    const counts = {
      newOrders,
      pendingClients: pendingClients.length,
      cashRequests: pendingCash.length,
      codDues: pendingCod.length,
    };
    return { ...counts, total: counts.newOrders + counts.pendingClients + counts.cashRequests + counts.codDues };
  },

  /** A merged, newest-first timeline of recent records across the queues. */
  async recent(locale: Locale, limit = 12): Promise<ActivityItem[]> {
    const [pickupPage, cash, cod, pendingClients] = await Promise.all([
      pickups.list({ review_status: 'all', page: 1, page_size: 15, sort_by: 'updated_at', sort_dir: 'desc' }),
      cashRequests.list(),
      codDues.list(),
      clients.list({ approval_status: 'pending' }),
    ]);

    const items: ActivityItem[] = [];
    for (const p of pickupPage.rows) {
      items.push({
        id: `pickup:${p.id}`,
        kind: 'pickup',
        title: p.code,
        status: p.review_status === 'pending_review' ? 'pending_review' : p.status,
        timestamp: p.updated_at,
        href: `/pickup/${p.id}`,
      });
    }
    for (const r of cash) {
      items.push({
        id: `cash:${r.id}`,
        kind: 'cash_request',
        title: r.code,
        status: r.status,
        timestamp: r.updated_at,
        href: '/cash-requests',
      });
    }
    for (const d of cod) {
      items.push({
        id: `cod:${d.id}`,
        kind: 'cod_due',
        title: d.code,
        status: d.status,
        timestamp: d.updated_at,
        href: '/cod',
      });
    }
    for (const c of pendingClients) {
      items.push({
        id: `client:${c.id}`,
        kind: 'client',
        title: pickLocale(c.name, locale),
        status: 'pending',
        timestamp: c.updated_at,
        href: '/clients/pending',
      });
    }

    return items
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, limit);
  },
};
