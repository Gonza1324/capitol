alter table public.tasks
add column if not exists origin_type text,
add column if not exists origin_id uuid,
add column if not exists completed_at timestamptz;

create index if not exists tasks_client_id_idx on public.tasks (client_id) where deleted_at is null;
create index if not exists tasks_status_idx on public.tasks (status) where deleted_at is null;
create index if not exists tasks_due_date_idx on public.tasks (due_date) where deleted_at is null;
create index if not exists task_assignees_user_id_idx on public.task_assignees (user_id);
