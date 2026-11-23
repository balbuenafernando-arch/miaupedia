begin;
alter table public.peru_locations enable row level security;
revoke insert, update, delete, truncate, references, trigger on public.peru_locations from anon, authenticated;
grant select on public.peru_locations to anon, authenticated;
create policy "Public read access to geographic names"
  on public.peru_locations for select to anon, authenticated using (true);
commit;
