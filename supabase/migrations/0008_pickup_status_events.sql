-- 0008_pickup_status_events — normalized mirror of pickups.status_history.
-- The repo keeps status_history jsonb as the source of truth (mock parity) and
-- also appends a row here, so the driver RLS rule (write only own events) is real.

create table public.pickup_status_events (
  id          bigint generated always as identity primary key,
  pickup_id   text not null references public.pickups(id) on delete cascade,
  status      text not null,
  "timestamp" timestamptz not null default now(),
  user_id     text,
  note        text,
  reason_code text
);
create index on public.pickup_status_events (pickup_id);
