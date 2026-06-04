-- 0005_clients — merchants. Soft-delete + approval gate.

create table public.clients (
  id                    text primary key,
  name                  jsonb not null check (public.is_bilingual(name)),
  business_name         jsonb,
  phone_primary         text not null,
  phone_secondary       text,
  email                 text,
  pickup_address        jsonb not null,
  preferred_branch_id   text references public.branches(id),
  tax_number            text,
  commercial_register   text,
  payment_terms         jsonb not null,
  total_orders          integer not null default 0,
  total_cod_owed        bigint not null default 0,
  is_active             boolean not null default true,
  approval_status       text check (approval_status in ('pending','approved','rejected')),
  approval_requested_at timestamptz,
  approved_at           timestamptz,
  approved_by           text,
  rejection_reason      text,
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            text,
  updated_by            text,
  deleted_at            timestamptz,
  deleted_by            text
);
create index on public.clients (preferred_branch_id);
create index on public.clients (approval_status);
create trigger clients_touch before update on public.clients
  for each row execute function public.set_updated_at();
