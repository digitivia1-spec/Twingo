/**
 * In-memory mutable store for the mock backend.
 * Seeded from /data/mock/*.json at module load, then mutated in-place by the
 * mock repository methods. Refreshing the page resets the store (acceptable
 * for the Phase 1 demo).
 */
import { DATA_SOURCE } from './source';
import branchesSeed from '@/data/mock/branches.json';
import usersSeed from '@/data/mock/users.json';
import clientsSeed from '@/data/mock/clients.json';
import pickupsSeed from '@/data/mock/pickups.json';
import shiftsSeed from '@/data/mock/driver-shifts.json';
import codDuesSeed from '@/data/mock/cod-dues.json';
import stockSeed from '@/data/mock/stock.json';
import movementsSeed from '@/data/mock/stock-movements.json';
import pricesSeed from '@/data/mock/prices.json';
import returnsSeed from '@/data/mock/returns.json';
import governoratesSeed from '@/data/mock/governorates.json';
import cashRequestsSeed from '@/data/mock/cash-requests.json';
import citiesSeed from '@/data/mock/cities.json';
import districtsSeed from '@/data/mock/districts.json';
import zonesSeed from '@/data/mock/zones.json';
import clientRatesSeed from '@/data/mock/client-rates.json';
import awbCodesSeed from '@/data/mock/awb-codes.json';

import type {
  AwbCode,
  Branch,
  CashRequest,
  City,
  Client,
  ClientShippingRate,
  CodDue,
  District,
  DriverShift,
  Governorate,
  Pickup,
  PriceListEntry,
  ReturnManifest,
  StockItem,
  StockMovement,
  User,
  Zone,
} from '@/lib/types';

/** Module-level, mutable. Keep this process-local. */
export const store = {
  branches: structuredClone(branchesSeed) as Branch[],
  users: structuredClone(usersSeed) as User[],
  clients: structuredClone(clientsSeed) as Client[],
  pickups: structuredClone(pickupsSeed) as Pickup[],
  shifts: structuredClone(shiftsSeed) as DriverShift[],
  codDues: structuredClone(codDuesSeed) as CodDue[],
  stock: structuredClone(stockSeed) as StockItem[],
  movements: structuredClone(movementsSeed) as StockMovement[],
  prices: structuredClone(pricesSeed) as PriceListEntry[],
  returns: structuredClone(returnsSeed) as ReturnManifest[],
  governorates: structuredClone(governoratesSeed) as Governorate[],
  cashRequests: structuredClone(cashRequestsSeed) as CashRequest[],
  cities: structuredClone(citiesSeed) as City[],
  districts: structuredClone(districtsSeed) as District[],
  zones: structuredClone(zonesSeed) as Zone[],
  clientRates: structuredClone(clientRatesSeed) as ClientShippingRate[],
  awbCodes: structuredClone(awbCodesSeed) as AwbCode[],
};

/* ---------- Seed extras for the ops queues ----------
 * Existing seed JSON predates the queue schema, so we inject a small
 * set of un-approved merchants and pending-review pickups at boot so
 * the New Orders / Pending Clients / Cash Requests pages aren't empty.
 */

// 1. Merchants pending verification — surface in /clients/pending.
// Only injected in mock mode; in supabase mode the real DB carries these rows.
if (DATA_SOURCE === 'mock')
  store.clients.push(
  {
    id: 'cl_pending_zenith',
    name: { ar: 'زينيث ستور', en: 'Zenith Store' },
    business_name: { ar: 'زينيث للأزياء', en: 'Zenith Apparel' },
    phone_primary: '+201018765432',
    email: 'hello@zenith.eg',
    pickup_address: {
      governorate_id: 'gov_c',
      city: 'القاهرة',
      district: 'مصر الجديدة',
      street: 'شارع الحجاز',
      full_address_ar: 'شارع الحجاز، مصر الجديدة',
      full_address_en: 'Hejaz St, Heliopolis',
    },
    preferred_branch_id: 'br_cairo_hq',
    payment_terms: { method: 'instapay', frequency: 'weekly' },
    total_orders: 0,
    total_cod_owed: 0,
    is_active: false,
    approval_status: 'pending',
    approval_requested_at: '2026-05-08T10:00:00Z',
    created_at: '2026-05-08T10:00:00Z',
    updated_at: '2026-05-08T10:00:00Z',
  },
  {
    id: 'cl_pending_marina',
    name: { ar: 'مارينا أكسسوارز', en: 'Marina Accessories' },
    business_name: { ar: 'مارينا أكسسوارز', en: 'Marina Accessories' },
    phone_primary: '+201199887766',
    email: 'orders@marina-acc.eg',
    pickup_address: {
      governorate_id: 'gov_alex',
      city: 'الإسكندرية',
      district: 'سموحة',
      street: 'شارع فيكتور عمانوئيل',
      full_address_ar: 'فيكتور عمانوئيل، سموحة، الإسكندرية',
      full_address_en: 'Victor Emanuel St, Smouha, Alexandria',
    },
    preferred_branch_id: 'br_alex',
    payment_terms: { method: 'cash', frequency: 'monthly' },
    total_orders: 0,
    total_cod_owed: 0,
    is_active: false,
    approval_status: 'pending',
    approval_requested_at: '2026-05-09T14:30:00Z',
    created_at: '2026-05-09T14:30:00Z',
    updated_at: '2026-05-09T14:30:00Z',
  },
  {
    id: 'cl_pending_oasis',
    name: { ar: 'واحة الجمال', en: 'Beauty Oasis' },
    business_name: { ar: 'واحة الجمال — منتجات تجميل', en: 'Beauty Oasis — Cosmetics' },
    phone_primary: '+201234567890',
    email: 'hi@oasis.eg',
    pickup_address: {
      governorate_id: 'gov_c',
      city: 'القاهرة',
      district: '6 أكتوبر',
      street: 'الحي السابع',
      full_address_ar: 'الحي السابع، 6 أكتوبر',
      full_address_en: '7th District, 6 October',
    },
    preferred_branch_id: 'br_cairo_hq',
    payment_terms: { method: 'bank_transfer', frequency: 'bi_weekly' },
    total_orders: 0,
    total_cod_owed: 0,
    is_active: false,
    approval_status: 'pending',
    approval_requested_at: '2026-05-10T08:00:00Z',
    created_at: '2026-05-10T08:00:00Z',
    updated_at: '2026-05-10T08:00:00Z',
  },
);

