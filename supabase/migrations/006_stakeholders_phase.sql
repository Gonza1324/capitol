alter table public.stakeholder_clients
add column if not exists relationship_description text;

create index if not exists stakeholders_type_idx on public.stakeholders (type) where deleted_at is null;
create index if not exists stakeholders_active_idx on public.stakeholders (is_active) where deleted_at is null;
create index if not exists stakeholder_clients_client_id_idx on public.stakeholder_clients (client_id);
create index if not exists stakeholder_topics_topic_id_idx on public.stakeholder_topics (topic_id);
