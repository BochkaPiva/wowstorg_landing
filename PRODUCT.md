# WOWSTORG Product Context

## Product

WOWSTORG is a premium event agency landing and future content/catalog platform for companies that need memorable corporate events, team buildings, interactive zones, branded game mechanics, and event props rental.

The first public surface is a conversion-focused landing page. The product must later grow into a connected ecosystem with:

- catalog of services, games, props, and ready-made event packages;
- lead capture and request management;
- admin editing for landing blocks and catalog content;
- internal Telegram notifications;
- future integration with the internal B2B system `WebApp_WowStorg`.

## Audience

Primary audience:

- business owners, HR teams, marketers, office managers, and event managers;
- clients choosing an event contractor for corporate events, exhibitions, festivals, promo zones, and internal team activities.

They need emotional confidence first, then operational confidence:

- the event will feel unusual and premium;
- guests will be engaged quickly;
- the contractor can handle logistics, timing, props, branding, and safety;
- the next step is easy and does not feel like a hard sales call.

## Positioning

WOWSTORG turns business tasks into live game experiences: corporate events, team buildings, interactive zones, and event props that guests join from the first minutes.

The brand should feel:

- cinematic;
- premium;
- playful, but not childish;
- direct and confident;
- operationally reliable.

## Conversion Goal

The main conversion is a project discussion request.

Primary CTA:

`Обсудить проект`

Secondary CTA ideas:

- `Получить подборку игр`
- `Рассчитать мероприятие`
- `Смотреть каталог`

The CTA promise should be useful: the client describes the task, and WOWSTORG proposes a format, game selection, and production approach for the audience, venue, and budget.

## Current Scope

Current implementation:

- React/Vite landing plus a separate public `/catalog` surface;
- cinematic hero with dinosaur video;
- SEO-aware landing structure;
- empty catalog categories prepared for real content;
- persistent client-side catalog cart attached to the lead request;
- early domain models for future leads, catalog items, and content blocks;
- documentation for architecture, data model, integrations, SEO, catalog, and landing structure.

Out of scope for the current frontend phase:

- real admin panel;
- real database;
- real Telegram bot;
- payments;
- populated public catalog and CMS editing.

## Future Scope

The project should be ready to expand into:

- Next.js or comparable SSR framework when SEO route count grows;
- backend/API layer for lead submission;
- PostgreSQL/Supabase or another managed database;
- content/admin model for editable blocks;
- catalog routes for SEO categories and services;
- Telegram bot/webhook for internal notifications;
- structured data and sitemap after the production domain is confirmed.
