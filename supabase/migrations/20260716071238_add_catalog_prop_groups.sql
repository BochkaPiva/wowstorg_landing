create table public.catalog_prop_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  title text not null check (length(title) between 2 and 80),
  sort_order integer not null default 100,
  is_visible boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_items
  add column prop_group_id uuid references public.catalog_prop_groups(id) on delete set null;

alter table public.catalog_items
  add constraint catalog_items_prop_group_only_for_props
  check (prop_group_id is null or category_id = 'props');

create index catalog_prop_groups_updated_by_idx
  on public.catalog_prop_groups (updated_by);

create index catalog_items_props_group_public_idx
  on public.catalog_items (prop_group_id, is_featured desc, sort_order, created_at desc)
  where category_id = 'props' and status = 'published';

create trigger catalog_prop_groups_set_updated_at
before update on public.catalog_prop_groups
for each row execute function private.set_updated_at();

alter table public.catalog_prop_groups enable row level security;

revoke all on table public.catalog_prop_groups from anon, authenticated;
grant select on table public.catalog_prop_groups to anon, authenticated;
grant insert, update, delete on table public.catalog_prop_groups to authenticated;

create policy catalog_prop_groups_public_read on public.catalog_prop_groups
for select to anon
using (is_visible);

create policy catalog_prop_groups_admin_read on public.catalog_prop_groups
for select to authenticated
using ((select private.is_active_admin(array[
  'owner'::public.admin_role,
  'admin'::public.admin_role,
  'editor'::public.admin_role,
  'viewer'::public.admin_role
])));

create policy catalog_prop_groups_insert_mfa on public.catalog_prop_groups
for insert to authenticated
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array[
    'owner'::public.admin_role,
    'admin'::public.admin_role,
    'editor'::public.admin_role
  ]))
  and updated_by = (select auth.uid())
);

create policy catalog_prop_groups_update_mfa on public.catalog_prop_groups
for update to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array[
    'owner'::public.admin_role,
    'admin'::public.admin_role,
    'editor'::public.admin_role
  ]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array[
    'owner'::public.admin_role,
    'admin'::public.admin_role,
    'editor'::public.admin_role
  ]))
  and updated_by = (select auth.uid())
);

create policy catalog_prop_groups_delete_mfa on public.catalog_prop_groups
for delete to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array[
    'owner'::public.admin_role,
    'admin'::public.admin_role
  ]))
);

comment on table public.catalog_prop_groups is
  'Admin-managed public subcategories used only to classify standalone props.';

comment on column public.catalog_items.prop_group_id is
  'Optional prop subcategory. Must remain null for non-prop catalog items.';
