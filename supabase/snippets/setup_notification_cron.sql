-- Run once in the Supabase SQL Editor after replacing both placeholders.
-- Do not commit real values into this file.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'wowstorg_project_url'
);

select vault.create_secret(
  'REPLACE_WITH_THE_SAME_CRON_SECRET_USED_BY_EDGE_FUNCTIONS',
  'wowstorg_notification_cron_secret'
);

select cron.schedule(
  'wowstorg-process-telegram-notifications',
  '* * * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'wowstorg_project_url'
      ) || '/functions/v1/process-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'wowstorg_notification_cron_secret'
        )
      ),
      body := '{}'::jsonb
    );
  $$
);
