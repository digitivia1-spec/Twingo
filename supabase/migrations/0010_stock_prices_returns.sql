-- 0010 — stock items + movements, global price list, return manifests.

create table public.stock_items (
  id                     text primary key,
  sku                    text not null,
  name                   jsonb not null check (public.is_bilingual(name)),
  description            jsonb,
  category               text,
  branch_id              text not null references public.branches(id),
  quantity               integer not null default 0,
  unit                   text not null check (unit in ('piece','box','kg')),
  status                 text not null check (status in ('available','locked','in_transit','reserved')),
  locked_at              timestamptz,
  locked_by              text,
  locked_reason          jsonb,
  unlocked_at            timestamptz,
  unlocked_by            text,
  unlock_reason          jsonb,
  reserved_for_pickup_id text,
  reserved_at            timestamptz,
  last_movement_at       timestamptz not null default now(),
  client_id              text references public.clients(id),
  barcode                text,
  thumbnail_url          text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  deleted_at             timestamptz,
  deleted_by             text
);
create index on public.stock_items (branch_id);
create index on public.stock_items (status);
create trigger stock_items_touch before update on public.stock_items
  for each row execute function public.set_updated_at();

create table public.stock_movements (
  id                text primary key,
  stock_item_id     text not null references public.stock_items(id),
  type              text not null check (type in
                      ('transfer','intake','outbound','lock','unlock','adjustment')),
  from_branch_id    text,
  to_branch_id      text,
  quantity          integer not null,
  reason            jsonb,
  user_id           text,
  "timestamp"       timestamptz not null default now(),
  related_pickup_id text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on public.stock_movements (stock_item_id);
create trigger stock_movements_touch before update on public.stock_movements
  for each row execute function public.set_updated_at();

create table public.price_list_entries (
  id                       text primary key,
  from_governorate_id      text not null references public.governorates(id),
  to_governorate_id        text not null references public.governorates(id),
  weight_tier              jsonb not null,
  base_price               bigint not null,
  cod_handling_fee_percent numeric,
  fragile_surcharge        bigint,
  is_active                boolean not null default true
);

create table public.return_manifests (
  id                       text primary key,
  code                     text not null,
  client_id                text not null references public.clients(id),
  branch_id                text not null references public.branches(id),
  pickup_ids               text[] not null default '{}',
  status                   text not null check (status in
                             ('draft','in_transit','delivered_to_merchant','acknowledged')),
  expected_delivery_date   text,
  delivered_at             timestamptz,
  acknowledged_at          timestamptz,
  acknowledged_by_signature text,
  total_pieces             integer not null default 0,
  total_value              bigint not null default 0,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create trigger return_manifests_touch before update on public.return_manifests
  for each row execute function public.set_updated_at();
