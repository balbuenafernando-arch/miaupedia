begin;

-- Profiles contain email addresses and a role used by the moderation policy.
-- Account creation still runs through the Auth trigger with its own privileges.
revoke all on public.users from public, anon, authenticated;
grant select (id, role) on public.users to authenticated;
alter policy "public users" on public.users to authenticated
  using (id = (select auth.uid()));
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Data API grants are explicit on new Supabase projects. Ownership is checked
-- by the existing RLS policies for these tables.
grant select, insert, update, delete on
  public.cats, public.cat_preferences, public.reminders, public.demo_follows
  to authenticated;
grant update, delete on public.reviews to authenticated;

commit;
