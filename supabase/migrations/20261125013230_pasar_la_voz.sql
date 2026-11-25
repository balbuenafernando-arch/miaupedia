begin;

-- These privileges are unrelated to row-level application access.
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

create schema if not exists community_internal;
revoke all on schema community_internal from public, anon, authenticated;

create table public.community_documents (
  document text not null,
  version text not null,
  current_version boolean not null default false,
  primary key (document,version)
);
create unique index community_document_current on public.community_documents(document) where current_version;
create table public.community_acceptances (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  primary key(user_id,document,version),
  foreign key(document,version) references public.community_documents(document,version)
);
insert into public.community_documents(document,version,current_version) values
  ('terminos','1.0',true), ('privacidad','1.0',true), ('normas','1.0',true);

alter table public.community_documents enable row level security;
alter table public.community_acceptances enable row level security;
revoke all on public.community_documents,public.community_acceptances from public,anon,authenticated;
grant select on public.community_documents to anon,authenticated;
grant select, insert(document,version) on public.community_acceptances to authenticated;
create policy "Community document versions are public" on public.community_documents for select to anon,authenticated using(true);
create policy "Accounts read their own acceptance" on public.community_acceptances for select to authenticated using(user_id=(select auth.uid()));
create policy "Accounts record their own current acceptance" on public.community_acceptances for insert to authenticated with check(
  user_id=(select auth.uid()) and not coalesce((select auth.jwt()->>'is_anonymous')='true',false)
  and exists(select 1 from public.community_documents d where d.document=community_acceptances.document
    and d.version=community_acceptances.version and d.current_version)
);

create function public.community_can_write() returns boolean
language sql stable set search_path=pg_catalog
as $$
  select auth.uid() is not null and not coalesce(auth.jwt()->>'is_anonymous'='true',false)
    and exists(select 1 from public.community_documents d where d.current_version)
    and not exists(select 1 from public.community_documents d where d.current_version and not exists (
      select 1 from public.community_acceptances a where a.user_id=auth.uid()
        and a.document=d.document and a.version=d.version));
$$;
revoke all on function public.community_can_write() from public,anon;
grant execute on function public.community_can_write() to authenticated;

alter table public.businesses
  add column community_state text not null default 'approved' check(community_state in ('pending','approved','rejected','hidden')),
  add column proposed_by uuid references auth.users(id) on delete set null,
  add column community_proposal boolean not null default false,
  add column historical_duplicate boolean not null default false;

-- Retain any historical duplicates while reserving each existing branch key.
with ranked as (
  select id, row_number() over(partition by tipo, public.normalized_catalog_name(nombre),
    public.normalized_catalog_name(distrito),public.normalized_catalog_name(direccion)
    order by created_at nulls last,id) as position
  from public.businesses where tipo in ('Veterinaria','Pet Shop') and direccion is not null
)
update public.businesses b set historical_duplicate=true from ranked r where b.id=r.id and r.position>1;

create unique index businesses_community_branch_uidx on public.businesses (
  tipo, public.normalized_catalog_name(nombre), public.normalized_catalog_name(distrito),
  public.normalized_catalog_name(direccion)
) where tipo in ('Veterinaria','Pet Shop') and not historical_duplicate;

revoke select,insert,update,delete on public.businesses from public,anon,authenticated;
grant select(id,tipo,nombre,slug,descripcion,direccion,departamento,provincia,distrito,telefono,
  sitio_web,horario,imagen,fotografias,puntuacion,cantidad_resenas,emergencia_24h,hospitalizacion,
  laboratorio,ecografia,cirugia,atencion_frecuente_gatos,exclusiva_gatos,claimed,featured,created_at,community_state,historical_duplicate)
  on public.businesses to anon,authenticated;
grant insert(id,tipo,nombre,slug,distrito,direccion,community_state,proposed_by,community_proposal)
  on public.businesses to authenticated;
grant update(descripcion,direccion,telefono,sitio_web,horario,imagen,fotografias,emergencia_24h,
  hospitalizacion,laboratorio,ecografia,cirugia,atencion_frecuente_gatos,exclusiva_gatos)
  on public.businesses to authenticated;
alter policy "public businesses" on public.businesses using(community_state='approved');
create policy "Authors can see their own pending business" on public.businesses for select to authenticated
  using(proposed_by=(select auth.uid()) and community_state='pending');
create policy "Accounts can only propose pending branches" on public.businesses for insert to authenticated with check(
  (select public.community_can_write()) and proposed_by=(select auth.uid()) and community_proposal
  and community_state='pending' and tipo in ('Veterinaria','Pet Shop')
  and char_length(nombre) between 2 and 120 and char_length(distrito) between 2 and 80
  and char_length(direccion) between 4 and 180 and char_length(public.normalized_catalog_name(direccion)) >= 4
);

