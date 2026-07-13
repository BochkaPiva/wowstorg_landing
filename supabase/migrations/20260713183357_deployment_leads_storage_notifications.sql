alter table public.landing_leads
  add column company text check (company is null or length(company) <= 200),
  add column contact_type text not null default 'Телефон' check (length(contact_type) between 2 and 40),
  add column date_is_flexible boolean not null default true;

create table public.lead_submission_limits (
  ip_hash text not null check (length(ip_hash) = 64),
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (ip_hash, window_start)
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.landing_leads(id) on delete cascade,
  channel text not null default 'telegram' check (channel = 'telegram'),
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text check (last_error is null or length(last_error) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lead_id, channel)
);

create index notification_outbox_pending_idx
  on public.notification_outbox (next_attempt_at, created_at)
  where status = 'pending';

create index lead_submission_limits_updated_idx
  on public.lead_submission_limits (updated_at);

create trigger notification_outbox_set_updated_at
before update on public.notification_outbox
for each row execute function private.set_updated_at();

alter table public.lead_submission_limits enable row level security;
alter table public.notification_outbox enable row level security;

revoke all on table public.lead_submission_limits from public, anon, authenticated;
revoke all on table public.notification_outbox from public, anon, authenticated;
grant select on table public.notification_outbox to authenticated;
grant all on table public.lead_submission_limits to service_role;
grant all on table public.notification_outbox to service_role;
grant all on table public.landing_leads to service_role;

create policy notification_outbox_read
on public.notification_outbox
for select
to authenticated
using ((select private.is_active_admin(array[
  'owner'::public.admin_role,
  'admin'::public.admin_role,
  'editor'::public.admin_role,
  'viewer'::public.admin_role
])));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy site_media_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

create policy site_media_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-media'
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  bucket_id = 'site-media'
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

create policy site_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-media'
  and (select auth.jwt() ->> 'aal') = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role]))
);

create or replace function public.accept_landing_lead(
  p_name text,
  p_company text,
  p_contact_type text,
  p_contact text,
  p_event_type text,
  p_guest_range text,
  p_event_date date,
  p_date_is_flexible boolean,
  p_message text,
  p_catalog_selection_ids text[],
  p_consent_version text,
  p_ip_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz;
  submission_count integer;
  new_lead_id uuid;
begin
  if p_ip_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid request fingerprint' using errcode = '22023';
  end if;

  if length(trim(p_name)) not between 1 and 160
    or length(trim(p_contact)) not between 3 and 320
    or length(trim(p_contact_type)) not between 2 and 40
    or length(trim(p_event_type)) not between 2 and 120
    or length(trim(p_guest_range)) not between 1 and 80
    or length(trim(p_consent_version)) not between 1 and 40
    or cardinality(coalesce(p_catalog_selection_ids, '{}'::text[])) > 200
  then
    raise exception 'invalid lead payload' using errcode = '22023';
  end if;

  current_window := to_timestamp(floor(extract(epoch from now()) / 600) * 600);

  insert into public.lead_submission_limits (ip_hash, window_start, request_count, updated_at)
  values (p_ip_hash, current_window, 1, now())
  on conflict (ip_hash, window_start) do update
  set request_count = public.lead_submission_limits.request_count + 1,
      updated_at = now()
  returning request_count into submission_count;

  if submission_count > 5 then
    raise exception 'lead rate limit exceeded' using errcode = 'P0001';
  end if;

  insert into public.landing_leads (
    name,
    company,
    contact_type,
    contact,
    event_type,
    guest_range,
    event_date,
    date_is_flexible,
    message,
    catalog_selection_ids,
    consent_version,
    consented_at
  )
  values (
    trim(p_name),
    nullif(trim(coalesce(p_company, '')), ''),
    trim(p_contact_type),
    trim(p_contact),
    trim(p_event_type),
    trim(p_guest_range),
    case when p_date_is_flexible then null else p_event_date end,
    p_date_is_flexible,
    nullif(trim(coalesce(p_message, '')), ''),
    coalesce(p_catalog_selection_ids, '{}'::text[]),
    trim(p_consent_version),
    now()
  )
  returning id into new_lead_id;

  insert into public.notification_outbox (lead_id)
  values (new_lead_id);

  return new_lead_id;
end;
$$;

revoke all on function public.accept_landing_lead(text, text, text, text, text, text, date, boolean, text, text[], text, text) from public, anon, authenticated;
grant execute on function public.accept_landing_lead(text, text, text, text, text, text, date, boolean, text, text[], text, text) to service_role;

create or replace function public.claim_telegram_notifications(p_batch_size integer default 10)
returns table (outbox_id uuid, lead_id uuid, attempt integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.notification_outbox
  set status = 'pending',
      locked_at = null,
      next_attempt_at = now()
  where status = 'processing'
    and locked_at < now() - interval '5 minutes';

  delete from public.lead_submission_limits
  where updated_at < now() - interval '24 hours';

  return query
  with candidates as (
    select item.id
    from public.notification_outbox item
    where item.channel = 'telegram'
      and item.status = 'pending'
      and item.next_attempt_at <= now()
    order by item.created_at
    for update skip locked
    limit least(greatest(p_batch_size, 1), 25)
  )
  update public.notification_outbox item
  set status = 'processing',
      locked_at = now(),
      attempts = item.attempts + 1
  from candidates
  where item.id = candidates.id
  returning item.id, item.lead_id, item.attempts;
end;
$$;

revoke all on function public.claim_telegram_notifications(integer) from public, anon, authenticated;
grant execute on function public.claim_telegram_notifications(integer) to service_role;

create or replace function public.publish_content(
  document_id uuid,
  expected_version bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  document public.content_documents%rowtype;
  next_version bigint;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  if coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then
    raise exception 'multi-factor authentication required' using errcode = '42501';
  end if;

  if not private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]) then
    raise exception 'insufficient privileges' using errcode = '42501';
  end if;

  select * into document
  from public.content_documents
  where id = document_id
  for update;

  if not found then
    raise exception 'content document not found' using errcode = 'P0002';
  end if;

  if document.version <> expected_version then
    raise exception 'content version conflict' using errcode = '40001';
  end if;

  if document.draft_payload ->> 'version' <> '3' then
    raise exception 'unsupported content schema version' using errcode = '22023';
  end if;

  next_version := document.version + 1;

  update public.content_documents
  set version = next_version,
      updated_by = (select auth.uid())
  where id = document.id;

  insert into public.published_content (content_key, payload, version, published_at)
  values (document.content_key, document.draft_payload, next_version, now())
  on conflict (content_key) do update
  set payload = excluded.payload,
      version = excluded.version,
      published_at = excluded.published_at;

  insert into public.content_revisions (document_id, version, snapshot, created_by)
  values (document.id, next_version, document.draft_payload, (select auth.uid()));

  insert into public.admin_audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    (select auth.uid()),
    'content.publish',
    'content_document',
    document.id::text,
    jsonb_build_object('content_key', document.content_key, 'version', next_version)
  );

  return next_version;
end;
$$;

comment on table public.notification_outbox is 'Durable delivery queue. A lead transaction always creates its Telegram notification before commit.';
comment on table public.lead_submission_limits is 'Stores HMAC request fingerprints only. Raw visitor IP addresses are never persisted.';
comment on function public.accept_landing_lead(text, text, text, text, text, text, date, boolean, text, text[], text, text) is 'Service-only atomic lead ingestion with database rate limiting and outbox creation.';
