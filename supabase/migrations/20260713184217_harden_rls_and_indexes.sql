revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Publishing stays behind a server endpoint until the production admin flow is connected.
revoke execute on function public.publish_content(uuid, bigint) from authenticated;
grant execute on function public.publish_content(uuid, bigint) to service_role;

create index if not exists content_documents_updated_by_idx
  on public.content_documents (updated_by);

create index if not exists content_revisions_created_by_idx
  on public.content_revisions (created_by);

drop policy if exists admin_profiles_read_self on public.admin_profiles;
drop policy if exists admin_profiles_read_for_admins on public.admin_profiles;

create policy admin_profiles_read
on public.admin_profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role]))
);

create policy lead_submission_limits_no_client_access
on public.lead_submission_limits
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists content_documents_insert_with_mfa on public.content_documents;
create policy content_documents_insert_with_mfa
on public.content_documents
for insert
to authenticated
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
  and updated_by = (select auth.uid())
);

drop policy if exists content_documents_update_with_mfa on public.content_documents;
create policy content_documents_update_with_mfa
on public.content_documents
for update
to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
  and updated_by = (select auth.uid())
);

drop policy if exists landing_leads_update_with_mfa on public.landing_leads;
create policy landing_leads_update_with_mfa
on public.landing_leads
for update
to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

drop policy if exists site_media_admin_insert on storage.objects;
create policy site_media_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

drop policy if exists site_media_admin_update on storage.objects;
create policy site_media_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-media'
  and (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  bucket_id = 'site-media'
  and (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

drop policy if exists site_media_admin_delete on storage.objects;
create policy site_media_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-media'
  and (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role]))
);

comment on function public.publish_content(uuid, bigint) is
  'Server-only atomic publisher. A production admin endpoint must authenticate the user, require AAL2 MFA, and call with a secret key.';
