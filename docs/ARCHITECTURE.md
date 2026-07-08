# WOWSTORG Landing Architecture

## Current Phase

The project is a React 18 + TypeScript + Vite landing page with a premium interactive hero.
The current repository stays frontend-only until the product structure, content model, and
lead workflow are approved.

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
