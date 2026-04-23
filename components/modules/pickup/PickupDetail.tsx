'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Map as MapIcon, PackageOpen, User, Wallet } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { VehicleIcon } from '@/components/shared/VehicleIcon';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { pickups } from '@/lib/api/pickups';
import { clients } from '@/lib/api/clients';
import { users } from '@/lib/api/users';
import { branches } from '@/lib/api/branches';
import { formatEgp } from '@/lib/format/currency';
import { formatDateTime } from '@/lib/format/date';
import { formatWeightKg } from '@/lib/format/numbers';
import { formatEgyptianMobile } from '@/lib/format/phone';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';

export function PickupDetail({ id }: { id: string }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;

  const { data, isLoading } = useQuery({
    queryKey: ['pickup', id],
    queryFn: async () => {
      const pk = await pickups.getById(id);
      if (!pk) return null;
      const [cl, br, drv] = await Promise.all([
        clients.getById(pk.client_id),
        branches.getById(pk.branch_id),
        pk.driver_id ? users.getById(pk.driver_id) : Promise.resolve(null),
      ]);
      return { pk, cl, br, drv };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data?.pk) {
    return (
      <div className="py-16 text-center">
        <p className="text-fg-muted">{t('common.empty')}</p>
      </div>
    );
  }

  const { pk, cl, br, drv } = data;

  return (
    <>
      <PageHeader
        elementId="pickup.detail"
        title={pk.code}
        subtitle={cl ? pickLocale(cl.name, locale) : ''}
        actions={
          <Link href="../pickup">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              {t('common.back')}
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <FeedbackPin elementId="pickup.detail.recipient">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary-700" />
                {t('pickup.detail.recipient')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <KV k={t('pickup.create.recipientName')} v={pickLocale(pk.recipient.name, locale)} />
              <KV
                k={t('pickup.create.recipientPhone')}
                v={formatEgyptianMobile(pk.recipient.phone_primary)}
              />
              {pk.recipient.phone_secondary && (
                <KV
                  k={t('pickup.create.recipientPhone') + ' 2'}
                  v={formatEgyptianMobile(pk.recipient.phone_secondary)}
                />
              )}
              <KV
                k={t('pickup.create.address')}
                v={
                  locale === 'ar'
                    ? pk.delivery_address.full_address_ar
                    : pk.delivery_address.full_address_en ??
                      pk.delivery_address.full_address_ar
                }
              />
              {pk.delivery_address.landmark && (
                <KV
                  k={t('pickup.create.landmark')}
                  v={pk.delivery_address.landmark}
                />
              )}
            </CardContent>
          </Card>
        </FeedbackPin>

        <FeedbackPin elementId="pickup.detail.package">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageOpen className="h-4 w-4 text-primary-700" />
                {t('pickup.detail.package')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <KV
                k={t('pickup.create.description')}
                v={pickLocale(pk.description, locale)}
              />
              <KV
                k={t('pickup.create.weight')}
                v={formatWeightKg(pk.weight_kg, locale)}
              />
              <KV k={t('pickup.create.pieces')} v={String(pk.pieces_count)} />
              <KV
                k={t('pickup.create.fragile')}
                v={pk.is_fragile ? t('common.yes') : t('common.no')}
              />
              {pk.reference_code && (
                <KV
                  k={t('pickup.columns.referenceCode')}
                  v={pk.reference_code}
                />
              )}
            </CardContent>
          </Card>
        </FeedbackPin>

        <FeedbackPin elementId="pickup.detail.money">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary-700" />
                {t('pickup.detail.money')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <KV k="COD" v={formatEgp(pk.cod_amount, locale)} />
              <KV
                k={t('pickup.create.shipping')}
                v={formatEgp(pk.shipping_fee, locale)}
              />
              <KV
                k={t('pickup.columns.branch')}
                v={br ? pickLocale(br.name, locale) : '—'}
              />
              <div className="flex items-center justify-between py-0.5">
                <span className="text-fg-muted">
                  {t('pickup.columns.status')}
                </span>
                <StatusBadge kind="order" status={pk.status} />
              </div>
              {pk.vehicle_type && (
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-fg-muted">
                    {t('pickup.columns.vehicle')}
                  </span>
                  <VehicleIcon type={pk.vehicle_type} />
                </div>
              )}
              {drv && (
                <KV
                  k={t('finance.columns.driver')}
                  v={`${pickLocale(drv.name, locale)} · ${drv.driver_code ?? ''}`}
                />
              )}
            </CardContent>
          </Card>
        </FeedbackPin>
      </div>

      <FeedbackPin elementId="pickup.detail.timeline">
        <Card>
          <CardHeader>
            <CardTitle>{t('pickup.detail.timeline')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-s-2 border-border ps-4 space-y-4">
              {pk.status_history.map((evt, i) => (
                <li key={i} className="relative">
                  <span className="absolute start-[-22px] top-1 flex h-3 w-3 -translate-x-1/2 rounded-full bg-primary-700 ring-4 ring-surface" />
                  <div className="flex items-center gap-3">
                    <StatusBadge kind="order" status={evt.status} />
                    <span className="text-[11px] text-fg-muted">
                      {formatDateTime(evt.timestamp, locale)}
                    </span>
                  </div>
                  {evt.note && (
                    <p className="mt-1 text-xs text-fg-muted">{evt.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </FeedbackPin>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-primary-700" />
            {t('pickup.detail.mapPlaceholder')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-muted text-xs text-fg-subtle">
            {t('pickup.detail.mapPlaceholder')}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-0.5">
      <span className="text-fg-muted">{k}</span>
      <span className="text-fg text-end">{v}</span>
    </div>
  );
}
