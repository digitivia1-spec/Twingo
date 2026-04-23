import type { Locale } from '@/lib/i18n/config';

/**
 * Convert piasters (EGP × 100) to an integer-EGP value.
 * Display-only — do NOT round-trip through this for storage.
 */
export function piastersToEgp(piasters: number): number {
  return Math.round(piasters) / 100;
}

const arFormatter = new Intl.NumberFormat('ar-EG', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const enFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Display format: `٤٢٥ ج.م` (AR) or `EGP 425` (EN). */
export function formatEgp(piasters: number, locale: Locale): string {
  const egp = piastersToEgp(piasters);
  if (locale === 'ar') {
    return `${arFormatter.format(egp)} ج.م`;
  }
  return `EGP ${enFormatter.format(egp)}`;
}

/** Same as formatEgp but without the currency suffix (for dense tables). */
export function formatEgpPlain(piasters: number, locale: Locale): string {
  const egp = piastersToEgp(piasters);
  return (locale === 'ar' ? arFormatter : enFormatter).format(egp);
}

/** Parse a user-entered EGP string to piasters. Tolerant of AR/EN digits. */
export function parseEgpToPiasters(input: string): number | null {
  const normalized = input
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
