/* Generates supabase/migrations/0013_seed.sql from data/mock/*.json.
 * Nested objects -> jsonb, id-arrays -> text[], everything else scalar.
 * Re-runnable: emits `insert ... on conflict (id) do nothing`. */
const fs = require('fs');
const path = require('path');

const MOCK = path.join(__dirname, '..', 'data', 'mock');
const load = (f) => JSON.parse(fs.readFileSync(path.join(MOCK, f + '.json'), 'utf8'));

// ── seed-extras pulled from lib/api/_store.ts so ops queues aren't empty ──
const pendingClients = [
  { id: 'cl_pending_zenith', name: { ar: 'زينيث ستور', en: 'Zenith Store' }, business_name: { ar: 'زينيث للأزياء', en: 'Zenith Apparel' }, phone_primary: '+201018765432', email: 'hello@zenith.eg', pickup_address: { governorate_id: 'gov_c', city: 'القاهرة', district: 'مصر الجديدة', street: 'شارع الحجاز', full_address_ar: 'شارع الحجاز، مصر الجديدة', full_address_en: 'Hejaz St, Heliopolis' }, preferred_branch_id: 'br_cairo_hq', payment_terms: { method: 'instapay', frequency: 'weekly' }, total_orders: 0, total_cod_owed: 0, is_active: false, approval_status: 'pending', approval_requested_at: '2026-05-08T10:00:00Z', created_at: '2026-05-08T10:00:00Z', updated_at: '2026-05-08T10:00:00Z' },
  { id: 'cl_pending_marina', name: { ar: 'مارينا أكسسوارز', en: 'Marina Accessories' }, business_name: { ar: 'مارينا أكسسوارز', en: 'Marina Accessories' }, phone_primary: '+201199887766', email: 'orders@marina-acc.eg', pickup_address: { governorate_id: 'gov_alx', city: 'الإسكندرية', district: 'سموحة', street: 'شارع فيكتور عمانوئيل', full_address_ar: 'فيكتور عمانوئيل، سموحة، الإسكندرية', full_address_en: 'Victor Emanuel St, Smouha, Alexandria' }, preferred_branch_id: 'br_alex', payment_terms: { method: 'cash', frequency: 'monthly' }, total_orders: 0, total_cod_owed: 0, is_active: false, approval_status: 'pending', approval_requested_at: '2026-05-09T14:30:00Z', created_at: '2026-05-09T14:30:00Z', updated_at: '2026-05-09T14:30:00Z' },
  { id: 'cl_pending_oasis', name: { ar: 'واحة الجمال', en: 'Beauty Oasis' }, business_name: { ar: 'واحة الجمال — منتجات تجميل', en: 'Beauty Oasis — Cosmetics' }, phone_primary: '+201234567890', email: 'hi@oasis.eg', pickup_address: { governorate_id: 'gov_c', city: 'القاهرة', district: '6 أكتوبر', street: 'الحي السابع', full_address_ar: 'الحي السابع، 6 أكتوبر', full_address_en: '7th District, 6 October' }, preferred_branch_id: 'br_cairo_hq', payment_terms: { method: 'bank_transfer', frequency: 'bi_weekly' }, total_orders: 0, total_cod_owed: 0, is_active: false, approval_status: 'pending', approval_requested_at: '2026-05-10T08:00:00Z', created_at: '2026-05-10T08:00:00Z', updated_at: '2026-05-10T08:00:00Z' },
];
const reviewPickups = [
  { id: 'pk_review_001', code: 'PK-2001', reference_code: 'AHM-9001', client_id: 'cl_ahmed_store', branch_id: 'br_cairo_hq', order_type: 'forward', submission_source: 'merchant_portal', review_status: 'pending_review', recipient: { name: { ar: 'ياسمين فؤاد', en: 'Yasmin Fouad' }, phone_primary: '+201019998877' }, delivery_address: { governorate_id: 'gov_c', city: 'القاهرة', district: 'الدقي', street: 'شارع التحرير', full_address_ar: 'التحرير، الدقي، الجيزة', full_address_en: 'Tahrir St, Dokki, Giza' }, description: { ar: 'سنيكرز بنات', en: 'Sneakers — kids' }, weight_kg: 0.9, pieces_count: 1, is_fragile: false, allow_open_package: true, cod_amount: 65000, shipping_fee: 6000, status: 'pending', status_history: [{ status: 'pending', timestamp: '2026-05-09T11:00:00Z', note: 'Submitted via merchant portal' }], created_at: '2026-05-09T11:00:00Z', updated_at: '2026-05-09T11:00:00Z' },
  { id: 'pk_review_002', code: 'PK-2002', reference_code: 'NF-7711', client_id: 'cl_nour_fashion', branch_id: 'br_cairo_hq', order_type: 'exchange', submission_source: 'shopify', review_status: 'pending_review', recipient: { name: { ar: 'محمود سيف', en: 'Mahmoud Seif' }, phone_primary: '+201112223344' }, delivery_address: { governorate_id: 'gov_c', city: 'القاهرة', district: 'مدينة نصر', street: 'شارع مكرم عبيد', full_address_ar: 'مكرم عبيد، مدينة نصر', full_address_en: 'Makram Ebeid, Nasr City' }, description: { ar: 'استبدال مقاس فستان', en: 'Dress size exchange' }, weight_kg: 0.5, pieces_count: 1, is_fragile: false, allow_open_package: true, cod_amount: 0, shipping_fee: 4000, status: 'pending', status_history: [{ status: 'pending', timestamp: '2026-05-10T07:45:00Z', note: 'Shopify webhook intake' }], created_at: '2026-05-10T07:45:00Z', updated_at: '2026-05-10T07:45:00Z' },
  { id: 'pk_review_003', code: 'PK-2003', reference_code: 'TH-204', client_id: 'cl_tech_hub', branch_id: 'br_cairo_hq', order_type: 'forward', submission_source: 'csv_import', review_status: 'pending_review', recipient: { name: { ar: 'سامح وليم', en: 'Sameh William' }, phone_primary: '+201234445566' }, delivery_address: { governorate_id: 'gov_gz', city: 'الجيزة', district: '6 أكتوبر', street: 'الحي 12', full_address_ar: 'الحي 12، 6 أكتوبر، الجيزة', full_address_en: '12th District, 6 October, Giza' }, description: { ar: 'سماعة بلوتوث', en: 'Bluetooth headset' }, weight_kg: 0.3, pieces_count: 1, is_fragile: true, allow_open_package: false, cod_amount: 195000, shipping_fee: 7500, status: 'pending', status_history: [{ status: 'pending', timestamp: '2026-05-10T09:20:00Z', note: 'CSV bulk import' }], created_at: '2026-05-10T09:20:00Z', updated_at: '2026-05-10T09:20:00Z' },
];

