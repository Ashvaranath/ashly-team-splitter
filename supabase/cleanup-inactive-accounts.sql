-- Auto-delete accounts that have not logged in for 5 continuous months.
-- Already applied on the ashly-team-splitter Supabase project.

create or replace function public.delete_inactive_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  with doomed as (
    select id
    from auth.users
    where coalesce(last_sign_in_at, created_at) < (timezone('utc', now()) - interval '5 months')
  ),
  deleted as (
    delete from auth.users as users
    using doomed
    where users.id = doomed.id
    returning users.id
  )
  select count(*)::integer into deleted_count from deleted;

  return deleted_count;
end;
$$;

revoke all on function public.delete_inactive_accounts() from public;
revoke all on function public.delete_inactive_accounts() from anon, authenticated;
grant execute on function public.delete_inactive_accounts() to postgres, service_role;

comment on function public.delete_inactive_accounts() is
  'Permanently deletes auth users inactive for 5 months (and cascaded ratings).';

create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'delete-inactive-accounts-daily';
exception
  when others then
    null;
end $$;

select cron.schedule(
  'delete-inactive-accounts-daily',
  '0 3 * * *',
  $$select public.delete_inactive_accounts()$$
);
