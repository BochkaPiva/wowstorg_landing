-- The cron job is installed by the configure_notification_cron migration.
-- Before applying it to a new environment, create these Vault secrets in the
-- Supabase Dashboard under Integrations > Vault:
--
--   wowstorg_project_url
--   wowstorg_notification_cron_secret
--
-- The second value must match the CRON_SECRET Edge Function secret.
-- Never store either real value in this repository.

select
  jobid,
  jobname,
  schedule,
  active
from cron.job
where jobname = 'wowstorg-process-telegram-notifications';
