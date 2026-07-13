# WOWSTORG Landing Architecture

## Current Phase

The project is a React 18 + TypeScript + Vite landing page with a premium interactive hero
and a separate public catalog shell at `/catalog`.
The current repository stays frontend-only until the product structure, content model, and
lead workflow are approved.

The first development-only admin surface now exists at `/admin`. It uses a local draft
repository and cannot be enabled in production until server authentication, persistence and
auditing are added. The approved application boundary is documented in
`docs/ADMIN_ARCHITECTURE.md`.

## Direction

The landing should grow into a serious product surface connected to WebApp_WowStorg, not a
throwaway static page. The recommended path is staged:

1. Keep the current Vite landing stable while visual structure is being designed.
2. Define content blocks, lead schema, analytics, and notification contracts.
3. Add backend capabilities only after the landing information architecture is stable.
4. Consider migration to Next.js App Router when server-side forms, admin previews, SEO
   routes, or authenticated admin tools become first-class needs.

## Layering

```text
src/app                 Application composition and providers
src/widgets             Large page sections and visible landing widgets
src/features            User-facing capabilities and workflows
src/entities            Shared domain models
src/shared              Reusable UI, libs, styles, config
src/integrations        External system boundaries
docs                    Product, architecture, data, and integration notes
```

## Content Architecture

The landing is structured as a conversion narrative:

1. attention through the mascot-driven hero;
2. interest through positioning and event formats;
3. selection through a catalog of props, games, packages, and services;
4. trust through scenarios, cases, and production process;
5. conversion through a focused request flow.

The future admin panel should edit content blocks and catalog items, not arbitrary page HTML.

## Catalog Integration Boundary

The public catalog and `WebApp_WowStorg` are related products with different ownership:

- `WebApp_WowStorg` owns physical inventory, quantities, reservations, and availability;
- the public catalog owns package presentation, marketing content, media, SEO, and publication;
- packages reference B2B inventory through stable external IDs;
- the public browser reads a server-produced public projection, never the internal database;
- date-specific availability and lead submission go through authenticated server-to-server
  integration endpoints;
- internal prices, service notes, partner-only data, and operational statuses are excluded
  from the public contract by default.

This boundary allows the future catalog and admin panel to evolve without coupling the
landing bundle to the B2B schema or exposing privileged data.

## Current Catalog Shell

- `/catalog` is selected from `window.location.pathname` without adding a routing dependency;
- category state is reflected in the `section` query parameter;
- the catalog intentionally contains no fabricated positions;
- the cart is persisted under a versioned `localStorage` key and is available on both pages;
- selected cart lines are appended to the current lead email body;
- production hosting must rewrite `/catalog` to `index.html` while the project remains a Vite SPA.

When catalog detail routes and server-rendered SEO pages become first-class, routing should
move to the chosen SSR framework rather than expanding this temporary pathname switch.

## Non-Goals For The Current Phase

- no backend inside this Vite app;
- no fake admin panel;
- no fake database calls;
- no Telegram bot token in client code;
- no tight coupling to WebApp_WowStorg before integration contracts are known.

## Security Baseline

- secrets are server-only;
- public forms need validation, rate limiting, spam protection, and audit logs;
- admin functionality must require authentication and role checks;
- content changes should be versioned or auditable;
- Telegram notifications should be sent from a server context only.
