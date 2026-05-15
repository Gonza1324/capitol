create table public.internal_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  notes text,
  event_type text not null default 'meeting',
  status text not null default 'scheduled',
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  location text,
  meeting_url text,
  client_id uuid references public.clients(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  stakeholder_id uuid references public.stakeholders(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  interaction_id uuid references public.interactions(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  visibility text not null default 'internal',
  source text not null default 'internal',
  external_provider text,
  external_event_id text,
  external_calendar_id text,
  sync_status text not null default 'not_synced',
  last_synced_at timestamptz,
  recurrence_rule text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint internal_calendar_events_type_check check (event_type in ('call', 'meeting', 'internal_meeting', 'reminder', 'task_deadline', 'follow_up', 'report_due', 'alert_follow_up', 'other')),
  constraint internal_calendar_events_status_check check (status in ('scheduled', 'completed', 'cancelled', 'postponed')),
  constraint internal_calendar_events_source_check check (source in ('internal', 'google')),
  constraint internal_calendar_events_sync_status_check check (sync_status in ('not_synced', 'synced', 'sync_error', 'external_only')),
  constraint internal_calendar_events_visibility_check check (visibility in ('internal')),
  constraint internal_calendar_events_dates_check check (end_at is null or end_at >= start_at)
);

create index if not exists internal_calendar_events_start_idx
on public.internal_calendar_events (start_at)
where deleted_at is null;

create index if not exists internal_calendar_events_client_idx
on public.internal_calendar_events (client_id)
where deleted_at is null;

create index if not exists internal_calendar_events_assigned_to_idx
on public.internal_calendar_events (assigned_to)
where deleted_at is null;

create index if not exists internal_calendar_events_task_idx
on public.internal_calendar_events (task_id)
where deleted_at is null;

create trigger internal_calendar_events_updated_at
before update on public.internal_calendar_events
for each row execute function public.set_updated_at();

alter table public.internal_calendar_events enable row level security;

create policy "internal calendar events"
on public.internal_calendar_events
for all
using (public.is_internal_user())
with check (public.is_internal_user());
