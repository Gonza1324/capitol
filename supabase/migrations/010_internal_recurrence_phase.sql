alter table public.tasks
  add column if not exists recurrence_interval integer not null default 1,
  add column if not exists recurrence_ends_at date,
  add column if not exists recurrence_count integer,
  add column if not exists parent_recurring_id uuid references public.tasks(id) on delete set null,
  add column if not exists generated_from_recurring_id uuid references public.tasks(id) on delete set null,
  add column if not exists next_occurrence_at date;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_recurrence_interval_positive'
  ) then
    alter table public.tasks
      add constraint tasks_recurrence_interval_positive check (recurrence_interval >= 1) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_recurrence_count_positive'
  ) then
    alter table public.tasks
      add constraint tasks_recurrence_count_positive check (recurrence_count is null or recurrence_count >= 1) not valid;
  end if;
end $$;

create index if not exists tasks_parent_recurring_idx
on public.tasks (parent_recurring_id)
where deleted_at is null;

create index if not exists tasks_generated_from_recurring_idx
on public.tasks (generated_from_recurring_id)
where deleted_at is null;

create unique index if not exists tasks_generated_occurrence_due_date_unique
on public.tasks (generated_from_recurring_id, due_date)
where generated_from_recurring_id is not null
  and due_date is not null
  and deleted_at is null;

alter table public.internal_calendar_events
  add column if not exists recurrence_interval integer not null default 1,
  add column if not exists recurrence_ends_at timestamptz,
  add column if not exists recurrence_count integer,
  add column if not exists parent_recurring_id uuid references public.internal_calendar_events(id) on delete set null,
  add column if not exists generated_from_recurring_id uuid references public.internal_calendar_events(id) on delete set null,
  add column if not exists next_occurrence_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'internal_calendar_events_recurrence_interval_positive'
  ) then
    alter table public.internal_calendar_events
      add constraint internal_calendar_events_recurrence_interval_positive check (recurrence_interval >= 1) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'internal_calendar_events_recurrence_count_positive'
  ) then
    alter table public.internal_calendar_events
      add constraint internal_calendar_events_recurrence_count_positive check (recurrence_count is null or recurrence_count >= 1) not valid;
  end if;
end $$;

create index if not exists internal_calendar_events_parent_recurring_idx
on public.internal_calendar_events (parent_recurring_id)
where deleted_at is null;

create index if not exists internal_calendar_events_generated_from_recurring_idx
on public.internal_calendar_events (generated_from_recurring_id)
where deleted_at is null;

create unique index if not exists internal_calendar_events_generated_occurrence_start_unique
on public.internal_calendar_events (generated_from_recurring_id, start_at)
where generated_from_recurring_id is not null
  and deleted_at is null;
