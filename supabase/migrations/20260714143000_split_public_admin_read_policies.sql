-- Keep anonymous reads independent from privileged admin checks. Calling the
-- private admin helper from a policy assigned to anon causes PostgREST to
-- reject otherwise public rows before PostgreSQL can short-circuit the OR.

drop policy if exists catalog_categories_public_read on public.catalog_categories;
drop policy if exists catalog_items_public_read on public.catalog_items;
drop policy if exists catalog_media_public_read on public.catalog_media;
drop policy if exists portfolio_collections_public_read on public.portfolio_collections;
drop policy if exists portfolio_projects_public_read on public.portfolio_projects;
drop policy if exists portfolio_media_public_read on public.portfolio_media;

create policy catalog_categories_public_read on public.catalog_categories
for select to anon, authenticated
using (is_visible);

create policy catalog_categories_admin_read on public.catalog_categories
for select to authenticated
using ((select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role])));

create policy catalog_items_public_read on public.catalog_items
for select to anon, authenticated
using (status = 'published');

create policy catalog_items_admin_read on public.catalog_items
for select to authenticated
using ((select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role])));

create policy catalog_media_public_read on public.catalog_media
for select to anon, authenticated
using (exists (
  select 1
  from public.catalog_items item
  where item.id = item_id
    and item.status = 'published'
));

create policy catalog_media_admin_read on public.catalog_media
for select to authenticated
using ((select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role])));

create policy portfolio_collections_public_read on public.portfolio_collections
for select to anon, authenticated
using (is_visible);

create policy portfolio_collections_admin_read on public.portfolio_collections
for select to authenticated
using ((select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role])));

create policy portfolio_projects_public_read on public.portfolio_projects
for select to anon, authenticated
using (status = 'published');

create policy portfolio_projects_admin_read on public.portfolio_projects
for select to authenticated
using ((select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role])));

create policy portfolio_media_public_read on public.portfolio_media
for select to anon, authenticated
using (exists (
  select 1
  from public.portfolio_projects project
  where project.id = project_id
    and project.status = 'published'
));

create policy portfolio_media_admin_read on public.portfolio_media
for select to authenticated
using ((select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role])));