// 2. Pickups submitted by merchants that need ops review.
const pendingReviewSamples: Pickup[] = [
  {
    id: 'pk_review_001',
    code: 'PK-2001',
    reference_code: 'AHM-9001',
    client_id: 'cl_ahmed_store',
    branch_id: 'br_cairo_hq',
    order_type: 'forward',
    submission_source: 'merchant_portal',
    review_status: 'pending_review',
    recipient: {
      name: { ar: 'ياسمين فؤاد', en: 'Yasmin Fouad' },
      phone_primary: '+201019998877',
    },
    delivery_address: {
      governorate_id: 'gov_c',
      city: 'القاهرة',
      district: 'الدقي',
      street: 'شارع التحرير',
      full_address_ar: 'التحرير، الدقي، الجيزة',
      full_address_en: 'Tahrir St, Dokki, Giza',
    },
    description: { ar: 'سنيكرز بنات', en: 'Sneakers — kids' },
    weight_kg: 0.9,
    pieces_count: 1,
    is_fragile: false,
    allow_open_package: true,
    cod_amount: 65000,
    shipping_fee: 6000,
    status: 'pending',
    status_history: [
      {
        status: 'pending',
        timestamp: '2026-05-09T11:00:00Z',
        note: 'Submitted via merchant portal',
      },
    ],
    created_at: '2026-05-09T11:00:00Z',
    updated_at: '2026-05-09T11:00:00Z',
  },
  {
    id: 'pk_review_002',
    code: 'PK-2002',
    reference_code: 'NF-7711',
    client_id: 'cl_nour_fashion',
    branch_id: 'br_cairo_hq',
    order_type: 'exchange',
    submission_source: 'shopify',
    review_status: 'pending_review',
    recipient: {
      name: { ar: 'محمود سيف', en: 'Mahmoud Seif' },
      phone_primary: '+201112223344',
    },
    delivery_address: {
      governorate_id: 'gov_c',
      city: 'القاهرة',
      district: 'مدينة نصر',
      street: 'شارع مكرم عبيد',
      full_address_ar: 'مكرم عبيد، مدينة نصر',
      full_address_en: 'Makram Ebeid, Nasr City',
    },
    description: { ar: 'استبدال مقاس فستان', en: 'Dress size exchange' },
    weight_kg: 0.5,
    pieces_count: 1,
    is_fragile: false,
    allow_open_package: true,
    cod_amount: 0,
    shipping_fee: 4000,
    status: 'pending',
    status_history: [
      {
        status: 'pending',
        timestamp: '2026-05-10T07:45:00Z',
        note: 'Shopify webhook intake',
      },
    ],
    created_at: '2026-05-10T07:45:00Z',
    updated_at: '2026-05-10T07:45:00Z',
  },
  {
    id: 'pk_review_003',
    code: 'PK-2003',
    reference_code: 'TH-204',
    client_id: 'cl_tech_hub',
    branch_id: 'br_cairo_hq',
    order_type: 'forward',
    submission_source: 'csv_import',
    review_status: 'pending_review',
    recipient: {
      name: { ar: 'سامح وليم', en: 'Sameh William' },
      phone_primary: '+201234445566',
    },
    delivery_address: {
      governorate_id: 'gov_giza',
      city: 'الجيزة',
      district: '6 أكتوبر',
      street: 'الحي 12',
      full_address_ar: 'الحي 12، 6 أكتوبر، الجيزة',
      full_address_en: '12th District, 6 October, Giza',
    },
    description: { ar: 'سماعة بلوتوث', en: 'Bluetooth headset' },
    weight_kg: 0.3,
    pieces_count: 1,
    is_fragile: true,
    allow_open_package: false,
    cod_amount: 195000,
    shipping_fee: 7500,
    status: 'pending',
    status_history: [
      {
        status: 'pending',
        timestamp: '2026-05-10T09:20:00Z',
        note: 'CSV bulk import',
      },
    ],
    created_at: '2026-05-10T09:20:00Z',
    updated_at: '2026-05-10T09:20:00Z',
  },
];
if (DATA_SOURCE === 'mock') store.pickups.unshift(...pendingReviewSamples);

export function nowIso(): string {
  return new Date().toISOString();
}

export function nextSequence(prefix: string, existing: { id: string }[]): string {
  const max = existing.reduce((acc, item) => {
    const n = Number(item.id.replace(`${prefix}_`, '').replace(/\D/g, ''));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}_${String(max + 1).padStart(4, '0')}`;
}

/** Simulated async latency (ms). Set to 0 to disable. */
export const MOCK_LATENCY_MS = Number(
  process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 0,
);

export async function latency<T>(value: T): Promise<T> {
  if (MOCK_LATENCY_MS > 0) {
    await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
  }
  return value;
}
