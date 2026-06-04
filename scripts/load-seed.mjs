/* One-off seed loader: signs in as the bootstrapped admin and upserts the
 * full mock dataset over PostgREST (RLS-respecting). Re-runnable (ignores
 * duplicates). Not part of the app build. Usage: node scripts/load-seed.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = 'https://opqjsrmbivifjuhcjctt.supabase.co';
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wcWpzcm1iaXZpZmp1aGNqY3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Nzk0ODgsImV4cCI6MjA5NjE1NTQ4OH0.DtbGSinutJz9X5hLC5TQz8erwVKNaH3M6TwfQvryeCA';
const EMAIL = 'nagui@twinjo.com';
const PASSWORD = 'Twingo!Demo2026';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK = path.join(__dirname, '..', 'data', 'mock');
const load = (f) => JSON.parse(fs.readFileSync(path.join(MOCK, f + '.json'), 'utf8'));

// seed-extras (mirror lib/api/_store.ts) so ops queues aren't empty
const pendingClients = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-extras.json'), 'utf8')).pendingClients;
const reviewPickups = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-extras.json'), 'utf8')).reviewPickups;

async function signIn() {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`signin failed: ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}

async function insertRows(token, table, rows) {
  if (!rows.length) return;
  const r = await fetch(`${URL}/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!r.ok) throw new Error(`insert ${table} failed: ${r.status} ${await r.text()}`);
  console.log(`  ✓ ${table}: ${rows.length}`);
}

async function patch(token, table, id, body) {
  const r = await fetch(`${URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`patch ${table} ${id} failed: ${r.status} ${await r.text()}`);
}

const strip = (rows, ...keys) =>
  rows.map((o) => { const c = { ...o }; for (const k of keys) delete c[k]; return c; });

async function main() {
  const token = await signIn();
  console.log('Signed in as admin. Loading…');

  await insertRows(token, 'governorates', load('governorates'));
  await insertRows(token, 'cities', load('cities'));
  await insertRows(token, 'districts', load('districts'));
  await insertRows(token, 'zones', load('zones'));

  // branches before users, but defer manager_id (FK -> users).
  const branches = load('branches');
  await insertRows(token, 'branches', strip(branches, 'manager_id'));
  await insertRows(token, 'users', load('users'));
  for (const b of branches) if (b.manager_id) await patch(token, 'branches', b.id, { manager_id: b.manager_id });

  await insertRows(token, 'clients', load('clients').concat(pendingClients));
  await insertRows(token, 'client_shipping_rates', load('client-rates'));
  await insertRows(token, 'awb_codes', load('awb-codes'));
  await insertRows(token, 'pickups', load('pickups').concat(reviewPickups));
  await insertRows(token, 'driver_shifts', load('driver-shifts'));
  await insertRows(token, 'cod_dues', load('cod-dues'));
  await insertRows(token, 'cash_requests', load('cash-requests'));
  await insertRows(token, 'stock_items', load('stock'));
  await insertRows(token, 'stock_movements', load('stock-movements'));
  await insertRows(token, 'price_list_entries', load('prices'));
  await insertRows(token, 'return_manifests', load('returns'));

  // u_nagui was bootstrapped with null branch in 0014 — link it now.
  await patch(token, 'users', 'u_nagui', { branch_id: 'br_cairo_hq' });
  console.log('Seed load complete.');
}
main().catch((e) => { console.error(e); process.exit(1); });
