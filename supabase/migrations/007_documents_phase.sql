alter table public.files
add column if not exists file_url text,
add column if not exists external_url text,
add column if not exists document_type text not null default 'other',
add column if not exists source_type text not null default 'external_link',
add column if not exists updated_at timestamptz not null default now(),
add column if not exists size bigint;

update public.files
set
  file_url = coalesce(file_url, case when storage_path is not null then url else null end),
  external_url = coalesce(external_url, case when storage_path is null then url else null end),
  source_type = case when storage_path is not null then 'upload' else coalesce(source_type, 'external_link') end,
  size = coalesce(size, size_bytes)
where file_url is null or external_url is null or size is null;

alter table public.files
drop constraint if exists files_entity_type_check,
add constraint files_entity_type_check check (entity_type in ('client', 'contact', 'task', 'interaction', 'report', 'alert', 'stakeholder'));

alter table public.files
drop constraint if exists files_source_type_check,
add constraint files_source_type_check check (source_type in ('upload', 'external_link'));

alter table public.files
drop constraint if exists files_document_type_check,
add constraint files_document_type_check check (document_type in ('contract', 'report', 'presentation', 'spreadsheet', 'note', 'legal', 'media', 'image', 'audio', 'other'));

alter table public.files
drop constraint if exists files_source_required_check,
add constraint files_source_required_check check (
  (source_type = 'upload' and (storage_path is not null or file_url is not null))
  or
  (source_type = 'external_link' and external_url is not null)
) not valid;

drop trigger if exists files_updated_at on public.files;
create trigger files_updated_at before update on public.files for each row execute function public.set_updated_at();

create index if not exists files_entity_idx on public.files (entity_type, entity_id) where deleted_at is null;
create index if not exists files_source_type_idx on public.files (source_type) where deleted_at is null;
create index if not exists files_document_type_idx on public.files (document_type) where deleted_at is null;
create index if not exists files_uploaded_by_idx on public.files (uploaded_by) where deleted_at is null;
create index if not exists files_created_at_idx on public.files (created_at desc) where deleted_at is null;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'internal documents storage read') then
    create policy "internal documents storage read" on storage.objects
      for select using (bucket_id = 'documents' and public.is_internal_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'internal documents storage write') then
    create policy "internal documents storage write" on storage.objects
      for insert with check (bucket_id = 'documents' and public.is_internal_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'internal documents storage update') then
    create policy "internal documents storage update" on storage.objects
      for update using (bucket_id = 'documents' and public.is_internal_user())
      with check (bucket_id = 'documents' and public.is_internal_user());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'admin documents storage delete') then
    create policy "admin documents storage delete" on storage.objects
      for delete using (bucket_id = 'documents' and public.current_user_role() = 'admin');
  end if;
end $$;
