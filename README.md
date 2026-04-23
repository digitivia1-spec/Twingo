# Twinjo ERP — Twingo Demo

Bilingual AR/EN, RTL-first ERP demo for **Twinjo Logistics** (Cairo). Built by **Digitivia**.

Target URL: **`https://twingo-demo.digitivia.com`**

---

## What this repo contains

- **Next.js 15.5** (App Router) + TypeScript 5.7 + Tailwind 3.4 + `next-intl`
- **Mock backend only** (Phase 1) — all state lives in `data/mock/*.json` and is mutated in-process
- **Repository pattern** — `lib/api/*` gives every entity a clean interface; swap to Supabase in Phase 3 with zero UI changes
- **RTL-first** — every spacing and layout class is logical (`ms-*` / `me-*` / `start-*` / `end-*`). Switching to EN flips direction without bugs
- **`<FeedbackPin />`** wrapping every interactive element — on hover a small pin appears; click opens the Sentry feedback dialog with tags `{ elementId, page, locale }` pre-filled and a per-element screenshot captured via `html2canvas-pro`
- **Sentry feedback relay** — `app/api/feedback/route.ts` receives the Sentry webhook and optionally emails via Resend
- **9 modules** — Dashboard, Pick Up (list/detail/new), Finance Driver (dual-control reconciliation), COD Clients (pay-out + WhatsApp preview), Stock (locked/unlock/transfer), Branches, Price List (coming-soon placeholder), Returns (coming-soon placeholder), Governorates (27 read-only)
- **Deploy-ready** — Dockerfile, PM2 `ecosystem.config.js`, Nginx config, GitHub Actions workflow that builds on CI and rsyncs the standalone bundle to the VPS

---

## Local development

Requirements: **Node 20.x**, **pnpm ≥ 9**.

```bash
# 1. Install
pnpm install

# 2. Download fonts (Cairo AR + Inter EN) into public/fonts/
pnpm add -D @fontsource/cairo @fontsource/inter
mkdir -p public/fonts/cairo public/fonts/inter
cp node_modules/@fontsource/cairo/files/cairo-arabic-400-normal.woff2  public/fonts/cairo/Cairo-Regular.woff2
cp node_modules/@fontsource/cairo/files/cairo-arabic-600-normal.woff2  public/fonts/cairo/Cairo-SemiBold.woff2
cp node_modules/@fontsource/cairo/files/cairo-arabic-700-normal.woff2  public/fonts/cairo/Cairo-Bold.woff2
cp node_modules/@fontsource/cairo/files/cairo-arabic-800-normal.woff2  public/fonts/cairo/Cairo-ExtraBold.woff2
cp node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2   public/fonts/inter/Inter-Regular.woff2
cp node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2   public/fonts/inter/Inter-Medium.woff2
cp node_modules/@fontsource/inter/files/inter-latin-600-normal.woff2   public/fonts/inter/Inter-SemiBold.woff2
cp node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2   public/fonts/inter/Inter-Bold.woff2

# 3. Copy env
cp .env.example .env.local
# → set NEXT_PUBLIC_SENTRY_DSN if you want feedback widgets working locally.

# 4. Dev server
pnpm dev
# open http://localhost:3000   — Arabic (RTL)
# open http://localhost:3000/en — English (LTR)
```

### Useful commands

```bash
pnpm dev            # dev server on :3000
pnpm build          # production build (must pass before every commit)
pnpm typecheck      # tsc --noEmit
pnpm lint           # next lint (enforces no physical CSS props via .eslintrc.json)
pnpm format         # prettier --write
pnpm start          # run the production build
```

---

## Project conventions (quick reference)

