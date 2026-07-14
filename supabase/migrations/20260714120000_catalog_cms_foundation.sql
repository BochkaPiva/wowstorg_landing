create table public.catalog_categories (
  id text primary key check (id in ('teambuilding', 'welcome', 'game_zone', 'props')),
  title text not null check (length(title) between 2 and 80),
  description text not null default '' check (length(description) <= 500),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.catalog_categories(id),
  kind text not null check (kind in ('package', 'zone', 'service', 'prop')),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  title text not null check (length(title) between 2 and 140),
  short_description text not null check (length(short_description) between 10 and 320),
  description text not null default '' check (length(description) <= 8000),
  effect_statement text not null default '' check (length(effect_statement) <= 500),
  price_from numeric(12, 2) check (price_from is null or price_from >= 0),
  price_unit text check (price_unit is null or length(price_unit) <= 40),
  guest_min integer check (guest_min is null or guest_min > 0),
  guest_max integer check (guest_max is null or guest_max >= guest_min),
  duration_min integer check (duration_min is null or duration_min > 0),
  duration_max integer check (duration_max is null or duration_max >= duration_min),
  included_items text[] not null default '{}',
  requirements text[] not null default '{}',
  badges text[] not null default '{}',
  lead_intent text not null default 'selection' check (lead_intent in ('consultation', 'estimate', 'selection', 'rent')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(included_items) <= 50),
  check (cardinality(requirements) <= 30),
  check (cardinality(badges) <= 12)
);

create table public.catalog_media (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id) on delete cascade,
  storage_path text not null check (storage_path ~ '^catalog/[a-z0-9/_-]+\.(png|jpg|jpeg|webp|avif)$'),
  alt_text text not null check (length(alt_text) between 2 and 240),
  media_type text not null default 'image' check (media_type = 'image'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (item_id, storage_path)
);

create table public.portfolio_collections (
  id text primary key check (id ~ '^[a-z0-9][a-z0-9_-]{1,63}$'),
  title text not null check (length(title) between 2 and 100),
  description text not null default '' check (length(description) <= 500),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  collection_id text not null references public.portfolio_collections(id),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  title text not null check (length(title) between 2 and 160),
  meta text not null default '' check (length(meta) <= 240),
  lead text not null check (length(lead) between 10 and 1200),
  facts text[] not null default '{}',
  result text not null default '' check (length(result) <= 1600),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  sort_order integer not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(facts) <= 12)
);

create table public.portfolio_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.portfolio_projects(id) on delete cascade,
  storage_path text not null check (storage_path ~ '^cases/[a-z0-9/_-]+\.(png|jpg|jpeg|webp|avif)$'),
  alt_text text not null check (length(alt_text) between 2 and 240),
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, storage_path)
);

create index catalog_items_public_idx
  on public.catalog_items (category_id, is_featured desc, sort_order, created_at desc)
  where status = 'published';
create index catalog_media_item_idx on public.catalog_media (item_id, sort_order);
create index portfolio_projects_public_idx
  on public.portfolio_projects (collection_id, sort_order, created_at desc)
  where status = 'published';
create index portfolio_media_project_idx on public.portfolio_media (project_id, is_cover desc, sort_order);

create trigger catalog_categories_set_updated_at
before update on public.catalog_categories
for each row execute function private.set_updated_at();

create trigger catalog_items_set_updated_at
before update on public.catalog_items
for each row execute function private.set_updated_at();

create trigger portfolio_collections_set_updated_at
before update on public.portfolio_collections
for each row execute function private.set_updated_at();

create trigger portfolio_projects_set_updated_at
before update on public.portfolio_projects
for each row execute function private.set_updated_at();

alter table public.catalog_categories enable row level security;
alter table public.catalog_items enable row level security;
alter table public.catalog_media enable row level security;
alter table public.portfolio_collections enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_media enable row level security;

