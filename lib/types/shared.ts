export interface Bilingual {
  ar: string;
  en: string;
}

export interface EgyptianAddress {
  governorate_id: string;
  city: string;
  district: string;
  street: string;
  building?: string;
  floor?: string;
  apartment?: string;
  landmark?: string;
  full_address_ar: string;
  full_address_en?: string;
}

export interface Contact {
  name: Bilingual;
  phone_primary: string;
  phone_secondary?: string;
  email?: string;
}

export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SoftDelete {
  deleted_at?: string;
  deleted_by?: string;
}

/** Pagination helpers. */
export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  page_size: number;
}
