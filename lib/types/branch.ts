import type { AuditFields, Bilingual } from './shared';

export interface Branch extends AuditFields {
  id: string;
  name: Bilingual;
  code: string;
  governorate_id: string;
  city: string;
  address: string;
  phone: string;
  manager_id?: string;
  coverage_governorate_ids: string[];
  is_active: boolean;
  is_headquarters: boolean;
  location?: { lat: number; lng: number };
}
