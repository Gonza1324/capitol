create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'partner_director', 'analyst', 'assistant', 'external_client');
create type client_status as enum ('active', 'prospect', 'paused', 'former', 'potential', 'archived');
create type client_type as enum ('company', 'chamber', 'ngo', 'person', 'public_agency', 'embassy', 'association', 'other');
create type confidentiality_level as enum ('standard', 'confidential', 'restricted');
create type fee_currency as enum ('ARS', 'USD');
create type billing_period as enum ('monthly', 'quarterly', 'annual', 'one_time', 'other');
create type interest_priority as enum ('high', 'medium', 'low');
create type task_status as enum ('pending', 'in_progress', 'in_review', 'blocked', 'completed', 'cancelled');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type interaction_type as enum ('call', 'in_person_meeting', 'important_email', 'whatsapp', 'lunch', 'presentation', 'stakeholder_meeting', 'internal_meeting', 'other');
create type report_type as enum ('weekly_report', 'monthly_report', 'political_context', 'legislative_report', 'regulatory_report', 'media_report', 'custom_report', 'executive_memo', 'urgent_alert', 'official_gazette_daily_changes');
create type report_status as enum ('draft', 'in_review', 'approved', 'sent', 'archived');
create type alert_category as enum ('legislative', 'executive', 'judicial', 'regulatory', 'media', 'provincial', 'municipal', 'international', 'other');
create type alert_urgency as enum ('low', 'medium', 'high', 'critical');
create type alert_medium as enum ('email', 'whatsapp', 'pdf', 'other');
create type stakeholder_type as enum ('official', 'legislator', 'advisor', 'chamber', 'journalist', 'union', 'ngo', 'business_person', 'regulator', 'provincial_referent', 'other');
create type stakeholder_stance as enum ('ally', 'neutral', 'opponent', 'unknown');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role user_role not null default 'analyst',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'analyst')
  );
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  status client_status not null default 'prospect',
  client_type client_type not null default 'company',
  description text,
  strategic_profile text,
  start_date date,
  end_date date,
  confidentiality_level confidentiality_level not null default 'standard',
  website text,
  drive_url text,
  general_notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.client_assignments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create table public.client_external_access (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (client_id, user_id)
);

