import type { Bilingual } from './shared';

/**
 * A named city within a governorate. Used to disambiguate addresses and
 * roll up districts.
 */
export interface City {
  id: string;
  name: Bilingual;
  code: string;
  governorate_id: string;
  is_active: boolean;
  display_order: number;
}
