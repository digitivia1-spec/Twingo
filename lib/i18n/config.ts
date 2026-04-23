export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

/** The locale whose route has NO prefix. Arabic is the default, so it lives at `/`. */
export const rootLocale: Locale = 'ar';

export const localeDirs: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export const localeLabels: Record<Locale, { native: string; switcher: string }> = {
  ar: { native: 'العربية', switcher: 'عربي' },
  en: { native: 'English', switcher: 'EN' },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
