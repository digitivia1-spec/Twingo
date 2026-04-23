import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { defaultLocale, isLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // In App Router with [locale] segments, `requestLocale` is the segment value.
  const candidate = (await requestLocale) ?? defaultLocale;
  const locale = isLocale(candidate) ? candidate : defaultLocale;
  if (!isLocale(locale)) notFound();

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
    timeZone: 'Africa/Cairo',
    now: new Date(),
  };
});
