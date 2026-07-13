# Data Model Draft

## Lead

Public event request from the landing or internal systems.

Website leads are owned by the landing/admin backend. They are not `Order` records from
`WebApp_WowStorg`. A qualified lead may later receive an optional `convertedProjectId` after
an explicit server-side conversion action.

Fields planned:

- `id`
- `status`: `new`, `in_progress`, `qualified`, `archived`
- `source`: `landing`, `b2b-webapp`, `manual`
- `name`
- `phone`
- `email`
- `company`
- `eventDate`
- `eventFormat`
- `guestCount`
- `message`
- `utm`
- `createdAt`
- `updatedAt`
- `convertedProjectId` (optional external WebApp project reference)
- `convertedAt` (optional)

## ContentBlock

Editable landing block for a future admin panel.

Fields planned:

- `id`
- `kind`
- `slug`
- `title`
- `body`
- `payload`
- `isPublished`
- `sortOrder`
- `updatedAt`

## Future Storage Candidates

- Supabase Postgres for leads, content blocks, audit logs, and admin roles.
- Storage bucket for future media assets if blocks become admin-editable.
- Server-side queue or edge function for Telegram notification retries.

## CatalogItem

Future catalog entity for services, games, props, and packages.

Fields planned:

- `id`
- `kind`: `service`, `prop`, `game`, `package`
- `slug`
- `title`
- `shortDescription`
- `seoTitle`
- `seoDescription`
- `audience`
- `useCases`
- `media`
- `leadIntent`
- `isFeatured`
- `isPublished`
- `sortOrder`
- `updatedAt`
