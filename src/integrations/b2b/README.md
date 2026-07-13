# B2B Integration

Integration boundary for `C:\Projects\WebApp_WowStorg`.

The applications stay separate. `WebApp_WowStorg` owns inventory, reservations, operational
orders and projects. This repository owns public content, public catalog presentation and
incoming website leads.

Allowed future integrations:

- reference internal inventory from public catalog items by stable external ID;
- request a public availability answer for a selected date range;
- explicitly convert a qualified website lead into an internal project;
- store the returned internal project ID on the lead.

Disallowed coupling:

- direct browser access to the internal database;
- automatic conversion of every lead into an order;
- exposure of exact stock, internal prices, notes or partner discounts;
- shared sessions or user tables between public admin and internal WebApp.

See `docs/ADMIN_ARCHITECTURE.md` for the full boundary.
