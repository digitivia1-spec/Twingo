# Twingo — Improvement Plan

_After our first client meeting + walkthrough of the existing tuyingo.com back-office and merchant portal, plus a regional competitive scan (Bosta, Mylerz, ShipBlu, Aramex, Fetchr, J&T Egypt). This is the punch list we are working from._

> **Positioning lock-in:** Twingo is a **courier operator** (own fleet + branches) — not a SaaS for couriers. Our tool is internal ops (back office) + a merchant-facing portal. Same shape as Bosta.

---

## 1 · What the existing tool does well (preserve)

| Capability | Why it matters |
| --- | --- |
| AWB code pool ("Available Codes") | Enables sequential, branch-prefixed waybill numbers — keep. |
| Per-merchant custom shipping rates (`/client_shipping_cost/{id}`) | Big merchants negotiate. Industry standard. |
| Cash-withdrawal request queue (`/cash_requests`) | Merchant-initiated payout flow — solid pattern. |
| Un-approved client queue | Compliance-friendly merchant onboarding. |
| Multiple order types (Forward, Exchange, Refund, Pickup, Return-to-shipper, Damage, Lost, Transit, Partial-Receive, Return-Warehouse, Item-with-driver, Partial Returned) | Real-world ops needs more than just "delivery." Worth keeping the breadth. |
| Bulk CSV import + Zamit + **Shopify** integration | Merchant onboarding wins are downstream of this. |
| Print run sheet · driver code sheet · refund sheet | Drivers still operate on paper. Don't drop. |
| Bulk export (Copy / Excel / CSV / PDF / Print) | Finance & ops live in spreadsheets. |
| Per-merchant order list with status counters | Merchants want a single-screen pulse. |

## 2 · Critical issues in the existing tool

| # | Issue | Impact |
| --- | --- | --- |
| 1 | **47 order statuses** with duplicates ("Couldn't Reach Client" appears 7+ times), typos ("Faild", "DUPLICATED", "wearhouse maaaaadi"), branch suffixes baked into names ("Preparing (maadi)", "Preparing (nasrcity)") | Reporting is unusable. Drivers/agents pick the wrong status. Power-BI/exports are noise. |
| 2 | **Driver list is overloaded** — ~150 entries, but many are finance accounts (`حسابات …`), warehouse aliases ("Received at wearhouse maaaaadi", "Returned to shepar"), or zone names ("tuyingo دلتا وقنال اسكندرية") | The "Driver" entity does triple duty as person, route, and ledger account. Settlement & dispatch logic both suffer. |
| 3 | **No public tracking page** for end-customers | Customers ping the merchant; merchant pings the operator. Bosta/ShipBlu both ship branded tracking pages out of the box. |
| 4 | **No driver mobile/tablet app** with barcode scan, POD photo, signature capture | Industry table stakes. ShipBlu's AutoPilot rides on this data. Without it: no live tracking, no real failure-reason data. |
| 5 | **i18n breakage** — untranslated keys leaking into UI ("main.add stock"). Title typos ("Driviers", "Creat Client", "SCV"). | Erodes trust on screen demos. |
| 6 | **Cities table is a dumping ground** — governorates ("Cairo", "Giza"…) mixed with sub-zones ("DWAHY_ ELKAHERA", "BALTEM"). | Pricing tiers and coverage logic break against this. |
| 7 | **No structured status timeline** on orders. Status events exist but lack reason codes (e.g. why was it "Couldn't Reach Client" — wrong number? not home? phone off?). | We can't drive automated rescheduling or customer-experience analytics. |
| 8 | **Counter-only dashboard** — no charts, no trend, no aging. | Operators are flying blind on success-rate trends and COD aging. |
| 9 | **No notifications log** — WhatsApp template usage is implicit | Disputes ("you didn't tell me about delivery") cannot be evidenced. |
| 10 | **Returns workflow** lacks merchant-side acknowledgment / signature | Both merchants and ops want a paper trail. |

## 3 · Competitive read (MENA last-mile)

