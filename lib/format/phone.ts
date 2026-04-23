import { z } from 'zod';

/** Egyptian mobile: 11 digits, starts with 010/011/012/015. */
export const EGYPTIAN_MOBILE_REGEX = /^01[0125]\d{8}$/;

export const EgyptianMobileSchema = z.string().regex(EGYPTIAN_MOBILE_REGEX, {
  message: 'invalid_egyptian_mobile',
});

/** Strip a leading +20 or 20 if present and return local format `01xxxxxxxxx`. */
export function toLocal(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+20')) return cleaned.slice(3);
  if (cleaned.startsWith('0020')) return cleaned.slice(4);
  if (cleaned.startsWith('20') && cleaned.length === 12) return cleaned.slice(2);
  return cleaned;
}

/** Convert a local Egyptian mobile to E.164. */
export function toE164(phone: string): string {
  const local = toLocal(phone);
  return `+20${local.replace(/^0/, '')}`;
}

/** Format for display: `010 1234 5678` */
export function formatEgyptianMobile(phone: string): string {
  const local = toLocal(phone);
  if (!EGYPTIAN_MOBILE_REGEX.test(local)) return local;
  return `${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`;
}
