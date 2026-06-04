-- 0002_geography — governorates, cities, districts, zones.

create table public.governorates (
  id            text primary key,
  name          jsonb not null check (public.is_bilingual(name)),
  code          text not null,
  is_active     boolean not null default true,
  display_order integer not null default 0
);

create table public.cities (
  id              text primary key,
  name            jsonb not null check (public.is_bilingual(name)),
  code            text not null,
  governorate_id  text not null references public.governorates(id),
  is_active       boolean not null default true,
  display_order   integer not null default 0
);
create index on public.cities (governorate_id);

create table public.districts (
  id         text primary key,
  name       jsonb not null check (public.is_bilingual(name)),
  code       text not null,
  city_id    text not null references public.cities(id),
  is_active  boolean not null default true
);
create index on public.districts (city_id);

create table public.zones (
  id               text primary key,
  name             jsonb not null check (public.is_bilingual(name)),
  code             text not null,
  governorate_ids  text[] not null default '{}',
  branch_ids       text[] not null default '{}',
  color            text,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger zones_touch before update on public.zones
  for each row execute function public.set_updated_at();
