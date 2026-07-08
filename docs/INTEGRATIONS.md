# Integrations

## Telegram

Internal notifications should be sent from a trusted server context.

Events:

- new landing lead;
- lead assigned/taken into work;
- lead status changed;
- admin content publish requested;
- production incident.

Do not expose `TELEGRAM_BOT_TOKEN` in browser bundles.

## WebApp_WowStorg

The landing should remain decoupled from the internal B2B app through explicit contracts.

Possible contract:

- landing creates lead;
- backend notifies Telegram;
- manager works with lead in WebApp_WowStorg;
- WebApp_WowStorg can update lead status or attach internal notes.

Shared identifiers should be stable and opaque.
