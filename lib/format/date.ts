import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Locale } from '@/lib/i18n/config';

const CAIRO_TZ = 'Africa/Cairo';

export function toCairo(isoOrDate: string | Date): Date {
  const date = typeof isoOrDate === 'string' ? parseISO(isoOrDate) : isoOrDate;
  return toZonedTime(date, CAIRO_TZ);
}

/** `DD/MM/YYYY` in both locales; AR uses Arabic-Indic digits. */
export function formatDate(iso: string | Date, locale: Locale): string {
  const zoned = toCairo(iso);
  const formatted = format(zoned, 'dd/MM/yyyy');
  return locale === 'ar' ? toArabicIndic(formatted) : formatted;
}

export function formatDateTime(iso: string | Date, locale: Locale): string {
  const zoned = toCairo(iso);
  const formatted = format(zoned, 'dd/MM/yyyy HH:mm');
  return locale === 'ar' ? toArabicIndic(formatted) : formatted;
}

export function formatTime(iso: string | Date, locale: Locale): string {
  const zoned = toCairo(iso);
  const formatted = format(zoned, 'HH:mm');
  return locale === 'ar' ? toArabicIndic(formatted) : formatted;
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicIndic(input: string): string {
  return input.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)] ?? d);
}

export function fromArabicIndic(input: string): string {
  return input.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