revoke all on table public.catalog_categories from anon, authenticated;
revoke all on table public.catalog_items from anon, authenticated;
revoke all on table public.catalog_media from anon, authenticated;
revoke all on table public.portfolio_collections from anon, authenticated;
revoke all on table public.portfolio_projects from anon, authenticated;
revoke all on table public.portfolio_media from anon, authenticated;

grant select on table public.catalog_categories, public.catalog_items, public.catalog_media to anon, authenticated;
grant select on table public.portfolio_collections, public.portfolio_projects, public.portfolio_media to anon, authenticated;
grant insert, update, delete on table public.catalog_categories, public.catalog_items, public.catalog_media to authenticated;
grant insert, update, delete on table public.portfolio_collections, public.portfolio_projects, public.portfolio_media to authenticated;

create policy catalog_categories_public_read on public.catalog_categories
for select to anon, authenticated
using (
  is_visible
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role]))
);

create policy catalog_categories_write_with_mfa on public.catalog_categories
for all to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
  and updated_by = (select auth.uid())
);

create policy catalog_items_public_read on public.catalog_items
for select to anon, authenticated
using (
  status = 'published'
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role]))
);

create policy catalog_items_write_with_mfa on public.catalog_items
for all to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
  and updated_by = (select auth.uid())
);

create policy catalog_media_public_read on public.catalog_media
for select to anon, authenticated
using (
  exists (select 1 from public.catalog_items item where item.id = item_id and item.status = 'published')
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role]))
);

create policy catalog_media_write_with_mfa on public.catalog_media
for all to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

create policy portfolio_collections_public_read on public.portfolio_collections
for select to anon, authenticated
using (
  is_visible
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role]))
);

create policy portfolio_collections_write_with_mfa on public.portfolio_collections
for all to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
  and updated_by = (select auth.uid())
);

create policy portfolio_projects_public_read on public.portfolio_projects
for select to anon, authenticated
using (
  status = 'published'
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role]))
);

create policy portfolio_projects_write_with_mfa on public.portfolio_projects
for all to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
  and updated_by = (select auth.uid())
);

create policy portfolio_media_public_read on public.portfolio_media
for select to anon, authenticated
using (
  exists (select 1 from public.portfolio_projects project where project.id = project_id and project.status = 'published')
  or (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role, 'viewer'::public.admin_role]))
);

create policy portfolio_media_write_with_mfa on public.portfolio_media
for all to authenticated
using (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
)
with check (
  (select auth.jwt()) ->> 'aal' = 'aal2'
  and (select private.is_active_admin(array['owner'::public.admin_role, 'admin'::public.admin_role, 'editor'::public.admin_role]))
);

-- The function already validates the user, active role and AAL2 before publishing.
grant execute on function public.publish_content(uuid, bigint) to authenticated;

insert into public.catalog_categories (id, title, description, sort_order, is_visible)
values
  ('teambuilding', 'Тимбилдинги', 'Готовые командные программы со сценарием, ведущими и общим финалом.', 10, true),
  ('welcome', 'Welcome-зоны', 'Механики для встречи гостей и мягкого включения в событие.', 20, true),
  ('game_zone', 'Игровые зоны', 'Комплектные игровые пространства для корпоративов, выставок и фестивалей.', 30, true),
  ('props', 'Реквизит', 'Отдельные позиции для аренды и комплектации площадки.', 40, true)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order;