const JSONB = {
  governorates: ['name'], cities: ['name'], districts: ['name'], zones: ['name'],
  branches: ['name', 'location'], users: ['name'],
  clients: ['name', 'business_name', 'pickup_address', 'payment_terms'],
  client_shipping_rates: ['weight_tier'],
  pickups: ['recipient', 'delivery_address', 'description', 'status_history'],
  stock_items: ['name', 'description', 'locked_reason', 'unlock_reason'],
  stock_movements: ['reason'], price_list_entries: ['weight_tier'],
};
const ARRAYS = {
  zones: ['governorate_ids', 'branch_ids'], branches: ['coverage_governorate_ids'],
  cod_dues: ['pickup_ids'], return_manifests: ['pickup_ids'],
};

const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const sqlArray = (arr) => (arr && arr.length ? 'array[' + arr.map(q).join(',') + ']::text[]' : "'{}'::text[]");

function val(table, col, v) {
  if (v === null || v === undefined) return 'null';
  if ((JSONB[table] || []).includes(col)) return q(JSON.stringify(v)) + '::jsonb';
  if ((ARRAYS[table] || []).includes(col)) return sqlArray(v);
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return q(v);
}

function rows(table, arr) {
  if (!arr.length) return '';
  let out = `\n-- ${table} (${arr.length})\n`;
  for (const o of arr) {
    const cols = Object.keys(o);
    const vals = cols.map((c) => val(table, c, o[c]));
    out += `insert into public.${table} (${cols.map((c) => '"' + c + '"').join(', ')}) values (${vals.join(', ')}) on conflict (id) do nothing;\n`;
  }
  return out;
}

const branchesData = load('branches');
const branchesNoMgr = branchesData.map((b) => { const c = { ...b }; delete c.manager_id; return c; });

let sql = '-- 0013_seed — generated by scripts/gen-seed.js from data/mock/*.json. Re-runnable.\n';
sql += rows('governorates', load('governorates'));
sql += rows('cities', load('cities'));
sql += rows('districts', load('districts'));
sql += rows('zones', load('zones'));
// branches before users but defer manager_id (FK -> users, circular).
sql += rows('branches', branchesNoMgr);
sql += rows('users', load('users'));
sql += '\n-- link branch managers + admin branch (deferred circular FKs)\n';
for (const b of branchesData) if (b.manager_id) sql += `update public.branches set manager_id = ${q(b.manager_id)} where id = ${q(b.id)};\n`;
sql += `update public.users set branch_id = 'br_cairo_hq' where id = 'u_nagui';\n`;
sql += rows('clients', load('clients').concat(pendingClients));
sql += rows('client_shipping_rates', load('client-rates'));
sql += rows('awb_codes', load('awb-codes'));
sql += rows('pickups', load('pickups').concat(reviewPickups));
sql += rows('driver_shifts', load('driver-shifts'));
sql += rows('cod_dues', load('cod-dues'));
sql += rows('cash_requests', load('cash-requests'));
sql += rows('stock_items', load('stock'));
sql += rows('stock_movements', load('stock-movements'));
sql += rows('price_list_entries', load('prices'));
sql += rows('return_manifests', load('returns'));

// Advance pickup sequence above any seeded pk_NNNN numeric id.
const allPk = load('pickups').concat(reviewPickups).map((p) => parseInt(String(p.id).replace(/\D/g, ''), 10)).filter(Number.isFinite);
const maxPk = Math.max(0, ...allPk);
sql += `\nselect setval('public.pickup_seq', ${Math.max(maxPk, 1000)}, true);\n`;

fs.writeFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '0013_seed.sql'), sql);
console.log('Wrote 0013_seed.sql —', sql.split('\n').filter((l) => l.startsWith('insert')).length, 'inserts; maxPk=', maxPk);
