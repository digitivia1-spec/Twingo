-- 0001_base — shared helpers used by every subsequent migration.
-- updated_at auto-touch trigger function.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Convenience: assert a jsonb value carries both bilingual keys.
create or replace function public.is_bilingual(v jsonb)
returns boolean
language sql
immutable
as $$
  select v ? 'ar' and v ? 'en';
$$;
