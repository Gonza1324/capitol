alter table public.report_recipients
add column if not exists name text;

alter table public.alert_recipients
add column if not exists name text;

create index if not exists reports_sent_at_idx on public.reports (sent_at) where deleted_at is null;
create index if not exists reports_status_idx on public.reports (status) where deleted_at is null;
create index if not exists report_clients_client_id_idx on public.report_clients (client_id);
create index if not exists alerts_sent_at_idx on public.alerts (sent_at) where deleted_at is null;
create index if not exists alerts_urgency_idx on public.alerts (urgency) where deleted_at is null;
create index if not exists alert_clients_client_id_idx on public.alert_clients (client_id);
