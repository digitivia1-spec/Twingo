import type { Bilingual } from './shared';

/**
 * A neighbourhood / district inside a city.
 * District names from the legacy tool were free-form strings; we keep
 * them structured here so pricing and coverage logic can use them.
 */
export interface District {
  id: string;
  name: Bilingual;
  code: string;
  city_id: string;
  is_active: boolean;
}
