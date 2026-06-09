-- 0017_support_role — add a read-only customer-support role.
-- Support staff handle customer inquiries: view orders, tracking, clients,
-- and COD/cash status. Read-only; no writes to any operational table.

alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role = any (array['super_admin','admin','manager','warehouse','driver','finance','support']));

create policy pickups_read_support on public.pickups
  for select to authenticated using (public.current_user_role() = 'support');
create policy pse_read_support on public.pickup_status_events
  for select to authenticated using (public.current_user_role() = 'support');
create policy clients_read_support on public.clients
  for select to authenticated using (public.current_user_role() = 'support');
create policy cod_dues_read_support on public.cod_dues
  for select to authenticated using (public.current_user_role() = 'support');
create policy cash_requests_read_support on public.cash_requests
  for select to authenticated using (public.current_user_role() = 'support');
create policy users_read_support on public.users
  for select to authenticated using (public.current_user_role() = 'support');
