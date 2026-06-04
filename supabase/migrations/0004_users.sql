-- 0004_users — staff + drivers. role lives here. Linked to auth.users via auth_id.

create table public.users (
  id              text primary key,
  auth_id         uuid unique references auth.users(id) on delete set null,
  name            jsonb not null check (public.is_bilingual(name)),
  phone           text not null,
  email           text,
  role            text not null check (role in
                    ('super_admin','admin','manager','warehouse','driver','finance')),
  branch_id       text references public.branches(id),
  is_active       boolean not null default true,
  driver_code     text,
  vehicle_type    text check (vehicle_type in ('tagamoa_van','october_van','motorcycle')),
  national_id     text,
  license_number  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      text,
  updated_by      text,
  deleted_at      timestamptz,
  deleted_by      text
);
create index on public.users (branch_id);
create index on public.users (role);
create trigger users_touch before update on public.users
  for each row execute function public.set_updated_at();

-- Close the branches <-> users circular reference now that users exists.
alter table public.branches
  add constraint branches_manager_id_fkey
  foreign key (manager_id) references public.users(id);

-- ─── RLS helper functions ────────────────────────────────────────────────
-- SECURITY DEFINER so they can read public.users regardless of the caller's
-- own RLS context (avoids infinite recursion inside users policies).
create or replace function public.current_user_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public.users where auth_id = auth.uid() limit 1;
$$;

create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.users where auth_id = auth.uid() limit 1;
$$;

create or replace function public.current_user_branch()
returns text language sql stable security definer set search_path = public as $$
  select branch_id from public.users where auth_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('super_admin','admin');
$$;
