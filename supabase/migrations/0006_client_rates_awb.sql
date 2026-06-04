-- 0006 — per-client shipping rates + AWB pool.

create table public.client_shipping_rates (
  id                       text primary key,
  client_id                text not null references public.clients(id),
  from_governorate_id      text not null references public.governorates(id),
  to_governorate_id        text not null references public.governorates(id),
  weight_tier              jsonb not null,
  base_price               bigint not null,
  cod_handling_fee_percent numeric,
  fragile_surcharge        bigint,
  is_active                boolean not null default true,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on public.client_shipping_rates (client_id);
create trigger client_rates_touch before update on public.client_shipping_rates
  for each row execute function public.set_updated_at();

create table public.awb_batches (
  id            text primary key,
  branch_id     text not null references public.branches(id),
  count         integer not null,
  from_sequence integer not null,
  to_sequence   integer not null,
  generated_by  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger awb_batches_touch before update on public.awb_batches
  for each row execute function public.set_updated_at();

create table public.awb_codes (
  id                     text primary key,
  code                   text not null,
  sequence               integer not null,
  branch_id              text not null references public.branches(id),
  status                 text not null check (status in ('available','reserved','used','voided')),
  reserved_for_pickup_id text,
  reserved_at            timestamptz,
  reserved_by            text,
  used_for_pickup_id     text,
  used_at                timestamptz,
  voided_at              timestamptz,
  voided_by              text,
  voided_reason          text,
  batch_id               text,
  generated_by           text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (branch_id, sequence)
);
create index on public.awb_codes (branch_id, status);
create trigger awb_codes_touch before update on public.awb_codes
  for each row execute function public.set_updated_at();
