import type { Locale } from '@/lib/i18n/config';
import { toArabicIndic } from './date';

const arIntFmt = new Intl.NumberFormat('ar-EG');
const enIntFmt = new Intl.NumberFormat('en-US');

export function formatInt(n: number, locale: Locale): string {
  return (locale === 'ar' ? arIntFmt : enIntFmt).format(Math.round(n));
}

export function formatPercent(n: number, locale: Locale): string {
  const s = `${(n * 100).toFixed(0)}%`;
  return locale === 'ar' ? toArabicIndic(s) : s;
}

export function formatWeightKg(kg: number, locale: Locale): string {
  const s = `${kg.toFixed(kg % 1 === 0 ? 0 : 1)} kg`;
  if (locale === 'ar') return `${toArabicIndic(s.replace(' kg', ''))} كجم`;
  return s;
}
