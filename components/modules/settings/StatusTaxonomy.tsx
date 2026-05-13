'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import {
  ORDER_STATUSES,
  type OrderStatus,
} from '@/lib/types/enums';
import { PICKUP_REASON_CODES } from '@/lib/types/pickup';

/**
 * Read-only reference for the canonical taxonomy:
 *  - 8 order statuses
 *  - 12 reason codes
 *  - Mapping table from the legacy 47-status sprawl → canonical 8 + reason code.
 *
 * The mapping table is what we'll use during the data migration off
 * tuyingo.com. It lives next to the taxonomy so the conversation with the
 * client has a single source of truth.
 */

interface StatusMeaning {
  status: OrderStatus;
  meaning: string;
  transitions: OrderStatus[];
}

const STATUS_GRAPH: StatusMeaning[] = [
  {
    status: 'pending',
    meaning: 'pickup intake; awaiting dispatch',
    transitions: ['dispatched', 'cancelled'],
  },
  {
    status: 'dispatched',
    meaning: 'assigned to a driver, package not yet on the road',
    transitions: ['out_for_delivery', 'cancelled'],
  },
  {
    status: 'out_for_delivery',
    meaning: 'driver is en route to the recipient',
    transitions: [
      'delivered',
      'partially_delivered',
      'refused',
      'returned',
      'cancelled',
    ],
  },
  {
    status: 'delivered',
    meaning: 'recipient signed for the whole package',
    transitions: [],
  },
  {
    status: 'partially_delivered',
    meaning: 'recipient accepted some pieces, returned the rest',
    transitions: ['returned'],
  },
  {
    status: 'returned',
    meaning: 'package on its way back to the merchant',
    transitions: [],
  },
  {
    status: 'cancelled',
    meaning: 'killed before delivery — by ops, merchant, or auto-rule',
    transitions: [],
  },
  {
    status: 'refused',
    meaning: 'recipient declined the package',
    transitions: ['returned'],
  },
];

/**
 * Legacy → canonical mapping. Migration off the 47-status sprawl drops
 * branch and language variants into the right canonical bucket; reason
 * codes carry the disambiguating signal.
 */
interface LegacyMapping {
  legacy: string;
  status: OrderStatus;
  reason?: string;
}

const LEGACY_MAPPING: LegacyMapping[] = [
  { legacy: 'New', status: 'pending' },
  { legacy: 'pick up', status: 'pending' },
  { legacy: 'Preparing (maadi)', status: 'pending' },
  { legacy: 'Preparing (nasrcity)', status: 'pending' },
  { legacy: 'NOT Ready', status: 'pending' },
  { legacy: 'Ready', status: 'pending' },
  { legacy: 'Received at Warehouse maddie', status: 'pending' },
  { legacy: 'Received at Warehouse N.C', status: 'pending' },
  { legacy: 'Missing Info (M)', status: 'pending' },
  { legacy: 'Missing Info (N.C)', status: 'pending' },
  { legacy: 'On Hold (M)', status: 'pending' },
  { legacy: 'On Hold (N.C)', status: 'pending' },
  { legacy: 'Shipped', status: 'dispatched' },
  { legacy: 'shipped(ND)', status: 'dispatched' },
  { legacy: 'Transit', status: 'dispatched' },
  { legacy: 'Transit to .M', status: 'dispatched' },
  { legacy: 'Delivery IN Progress', status: 'out_for_delivery' },
  { legacy: 'Delivered', status: 'delivered' },
  { legacy: 'COD Received', status: 'delivered' },
  {
    legacy: "Couldn't Reach Client",
    status: 'out_for_delivery',
    reason: 'not_home',
  },
  {
    legacy: "can't reach the client",
    status: 'out_for_delivery',
    reason: 'phone_off',
  },
  {
    legacy: "Couldn't Reach Client(ND)",
    status: 'out_for_delivery',
    reason: 'not_home',
  },
  {
    legacy: 'Client Rescheduled (M)',
    status: 'out_for_delivery',
    reason: 'customer_rescheduled',
  },
  {
    legacy: 'Client Rescheduled (n,c)',
    status: 'out_for_delivery',
    reason: 'customer_rescheduled',
  },
  {
    legacy: 'Client Rescheduled (ND)',
    status: 'out_for_delivery',
    reason: 'customer_rescheduled',
  },
  { legacy: 'Convert Address', status: 'pending', reason: 'address_wrong' },
  { legacy: 'Resend', status: 'pending' },
  { legacy: 'resend by shipper', status: 'pending' },
  { legacy: 'Failed', status: 'cancelled', reason: 'merchant_cancelled' },
  { legacy: 'Failed (Fees Collected)', status: 'cancelled' },
  { legacy: 'Faild (WD)', status: 'cancelled' },
  { legacy: 'Cancelled', status: 'cancelled' },
  { legacy: 'cancelled by shipper', status: 'cancelled', reason: 'merchant_cancelled' },
  { legacy: 'Customer canceled', status: 'refused', reason: 'customer_refused' },
  { legacy: 'Returned To Shipper', status: 'returned' },
  { legacy: 'Not Received', status: 'returned', reason: 'not_home' },
  { legacy: 'Missing piece', status: 'partially_delivered' },
  { legacy: 'Archived', status: 'delivered' },
  { legacy: 'DUPLICATED', status: 'cancelled' },
  { legacy: 'Pickup + Flare Fees', status: 'pending' },
  { legacy: 'SOS🆘', status: 'pending', reason: 'other' },
];

