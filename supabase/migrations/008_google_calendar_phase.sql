create table public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  google_account_email text,
  access_token text not null,
  refresh_token text,
  token_type text,
  scope text,
  expires_at timestamptz,
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id)
);

create table public.google_calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  google_event_id text not null,
  calendar_id text not null default 'primary',
  summary text,
  description text,
  location text,
  start_at timestamptz,
  end_at timestamptz,
  start_date date,
  end_date date,
  html_link text,
  hangout_link text,
  meet_url text,
  status text,
  organizer_email text,
  attendees jsonb not null default '[]'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  client_id uuid references public.clients(id) on delete set null,
  interaction_id uuid references public.interactions(id) on delete set null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, google_event_id)
);

create index if not exists google_calendar_events_user_start_idx
on public.google_calendar_events (user_id, start_at)
where deleted_at is null;

create index if not exists google_calendar_events_client_idx
on public.google_calendar_events (client_id)
where deleted_at is null;

create index if not exists google_calendar_events_interaction_idx
on public.google_calendar_events (interaction_id)
where deleted_at is null;

create trigger google_calendar_connections_updated_at
before update on public.google_calendar_connections
for each row execute function public.set_updated_at();

create trigger google_calendar_events_updated_at
before update on public.google_calendar_events
for each row execute function public.set_updated_at();

alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_events enable row level security;

create policy "own google calendar connections"
on public.google_calendar_connections
for all
using (user_id = auth.uid() and public.is_internal_user())
with check (user_id = auth.uid() and public.is_internal_user());

create policy "internal google calendar events"
on public.google_calendar_events
for all
using (public.is_internal_user())
with check (public.is_internal_user());
