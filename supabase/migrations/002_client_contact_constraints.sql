create unique index if not exists contacts_one_primary_per_client
on public.contacts (client_id)
where is_primary = true and deleted_at is null;
