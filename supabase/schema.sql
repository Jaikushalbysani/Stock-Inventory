-- ============================================================================
-- Nandagopala Rice Mill — Inventory schema  (RICE ONLY)
-- Run in Supabase:  Dashboard -> SQL Editor -> New query -> paste -> Run
--
-- Model:
--   * Only product is RICE.
--   * Stock is organised by BAG WEIGHT in kg (e.g. 25kg, 50kg, 22kg bags),
--     plus a LOOSE kind measured directly in kg.
--   * Every transaction is tied to a DEALER (required) and is inward or outward.
--   * No price/rate.
--   * Outward must pick a weight that already has stock (app blocks shortfalls).
--   * activity_log keeps a timestamped record of every add and removal.
--
-- NOTE: this resets earlier tables. Safe during setup.
-- ============================================================================

create extension if not exists "pgcrypto";

-- --- reset --------------------------------------------------------------
drop view  if exists public.daily_stock     cascade;
drop view  if exists public.current_stock   cascade;
drop view  if exists public.dealer_stock    cascade;
drop view  if exists public.stock_by_weight cascade;
drop table if exists public.activity_log    cascade;
drop table if exists public.transactions    cascade;
drop table if exists public.dealers         cascade;
drop table if exists public.parties         cascade;
drop table if exists public.products        cascade;

-- --- dealers ------------------------------------------------------------
create table public.dealers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  address     text,
  created_at  timestamptz not null default now()
);

-- --- transactions -------------------------------------------------------
--   kind = 'bag'  : bag_weight_kg = weight per bag, quantity = number of bags
--   kind = 'loose': bag_weight_kg = null,           quantity = kilograms
create table public.transactions (
  id            uuid primary key default gen_random_uuid(),
  bill_no       bigint generated always as identity,
  txn_date      date not null default current_date,
  type          text not null check (type in ('inward', 'outward')),
  dealer_id     uuid not null references public.dealers (id) on delete restrict,
  kind          text not null default 'bag' check (kind in ('bag', 'loose')),
  bag_weight_kg numeric(10, 2) check (bag_weight_kg is null or bag_weight_kg > 0),
  quantity      numeric(12, 2) not null check (quantity > 0),
  total_kg      numeric(14, 2) generated always as (
                  case when kind = 'bag' then bag_weight_kg * quantity else quantity end
                ) stored,
  notes         text,
  created_at    timestamptz not null default now(),
  constraint bag_needs_weight check (kind = 'loose' or bag_weight_kg is not null)
);

create unique index transactions_bill_no_idx on public.transactions (bill_no);
create index transactions_date_idx   on public.transactions (txn_date);
create index transactions_dealer_idx on public.transactions (dealer_id);
create index transactions_weight_idx on public.transactions (kind, bag_weight_kg);

-- --- activity log (timestamped audit of adds & removals) ----------------
create table public.activity_log (
  id             uuid primary key default gen_random_uuid(),
  action         text not null check (action in ('created', 'deleted')),
  transaction_id uuid,
  bill_no        bigint,
  txn_type       text,
  txn_date       date,
  dealer_name    text,
  kind           text,
  bag_weight_kg  numeric(10, 2),
  quantity       numeric(12, 2),
  total_kg       numeric(14, 2),
  notes          text,
  at             timestamptz not null default now()
);

create index activity_log_at_idx on public.activity_log (at desc);

-- --- views --------------------------------------------------------------

-- stock grouped by weight bucket (bags) and the loose bucket
create or replace view public.stock_by_weight as
select
  kind,
  bag_weight_kg,
  coalesce(sum(quantity) filter (where type = 'inward'),  0) as in_qty,
  coalesce(sum(quantity) filter (where type = 'outward'), 0) as out_qty,
  coalesce(sum(quantity) filter (where type = 'inward'),  0)
    - coalesce(sum(quantity) filter (where type = 'outward'), 0) as balance_qty,
  coalesce(sum(total_kg) filter (where type = 'inward'),  0)
    - coalesce(sum(total_kg) filter (where type = 'outward'), 0) as balance_kg
from public.transactions
group by kind, bag_weight_kg;

-- per-dealer totals (in kg)
create or replace view public.dealer_stock as
select
  d.id   as dealer_id,
  d.name as dealer_name,
  coalesce(sum(t.total_kg) filter (where t.type = 'inward'),  0) as in_kg,
  coalesce(sum(t.total_kg) filter (where t.type = 'outward'), 0) as out_kg,
  coalesce(sum(t.total_kg) filter (where t.type = 'inward'),  0)
    - coalesce(sum(t.total_kg) filter (where t.type = 'outward'), 0) as balance_kg
from public.dealers d
left join public.transactions t on t.dealer_id = d.id
group by d.id, d.name;

-- overall totals
create or replace view public.current_stock as
select
  coalesce(sum(quantity) filter (where kind = 'bag' and type = 'inward'),  0)
    - coalesce(sum(quantity) filter (where kind = 'bag' and type = 'outward'), 0) as total_bags,
  coalesce(sum(total_kg) filter (where type = 'inward'),  0)
    - coalesce(sum(total_kg) filter (where type = 'outward'), 0) as total_kg
from public.transactions;

-- --- row level security (auth disabled -> open to anon) -----------------
alter table public.dealers      enable row level security;
alter table public.transactions enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "open access" on public.dealers;
drop policy if exists "open access" on public.transactions;
drop policy if exists "open access" on public.activity_log;

create policy "open access" on public.dealers
  for all to anon, authenticated using (true) with check (true);
create policy "open access" on public.transactions
  for all to anon, authenticated using (true) with check (true);
create policy "open access" on public.activity_log
  for all to anon, authenticated using (true) with check (true);
