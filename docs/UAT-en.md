# 🧪 UAT script — Twingo

**URL:** `https://twingo-demo.digitivia.com`
**Password for all demo logins:** `Twingo2026`

| Role | Email |
|---|---|
| Super admin | `nagui@twinjo.com` |
| Manager | `mohamed@twinjo.com` |
| Finance | `nour@twinjo.com` |
| Warehouse | `youssef@twinjo.com` |
| Driver | `ahmed.driver@twinjo.com` |
| Customer support | `support@twinjo.com` |

## 1 · Basics
- Log in as each role → the sidebar shows only what that role should see.
- Toggle **AR / EN** (sidebar) → layout flips RTL/LTR, everything translated.
- Click **"Take a tour"** (sidebar) → the step-by-step walkthrough highlights each area.

## 2 · Order lifecycle (core flow) — as super_admin/manager
- **Pickups → New** → create a shipment (recipient, address, COD) → it appears in the list.
- **Pickups → Import** → download the **Excel template**, fill a couple rows, upload → the preview flags bad rows before import → import.
- Open a pending pickup → **Dispatch** to a driver + vehicle → status updates, history records it.
- **Track** page (and public `…/track`) → search the code → see the status timeline.

## 3 · Approvals & notifications
- **New Orders** → Approve / Reject a merchant order (reject asks for a reason).
- **Pending Clients** → Approve / Reject a new merchant.
- Top-bar **🔔 bell** → pending counts + recent activity; links jump to each queue.

## 4 · Finance — as `nour@twinjo.com`
- **Cash Requests** → Approve → then mark **Paid** (method + reference).
- **COD** → **Schedule** a payout date, then **Pay client** → check the WhatsApp confirmation preview.

## 5 · Customer support (read-only) — as `support@twinjo.com`
- Log in → confirm it can view **orders, tracking, client data, and COD status** to answer customer inquiries.
- Confirm it has **no** edit / approve / pay / user-management buttons (read-only).

## 6 · Staff management — as `nagui@twinjo.com` (admin only)
- **Staff → Add staff** → create a user (role + branch + password) → appears in the list. Note the **Customer support** role is available.
- **Edit** a user, **Reset password**, **Deactivate/Activate**.
- Log in as a non-admin (e.g. finance) → confirm Add/Edit controls are **hidden**.

## 7 · Reports & feedback
- **Reports** → open each report, change the date range.
- Hover any element → click the 💬 pin to leave feedback (reaches you by email).

## ✅ Ask the customer to confirm
- Arabic wording/terminology is correct.
- The order lifecycle matches their real operations.
- COD/payout math is correct.
- Any missing statuses or fields.
