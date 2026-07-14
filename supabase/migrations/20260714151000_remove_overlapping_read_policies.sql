-- Public visitors use the anonymous role. Authenticated sessions belong to
-- back-office users and are evaluated by the dedicated admin read policies.
-- Keeping these role sets disjoint avoids evaluating two permissive SELECT
-- policies for every authenticated request.

alter policy catalog_categories_public_read on public.catalog_categories to anon;
alter policy catalog_items_public_read on public.catalog_items to anon;
alter policy catalog_media_public_read on public.catalog_media to anon;
alter policy portfolio_collections_public_read on public.portfolio_collections to anon;
alter policy portfolio_projects_public_read on public.portfolio_projects to anon;
alter policy portfolio_media_public_read on public.portfolio_media to anon;
