# Catalog Strategy

## Product Role

The public catalog is a guided event-selection product, not an ecommerce shelf and not a
copy of the internal warehouse UI. It should help a client move from a business task to a
ready event format, understand what is included, and send a useful request without building
an event one inventory item at a time.

## Public Hierarchy

The order is intentional:

1. **Тимбилдинги** — complete programs with a scenario, stations, team, timing, and finale.
2. **Welcome-зоны** — ready guest-arrival packages for networking and early engagement.
3. **Игровые пространства** — multi-station packages for corporate events, exhibitions,
   festivals, and promo projects.
4. **Реквизит** — individual digitized items for clients and agencies that already have a
   scenario or need to complete an existing production.

Packages are the primary commercial offer. Individual props remain discoverable but never
become the first screen of the catalog.

## Navigation Model

The catalog supports two complementary paths:

- **By solution:** section -> package card -> package detail -> request.
- **By task:** goal, guest count, venue type, and event date -> recommended packages.

Search and filters should use public marketing attributes. Internal warehouse categories,
stock notes, supplier data, and operational statuses must not leak into the client UI.

## Package Card

The listing card contains only decision-making information:

- title and one clear effect statement;
- cover image or short muted video;
- best-fit event type;
- guest-count range and duration when confirmed;
- compact list of included capabilities;
- CTA to open the detail page.

Avoid showing an unverified price. Use “Запросить расчёт” when logistics, staffing, branding,
or location materially affect the estimate.

## Package Detail

Each package opens as a dedicated SEO-addressable page with:

- cinematic cover and gallery;
- concise result for the client;
- event flow and mechanics;
- what is included and what can be added;
- participant range, timing, venue, power, and setup requirements;
- related packages and compatible inventory;
- persistent compact request action;
- FAQ specific to the format.

The request form should inherit the package ID and title so the client does not repeat their
choice.

## Landing Gateway

The landing section is a product preview, not a fake catalog. It demonstrates the hierarchy,
switches between the four public sections, contains no invented items, and sends every action
to `/catalog` with the relevant section selected.

The first `/catalog` release is intentionally an empty product shell: categories, search,
empty states, persistent cart, and lead attachment are implemented before real cards are
published. Content will be added only from verified inventory and package data.

## B2B Integration Boundary

`WebApp_WowStorg` remains the source of truth for physical inventory, quantities,
availability, and internal operations. The public site owns marketing copy, media ordering,
SEO, publication status, and package composition.

The browser must never connect to the B2B database directly. A server-side integration will
publish a safe read model containing only approved fields. Package composition references
inventory by stable IDs; availability is requested through a server endpoint for the selected
date rather than exposing the internal stock model.

## Future Admin Responsibilities

- create and edit packages, zones, and public inventory pages;
- compose packages from stable B2B inventory IDs;
- upload and order media with required alt text;
- preview drafts before publication;
- edit SEO title, description, canonical slug, and structured data fields;
- feature, sort, publish, archive, and audit content changes;
- never edit raw page HTML or B2B stock from the landing CMS.