create table public.fijas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor text not null default ('Miauamigo ' || upper(left(auth.uid()::text,6))),
  title text not null check(char_length(btrim(title)) between 3 and 100),
  body text not null check(char_length(btrim(body)) between 5 and 2000),
  location text check(char_length(location)<=120),
  price numeric(10,2) check(price>=0),
  business_id uuid references public.businesses(id),
  rating smallint check(rating between 1 and 5),
  state text not null default 'published' check(state in ('published','hidden')),
  utiles integer not null default 0 check(utiles>=0),
  freshness text not null default 'unconfirmed' check(freshness in ('unconfirmed','confirmed','changed')),
  freshness_at timestamptz,
  created_at timestamptz not null default now(),
  check((business_id is null)=(rating is null))
);
create index fijas_business_recent on public.fijas(business_id,created_at desc);
create index fijas_recent on public.fijas(created_at desc,id);
create unique index fijas_one_experience on public.fijas(business_id,user_id) where business_id is not null;

create table public.fija_comments (
  id uuid primary key default gen_random_uuid(),
  fija_id uuid not null references public.fijas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autor text not null default ('Miauamigo ' || upper(left(auth.uid()::text,6))),
  body text not null check(char_length(btrim(body)) between 2 and 1000),
  state text not null default 'published' check(state in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index fija_comments_listing on public.fija_comments(fija_id,created_at,id);

create table public.fija_votes (
  fija_id uuid not null references public.fijas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  primary key (fija_id,user_id)
);
create table public.fija_saves (
  fija_id uuid not null references public.fijas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (fija_id,user_id)
);
create index fija_saves_account on public.fija_saves(user_id,created_at desc);

create table public.fija_updates (
  id uuid primary key default gen_random_uuid(),
  fija_id uuid not null references public.fijas(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check(kind in ('confirmed','price','availability','closed','other')),
  note text check(char_length(note)<=400),
  price numeric(10,2) check(price>=0),
  state text not null default 'published' check(state in ('published','hidden')),
  created_at timestamptz not null default clock_timestamp(),
  check((kind='price')=(price is not null))
);
create index fija_updates_listing on public.fija_updates(fija_id,created_at desc,id desc);

create table public.fija_reports (
  id uuid primary key default gen_random_uuid(),
  fija_id uuid not null references public.fijas(id) on delete cascade,
  comment_id uuid references public.fija_comments(id) on delete cascade,
  update_id uuid references public.fija_updates(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason text not null check(reason in ('spam','abuse','personal_data','false_information','other')),
  state text not null default 'open' check(state in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now(),
  check(num_nonnulls(comment_id,update_id)<=1),
  unique nulls not distinct (fija_id,comment_id,update_id,user_id)
);

create table public.community_moderation_log (
  id bigint generated always as identity primary key,
  entity text not null,
  entity_id uuid not null,
  previous_state text not null,
  new_state text not null,
  actor uuid,
  changed_at timestamptz not null default now()
);

do $$
declare target text;
begin
  foreach target in array array['fijas','fija_comments','fija_votes','fija_saves','fija_updates','fija_reports','community_moderation_log']
  loop
    execute format('alter table public.%I enable row level security', target);
    execute format('revoke all on public.%I from public,anon,authenticated', target);
  end loop;
end $$;

grant select(id,autor,title,body,location,price,business_id,rating,state,utiles,freshness,freshness_at,created_at)
  on public.fijas to anon,authenticated;
grant insert(id,title,body,location,price,business_id,rating) on public.fijas to authenticated;
grant select(id,fija_id,autor,body,state,created_at) on public.fija_comments to anon,authenticated;
grant insert(id,fija_id,body) on public.fija_comments to authenticated;
grant select(fija_id,user_id),insert(fija_id),delete on public.fija_votes to authenticated;
grant select(fija_id,user_id,created_at),insert(fija_id),delete on public.fija_saves to authenticated;
grant select(id,fija_id,kind,note,price,state,created_at) on public.fija_updates to anon,authenticated;
grant insert(id,fija_id,kind,note,price) on public.fija_updates to authenticated;
grant insert(fija_id,comment_id,update_id,reason) on public.fija_reports to authenticated;

create policy "Public fijas" on public.fijas for select to anon,authenticated using(state='published' and
  (business_id is null or exists(select 1 from public.businesses b where b.id=business_id and b.community_state='approved')));
create policy "Authors read their own pending experiences" on public.fijas for select to authenticated using (
  user_id=(select auth.uid()) and state='published' and business_id is not null);
create policy "Accounts publish their own experiences" on public.fijas for insert to authenticated with check(
  user_id=(select auth.uid()) and (select public.community_can_write()) and
  (business_id is null or exists(select 1 from public.businesses b where b.id=business_id and b.tipo in ('Veterinaria','Pet Shop')
    and b.community_state in ('approved','pending')))
);

create function public.community_public_fija(target uuid) returns boolean
language sql stable set search_path=pg_catalog as $$
  select exists(select 1 from public.fijas f where f.id=target and f.state='published'
    and (f.business_id is null or exists(select 1 from public.businesses b where b.id=f.business_id and b.community_state='approved')));
$$;

create policy "Published comments" on public.fija_comments for select to anon,authenticated
  using(state='published' and public.community_public_fija(fija_id));
create policy "Accounts post comments" on public.fija_comments for insert to authenticated
  with check(user_id=(select auth.uid()) and (select public.community_can_write()) and public.community_public_fija(fija_id));
create policy "Accounts read their votes" on public.fija_votes for select to authenticated using(user_id=(select auth.uid()));
create policy "Accounts vote on public fijas" on public.fija_votes for insert to authenticated
  with check(user_id=(select auth.uid()) and (select public.community_can_write()) and public.community_public_fija(fija_id));
create policy "Accounts undo their votes" on public.fija_votes for delete to authenticated using(user_id=(select auth.uid()));
create policy "Accounts read their saved fijas" on public.fija_saves for select to authenticated using(user_id=(select auth.uid()));
create policy "Accounts save public fijas" on public.fija_saves for insert to authenticated
  with check(user_id=(select auth.uid()) and (select public.community_can_write()) and public.community_public_fija(fija_id));
create policy "Accounts remove their saves" on public.fija_saves for delete to authenticated using(user_id=(select auth.uid()));
create policy "Public updates on public fijas" on public.fija_updates for select to anon,authenticated
  using(state='published' and public.community_public_fija(fija_id));
create policy "Accounts confirm or update public fijas" on public.fija_updates for insert to authenticated
  with check(user_id=(select auth.uid()) and (select public.community_can_write()) and public.community_public_fija(fija_id));
create policy "Accounts can report published content" on public.fija_reports for insert to authenticated with check(
  user_id=(select auth.uid()) and (select public.community_can_write()) and public.community_public_fija(fija_id)
  and (comment_id is null or exists(select 1 from public.fija_comments c where c.id=comment_id and c.fija_id=fija_reports.fija_id))
  and (update_id is null or exists(select 1 from public.fija_updates u where u.id=update_id and u.fija_id=fija_reports.fija_id))
);

-- Counters and moderation history cannot be altered through the application.
create function community_internal.community_vote_count() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
  if tg_op='INSERT' then
    update public.fijas set utiles=utiles+1 where id=new.fija_id;
    return new;
  end if;
  update public.fijas set utiles=greatest(utiles-1,0) where id=old.fija_id;
  return old;
end $$;
create trigger fija_vote_count after insert or delete on public.fija_votes
  for each row execute function community_internal.community_vote_count();

create function community_internal.community_freshness() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare latest public.fija_updates%rowtype;
begin
  perform 1 from public.fijas where id=new.fija_id for update;
  select * into latest from public.fija_updates where fija_id=new.fija_id and state='published'
    order by created_at desc,id desc limit 1;
  update public.fijas set freshness=case when latest.id is null then 'unconfirmed'
    when latest.kind='confirmed' then 'confirmed' else 'changed' end,
    freshness_at=latest.created_at where id=new.fija_id;
  return new;
end $$;
create trigger fija_freshness after insert or update of state on public.fija_updates
  for each row execute function community_internal.community_freshness();

create function community_internal.record_moderation() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare before_state text := to_jsonb(old)->>tg_argv[0];
declare after_state text := to_jsonb(new)->>tg_argv[0];
begin
  if before_state is distinct from after_state then
    insert into public.community_moderation_log(entity,entity_id,previous_state,new_state,actor)
      values(tg_table_name,new.id,before_state,after_state,auth.uid());
  end if;
  return new;
end $$;
create trigger business_moderation after update of community_state on public.businesses
  for each row execute function community_internal.record_moderation('community_state');
create trigger fija_moderation after update of state on public.fijas
  for each row execute function community_internal.record_moderation('state');
create trigger comment_moderation after update of state on public.fija_comments
  for each row execute function community_internal.record_moderation('state');
create trigger update_moderation after update of state on public.fija_updates
  for each row execute function community_internal.record_moderation('state');
create trigger report_moderation after update of state on public.fija_reports
  for each row execute function community_internal.record_moderation('state');
revoke all on all functions in schema community_internal from public,anon,authenticated;

create function public.pasar_la_voz(
  post_id uuid, post_title text, post_body text, post_location text, post_price numeric,
  branch_id uuid, stars smallint, branch_type public.business_type,
  branch_name text, branch_district text, branch_address text
) returns uuid language plpgsql security invoker set search_path=pg_catalog as $$
declare target_id uuid := branch_id;
begin
  if branch_name is not null and branch_id is not null then raise exception 'Seleccione una sola sede'; end if;
  if branch_name is not null then
    -- Also match previously cataloged branches without rekeying or replacing them.
    if exists(select 1 from public.businesses b where b.tipo=branch_type
      and public.normalized_catalog_name(b.nombre)=public.normalized_catalog_name(branch_name)
      and public.normalized_catalog_name(b.distrito)=public.normalized_catalog_name(branch_district)
      and public.normalized_catalog_name(b.direccion)=public.normalized_catalog_name(branch_address))
    then raise unique_violation using message='Esta sede ya existe'; end if;
    target_id := gen_random_uuid();
    insert into public.businesses(id,tipo,nombre,slug,distrito,direccion,community_state,proposed_by,community_proposal)
      values(target_id,branch_type,branch_name,'sede-'||target_id,branch_district,branch_address,'pending',auth.uid(),true);
  end if;
  insert into public.fijas(id,title,body,location,price,business_id,rating)
    values(post_id,post_title,post_body,post_location,post_price,target_id,stars);
  return post_id;
end $$;
revoke all on function public.pasar_la_voz(uuid,text,text,text,numeric,uuid,smallint,public.business_type,text,text,text) from public,anon;
grant execute on function public.pasar_la_voz(uuid,text,text,text,numeric,uuid,smallint,public.business_type,text,text,text) to authenticated;

create view public.community_directory with(security_invoker=true) as
  select f.id, 'fija'::text as kind, f.title, f.body, f.location, coalesce(latest.price,f.price) as price, f.autor, f.created_at, f.utiles,
    f.freshness, null::text as slug, null::text as business_type, null::numeric as average_rating,
    null::bigint as experience_count, concat_ws(' ',f.title,f.body,f.location,f.price,latest.price) as search_text
  from public.fijas f left join lateral (
    select u.price from public.fija_updates u where u.fija_id=f.id and u.state='published' and u.kind='price'
    order by u.created_at desc,u.id desc limit 1
  ) latest on true where f.business_id is null and f.state='published'
  union all
  select b.id, 'business', b.nombre, b.direccion, b.distrito, null::numeric, null::text,
    coalesce(x.last_at,b.created_at), coalesce(x.total_helps,0)::integer, 'unconfirmed',
    b.slug, b.tipo::text, x.average, x.total,
    concat_ws(' ',b.nombre,b.distrito,b.direccion,b.tipo,case when b.tipo='Pet Shop' then 'tienda mascotas' else 'atención veterinaria' end,x.experiences)
  from public.businesses b left join lateral (
    select max(f.created_at) as last_at,sum(f.utiles) as total_helps,
      round(avg(f.rating),1) as average,count(*) as total,
      string_agg(concat_ws(' ',f.title,f.body,f.price),' ') as experiences
    from public.fijas f where f.business_id=b.id and f.state='published'
  ) x on true
  where b.community_state='approved' and b.tipo in ('Veterinaria','Pet Shop') and not b.historical_duplicate;

revoke all on public.community_directory from public,anon,authenticated;
grant select on public.community_directory to anon,authenticated;

create function public.search_community(term text, ordering text, page_offset integer)
returns setof public.community_directory language sql stable set search_path=pg_catalog as $$
  with q as (
    select btrim(left(coalesce(term,''),120)) as raw
  ), ranked as (
    select d.*, ts_rank_cd(to_tsvector('spanish',d.search_text),plainto_tsquery('spanish',q.raw)) as rank
    from public.community_directory d cross join q
    where q.raw='' or to_tsvector('spanish',d.search_text) @@ plainto_tsquery('spanish',q.raw)
       or (public.normalized_catalog_name(q.raw)<>'' and
        strpos(public.normalized_catalog_name(d.search_text),public.normalized_catalog_name(q.raw))>0)
  )
  select id,kind,title,body,location,price,autor,created_at,utiles,freshness,slug,business_type,
    average_rating,experience_count,search_text from ranked
  order by case when ordering='utiles' then utiles end desc,
    case when coalesce(ordering,'relevantes')='relevantes'
      then rank + least(utiles,20)*0.02 + case freshness when 'changed' then -0.1 when 'confirmed' then 0.1 else 0 end
    end desc,
    created_at desc nulls last,id
  limit 21 offset greatest(0,least(coalesce(page_offset,0),2000));
$$;
revoke all on function public.search_community(text,text,integer) from public;
grant execute on function public.search_community(text,text,integer) to anon,authenticated;

commit;
