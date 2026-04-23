import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Pick a bilingual value with safe fallback. */
export function pickLocale<T>(
  bilingual: { ar: T; en: T },
  locale: 'ar' | 'en',
): T {
  return bilingual[locale] ?? bilingual.ar;
}

/** Minimal nanosecond-free pseudo-UUID for mock data. Not cryptographic. */
export function mockId(prefix: string, seed: number): string {
  return `${prefix}_${seed.toString(36).padStart(6, '0')}`;
}
