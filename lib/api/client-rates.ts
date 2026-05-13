import type { ClientShippingRate } from '@/lib/types/client-rate';
import { DATA_SOURCE, NOT_IMPLEMENTED } from './source';
import { latency, nowIso, store } from './_store';

export interface ClientRateFilters {
  client_id?: string;
  from_governorate_id?: string;
  to_governorate_id?: string;
  is_active?: boolean;
}

export interface ClientRateRepository {
  list(filters?: ClientRateFilters): Promise<ClientShippingRate[]>;
  getById(id: string): Promise<ClientShippingRate | null>;
  toggleActive(id: string, is_active: boolean): Promise<ClientShippingRate>;
}

const mock: ClientRateRepository = {
  async list(filters = {}) {
    let rows = store.clientRates.slice();
    if (filters.client_id)
      rows = rows.filter((r) => r.client_id === filters.client_id);
    if (filters.from_governorate_id)
      rows = rows.filter(
        (r) => r.from_governorate_id === filters.from_governorate_id,
      );
    if (filters.to_governorate_id)
      rows = rows.filter(
        (r) => r.to_governorate_id === filters.to_governorate_id,
      );
    if (typeof filters.is_active === 'boolean')
      rows = rows.filter((r) => r.is_active === filters.is_active);
    return latency(
      rows.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    );
  },
  async getById(id) {
    return latency(store.clientRates.find((r) => r.id === id) ?? null);
  },
  async toggleActive(id, is_active) {
    const r = store.clientRates.find((x) => x.id === id);
    if (!r) throw new Error(`Rate not found: ${id}`);
    r.is_active = is_active;
    r.updated_at = nowIso();
    return latency(r);
  },
};

const supabase: ClientRateRepository = {
  async list() { throw NOT_IMPLEMENTED; },
  async getById() { throw NOT_IMPLEMENTED; },
  async toggleActive() { throw NOT_IMPLEMENTED; },
};

export const clientRates: ClientRateRepository =
  DATA_SOURCE === 'supabase' ? supabase : mock;
