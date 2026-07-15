alter table public.catalog_items
  add column if not exists stock_quantity integer;

alter table public.catalog_items
  drop constraint if exists catalog_items_stock_quantity_check;

alter table public.catalog_items
  add constraint catalog_items_stock_quantity_check
  check (stock_quantity is null or stock_quantity >= 0);

comment on column public.catalog_items.stock_quantity is
  'Exact available quantity for standalone props; null means stock is not tracked.';
