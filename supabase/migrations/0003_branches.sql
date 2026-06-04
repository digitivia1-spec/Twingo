-- 0003_branches — operating branches. manager_id FK added in 0004 (circular with users).

create table public.branches (
  id                        text primary key,
  name                      jsonb not null check (public.is_bilingual(name)),
  code                      text not null unique,
  governorate_id            text references public.governorates(id),
  city                      text,
  address                   text,
  phone                     text,
  manager_id                text,
  coverage_governorate_ids  text[] not null default '{}',
  is_active                 boolean not null default true,
  is_headquarters           boolean not null default false,
  location                  jsonb,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  created_by                text,
  updated_by                text
);
create trigger branches_touch before update on public.branches
  for each row execute function public.set_updated_at();
