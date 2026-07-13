# WOWSTORG Admin Architecture

## Product boundary

The public site and `WebApp_WowStorg` remain separate applications and separate bounded
contexts.

### Landing and admin own

- landing pages, SEO fields and publication state;
- public catalog presentation, packages, media and cases;
- incoming website leads and their qualification status;
- public-to-internal catalog references;
- content revisions, preview and publication audit.

### WebApp_WowStorg owns

- physical inventory and stable inventory identifiers;
- stock, repair, reservation and availability rules;
- operational orders, estimates and warehouse processes;
- internal projects created after a lead is qualified;
- internal prices, notes, users and permissions.

## Lead conversion

A website lead is not an internal order. It can describe a full event, a consultation or an
idea without any catalog selection.

The future workflow is explicit:

1. The public API stores a lead in the landing database.
2. A website manager contacts and qualifies the lead.
3. The manager chooses `Create project in WebApp` when operational work is required.
4. A server-to-server call creates a project and returns its stable ID.
5. The landing lead stores only the returned project reference and conversion timestamp.

There is no automatic order creation and no shared lead/order table.

## Catalog integration

Public catalog items may reference internal inventory by stable `sourceInventoryId` values.
The public item owns its title, marketing copy, SEO, media and package composition. The
internal item owns stock and availability.

The integration API must return a public projection rather than Prisma records. Internal
prices, exact stock buckets, repair data, partner discounts and warehouse notes are excluded.

## Current implementation

`/admin` is available only in Vite development mode. It provides:

- an admin application shell;
- a local typed content draft repository;
- structured editing for SEO and every active landing block;
- nested portfolio collections, projects, facts and gallery references;
- preview through `/?preview=local`;
- product screens for catalog, cases, leads and integration boundaries.

The production build intentionally shows an unavailable screen at `/admin`. The repository now
contains the first Supabase migration with explicit admin roles, RLS, MFA-protected writes,
immutable revisions, an audit log and an atomic publish function. The Auth/MFA UI, server-side
lead endpoint and media storage must still be connected before the editor can be enabled in
production.

## Backend milestone

Recommended next backend slice:

1. Connect invite-only Supabase Auth and TOTP enrollment/challenge UI.
2. Replace the local draft repository with database draft/read/publish calls.
3. Add private media storage with image validation, metadata and SEO alt text.
4. Add a lead endpoint with validation, CAPTCHA, rate limiting and Telegram delivery retries.
5. Test RLS for every role and assurance level before enabling production `/admin`.
6. Implement the server-to-server catalog projection contract with `WebApp_WowStorg`.
