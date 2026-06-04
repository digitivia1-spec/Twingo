-- 0011_rls — enable RLS on every table and add per-role policies.
-- Pattern per table: one broad SELECT policy (readers) + one FOR ALL policy
-- (writers; permissive OR with the read policy never broadens reads because
-- writers are always a subset of readers).
--
-- Roles: super_admin/admin (full), manager (branch-scoped), warehouse
-- (read pickups+stock, write stock), driver (read own pickups, write own
-- status events), finance (read all, write cod_dues + cash_requests).

-- ── Privileges (RLS still gates every row) ───────────────────────────────
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated, anon;

-- ── geography + price reference data: read-all, admin-write ──────────────
do $$
declare t text;
begin
  foreach t in array array['governorates','cities','districts','zones','price_list_entries','client_shipping_rates']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %I on public.%I for select to authenticated using (true);', t||'_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());', t||'_write', t);
  end loop;
end $$;

-- ── branches ─────────────────────────────────────────────────────────────
alter table public.branches enable row level security;
create policy branches_read on public.branches for select to authenticated using (true);
create policy branches_write on public.branches for all to authenticated
  using (public.is_admin() or (public.current_user_role() = 'manager' and id = public.current_user_branch()))
  with check (public.is_admin() or (public.current_user_role() = 'manager' and id = public.current_user_branch()));

-- ── users ────────────────────────────────────────────────────────────────
alter table public.users enable row level security;
create policy users_read on public.users for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('finance','warehouse')
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch())
  or id = public.current_user_id()
);
create policy users_write on public.users for all to authenticated
  using (public.is_admin() or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()))
  with check (public.is_admin() or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));

-- ── clients ──────────────────────────────────────────────────────────────
alter table public.clients enable row level security;
create policy clients_read on public.clients for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('finance','warehouse','driver')
  or (public.current_user_role() = 'manager' and preferred_branch_id = public.current_user_branch())
);
create policy clients_write on public.clients for all to authenticated
  using (public.is_admin() or (public.current_user_role() = 'manager' and preferred_branch_id = public.current_user_branch()))
  with check (public.is_admin() or (public.current_user_role() = 'manager' and preferred_branch_id = public.current_user_branch()));

-- ── awb_batches + awb_codes ──────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['awb_batches','awb_codes']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($f$create policy %I on public.%I for select to authenticated using (
      public.is_admin() or public.current_user_role() in ('finance','warehouse')
      or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));$f$, t||'_read', t);
    execute format($f$create policy %I on public.%I for all to authenticated
      using (public.is_admin() or public.current_user_role() = 'warehouse'
        or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()))
      with check (public.is_admin() or public.current_user_role() = 'warehouse'
        or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));$f$, t||'_write', t);
  end loop;
end $$;

-- ── pickups ──────────────────────────────────────────────────────────────
alter table public.pickups enable row level security;
create policy pickups_read on public.pickups for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('finance','warehouse')
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch())
  or (public.current_user_role() = 'driver' and driver_id = public.current_user_id())
);
create policy pickups_write on public.pickups for all to authenticated
  using (public.is_admin() or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()))
  with check (public.is_admin() or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));

-- ── pickup_status_events (driver writes own) ─────────────────────────────
alter table public.pickup_status_events enable row level security;
create policy pse_read on public.pickup_status_events for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('finance','warehouse')
  or exists (select 1 from public.pickups p where p.id = pickup_status_events.pickup_id and (
       (public.current_user_role() = 'manager' and p.branch_id = public.current_user_branch())
       or (public.current_user_role() = 'driver' and p.driver_id = public.current_user_id())))
);
create policy pse_write on public.pickup_status_events for all to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.pickups p where p.id = pickup_status_events.pickup_id and (
         (public.current_user_role() = 'manager' and p.branch_id = public.current_user_branch())
         or (public.current_user_role() = 'driver' and p.driver_id = public.current_user_id()))))
  with check (
    public.is_admin()
    or exists (select 1 from public.pickups p where p.id = pickup_status_events.pickup_id and (
         (public.current_user_role() = 'manager' and p.branch_id = public.current_user_branch())
         or (public.current_user_role() = 'driver' and p.driver_id = public.current_user_id()))));

-- ── driver_shifts ────────────────────────────────────────────────────────
alter table public.driver_shifts enable row level security;
create policy driver_shifts_read on public.driver_shifts for select to authenticated using (
  public.is_admin()
  or public.current_user_role() = 'finance'
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch())
  or (public.current_user_role() = 'driver' and driver_id = public.current_user_id())
);
create policy driver_shifts_write on public.driver_shifts for all to authenticated
  using (public.is_admin() or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()))
  with check (public.is_admin() or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));

-- ── cod_dues (finance writes) ────────────────────────────────────────────
alter table public.cod_dues enable row level security;
create policy cod_dues_read on public.cod_dues for select to authenticated using (
  public.is_admin()
  or public.current_user_role() = 'finance'
  or (public.current_user_role() = 'manager' and exists (
       select 1 from public.clients c where c.id = cod_dues.client_id and c.preferred_branch_id = public.current_user_branch()))
);
create policy cod_dues_write on public.cod_dues for all to authenticated
  using (public.is_admin() or public.current_user_role() = 'finance')
  with check (public.is_admin() or public.current_user_role() = 'finance');

-- ── cash_requests (finance writes) ───────────────────────────────────────
alter table public.cash_requests enable row level security;
create policy cash_requests_read on public.cash_requests for select to authenticated using (
  public.is_admin()
  or public.current_user_role() = 'finance'
  or (public.current_user_role() = 'manager' and exists (
       select 1 from public.clients c where c.id = cash_requests.client_id and c.preferred_branch_id = public.current_user_branch()))
);
create policy cash_requests_write on public.cash_requests for all to authenticated
  using (public.is_admin() or public.current_user_role() = 'finance')
  with check (public.is_admin() or public.current_user_role() = 'finance');

-- ── stock_items (warehouse writes) ───────────────────────────────────────
alter table public.stock_items enable row level security;
create policy stock_items_read on public.stock_items for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('warehouse','finance')
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch())
);
create policy stock_items_write on public.stock_items for all to authenticated
  using (public.is_admin() or public.current_user_role() = 'warehouse'
    or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()))
  with check (public.is_admin() or public.current_user_role() = 'warehouse'
    or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));

-- ── stock_movements (warehouse writes) ───────────────────────────────────
alter table public.stock_movements enable row level security;
create policy stock_movements_read on public.stock_movements for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('warehouse','finance')
  or (public.current_user_role() = 'manager' and exists (
       select 1 from public.stock_items s where s.id = stock_movements.stock_item_id and s.branch_id = public.current_user_branch()))
);
create policy stock_movements_write on public.stock_movements for all to authenticated
  using (public.is_admin() or public.current_user_role() = 'warehouse')
  with check (public.is_admin() or public.current_user_role() = 'warehouse');

-- ── return_manifests ─────────────────────────────────────────────────────
alter table public.return_manifests enable row level security;
create policy return_manifests_read on public.return_manifests for select to authenticated using (
  public.is_admin()
  or public.current_user_role() in ('finance','warehouse')
  or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch())
);
create policy return_manifests_write on public.return_manifests for all to authenticated
  using (public.is_admin() or public.current_user_role() = 'warehouse'
    or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()))
  with check (public.is_admin() or public.current_user_role() = 'warehouse'
    or (public.current_user_role() = 'manager' and branch_id = public.current_user_branch()));
