begin;

-- Publish an opaque, deterministic key derived from the existing random UUID.
-- The account UUID and private account metadata remain inaccessible to readers.
alter table public.fijas
  add column author_slug text generated always as
    (pg_catalog.encode(pg_catalog.sha256(pg_catalog.uuid_send(user_id)), 'hex')) stored,
  add column image_url text check (
    image_url like 'https://rwgrntazljuyznzzvfgf.supabase.co/storage/v1/object/public/community-photos/%'
  );
grant select(author_slug,image_url) on public.fijas to anon,authenticated;
create index fijas_author_public_order on public.fijas(author_slug,created_at desc,id) where state='published';

create or replace view public.community_directory with(security_invoker=true) as
  select f.id, 'fija'::text as kind, f.title, f.body, f.location, f.price as price, f.autor, f.created_at, f.utiles,
    f.freshness, null::text as slug, null::text as business_type, null::numeric as average_rating,
    null::bigint as experience_count, concat_ws(' ',f.title,f.body,f.location,f.price) as search_text, f.author_slug, f.image_url
  from public.fijas f where f.business_id is null and f.state='published'
  union all
  select b.id, 'business', b.nombre, b.direccion, b.distrito, null::numeric, null::text,
    coalesce(x.last_at,b.created_at), coalesce(x.total_helps,0)::integer, 'unconfirmed',
    b.slug, b.tipo::text, x.average, x.total,
    concat_ws(' ',b.nombre,b.distrito,b.direccion,b.tipo,case when b.tipo='Pet Shop' then 'tienda mascotas' else 'atención veterinaria' end,x.experiences), null::text, null::text
  from public.businesses b left join lateral (
    select max(f.created_at) as last_at,sum(f.utiles) as total_helps,
      round(avg(f.rating),1) as average,count(*) as total,
      string_agg(concat_ws(' ',f.title,f.body,f.price),' ') as experiences
    from public.fijas f where f.business_id=b.id and f.state='published'
  ) x on true
  where b.community_state='approved' and b.tipo in ('Veterinaria','Pet Shop') and not b.historical_duplicate;

revoke all on public.community_directory from public,anon,authenticated;
grant select on public.community_directory to anon,authenticated;

create or replace function public.search_community(term text, ordering text, page_offset integer)
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
    average_rating,experience_count,search_text,author_slug,image_url from ranked
  order by case when ordering='utiles' then utiles end desc,
    case when coalesce(ordering,'relevantes')='relevantes'
      then rank + least(utiles,20)*0.02
    end desc,
    created_at desc nulls last,id
  limit 21 offset greatest(0,least(coalesce(page_offset,0),2000));
$$;

create view public.public_community_posts with(security_invoker=true) as
  select f.id,f.title,f.body,f.location,f.autor,f.price,f.created_at,f.utiles,
    f.freshness,f.freshness_at,f.business_id,f.rating,f.author_slug,f.image_url
  from public.fijas f
  where f.state='published' and (f.business_id is null or exists (
    select 1 from public.businesses b where b.id=f.business_id and b.community_state='approved'
  ));
revoke all on public.public_community_posts from public,anon,authenticated;
grant select on public.public_community_posts to anon,authenticated;

-- SECURITY DEFINER is needed only to read the account creation timestamp. The
-- explicit visibility check mirrors public RLS and never grants the author's
-- broader access to their pending branch experiences.
create function public.public_community_author(slug text)
returns table(alias text, joined_at timestamptz, useful_votes bigint)
language sql stable security definer set search_path=pg_catalog as $$
  select min(f.autor), u.created_at, sum(f.utiles)::bigint
  from public.fijas f
  join public.users u on u.id = f.user_id
  left join public.businesses b on b.id=f.business_id
  where f.author_slug=$1 and f.state='published'
    and (f.business_id is null or b.community_state='approved')
  group by u.id,u.created_at;
$$;
revoke all on function public.public_community_author(text) from public,anon,authenticated;
grant execute on function public.public_community_author(text) to anon,authenticated;

commit;
