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

revoke all on function public.publish_content(uuid, bigint) from public, anon;
grant execute on function public.publish_content(uuid, bigint) to authenticated;

comment on function public.publish_content(uuid, bigint) is
  'Atomic MFA-protected publisher for landing content schema version 3.';
