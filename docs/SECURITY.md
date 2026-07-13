# Admin security baseline

The current `/admin` editor is intentionally local-only. A production build renders a closed screen until the secure backend and authentication flow are configured. Do not remove this guard to "temporarily" publish the admin.

## Trust boundaries

- The browser may contain only the Supabase URL and publishable key.
- A `service_role` or secret key must exist only in server-side secrets and must never use a `VITE_` prefix.
- Public visitors can read `published_content` only.
- Drafts, revisions, leads, profiles, and audit events require an authenticated active admin profile.
- Every content or lead mutation requires an `aal2` session (TOTP MFA).
- New admin accounts are invite-only. Public Auth sign-up is disabled.
- The public lead form must call a server/Edge endpoint with CAPTCHA, rate limiting, payload validation, and a fixed CORS allow-list. It has no direct table insert grant.

## Database controls

Migration `supabase/migrations/20260713165723_admin_cms_security_foundation.sql` creates:

- explicit admin roles and active/inactive profiles;
- RLS on every exposed table;
- a public read-only projection separated from drafts;
- immutable revision and audit tables;
- an MFA-protected transactional publish function;
- optimistic version checks to prevent one editor from overwriting another;
- a separate landing lead queue with no public insert permission.

## Production checklist

1. Deploy the database in an approved region/jurisdiction. Personal-data storage must be reviewed before collecting real leads.
2. Disable public sign-up and create the first owner through a trusted server/admin channel.
3. Enable TOTP enrollment and verification, then confirm every admin reaches `aal2` before editing.
4. Set exact production Auth redirect URLs. Do not use wildcards.
5. Keep access tokens short-lived, rotate refresh tokens, and set inactivity/session timeouts.
6. Configure HTTPS, HSTS, CSP, `frame-ancestors`, `nosniff`, Referrer-Policy, and Permissions-Policy at the hosting edge.
7. Put the lead endpoint behind Turnstile/hCaptcha, IP and account rate limits, strict schema validation, and request-size limits.
8. Restrict CORS to the canonical site origin. Reject missing or unexpected origins on mutation endpoints.
9. Enable database backups/PITR, alerting for failed logins and publish anomalies, and periodically review `admin_audit_log`.
10. Test RLS using anon, viewer, editor, disabled-admin, aal1, and aal2 sessions before enabling production `/admin`.

## First owner bootstrap

Create the Auth user through a trusted admin channel, then run this once with the returned UUID:

```sql
insert into public.admin_profiles (id, role, is_active, display_name)
values ('AUTH_USER_UUID', 'owner', true, 'Site owner');
```

Never create a database trigger that automatically turns every new Auth user into an admin.
