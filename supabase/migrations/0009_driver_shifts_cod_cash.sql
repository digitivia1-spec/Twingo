-- 0009 — driver shift reconciliation, COD settlements, merchant cash requests.

create table public.driver_shifts (
  id               text primary key,
  driver_id        text not null references public.users(id),
  branch_id        text not null references public.branches(id),
  shift_date       text not null,
  orders_assigned  integer not null default 0,
  orders_delivered integer not null default 0,
  orders_returned  integer not null default 0,
  orders_cancelled integer not null default 0,
  orders_refused   integer not null default 0,
  expected_cash    bigint not null default 0,
  actual_cash      bigint not null default 0,
  variance         bigint not null default 0,
  status           text not null check (status in
                     ('pending','reconciled','approved','paid_out','disputed')),
  reconciled_at    timestamptz,
  reconciled_by    text,
  approved_at      timestamptz,
  approved_by      text,
  paid_out_at      timestamptz,
  paid_out_by      text,
  variance_reason  text,
  dispute_reason   text,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index on public.driver_shifts (branch_id);
create index on public.driver_shifts (driver_id);
create trigger driver_shifts_touch before update on public.driver_shifts
  for each row execute function public.set_updated_at();

create table public.cod_dues (
  id                      text primary key,
  code                    text not null,
  client_id               text not null references public.clients(id),
  accrual_period_start    text,
  accrual_period_end      text,
  pickup_ids              text[] not null default '{}',
  orders_count            integer not null default 0,
  gross_cod_collected     bigint not null default 0,
  shipping_fees_deducted  bigint not null default 0,
  other_deductions        bigint not null default 0,
  deductions_notes        text,
  net_amount_due          bigint not null default 0,
  status                  text not null check (status in ('pending','scheduled','paid','disputed')),
  scheduled_payout_date   text,
  payment_method          text check (payment_method in
                            ('cash','bank_transfer','instapay','vodafone_cash','fawry')),
  payment_reference       text,
  paid_at                 timestamptz,
  paid_by                 text,
  whatsapp_sent_at        timestamptz,
  whatsapp_template_used  text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index on public.cod_dues (client_id);
create trigger cod_dues_touch before update on public.cod_dues
  for each row execute function public.set_updated_at();

create table public.cash_requests (
  id                text primary key,
  code              text not null,
  client_id         text not null references public.clients(id),
  requested_amount  bigint not null,
  requested_method  text check (requested_method in
                      ('cash','bank_transfer','instapay','vodafone_cash','fawry')),
  bank_account      text,
  comment           text,
  status            text not null check (status in ('pending','approved','rejected','paid')),
  approved_at       timestamptz,
  approved_by       text,
  rejection_reason  text,
  paid_at           timestamptz,
  paid_by           text,
  payment_reference text,
  cod_due_id        text references public.cod_dues(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on public.cash_requests (client_id);
create trigger cash_requests_touch before update on public.cash_requests
  for each row execute function public.set_updated_at();
