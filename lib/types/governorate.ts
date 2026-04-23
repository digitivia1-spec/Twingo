import type { Bilingual } from './shared';

export interface Governorate {
  id: string;
  name: Bilingual;
  code: string;
  is_active: boolean;
  display_order: number;
}
