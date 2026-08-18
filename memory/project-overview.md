---
name: project-overview
description: What the Nandagopala Rice Mill inventory app is and its core data model
metadata:
  type: project
---

App for **Nandagopala Rice Mill** — a rice inventory manager (Next.js App Router + TypeScript + Tailwind + Supabase). Located at `d:\Kushal Applications\Stock Inventory`.

Core model (decided over several iterations):
- **Rice only** — no product selector.
- Stock organised by **bag weight in kg** (e.g. 25kg, 50kg, 22kg bags) plus a **loose** kind measured directly in kg. No "cases", no price/rate.
- Every transaction has a **dealer** (required), is inward or outward; one shared dealer list.
- Outward must pick an existing weight bucket and is **blocked if stock is insufficient** (checked in the create server action).
- Stock is always **derived from transactions** via SQL views (`stock_by_weight`, `dealer_stock`, `current_stock`) — never a manual field.
- `transactions.bill_no` (identity) drives printable **B&W bills** at `/bill/[bill]`.
- `activity_log` table records timestamped create/delete events for the **History** page (snapshots survive transaction deletion).

Whenever the data model changes, the user must **re-run `supabase/schema.sql`** (it drops & recreates tables). See [[supabase-auth-disabled]].
