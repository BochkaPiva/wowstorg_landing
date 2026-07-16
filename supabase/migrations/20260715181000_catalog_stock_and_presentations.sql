alter table public.catalog_items
  add column if not exists presentation_path text,
  add column if not exists presentation_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_items_presentation_fields_paired'
      and conrelid = 'public.catalog_items'::regclass
  ) then
    alter table public.catalog_items
      add constraint catalog_items_presentation_fields_paired
      check (
        (presentation_path is null and presentation_name is null)
        or (presentation_path is not null and presentation_name is not null)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'catalog_items_props_without_presentation'
      and conrelid = 'public.catalog_items'::regclass
  ) then
    alter table public.catalog_items
      add constraint catalog_items_props_without_presentation
      check (
        (category_id <> 'props' and kind <> 'prop')
        or (presentation_path is null and presentation_name is null)
      );
  end if;
end $$;

update storage.buckets
set
  file_size_limit = 31457280,
  allowed_mime_types = array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/avif',
    'application/pdf'
  ]::text[]
where id = 'site-media';

comment on column public.catalog_items.presentation_path is
  'Path to the optional client-facing PDF presentation in the site-media bucket.';

comment on column public.catalog_items.presentation_name is
  'Original display name of the optional PDF presentation.';
