alter table public.interactions
add column if not exists description text,
add column if not exists google_calendar_event_id text,
add column if not exists google_meet_url text,
add column if not exists updated_by uuid references public.profiles(id);

alter table public.interaction_external_participants
add column if not exists stakeholder_id uuid references public.stakeholders(id) on delete set null,
add column if not exists email text;

create index if not exists interactions_date_idx on public.interactions (interaction_date) where deleted_at is null;
create index if not exists interactions_type_idx on public.interactions (type) where deleted_at is null;
create index if not exists interaction_clients_client_id_idx on public.interaction_clients (client_id);
create index if not exists interaction_internal_participants_user_id_idx on public.interaction_internal_participants (user_id);
