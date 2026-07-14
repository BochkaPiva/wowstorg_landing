create index if not exists catalog_categories_updated_by_idx on public.catalog_categories (updated_by);
create index if not exists catalog_items_updated_by_idx on public.catalog_items (updated_by);
create index if not exists portfolio_collections_updated_by_idx on public.portfolio_collections (updated_by);
create index if not exists portfolio_projects_updated_by_idx on public.portfolio_projects (updated_by);

drop policy if exists catalog_categories_write_with_mfa on public.catalog_categories;
drop policy if exists catalog_items_write_with_mfa on public.catalog_items;
drop policy if exists catalog_media_write_with_mfa on public.catalog_media;
drop policy if exists portfolio_collections_write_with_mfa on public.portfolio_collections;
drop policy if exists portfolio_projects_write_with_mfa on public.portfolio_projects;
drop policy if exists portfolio_media_write_with_mfa on public.portfolio_media;

create policy catalog_categories_insert_mfa on public.catalog_categories for insert to authenticated
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy catalog_categories_update_mfa on public.catalog_categories for update to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])))
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy catalog_categories_delete_mfa on public.catalog_categories for delete to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role])));

create policy catalog_items_insert_mfa on public.catalog_items for insert to authenticated
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy catalog_items_update_mfa on public.catalog_items for update to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])))
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy catalog_items_delete_mfa on public.catalog_items for delete to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role])));

create policy catalog_media_insert_mfa on public.catalog_media for insert to authenticated
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])));
create policy catalog_media_update_mfa on public.catalog_media for update to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])))
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])));
create policy catalog_media_delete_mfa on public.catalog_media for delete to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role])));

create policy portfolio_collections_insert_mfa on public.portfolio_collections for insert to authenticated
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy portfolio_collections_update_mfa on public.portfolio_collections for update to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])))
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy portfolio_collections_delete_mfa on public.portfolio_collections for delete to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role])));

create policy portfolio_projects_insert_mfa on public.portfolio_projects for insert to authenticated
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy portfolio_projects_update_mfa on public.portfolio_projects for update to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])))
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])) and updated_by = (select auth.uid()));
create policy portfolio_projects_delete_mfa on public.portfolio_projects for delete to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role])));

create policy portfolio_media_insert_mfa on public.portfolio_media for insert to authenticated
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])));
create policy portfolio_media_update_mfa on public.portfolio_media for update to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])))
with check ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role])));
create policy portfolio_media_delete_mfa on public.portfolio_media for delete to authenticated
using ((select auth.jwt()) ->> 'aal' = 'aal2' and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role])));
