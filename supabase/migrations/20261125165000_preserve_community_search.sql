begin;

-- Keep existing price lookup and result ordering after removing the vigencia UI.
create or replace view public.community_directory with(security_invoker=true) as
  select f.id, 'fija'::text as kind, f.title, f.body, f.location, coalesce(latest.price,f.price) as price, f.autor, f.created_at, f.utiles,
    f.freshness, null::text as slug, null::text as business_type, null::numeric as average_rating,
    null::bigint as experience_count, concat_ws(' ',f.title,f.body,f.location,f.price,latest.price) as search_text, f.author_slug, f.image_url
  from public.fijas f left join lateral (
    select u.price from public.fija_updates u where u.fija_id=f.id and u.state='published' and u.kind='price'
    order by u.created_at desc,u.id desc limit 1
  ) latest on true where f.business_id is null and f.state='published'
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
      then rank + least(utiles,20)*0.02 + case freshness when 'changed' then -0.1 when 'confirmed' then 0.1 else 0 end
    end desc,
    created_at desc nulls last,id
  limit 21 offset greatest(0,least(coalesce(page_offset,0),2000));
$$;

commit;