- **ALL strings** via `next-intl` — see `messages/ar.json` and `messages/en.json`. No hardcoded text anywhere.
- **Money** is stored as **piasters** (EGP × 100). Format only with `lib/format/currency.ts`.
- **Phones** validate against `/^01[0125]\d{8}$/` (see `lib/format/phone.ts`).
- **Bilingual strings** are always `{ ar, en }`. Use `pickLocale(bilingual, locale)`.
- **Logical CSS only** — `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `rounded-s-*`, `rounded-e-*`, `border-s`, `border-e`. Physical props are banned (eslint rule).
- **Every interactive element wraps in `<FeedbackPin elementId="…">`**. Add new IDs to `lib/feedback/ids.ts`.

---

## Folder structure

```
/
├── app/
│   ├── [locale]/
│   │   ├── (dashboard)/        # sidebar + topbar routes
│   │   │   ├── page.tsx         # Dashboard
│   │   │   ├── pickup/          # Pick Up (list/detail/new)
│   │   │   ├── finance/         # Finance Driver
│   │   │   ├── cod/             # COD Clients
│   │   │   ├── branches/        # Branches
│   │   │   ├── stock/           # Stock / Warehouse
│   │   │   ├── prices/          # Price List (placeholder)
│   │   │   ├── returns/         # Returns (placeholder)
│   │   │   └── provinces/       # Governorates
│   │   └── layout.tsx           # root locale layout, fonts, dir, providers
│   ├── api/feedback/            # Sentry → Resend relay
│   ├── fonts.ts                 # self-hosted Cairo + Inter
│   ├── globals.css              # design tokens + Tailwind base
│   └── robots.ts                # disallow search indexing
├── components/
│   ├── feedback/                # <FeedbackPin />, Sentry bootstrap, dev ribbon
│   ├── layout/                  # Sidebar, Topbar, PageShell
│   ├── modules/<module>/        # per-module components (DashboardContent, PickupList, …)
│   ├── providers/               # QueryProvider (React Query)
│   ├── shared/                  # DataTable, KpiCard, FilterBar, StatusBadge, …
│   └── ui/                      # shadcn-style primitives (Button, Input, Dialog, …)
├── data/mock/                   # JSON seed for all entities
├── deploy/nginx.conf            # reference Nginx site config
├── lib/
│   ├── api/                     # repository pattern — mock + supabase stubs
│   ├── constants/               # vehicles, governorates, status tones
│   ├── feedback/ids.ts          # FEEDBACK_IDS union
│   ├── format/                  # currency / date / phone / numbers
│   ├── i18n/                    # next-intl config + routing
│   ├── state/ui.ts              # Zustand UI store (sidebar)
│   ├── types/                   # TS source-of-truth for every entity
│   └── utils.ts
├── messages/                    # ar.json + en.json
├── public/fonts/                # (populated by download step above)
├── sentry.*.config.ts           # Sentry init (client/server/edge)
├── instrumentation.ts           # Next.js 15 instrumentation hook
├── ecosystem.config.js          # PM2 config for the VPS
├── Dockerfile                   # multi-stage standalone
└── .github/workflows/deploy.yml # CI → rsync → PM2 reload
```

---

## Feedback system

Two layers, both gated by `NEXT_PUBLIC_ENABLE_FEEDBACK=true`:

1. **Global Sentry widget** — bottom-start (adapts to RTL), bilingual chrome (see `components/feedback/FeedbackBootstrap.tsx`).
2. **`<FeedbackPin />` wrappers** — every button, KPI, column header, filter pill, row action, and form field. On hover a small pin appears at the top-start corner. Click opens the Sentry dialog with a per-element screenshot (via `html2canvas-pro`, not `html2canvas`) and tags `{ elementId, page, locale }`.

The **Sentry webhook** posts to `/api/feedback`. If `RESEND_API_KEY` + `FEEDBACK_EMAIL_TO` are set, the route relays a pretty HTML email with the comment, elementId, page, and a link to the Sentry issue. If not, Sentry's native email alert (Alerts → Create Alert → tag filter `feedback:true`) is the single notification path.

---

## Data architecture

- `lib/types/*.ts` defines every entity (matches `docs/schema.md` from the brief).
- `lib/api/*.ts` declares a repository interface per entity (`list`, `getById`, plus verbs: `dispatch`, `reconcile`, `payOut`, `unlock`, `transfer`, …).
- Each repository has two implementations:
  - `mock` — reads/writes the in-memory seed from `data/mock/*.json`. Page refresh resets state.
  - `supabase` — throws `not-implemented` for now. Swap in Phase 3.
- The active backend is selected by `NEXT_PUBLIC_DATA_SOURCE=mock|supabase` (default `mock`).

Business rules enforced in the mock layer (will migrate to Postgres CHECK constraints later):

- **Pickup dispatch** → only from `pending`; sets `status`, `vehicle_type`, `driver_id`, `dispatched_at` atomically.
- **Driver shift approval** → `approved_by !== reconciled_by` (dual control).
- **Stock transfer** → source/destination must differ; quantity must be available.
- **Stock unlock** → requires `unlock_reason` + `approver_id`.

---

## Deployment brief — what you (Nagui) need to do outside this repo

This repo is **deploy-ready** — the only things it can't do from inside a session are (1) provisioning a VPS and (2) editing DNS at a registrar. Here's the minimal sequence. Total time ≈ 75 min, one-time cost ≈ €4.56/month.

### A · Provision the Hetzner CX22 VPS (~15 min)

1. Sign in at **https://console.hetzner.cloud**.
2. **Settings → Security → SSH Keys → Add SSH key.** Paste the output of `cat ~/.ssh/id_ed25519_hetzner.pub` (generate one with `ssh-keygen -t ed25519 -C "nagui@digitivia" -f ~/.ssh/id_ed25519_hetzner` if you don't have one yet). Name it `nagui-laptop`.
3. **New project → `digitivia-demos` → Add server** with:
   - Location: **Falkenstein (fsn1)** — ~60ms RTT to Cairo
   - Image: **Debian 12**
   - Type: **Shared vCPU → CX22** (€3.80/mo, 2 vCPU / 4 GB / 40 GB SSD / 20 TB traffic)
   - SSH keys: ✓ the one you just added
   - Backups: **Enable** (+20% → €4.56/mo total)
   - Name: `digitivia-demos-01`
4. Note the **public IPv4 and IPv6**. You'll need them in the next two steps.

### B · DNS on OVH (~5 min to add, 10–30 min to propagate)

1. https://www.ovh.com/manager/ → Web Cloud → Domain names → `digitivia.com` → **DNS zone**.
2. **Add an entry** → `A` record:

   | Field | Value |
   |---|---|
   | Sub-domain | `twingo-demo` |
   | Target | `YOUR_HETZNER_IPv4` |
   | TTL | `60` |

3. **Add an entry** → `AAAA` record with `YOUR_HETZNER_IPv6`, same sub-domain, TTL 60.
4. Wait 5–10 min, then verify:
   ```bash
   dig twingo-demo.digitivia.com +short
   dig twingo-demo.digitivia.com AAAA +short
   ```

> **Note on spelling.** The repo uses `twingo-demo.digitivia.com` (as the user typed it, with an `n`). The client's brand is `Twinjo` (with a `j`). If you want to match the brand, do a project-wide find-and-replace of `twingo-demo` → `twinjo-demo` (`deploy/nginx.conf`, `ecosystem.config.js`, `README.md`, `.env.example`, the GitHub Actions workflow, and the Sentry webhook URL in Sentry) before first deploy.

### C · Harden the VPS (~15 min)

SSH in as `root` first, create a non-root user, disable root SSH. The exact commands are in `files/FINAL_SETUP.md` Part 2 — follow that section verbatim. Outcome:

- `nagui` user with sudo + your SSH key
- Root SSH disabled, password auth disabled
- UFW allowing only 22 / 80 / 443
- `fail2ban` running
- `unattended-upgrades` enabled

### D · Install the stack (~15 min)

As `nagui` on the VPS:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx git curl build-essential

# Node 20 via nvm (user-scoped, isolates from system Node)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20 && nvm alias default 20

corepack enable
corepack prepare pnpm@latest --activate
npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Project directory + logs
sudo mkdir -p /var/www/twingo-erp /var/log/twingo-erp
sudo chown -R nagui:nagui /var/www/twingo-erp /var/log/twingo-erp
```

### E · Nginx + SSL (~10 min)

```bash
# Copy the reference config from this repo (deploy/nginx.conf) onto the VPS
sudo cp /path/to/deploy/nginx.conf /etc/nginx/sites-available/twingo-demo
sudo ln -s /etc/nginx/sites-available/twingo-demo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# SSL (DNS must already be propagated)
sudo certbot --nginx -d twingo-demo.digitivia.com
sudo certbot renew --dry-run   # verify auto-renewal works
```

`curl -I https://twingo-demo.digitivia.com` should return **502** at this point — that's expected. It means Nginx + DNS + SSL work; we just don't have a Node app running yet.

### F · Sentry project (~5 min)

1. Sign up at https://sentry.io (free tier is fine).
2. **Create Project → Next.js → `twinjo-erp-demo`**. Copy the **DSN**.
3. **Alerts → Create Alert → Issues → "A new issue is created" with tag filter `feedback:true` → Send email to `nagui@digitivia.com`** (and anyone else on the team). Name it `Twinjo ERP — Client Feedback`.
4. (Optional) **Settings → Integrations → Webhooks → Add** with URL `https://twingo-demo.digitivia.com/api/feedback`, event `issue.created`. If you add a webhook secret, put it in `SENTRY_WEBHOOK_SECRET` on the VPS.

### G · GitHub secrets (~3 min)

Go to `https://github.com/<org>/Twingo/settings/secrets/actions` and add:

| Name | Value |
|---|---|
| `VPS_HOST` | Your Hetzner IPv4 |
| `VPS_USER` | `nagui` |
| `VPS_SSH_KEY` | Contents of a deploy-only SSH key (generate with `ssh-keygen -t ed25519 -C "gh-deploy"`, then `ssh-copy-id -i deploy_key.pub nagui@HETZNER_IP`) |
| `NEXT_PUBLIC_SENTRY_DSN` | From Sentry |
| `SENTRY_ORG` | e.g. `digitivia` |
| `SENTRY_PROJECT` | `twinjo-erp-demo` |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens → Create (scope `project:releases`) |

### H · Put the runtime env on the VPS (~2 min)

```bash
# On the VPS as nagui
cat > /var/www/twingo-erp/.env.local <<'EOF'
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_LOCALE=ar
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_SENTRY_DSN=https://xxx@oYYY.ingest.sentry.io/ZZZ
SENTRY_WEBHOOK_SECRET=
# Optional Resend relay:
RESEND_API_KEY=
FEEDBACK_EMAIL_TO=nagui@digitivia.com,feedback@digitivia.com
FEEDBACK_EMAIL_FROM=Twinjo Feedback <feedback@digitivia.com>
EOF
```

### I · First deploy (~2 min)

Push the repo to GitHub. The `deploy.yml` workflow will:

1. Check out the code on a GitHub-hosted Ubuntu runner (free, 16 GB RAM — no OOM risk).
2. Download Cairo + Inter fonts via `@fontsource/*` and copy them into `public/fonts/`.
3. Run `pnpm typecheck && pnpm build` (build happens in CI — **your VPS never sees the heavy build step**).
4. Rsync `.next/standalone/ + .next/static/ + public/ + ecosystem.config.js + package.json` to `/var/www/twingo-erp/`.
5. SSH to the VPS and run `pm2 reload twingo-erp || pm2 start ecosystem.config.js && pm2 save`.

First deploy also needs `pm2 startup` once (run the command it prints as root) so the app auto-restarts after VPS reboots.

Once green: `curl -I https://twingo-demo.digitivia.com` → **200**.

### J · Sanity-test the live demo

- Open `https://twingo-demo.digitivia.com` — should land on Arabic/RTL Dashboard.
- Switch to `/en` — layout flips to LTR, fonts swap to Inter.
- Hover any button → pin appears → click → Sentry dialog opens (bilingual chrome).
- Type a comment in Arabic, submit → you should get an email within ~60s.
- Click a KPI card → deep-links to the source module with the right filter.
- On `/pickup`, click **Dispatch** on any pending row → pick a vehicle → row updates, toast appears.
- On `/stock`, filter to **Locked** → click 🔓 → fill the unlock modal → row becomes Available.
- On `/finance`, click **Reconcile** on a pending shift → enter actual cash → row status → `reconciled`.

---

## When the client (Modther Manem) reviews

Send (bilingual, WhatsApp-ready):

```
مرحبا أستاذ عبدالمنعم 👋

بناءً على المتطلبات اللي استلمناها والاجتماع بتاع 2 أبريل، عملنا النسخة الأولى من النظام.

🔗 الرابط: https://twingo-demo.digitivia.com

كيف تترك ملاحظاتك:
• مرر الماوس فوق أي زر أو عنصر → ستظهر أيقونة دائرية زرقاء
• اضغط عليها → اكتب ملاحظتك بالعربي أو الإنجليزي
• الملاحظة تصلنا فوراً على الإيميل مع لقطة شاشة

النظام حالياً ببيانات تجريبية (Mock) — الهدف إنك تراجع الـ UX والـ workflow قبل ما نربطه بقاعدة بيانات حقيقية.

في انتظار ملاحظاتك.
ديجيتيفيا — فريق التطوير
```

---

## Phase 3 migration path (Supabase)

When the demo signs off, switch to Supabase with zero UI rewrite:

1. Create the Postgres schema matching `lib/types/*` — most fields are 1:1 mappable.
2. Fill in `lib/api/*.supabase.ts` (replace the `throw NOT_IMPLEMENTED`s).
3. Flip `NEXT_PUBLIC_DATA_SOURCE=supabase` on the VPS.
4. Keep mock as the testing backend for CI / Storybook.

No component import needs to change — every page imports from `lib/api/*` and never knows which backend is live.

---

## License

Private · Digitivia · Twinjo Logistics · 2026
