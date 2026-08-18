# 🌾 Rice Mill Inventory

A daily stock-management web app for a rice mill. Track **inward** (milling
output / purchases) and **outward** (sales to dealers & customers) for each
product, all measured in **kilograms**, and see live stock plus a day-by-day
report.

Built with **Next.js (App Router) · TypeScript · Tailwind CSS · Supabase**
(Postgres + Auth).

## Features

- 🔐 Email + password login (Supabase Auth) — the whole app is behind auth.
- 📊 **Dashboard** — total stock, today's inward/outward, per-product balances,
  recent activity.
- 🔁 **Transactions** — add inward/outward entries (product, qty in kg, optional
  rate, dealer/customer, date, notes); filter and delete.
- 📅 **Daily Report** — pick any date and see Opening / Inward / Outward /
  Closing per product (closing = opening + inward − outward).
- 👥 **Dealers & Customers** — manage the parties you trade with.
- 🌾 **Products** — the 6 mill outputs (Rice, Broken Rice, Bran, Cheeru,
  Rejection, Waste); rename or add more.

## 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard go to **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
   tables, views, row-level-security policies, and seeds the 6 products.
3. (Recommended for a private internal tool) Disable public sign-ups so only you
   can create accounts: **Authentication → Providers → Email** — keep it on but
   turn **off** "Enable email confirmations" if you want instant login during
   setup, then create users from **Authentication → Users → Add user**.

## 2. Configure environment

Copy the example env file and fill in your project values (found under
**Project Settings → API**):

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to **/login**. Create an
account (or sign in with a user you added in Supabase), and you're in.

To build for production:

```bash
npm run build
npm start
```

## How stock is calculated

There is no manual "stock level" field — stock is always derived from the
transaction history, so it can't drift out of sync:

- **Current stock** (per product) = Σ inward − Σ outward (all dates).
- **Daily report** for a date `D`:
  - Opening = Σ (inward − outward) for all transactions **before** `D`
  - Inward / Outward = totals **on** `D`
  - Closing = Opening + Inward − Outward

To set a starting balance when you first go live, just add an **inward** entry
for each product with the quantity you already have in the godown.

## Project structure

```
app/
  login/                 # auth screen + server action
  auth/signout/          # sign-out route handler
  (app)/                 # authenticated area (shares the sidebar layout)
    dashboard/           # live overview
    transactions/        # add / list inward & outward
    report/              # daily opening-closing report
    parties/             # dealers & customers
    products/            # product list + rename / add
components/              # sidebar, page header
lib/
  supabase/              # browser / server / middleware clients
  types.ts               # shared TypeScript types
  format.ts              # kg & date formatting helpers
supabase/schema.sql      # run this in Supabase
middleware.ts            # route protection + session refresh
```

## Notes

- All quantities are in **kg**. The `rate` field is an optional price-per-kg
  you can use later for billing/value reports.
- Row Level Security grants full access to any authenticated user (a single
  mill team). If you later want admin vs. staff roles, that's a policy change in
  `schema.sql`.
