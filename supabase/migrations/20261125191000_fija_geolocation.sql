begin;
create table public.fija_locations (
  fija_id uuid primary key references public.fijas(id) on delete cascade,
  lat double precision not null check(lat between -90 and 90),
  lon double precision not null check(lon between -180 and 180),
  label text not null check(char_length(btrim(label)) between 1 and 120),
  district text check(char_length(district)<=80),
  province text check(char_length(province)<=80),
  region text check(char_length(region)<=80),
  country text check(char_length(country)<=80)
);
create index fija_locations_lat_lon on public.fija_locations(lat,lon);
alter table public.fija_locations enable row level security;
revoke all on public.fija_locations from public,anon,authenticated;
grant select on public.fija_locations to anon,authenticated;
create policy "Read confirmed locations of public fijas" on public.fija_locations
  for select to anon,authenticated using (public.community_public_fija(fija_id));

create function public.owns_fija(target uuid) returns boolean
language sql stable security definer set search_path=pg_catalog as $$
select exists(select 1 from public.fijas f where id=target and f.user_id=(select auth.uid()) and state='published')
  and not coalesce((select auth.jwt()->>'is_anonymous')='true',false)
$$;
revoke all on function public.owns_fija(uuid) from public,anon;
grant execute on function public.owns_fija(uuid) to authenticated;

create function public.save_fija_location(target uuid, pin jsonb, text_location text default null)
returns void language plpgsql security definer set search_path=pg_catalog as $$
begin
  if not public.owns_fija(target) then raise insufficient_privilege; end if;
  perform 1 from public.fijas where id=target and user_id=auth.uid() and state='published' for update;
  if not found then raise insufficient_privilege; end if;
  if pin is null then
    delete from public.fija_locations where fija_id=target;
    update public.fijas set location=nullif(left(btrim(text_location),120),'') where id=target;
    return;
  end if;
  insert into public.fija_locations(fija_id,lat,lon,label,district,province,region,country)
    values(target,(pin->>'lat')::float8,(pin->>'lon')::float8,btrim(pin->>'label'),
      nullif(btrim(pin->>'district'),''),nullif(btrim(pin->>'province'),''),nullif(btrim(pin->>'region'),''),nullif(btrim(pin->>'country'),''))
  on conflict(fija_id) do update set lat=excluded.lat,lon=excluded.lon,label=excluded.label,
    district=excluded.district,province=excluded.province,region=excluded.region,country=excluded.country;
  update public.fijas set location=left(concat_ws(', ',nullif(btrim(pin->>'label'),''),
    nullif(btrim(pin->>'district'),''),nullif(btrim(pin->>'region'),'')),120) where id=target;
end $$;
revoke all on function public.save_fija_location(uuid,jsonb,text) from public,anon;
grant execute on function public.save_fija_location(uuid,jsonb,text) to authenticated;

create function public.publish_fija_with_pin(
  post_id uuid, post_title text, post_body text, post_location text, post_price numeric,
  branch_id uuid, stars smallint, branch_type public.business_type,
  branch_name text, branch_district text, branch_address text, pin jsonb
) returns uuid language plpgsql security invoker set search_path=pg_catalog as $$
declare result uuid;
begin
  result:=public.pasar_la_voz(post_id,post_title,post_body,post_location,post_price,
    branch_id,stars,branch_type,branch_name,branch_district,branch_address);
  perform public.save_fija_location(result,pin);
  return result;
end $$;
revoke all on function public.publish_fija_with_pin(uuid,text,text,text,numeric,uuid,smallint,public.business_type,text,text,text,jsonb) from public,anon;
grant execute on function public.publish_fija_with_pin(uuid,text,text,text,numeric,uuid,smallint,public.business_type,text,text,text,jsonb) to authenticated;

create function public.nearby_fijas(term text, latitude float8, longitude float8, radius integer, page_offset integer)
returns table(id uuid,kind text,title text,body text,location text,price numeric,autor text,created_at timestamptz,
  utiles integer,freshness text,author_slug text,image_url text,distance_km float8)
language sql stable security invoker set search_path=pg_catalog as $$
  with matches as (
    select f.id,'fija'::text as kind,f.title,f.body,f.location,coalesce(d.price,f.price) as price,f.autor,f.created_at,
      f.utiles,f.freshness,f.author_slug,f.image_url,
      12742 * asin(sqrt(least(1,
        sin(radians(l.lat-latitude)/2)^2 + cos(radians(latitude))*cos(radians(l.lat))*sin(radians(l.lon-longitude)/2)^2
      ))) as distance
    from public.fija_locations l
    join public.public_community_posts f on f.id=l.fija_id
    left join public.community_directory d on d.id=f.id and d.kind='fija'
    cross join lateral (select btrim(left(coalesce(term,''),120)) as q,
      coalesce(d.search_text,concat_ws(' ',f.title,f.body,f.location,f.price)) as document) s
    where latitude between -90 and 90 and longitude between -180 and 180 and radius in (1,5,10,25)
      and l.lat between latitude-radius/110.5 and latitude+radius/110.5
      and (s.q='' or to_tsvector('spanish',s.document) @@ plainto_tsquery('spanish',s.q)
        or (public.normalized_catalog_name(s.q)<>'' and strpos(public.normalized_catalog_name(s.document),public.normalized_catalog_name(s.q))>0))
  )
  select id,kind,title,body,location,price,autor,created_at,utiles,freshness,author_slug,image_url,distance
  from matches where distance<=radius order by distance,id limit 21 offset greatest(0,least(coalesce(page_offset,0),2000))
$$;
revoke all on function public.nearby_fijas(text,float8,float8,integer,integer) from public;
grant execute on function public.nearby_fijas(text,float8,float8,integer,integer) to anon,authenticated;
commit;
