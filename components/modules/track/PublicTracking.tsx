'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Package,
  PhoneCall,
  Search,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { branches } from '@/lib/api/branches';
import { clients } from '@/lib/api/clients';
import { pickups } from '@/lib/api/pickups';
import { formatDate, formatDateTime } from '@/lib/format/date';
import { formatEgyptianMobile } from '@/lib/format/phone';
import { formatWeightKg } from '@/lib/format/numbers';
import type { Locale } from '@/lib/i18n/config';
import { pickLocale } from '@/lib/utils';

interface PublicTrackingProps {
  /** AWB code from the URL (e.g. PK-1024). Empty when called from a no-code entry. */
  code: string;
  /** When true, render outside any dashboard chrome (for /t/[code]). */
  fullPage?: boolean;
}

/**
 * Customer-facing tracking. Looks up a pickup by code (case-insensitive) and shows
 * a friendly timeline. Designed to work both inside and outside the dashboard chrome.
 */
export function PublicTracking({ code, fullPage = false }: PublicTrackingProps) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [query, setQuery] = useState('');

  /**
   * The pickups list isn't keyed by code, so search the page. In a real backend
   * this would be a `GET /pickups/by-code/{code}` endpoint.
   */
  const { data, isLoading, isFetched } = useQuery({
    queryKey: ['track', code.toLowerCase()],
    enabled: code.length > 0,
    queryFn: async () => {
      const upper = code.trim().toUpperCase();
      const list = await pickups.list({ page: 1, page_size: 1000 });
      const pk = list.rows.find((p) => p.code.toUpperCase() === upper);
      if (!pk) return null;
      const [cl, br] = await Promise.all([
        clients.getById(pk.client_id),
        branches.getById(pk.branch_id),
      ]);
      return { pk, cl, br };
    },
  });

  const wrapper = fullPage
    ? 'min-h-screen bg-surface-muted'
    : '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // Public route: stay on /t/[code]
    if (fullPage) {
      window.location.href = `/${locale === 'ar' ? '' : locale + '/'}t/${encodeURIComponent(trimmed)}`;
      return;
    }
    // Dashboard route
    window.location.href = `/${locale === 'ar' ? '' : locale + '/'}track/${encodeURIComponent(trimmed)}`;
  };

  return (
    <div className={wrapper}>
      {fullPage && (
        <header className="border-b border-border bg-primary-900 px-4 py-3 text-white sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary font-extrabold shadow-md">
                T
              </div>
              <div>
                <h1 className="text-sm font-extrabold leading-tight">
                  {t('brand.name')}
                </h1>
                <p className="text-[11px] text-white/70 leading-tight">
                  {t('track.branding.trustedBy')}
                </p>
              </div>
            </div>
            <a
              href={locale === 'ar' ? '/' : `/${locale}`}
              className="inline-flex items-center gap-1 text-[11px] text-white/80 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              {t('common.back')}
            </a>
          </div>
        </header>
      )}

      <div className={fullPage ? 'mx-auto max-w-3xl space-y-5 p-4 sm:p-8' : 'space-y-5'}>
        {!fullPage && (
          <header>
            <h1 className="text-xl font-bold text-fg">{t('track.title')}</h1>
            <p className="mt-1 text-xs text-fg-muted">{t('track.subtitle')}</p>
          </header>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Search className="h-4 w-4 text-primary-700" />
              {t('track.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('track.placeholder')}
                className="flex-1 font-mono"
                aria-label={t('track.placeholder')}
                defaultValue={code}
              />
              <Button type="submit">
                <Search className="h-3.5 w-3.5" />
                {t('track.submit')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {code && isLoading && (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        )}

        {code && isFetched && !data && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-6 w-6 text-warning" />
              <p className="text-sm font-bold">{t('track.notFound')}</p>
              <p className="text-xs text-fg-muted">{t('track.notFoundHint')}</p>
            </CardContent>
          </Card>
        )}

        {data && (
          <>
            <Card className="border-t-[3px] border-t-primary-700">
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-fg-subtle">
                      {t('track.result.code')}
                    </div>
                    <div className="font-mono text-lg font-extrabold text-primary-700">
                      {data.pk.code}
                    </div>
                  </div>
                  <StatusBadge kind="order" status={data.pk.status} />
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-2">
                  <KV
                    label={t('track.result.recipient')}
                    value={pickLocale(data.pk.recipient.name, locale)}
                  />
                  <KV
                    label={t('track.result.phone')}
                    value={formatEgyptianMobile(data.pk.recipient.phone_primary)}
                    mono
                  />
                  <KV
                    label={t('track.result.destination')}
                    value={
                      locale === 'ar'
                        ? data.pk.delivery_address.full_address_ar
                        : data.pk.delivery_address.full_address_en ??
                          data.pk.delivery_address.full_address_ar
                    }
                  />
                  <KV
                    label={t('track.result.merchant')}
                    value={data.cl ? pickLocale(data.cl.name, locale) : '—'}
                  />
                  <KV
                    label={t('track.result.weight')}
                    value={formatWeightKg(data.pk.weight_kg, locale)}
                  />
                  <KV
                    label={t('track.result.pieces')}
                    value={String(data.pk.pieces_count)}
                  />
                  {data.pk.expected_delivery_date && (
                    <KV
                      label={t('track.result.expected')}
                      value={formatDate(data.pk.expected_delivery_date, locale)}
                    />
                  )}
                  {data.br && (
                    <KV
                      label={t('pickup.columns.branch')}
                      value={pickLocale(data.br.name, locale)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-primary-700" />
                  {t('track.result.timeline')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="relative border-s-2 border-border ps-4 space-y-4">
                  {data.pk.status_history.map((evt, i) => {
                    const isLast = i === data.pk.status_history.length - 1;
                    return (
                      <li key={i} className="relative">
                        <span
                          className={
                            'absolute start-[-22px] top-1 flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-full ring-4 ring-surface ' +
                            (isLast ? 'bg-success' : 'bg-primary-700')
                          }
                        >
                          {isLast && (
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          )}
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge kind="order" status={evt.status} />
                          <span className="text-[11px] text-fg-muted">
                            {formatDateTime(evt.timestamp, locale)}
                          </span>
                        </div>
                        {evt.note && (
                          <p className="mt-1 text-xs text-fg-muted">
                            {evt.note}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-surface p-3 text-[11px] text-fg-muted">
              <PhoneCall className="h-3.5 w-3.5 text-primary-700" />
              {t('track.result.support')}
            </div>
          </>
        )}

        {fullPage && (
          <footer className="pt-4 text-center text-[10px] text-fg-subtle">
            <MapPin className="mx-auto mb-1 h-3 w-3" />
            {t('track.branding.operatorSince')}
          </footer>
        )}
      </div>
    </div>
  );
}

function KV({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wide text-fg-subtle">
        {label}
      </div>
      <div className={mono ? 'font-mono text-fg' : 'text-fg'}>{value}</div>
    </div>
  );
}
