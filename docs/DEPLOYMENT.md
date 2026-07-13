# Production deployment

The landing and the internal B2B application stay separate. Vercel serves this Vite application. A dedicated Supabase project owns public content, media, leads, admin identities, audit data, and notification delivery. No browser code receives a Supabase secret key or a Telegram token.

> Legal release gate for Russia: before accepting real leads, obtain a written review of personal-data localization, cross-border transfer, operator notification, consent text, retention, and processor agreements for the selected Vercel, Supabase, Cloudflare, and Telegram regions. If primary collection must remain in Russia, keep the frontend on Vercel if approved, but move the lead endpoint and primary database to Russian infrastructure (or self-host the backend there). This document is a technical checklist, not a legal conclusion.

## 1. Supabase project

1. Create a separate Supabase project for the landing. Keep it separate from `WebApp_WowStorg` until a narrow server-to-server integration contract exists.
2. In the repository run:

```powershell
npx.cmd supabase login
npx.cmd supabase link --project-ref mbpfsdbttdjksbmoaemv
npx.cmd supabase db push
npx.cmd supabase functions deploy submit-lead --use-api
npx.cmd supabase functions deploy process-notifications --use-api
```

`db push` creates the only required bucket, `site-media`. It is public for delivery and restricted to PNG, JPEG, WebP, and AVIF files up to 10 MB. Upload, update, and delete require an active admin session with AAL2 MFA. Suggested folders are `logos/`, `cases/`, and `catalog/`.

Do not create a lead-attachments bucket yet. The form does not collect files, so another public or private storage surface would add risk without a product need.

## 2. Edge Function secrets

Generate both random secrets locally:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Set these values in Supabase Dashboard -> Edge Functions -> Secrets:

```text
ALLOWED_ORIGINS=https://your-domain.ru,https://www.your-domain.ru
TURNSTILE_SECRET_KEY=...
IP_HASH_SECRET=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
TELEGRAM_MESSAGE_THREAD_ID=...
CRON_SECRET=...
```

Add a preview origin to `ALLOWED_ORIGINS` only when that exact preview deployment is meant to submit real leads. Wildcard Vercel origins are intentionally unsupported by the function.

`SUPABASE_URL` and `SUPABASE_SECRET_KEYS` are provided by the hosted Edge runtime. The functions also support the legacy `SUPABASE_SERVICE_ROLE_KEY` while Supabase completes the key migration. Never duplicate either secret key in Vercel.

## 3. Cloudflare Turnstile

1. Create one Managed Turnstile widget.
2. Add the production apex domain and `www` domain to its hostname allow-list.
3. Put the public site key in Vercel as `VITE_TURNSTILE_SITE_KEY`.
4. Put the secret key only in Supabase as `TURNSTILE_SECRET_KEY`.

The form token is checked by `submit-lead` using Siteverify. Tokens are not trusted from the browser and are single-use.

## 4. Telegram bot

1. Create the bot through BotFather and copy its token to `TELEGRAM_BOT_TOKEN` in Supabase.
2. Create a private internal group, enable Topics, add the bot, and send a command such as `/topicid` in the target topic. If the update is not visible, temporarily disable privacy for this bot through BotFather (`/setprivacy`), send the command again, then restore privacy.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates`. Save `message.chat.id` as `TELEGRAM_CHAT_ID` and `message.message_thread_id` as `TELEGRAM_MESSAGE_THREAD_ID`. The topic variable is optional; without it, Telegram sends to the group's default topic.
4. Run `supabase/snippets/setup_notification_cron.sql` once in SQL Editor after replacing its two placeholders.

The lead and outbox item are written in one database transaction. The cron runs every minute, claims rows with `SKIP LOCKED`, and retries failed Telegram deliveries with exponential backoff. A Telegram outage cannot erase the lead.

## 5. Vercel project

Import the GitHub repository into Vercel. The included `vercel.json` selects Vite, runs `npm run build`, serves `dist`, rewrites direct `/admin` and `/catalog` requests to the SPA, and adds CSP, HSTS, anti-framing, MIME, referrer, and permissions headers.

Add these variables in Vercel for Production and Preview:

```text
VITE_SUPABASE_URL=https://mbpfsdbttdjksbmoaemv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_3zQ_eLtZQEZNE1f4Vx3-zg_xq9RYDYj
VITE_TURNSTILE_SITE_KEY=...
```

Preview deployments need either a separate Turnstile widget whose hostname list contains the preview host, or they should be tested with Cloudflare's documented test keys. Do not add `*.vercel.app` to the production widget unless preview form submissions are intentionally allowed.

## 6. Supabase Auth production settings

In Authentication -> URL Configuration set Site URL to the canonical HTTPS domain and add only the exact admin callback URLs that are needed. Keep public signup and anonymous sign-in disabled. Invite admin users manually, enroll TOTP MFA, then add their UUIDs to `admin_profiles` with the minimum role needed.

The production `/admin` screen remains closed until the real Supabase Auth UI and server-backed editor repository are connected. This is deliberate: a local-only editor must not become an accidental production backdoor.

## 7. Release checks

Before switching DNS:

1. Close the legal release gate above before using production keys or accepting real visitor data.
2. Submit a test lead and confirm one `landing_leads` row and one `notification_outbox` row with `status = sent`.
3. Submit an invalid Turnstile token and confirm no lead is created.
4. Confirm the deployed response headers include CSP and HSTS.
5. Open `/catalog`, `/admin`, legal pages, and the canonical landing URL directly.
6. Upload one WebP logo to `site-media/logos/` and enter `logos/file.webp` in the trust block editor draft.
7. Confirm no Supabase secret key, Telegram token, Turnstile secret, or cron secret exists in Vercel or the browser bundle.
