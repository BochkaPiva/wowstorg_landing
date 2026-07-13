# SEO Strategy

## Principles

Google’s SEO guidance emphasizes helping search engines understand content and helping
users decide whether to visit the page. For WOWSTORG, SEO must be built into the
information architecture, not added as keyword stuffing.

## Primary Search Clusters

### Event agency

- event агентство
- ивент агентство
- организация мероприятий
- организация корпоративных мероприятий
- event агентство для бизнеса

### Team building

- тимбилдинг
- тимбилдинг для сотрудников
- корпоративный тимбилдинг
- командные игры для компании

### Interactive zones and props

- интерактивные зоны для мероприятий
- аренда реквизита для мероприятий
- игровой реквизит
- аренда гигантских игр
- игры для корпоратива

### Commercial scenarios

- корпоратив на 50 человек
- корпоратив на 100 человек
- промо-зона для бренда
- интерактивная зона на выставку
- городское мероприятие с игровыми активностями

## URL Strategy For Future Expansion

Keep the current home page as the brand and conversion hub. Add SEO pages only when
there is enough real content to satisfy the intent.

Planned routes:

```text
/catalog
/catalog/props
/catalog/games
/catalog/packages
/services/team-building
/services/corporate-events
/services/interactive-zones
/services/event-props-rental
/cases
/cases/<case-slug>
```

## Structured Data

Use JSON-LD only for visible, truthful content.

Future candidates:

- `Organization` for brand identity;
- `LocalBusiness` only when address/contacts are confirmed;
- `Service` for service pages;
- `Product` only for catalog items with real product-like data;
- `FAQPage` only when FAQ is visible on the page;
- `BreadcrumbList` for future multi-page routes.

Do not add fake ratings, fake reviews, fake client logos, or invisible structured data.

## On-Page SEO Requirements

- one clear H1 per page;
- readable section headings with natural Russian wording;
- crawlable links for catalog and service pages when they exist;
- unique title and description per future route;
- descriptive alt text for real images;
- sitemap and robots after production domain is known;
- canonical URL only after final domain is known.

## Content Rule

Every SEO block must answer a real user question. If a paragraph exists only to repeat a
keyword, it should not be shipped.
