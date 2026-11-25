begin;

-- The existing public projection intentionally withholds user_id. The owner
-- can list their posts without exposing that column through PostgREST.
create function public.own_community_posts(page_offset integer default 0)
returns table (
  id uuid, title text, body text, location text, autor text, price numeric,
  created_at timestamptz, utiles integer, freshness text, freshness_at timestamptz,
  business_id uuid, rating smallint, pending boolean
)
language sql stable security definer set search_path = pg_catalog
as $$
  select f.id, f.title, f.body, f.location, f.autor, f.price, f.created_at,
    f.utiles, f.freshness, f.freshness_at, f.business_id, f.rating,
    coalesce(b.community_state = 'pending', false)
  from public.fijas f
  left join public.businesses b on b.id = f.business_id
  where f.user_id = (select auth.uid())
    and not coalesce((select auth.jwt()->>'is_anonymous') = 'true', false)
    and f.state = 'published'
    and (f.business_id is null or b.community_state in ('approved','pending'))
  order by f.created_at desc, f.id
  limit 21 offset greatest(0, page_offset);
$$;

revoke all on function public.own_community_posts(integer) from public, anon;
grant execute on function public.own_community_posts(integer) to authenticated;

commit;