| Competitor | Differentiator we should match | Differentiator we can leapfrog |
| --- | --- | --- |
| **Bosta** | Smart stickers (sticker ↔ order), digital wallet, deep Shopify app, SMS/email notifications | Wallet + tracking polish · we can win on **first-attempt success rate transparency** |
| **ShipBlu** | AutoPilot AI for routing & failure prediction; warehousing/fulfillment | We can win on **multi-branch ops UI** (they're warehouse-centric) |
| **Mylerz** | Door-to-door / D2C / C2D / C2C flows; multi-method COD (cash, card-on-delivery, mobile wallets, prepaid) | We can win on **per-merchant accounting** (custom rates already in our model) |
| **Aramex / Fetchr / J&T** | Brand trust, B2B contracts | We can win on **Egyptian governorate-aware UX** + **bilingual RTL polish** |

## 4 · What our repo already has

Pages live: `/`, `/pickup` (list/detail/new), `/finance`, `/cod`, `/stock`, `/branches`, `/prices`, `/returns`, `/provinces`. Data models defined for: Governorate, Branch, User (incl. drivers), Client, Pickup, DriverShift, CodDue, StockItem, StockMovement, PriceListEntry, ReturnManifest. Bilingual AR/EN with RTL. Mock data layer + Tanstack Query + shadcn-style components.

**What's missing that this plan adds (P0 below).**

## 5 · Roadmap — prioritized

### P0 — ship now (this iteration, in this PR)

1. **`/clients`** — merchant directory, with COD owed, ship-amount link, status, branch.
2. **`/drivers`** — driver directory, last shift summary, vehicle, branch.
3. **`/users`** — staff/employee directory with roles.
4. **`/track/[code]`** — public, no-auth tracking page with status timeline + ETA. Branded for end-customers.
5. **Sidebar update** + AR/EN strings for the above.

### P1 — next iteration

6. **Status reason codes** — extend `PickupStatusEvent` with `reason_code` enum (wrong_number, not_home, refused, address_wrong, holiday, weather…). Drives auto-reschedule policy.
7. **AWB code pool UI** — sequential, branch-prefixed reservation.
8. **CSV bulk import for pickups** — with Egyptian phone + governorate validation, error report download.
9. **Cash request workflow** — merchant requests payout, finance approves & links to CodDue.
10. **Notifications log** — every WhatsApp/SMS sent, with template id, status, retry.
11. **Reports module** — orders by status, driver perf, income, money-txn, history.
12. **Run sheet print** view (driver-friendly, large fonts, scannable barcodes).
13. **Driver mobile dashboard** (web responsive) — assigned pickups, scan-to-update, mark delivered, capture reason code + photo.

### P2 — phase 2

14. **Merchant self-service portal** at `/m/*` (separate route group from back-office).
15. **Route optimization** stub — even a "group by district" first pass beats nothing.
16. **Shopify integration** stub — install URL + webhook handler scaffold.
17. **Tracking notifications outbound** — WhatsApp template send on status change.
18. **Returns acknowledgment signature capture** in merchant portal.

## 6 · Status taxonomy — proposed clean list

Replace the 47-status sprawl with **8 canonical statuses** + a separate `reason_code` field:

`pending` · `dispatched` · `out_for_delivery` · `delivered` · `partially_delivered` · `returned` · `cancelled` · `refused`

Reason codes (free-form per-status, but enum-controlled):
- `not_home`, `wrong_number`, `address_wrong`, `customer_refused`, `package_damaged`, `holiday`, `weather`, `out_of_zone`, `customer_rescheduled`, `merchant_cancelled`.

Branch is its own field (already modelled). Don't bake branch names into status labels.

## 7 · Risks & assumptions

- Migration off the 47-status sprawl is the most painful part — needs a mapping table from legacy → new + a one-shot data migration. Plan this as a P1 task with the client present.
- The driver-list cleanup also needs the client in the room — they currently use it as a ledger.
- We assume the current Next.js + mock-data scaffold remains the implementation track; switching to Supabase is queued behind feature parity.

---

_Document owner: Digitivia_
