-- Curated inventory import, part 5 of 5.
-- Internal duplicates and model numbers are consolidated into client-facing catalog cards.

with source (
  slug, title, group_slug, price_from, stock_quantity,
  short_description, description, badges, requirements, sort_order
) as (
values
  (
      'fotozona-kover', 'Фотозона «Ковёр»', 'osnaschenie-ploschadki', 6000, 1,
      'Фактурный ковёр на самостоятельном деревянном каркасе для ироничной ретро-фотозоны и тематического декора.',
      'Размер композиции — 3 × 2 м. Конструкция создаёт полноценный фон и хорошо дополняется торшером, тумбой и ретро-телевизорами.',
      array['3 × 2 м', 'Ретро-фотозона']::text[], array['Нужна площадка для установки каркаса']::text[], 81
    ),
  (
      'futbolnye-vorota', 'Разборные футбольные ворота', 'sport-i-aktivnosti', 4000, 1,
      'Полноразмерные разборные ворота для матчей, ударных челленджей и спортивных станций.',
      'Размер — 245 × 155 × 80 см. Конструкция подходит для временной площадки и перевозится в разобранном виде.',
      array['245 × 155 × 80 см']::text[], array['Нужна ровная открытая площадка']::text[], 82
    ),
  (
      'futbolnye-vorota-detskie', 'Детские складные футбольные ворота', 'detskiy-rekvizit', 800, 2,
      'Лёгкие ворота 120 × 90 см со складным каркасом на гибких секциях для детской игровой площадки.',
      'Каркас собирается по принципу палаточных дуг: секции соединены внутренней резинкой и быстро складываются для перевозки.',
      array['120 × 90 см', '2 штуки']::text[], array[]::text[], 83
    ),
  (
      'hokkeynaya-klyushka-detskaya', 'Детская хоккейная клюшка', 'detskiy-rekvizit', 250, 4,
      'Лёгкая клюшка для детских хоккейных игр, эстафет и заданий на ведение мяча или шайбы.',
      'Четыре клюшки позволяют провести парную игру или собрать небольшую командную станцию.',
      array['4 штуки']::text[], array[]::text[], 84
    ),
  (
      'holodilnik-belyy', 'Белый холодильник', 'shatry-i-torgovoe-oborudovanie', 5000, 2,
      'Классический белый холодильник для временной кухни, кейтеринга, backstage или хранения продукции.',
      'Два отдельных холодильника позволяют распределить продукты и напитки между зонами мероприятия.',
      array['2 штуки', '220 В']::text[], array['Требуется подключение к электросети 220 В']::text[], 85
    ),
  (
      'holodilnik-dlya-napitkov-pepsi', 'Холодильник для напитков Pepsi', 'shatry-i-torgovoe-oborudovanie', 3500, 1,
      'Вертикальный холодильник-витрина для охлаждения и заметной выкладки напитков в барной или торговой зоне.',
      'Стеклянная дверь помогает гостям видеть ассортимент, а вертикальный формат экономит место за стойкой.',
      array['Витрина', '220 В']::text[], array['Требуется подключение к электросети 220 В']::text[], 86
    ),
  (
      'holodilnik-dlya-napitkov-tuborg', 'Холодильник для напитков Tuborg', 'shatry-i-torgovoe-oborudovanie', 3500, 1,
      'Вертикальный холодильник-витрина для напитков, подходящий для бара, фестивальной точки или кейтеринга.',
      'Прозрачная дверь сохраняет продукцию на виду и упрощает обслуживание гостей в течение мероприятия.',
      array['Витрина', '220 В']::text[], array['Требуется подключение к электросети 220 В']::text[], 87
    ),
  (
      'shater-bezhevyy-3x3', 'Бежевый шатёр 3 × 3 м', 'shatry-i-torgovoe-oborudovanie', 10000, 2,
      'Элегантный бежевый шатёр для камерной торговой точки, регистрации, welcome-зоны или отдыха гостей.',
      'Размер — 3 × 3 м. Спокойный оттенок хорошо сочетается с деревянным, ярмарочным и натуральным оформлением; монтаж включён в стоимость.',
      array['3 × 3 м', 'Монтаж включён']::text[], array['Условия установки проверяются по площадке']::text[], 88
    ),
  (
      'shater-teleskopicheskiy-3x3', 'Графитовый шатёр 3 × 3 м', 'shatry-i-torgovoe-oborudovanie', 8500, 3,
      'Компактный телескопический шатёр графитового цвета для регистрации, технической точки или промозоны.',
      'Каркас быстро раскрывается и собирает защищённую рабочую зону размером 3 × 3 м. Нейтральный тёмно-серый цвет подходит к современному оформлению.',
      array['3 × 3 м', 'Телескопический']::text[], array['Условия крепления зависят от покрытия и погоды']::text[], 89
    ),
  (
      'shater-teleskopicheskiy-3x6', 'Графитовый шатёр 3 × 6 м', 'shatry-i-torgovoe-oborudovanie', 16000, 2,
      'Просторный телескопический шатёр графитового цвета для большой рабочей, торговой или гостевой зоны.',
      'Размер 3 × 6 м позволяет разместить несколько столов, оборудование или полноценную точку обслуживания. Конструкция быстро раскрывается на площадке.',
      array['3 × 6 м', 'Телескопический']::text[], array['Условия крепления зависят от покрытия и погоды']::text[], 90
    ),
  (
      'shater-teleskopicheskiy-4x2', 'Белый шатёр 4 × 2 м', 'shatry-i-torgovoe-oborudovanie', 7000, 1,
      'Белый телескопический шатёр вытянутого формата для стойки регистрации, бара или линейной рабочей зоны.',
      'Размер — 4 × 2 м. Светлый нейтральный цвет легко адаптируется к фирменному оформлению и не перегружает площадку.',
      array['4 × 2 м', 'Телескопический']::text[], array['Условия крепления зависят от покрытия и погоды']::text[], 91
    )
)
insert into public.catalog_items (
  category_id, prop_group_id, kind, slug, title,
  short_description, description, effect_statement,
  price_from, price_unit, stock_quantity,
  guest_min, guest_max, duration_min, duration_max,
  included_items, requirements, badges,
  lead_intent, status, is_featured, sort_order
)
select
  'props', groups.id, 'prop', source.slug, source.title,
  source.short_description, source.description, '',
  source.price_from, 'в сутки', source.stock_quantity,
  null, null, null, null,
  '{}'::text[], source.requirements, source.badges,
  'rent', 'published', false, source.sort_order
from source
join public.catalog_prop_groups groups on groups.slug = source.group_slug
on conflict (slug) do update set
  category_id = excluded.category_id,
  prop_group_id = excluded.prop_group_id,
  kind = excluded.kind,
  title = excluded.title,
  short_description = excluded.short_description,
  description = excluded.description,
  effect_statement = excluded.effect_statement,
  price_from = excluded.price_from,
  price_unit = excluded.price_unit,
  stock_quantity = excluded.stock_quantity,
  guest_min = excluded.guest_min,
  guest_max = excluded.guest_max,
  duration_min = excluded.duration_min,
  duration_max = excluded.duration_max,
  included_items = excluded.included_items,
  requirements = excluded.requirements,
  badges = excluded.badges,
  lead_intent = excluded.lead_intent,
  status = excluded.status,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  updated_at = now();
