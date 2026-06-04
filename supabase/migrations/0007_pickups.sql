-- 0007_pickups — the core shipment entity. Soft-delete.
-- id/code auto-assigned by trigger when not supplied (mirrors mock nextSequence).

create sequence if not exists public.pickup_seq start with 1;

create table public.pickups (
  id                  text primary key,
  code                text not null,
  reference_code      text,
  client_id           text not null references public.clients(id),
  branch_id           text not null references public.branches(id),
  order_type          text check (order_type in
                        ('forward','exchange','refund','pickup','return_to_shipper',
                         'damage','lost','transit','partial_receive','return_warehouse',
                         'item_with_driver','partial_returned')),
  submission_source   text check (submission_source in
                        ('admin_create','merchant_portal','csv_import','shopify','zamit','api')),
  review_status       text check (review_status in ('pending_review','approved','rejected')),
  reviewed_at         timestamptz,
  reviewed_by         text,
  rejection_reason    text,
  recipient           jsonb not null,
  delivery_address    jsonb not null,
  description         jsonb not null,
  weight_kg           numeric not null default 0,
  pieces_count        integer not null default 1,
  is_fragile          boolean not null default false,
  allow_open_package  boolean not null default false,
  cod_amount          bigint not null default 0,
  shipping_fee        bigint not null default 0,
  status              text not null check (status in
                        ('pending','dispatched','out_for_delivery','delivered',
                         'partially_delivered','returned','cancelled','refused')),
  vehicle_type        text check (vehicle_type in ('tagamoa_van','october_van','motorcycle')),
  driver_id           text references public.users(id),
  dispatched_at       timestamptz,
  expected_delivery_date text,
  delivered_at        timestamptz,
  status_history      jsonb not null default '[]'::jsonb,
  internal_notes      text,
  driver_notes        text,
  customer_notes      text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          text,
  updated_by          text,
  deleted_at          timestamptz,
  deleted_by          text
);
create index on public.pickups (branch_id);
create index on public.pickups (client_id);
create index on public.pickups (driver_id);
create index on public.pickups (status);
create index on public.pickups (review_status);
create index on public.pickups (created_at);

create or replace function public.assign_pickup_code()
returns trigger language plpgsql as $$
declare n bigint;
begin
  if new.id is null or new.id = '' then
    n := nextval('public.pickup_seq');
    new.id := 'pk_' || lpad(n::text, 4, '0');
  end if;
  if new.code is null or new.code = '' then
    new.code := 'PK-' || ltrim(split_part(new.id, '_', 2), '0');
  end if;
  return new;
end;
$$;

create trigger pickups_assign_code before insert on public.pickups
  for each row execute function public.assign_pickup_code();
create trigger pickups_touch before update on public.pickups
  for each row execute function public.set_updated_at();
