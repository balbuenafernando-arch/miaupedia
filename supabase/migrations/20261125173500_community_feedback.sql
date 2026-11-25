begin;
create table public.community_feedback (
  id uuid primary key,
  category text not null check (category in ('sugerencia','problema','comentario')),
  content text not null check (char_length(content) between 10 and 1000),
  user_id uuid references auth.users(id) on delete set null,
  sender_key text not null,
  created_at timestamptz not null default now()
);
alter table public.community_feedback enable row level security;
revoke all on public.community_feedback from public, anon, authenticated;
grant select(id,category,content,user_id,created_at) on public.community_feedback to authenticated;
create policy "Authorized administrators read feedback" on public.community_feedback
  for select to authenticated using (exists(select 1 from public.users
    where id=(select auth.uid()) and role='admin'));

create index community_feedback_recent_sender on public.community_feedback(sender_key,created_at desc);
create index community_feedback_recent on public.community_feedback(created_at desc);
create function public.submit_community_feedback(request_id uuid, category text, content text, device_id uuid)
returns void language plpgsql security definer set search_path=pg_catalog as $$
declare
  actual_user uuid := auth.uid();
  message text := btrim($3);
  sender text;
begin
  if $1 is null or $4 is null or $2 is null or $2 not in ('sugerencia','problema','comentario')
    or message is null or char_length(message) not between 10 and 1000 then
    raise exception using errcode='22023',message='invalid_feedback';
  end if;
  sender := encode(sha256(convert_to(coalesce('user:'||actual_user::text,'device:'||$4::text),'UTF8')), 'hex');
  perform pg_advisory_xact_lock(hashtextextended(sender,0));
  if exists(select 1 from public.community_feedback f where f.id=$1 and f.sender_key=sender) then return; end if;
  if exists(select 1 from public.community_feedback f where f.sender_key=sender and f.category=$2 and
       lower(regexp_replace(f.content,'[[:space:]]+',' ','g'))=lower(regexp_replace(message,'[[:space:]]+',' ','g'))
       and f.created_at>now()-interval '24 hours') then return; end if;
  if (select count(*) from public.community_feedback f where f.sender_key=sender and f.created_at>now()-interval '1 hour')>=3
    or (select count(*) from public.community_feedback f where f.created_at>now()-interval '1 minute')>=40 then
    raise exception using errcode='P0001',message='feedback_rate_limit';
  end if;
  insert into public.community_feedback(id,category,content,user_id,sender_key) values($1,$2,message,actual_user,sender);
end;
$$;
revoke all on function public.submit_community_feedback(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.submit_community_feedback(uuid,text,text,uuid) to anon,authenticated;
commit;