export function StatusTaxonomy() {
  const t = useTranslations();

  return (
    <>
      <PageHeader
        elementId="settings.statuses"
        title={t('settings.statuses.title')}
        subtitle={t('settings.statuses.subtitle')}
      />

      <FeedbackPin elementId="settings.statuses.canonical">
        <Card>
          <CardHeader>
            <CardTitle>
              {t('settings.statuses.canonical')} · {ORDER_STATUSES.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-fg-muted">
              {t('settings.statuses.canonicalNote')}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {STATUS_GRAPH.map((s) => (
                <div
                  key={s.status}
                  className="rounded-lg border border-border bg-surface p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <StatusBadge kind="order" status={s.status} />
                  </div>
                  <p className="text-[11px] text-fg-muted">{s.meaning}</p>
                  {s.transitions.length > 0 && (
                    <p className="mt-2 text-[10px] text-fg-subtle">
                      →{' '}
                      {s.transitions
                        .map((tt) => t(`statuses.order.${tt}` as const))
                        .join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FeedbackPin>

      <FeedbackPin elementId="settings.statuses.reasons">
        <Card>
          <CardHeader>
            <CardTitle>
              {t('settings.statuses.reasons')} · {PICKUP_REASON_CODES.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-fg-muted">
              {t('settings.statuses.reasonsNote')}
            </p>
            <div className="flex flex-wrap gap-2">
              {PICKUP_REASON_CODES.map((r) => (
                <Badge key={r} tone="warning">
                  {t(`reasonCodes.${r}` as const)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </FeedbackPin>

      <FeedbackPin elementId="settings.statuses.legacyMap">
        <Card className="border-t-[3px] border-t-warning">
          <CardHeader>
            <CardTitle>{t('settings.statuses.legacyMap')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-fg-muted">
              {t('settings.statuses.legacyMapNote')}
            </p>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead className="bg-surface-muted text-[10px] font-bold uppercase tracking-wide text-fg-subtle">
                  <tr>
                    <th className="px-3 py-2 text-start">
                      {t('settings.statuses.legacyHeader')}
                    </th>
                    <th className="px-3 py-2 text-start">
                      {t('settings.statuses.canonicalHeader')}
                    </th>
                    <th className="px-3 py-2 text-start">
                      {t('settings.statuses.reasonHeader')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {LEGACY_MAPPING.map((m, i) => (
                    <tr
                      key={i}
                      className="border-t border-border hover:bg-surface-hover"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-fg-muted">
                        {m.legacy}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge kind="order" status={m.status} />
                      </td>
                      <td className="px-3 py-2">
                        {m.reason ? (
                          <Badge tone="warning">
                            {t(`reasonCodes.${m.reason}` as const)}
                          </Badge>
                        ) : (
                          <span className="text-fg-subtle">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[10px] text-fg-subtle">
              {t('settings.statuses.legacyMapFooter')}
            </p>
          </CardContent>
        </Card>
      </FeedbackPin>
    </>
  );
}