create table public.client_fees (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  amount numeric(14,2) not null,
  currency fee_currency not null,
  billing_period billing_period not null,
  description text,
  start_date date,
  end_date date,
  is_active boolean not null default true,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  full_name text not null,
  title text,
  email text,
  whatsapp text,
  linkedin_url text,
  area text,
  relationship_role text,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  birthday date,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.industries (id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.client_industries (client_id uuid references public.clients(id) on delete cascade, industry_id uuid references public.industries(id) on delete cascade, primary key (client_id, industry_id));
create table public.interests (id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now());
create table public.client_interests (client_id uuid references public.clients(id) on delete cascade, interest_id uuid references public.interests(id) on delete cascade, priority interest_priority not null default 'medium', start_date date, end_date date, primary key (client_id, interest_id));
create table public.topics (id uuid primary key default gen_random_uuid(), name text not null unique, is_active boolean not null default true, created_at timestamptz not null default now());

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  client_id uuid references public.clients(id) on delete set null,
  status task_status not null default 'pending',
  priority task_priority not null default 'medium',
  due_date date,
  source text,
  is_recurring boolean not null default false,
  recurrence_rule text,
  comments text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.task_assignees (task_id uuid references public.tasks(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (task_id, user_id));
create table public.task_comments (id uuid primary key default gen_random_uuid(), task_id uuid references public.tasks(id) on delete cascade, body text not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), deleted_at timestamptz);

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  type interaction_type not null default 'call',
  title text not null,
  interaction_date date,
  start_time time,
  end_time time,
  location text,
  external_participants text,
  summary text,
  notes text,
  decisions text,
  risks text,
  next_steps text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.interaction_clients (interaction_id uuid references public.interactions(id) on delete cascade, client_id uuid references public.clients(id) on delete cascade, primary key (interaction_id, client_id));
create table public.interaction_internal_participants (interaction_id uuid references public.interactions(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, primary key (interaction_id, user_id));
create table public.interaction_external_participants (id uuid primary key default gen_random_uuid(), interaction_id uuid references public.interactions(id) on delete cascade, contact_id uuid references public.contacts(id) on delete set null, name text);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type report_type not null default 'custom_report',
  status report_status not null default 'draft',
  topic text,
  description text,
  sent_at timestamptz,
  responsible_id uuid references public.profiles(id),
  recipients text,
  external_url text,
  notes text,
  approval_required boolean not null default false,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  is_client_visible boolean not null default false,
  client_visible_at timestamptz,
  client_visibility_approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.report_clients (report_id uuid references public.reports(id) on delete cascade, client_id uuid references public.clients(id) on delete cascade, primary key (report_id, client_id));
create table public.report_recipients (id uuid primary key default gen_random_uuid(), report_id uuid references public.reports(id) on delete cascade, contact_id uuid references public.contacts(id) on delete set null, email text);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category alert_category not null default 'other',
  urgency alert_urgency not null default 'medium',
  description text,
  content text,
  sent_at timestamptz,
  medium alert_medium not null default 'email',
  responsible_id uuid references public.profiles(id),
  recipients text,
  attachment_url text,
  notes text,
  is_client_visible boolean not null default false,
  client_visible_at timestamptz,
  client_visibility_approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.alert_clients (alert_id uuid references public.alerts(id) on delete cascade, client_id uuid references public.clients(id) on delete cascade, primary key (alert_id, client_id));
create table public.alert_interests (alert_id uuid references public.alerts(id) on delete cascade, interest_id uuid references public.interests(id) on delete cascade, primary key (alert_id, interest_id));
create table public.alert_industries (alert_id uuid references public.alerts(id) on delete cascade, industry_id uuid references public.industries(id) on delete cascade, primary key (alert_id, industry_id));
create table public.alert_recipients (id uuid primary key default gen_random_uuid(), alert_id uuid references public.alerts(id) on delete cascade, contact_id uuid references public.contacts(id) on delete set null, email text);

create table public.stakeholders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  organization text,
  title text,
  email text,
  phone text,
  linkedin_url text,
  type stakeholder_type not null default 'other',
  political_party text,
  jurisdiction text,
  influence_area text,
  influence_level text,
  stance stakeholder_stance not null default 'unknown',
  sensitivity_level text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.stakeholder_clients (stakeholder_id uuid references public.stakeholders(id) on delete cascade, client_id uuid references public.clients(id) on delete cascade, primary key (stakeholder_id, client_id));
create table public.stakeholder_topics (stakeholder_id uuid references public.stakeholders(id) on delete cascade, topic_id uuid references public.topics(id) on delete cascade, primary key (stakeholder_id, topic_id));

create table public.files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  url text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.comments (id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, body text not null, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), deleted_at timestamptz);
create table public.activity_log (id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now());
create table public.saved_searches (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, name text not null, filters jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, type text not null, title text not null, body text, entity_type text, entity_id uuid, read_at timestamptz, created_at timestamptz not null default now());
create table public.notification_preferences (user_id uuid primary key references public.profiles(id) on delete cascade, email_enabled boolean not null default true, in_app_enabled boolean not null default true, daily_summary boolean not null default true, weekly_summary boolean not null default true, updated_at timestamptz not null default now());

create or replace function public.current_user_role()
returns user_role language sql security definer stable set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_internal_user()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(public.current_user_role() in ('admin', 'partner_director', 'analyst', 'assistant'), false)
$$;

create or replace function public.can_manage_fees()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(public.current_user_role() in ('admin', 'partner_director'), false)
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
create trigger client_fees_updated_at before update on public.client_fees for each row execute function public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger interactions_updated_at before update on public.interactions for each row execute function public.set_updated_at();
create trigger reports_updated_at before update on public.reports for each row execute function public.set_updated_at();
create trigger alerts_updated_at before update on public.alerts for each row execute function public.set_updated_at();
create trigger stakeholders_updated_at before update on public.stakeholders for each row execute function public.set_updated_at();
create trigger saved_searches_updated_at before update on public.saved_searches for each row execute function public.set_updated_at();
create trigger notification_preferences_updated_at before update on public.notification_preferences for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.client_assignments enable row level security;
alter table public.client_external_access enable row level security;
alter table public.client_fees enable row level security;
alter table public.contacts enable row level security;
alter table public.industries enable row level security;
alter table public.client_industries enable row level security;
alter table public.interests enable row level security;
alter table public.client_interests enable row level security;
alter table public.topics enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_comments enable row level security;
alter table public.interactions enable row level security;
alter table public.interaction_clients enable row level security;
alter table public.interaction_internal_participants enable row level security;
alter table public.interaction_external_participants enable row level security;
alter table public.reports enable row level security;
alter table public.report_clients enable row level security;
alter table public.report_recipients enable row level security;
alter table public.alerts enable row level security;
alter table public.alert_clients enable row level security;
alter table public.alert_interests enable row level security;
alter table public.alert_industries enable row level security;
alter table public.alert_recipients enable row level security;
alter table public.stakeholders enable row level security;
alter table public.stakeholder_clients enable row level security;
alter table public.stakeholder_topics enable row level security;
alter table public.files enable row level security;
alter table public.comments enable row level security;
alter table public.activity_log enable row level security;
alter table public.saved_searches enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

create policy "profiles read internal" on public.profiles for select using (public.is_internal_user() or id = auth.uid());
create policy "profiles update own or admin" on public.profiles for update using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "internal read clients" on public.clients for select using (public.is_internal_user());
create policy "internal create clients" on public.clients for insert with check (public.is_internal_user());
create policy "internal update clients" on public.clients for update using (public.is_internal_user());
create policy "admin delete clients" on public.clients for delete using (public.current_user_role() = 'admin');

create policy "fee read restricted" on public.client_fees for select using (public.can_manage_fees());
create policy "fee write restricted" on public.client_fees for all using (public.can_manage_fees()) with check (public.can_manage_fees());

create policy "internal read contacts" on public.contacts for select using (public.is_internal_user());
create policy "internal write contacts" on public.contacts for all using (public.is_internal_user()) with check (public.is_internal_user());

create policy "internal read tasks" on public.tasks for select using (public.is_internal_user());
create policy "internal write tasks" on public.tasks for all using (public.is_internal_user()) with check (public.is_internal_user());

create policy "own saved searches" on public.saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notifications" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own notification preferences" on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "internal read all operational tables" on public.client_assignments for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal read external access" on public.client_external_access for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');
create policy "internal industries" on public.industries for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal client industries" on public.client_industries for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal interests" on public.interests for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal client interests" on public.client_interests for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal topics" on public.topics for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal task assignees" on public.task_assignees for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal task comments" on public.task_comments for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal interactions" on public.interactions for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal interaction clients" on public.interaction_clients for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal interaction participants" on public.interaction_internal_participants for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal interaction external participants" on public.interaction_external_participants for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal reports" on public.reports for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal report clients" on public.report_clients for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal report recipients" on public.report_recipients for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal alerts" on public.alerts for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal alert clients" on public.alert_clients for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal alert interests" on public.alert_interests for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal alert industries" on public.alert_industries for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal alert recipients" on public.alert_recipients for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal stakeholders" on public.stakeholders for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal stakeholder clients" on public.stakeholder_clients for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal stakeholder topics" on public.stakeholder_topics for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal files" on public.files for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal comments" on public.comments for all using (public.is_internal_user()) with check (public.is_internal_user());
create policy "internal activity log" on public.activity_log for select using (public.is_internal_user());
create policy "activity log insert" on public.activity_log for insert with check (public.is_internal_user());

insert into storage.buckets (id, name, public)
values ('capitol-documents', 'capitol-documents', false)
on conflict (id) do nothing;

create policy "internal storage read" on storage.objects for select using (bucket_id = 'capitol-documents' and public.is_internal_user());
create policy "internal storage write" on storage.objects for insert with check (bucket_id = 'capitol-documents' and public.is_internal_user());
create policy "internal storage update" on storage.objects for update using (bucket_id = 'capitol-documents' and public.is_internal_user());
create policy "admin storage delete" on storage.objects for delete using (bucket_id = 'capitol-documents' and public.current_user_role() = 'admin');