insert into public.catalog_items (
  category_id, kind, slug, title, short_description, description,
  effect_statement, guest_min, guest_max, duration_min, duration_max,
  included_items, requirements, badges, lead_intent, status, is_featured, sort_order
)
values
  (
    'teambuilding', 'package', 'komandnyy-marshrut', 'Командный маршрут',
    'Сценарный тимбилдинг, где команды проходят связанные испытания и встречаются в общем финале.',
    'Подходит для знакомства подразделений, перезапуска коммуникации и большого корпоративного дня. Состав механик и темп программы адаптируются под площадку и число участников.',
    'Не набор конкурсов, а единая история с понятной общей целью.', 30, 250, 90, 180,
    array['сценарий и тайминг', 'ведущий и игротехники', 'комплект игровых механик', 'общий финал'],
    array['площадка от 250 м²', 'доступ на монтаж'], array['готовый пакет', 'для команд'],
    'estimate', 'published', true, 10
  ),
  (
    'teambuilding', 'package', 'bolshaya-igra', 'Большая игра',
    'Масштабная программа для нескольких команд с параллельными станциями и общим результатом.',
    'Гости свободно двигаются между игровыми точками, зарабатывают общий ресурс и собирают финальный объект или решение.',
    'Работает на большой аудитории без очередей у одной активности.', 80, 500, 120, 240,
    array['координация площадки', 'система станций', 'команда ведущих', 'финальная механика'],
    array['зонирование площадки', 'технический доступ'], array['масштабный формат', '80–500 гостей'],
    'consultation', 'published', false, 20
  ),
  (
    'welcome', 'zone', 'welcome-konstruktor', 'Welcome-конструктор',
    'Набор коротких игровых механик, которые занимают гостей с первых минут и помогают начать общение.',
    'Зону собираем под тайминг сбора гостей, состав аудитории и визуальный стиль события. Можно добавить брендинг и фото-механику.',
    'Первое впечатление становится частью программы, а не ожиданием её начала.', 30, 300, 30, 120,
    array['2–4 игровые точки', 'игротехники', 'оформление зоны'],
    array['место у входной группы'], array['welcome', 'можно брендировать'],
    'selection', 'published', true, 10
  ),
  (
    'game_zone', 'zone', 'igrovaya-gostinaya', 'Игровая гостиная',
    'Свободная игровая зона для общения: гости подключаются в удобный момент и выбирают механику по настроению.',
    'Комплект подходит для корпоративов, фестивалей и выставок. Количество точек рассчитывается по потоку гостей и времени работы.',
    'Поддерживает живой ритм события без обязательного общего старта.', 40, 400, 60, 360,
    array['игровые станции', 'крупный реквизит', 'сопровождение'],
    array['ровная площадка', 'зона хранения'], array['свободный формат', 'для потока гостей'],
    'selection', 'published', true, 10
  ),
  (
    'props', 'prop', 'bolshaya-dzhenga', 'Большая дженга',
    'Напольная игра для welcome-зоны, свободной программы или отдельной игровой станции.',
    'Выдаём комплектом и подсказываем, как встроить механику в программу. Проведение игротехником можно добавить отдельно.',
    'Понятная механика, к которой легко подключиться без длинной инструкции.', 2, 12, 10, 180,
    array['комплект брусков', 'сумка для перевозки'],
    array['ровная площадка 2 × 2 м'], array['реквизит', 'быстрый старт'],
    'rent', 'published', false, 10
  ),
  (
    'props', 'prop', 'komandnyy-balansir', 'Командный балансир',
    'Кооперативная механика на точность и синхронную работу небольшой команды.',
    'Используется как самостоятельная станция или часть большого маршрута. Сложность регулируется под возраст и темп программы.',
    'Результат зависит от договорённости внутри команды, а не от силы одного участника.', 4, 12, 10, 30,
    array['балансир', 'игровой комплект'],
    array['ровная площадка 3 × 3 м'], array['командная механика', 'реквизит'],
    'rent', 'published', false, 20
  )
on conflict (slug) do nothing;

insert into public.portfolio_collections (id, title, description, sort_order, is_visible)
values
  ('teambuilding', 'Тимбилдинги', 'Реализованные командные программы.', 10, true),
  ('welcome', 'Welcome-зоны', 'Проекты для встречи и вовлечения гостей.', 20, true),
  ('game-zone', 'Игровые зоны', 'Игровые пространства на событиях.', 30, true)
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order;

comment on table public.catalog_items is 'Public catalog. Anonymous users see only published rows; MFA-protected admins see and edit all rows.';
comment on table public.catalog_media is 'References public site-media objects. Binary files remain in Supabase Storage.';
comment on table public.portfolio_projects is 'Portfolio entries are independent from catalog products and can be published separately.';
