/**
 * In-memory mutable store for the mock backend.
 * Seeded from /data/mock/*.json at module load, then mutated in-place by the
 * mock repository methods. Refreshing the page resets the store (acceptable
 * for the Phase 1 demo).
 */
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

import type {
  Branch,
  Client,
  CodDue,
  DriverShift,
  Governorate,
  Pickup,
  PriceListEntry,
  ReturnManifest,
  StockItem,
  StockMovement,
  User,
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
};

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
