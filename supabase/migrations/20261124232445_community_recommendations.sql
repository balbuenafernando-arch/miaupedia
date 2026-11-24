begin;

create function public.normalized_catalog_name(value text) returns text
language sql immutable strict parallel safe
set search_path = pg_catalog
as $$
  select regexp_replace(
    translate(lower(value), 'áéíóúü', 'aeiouu'),
    '[[:space:][:punct:]]+', '', 'g'
  );
$$;

alter table public.products
  add column propuesto_por uuid references public.users(id) on delete set null,
  add column duplicado_historico boolean not null default false;

-- Keep historical rows and URLs. Only one existing row per normalized key
-- reserves the key against future inserts.
with ranked as (
  select id, row_number() over (
    partition by public.normalized_catalog_name(nombre),
      (case when categoria in ('Alimentos','Arenas') then categoria else 'Accesorios' end)
    order by publicado desc, created_at nulls last, id
  ) as position
  from public.products
)
update public.products p set duplicado_historico = true
from ranked r where p.id = r.id and r.position > 1;

create unique index products_community_name_uidx on public.products (
  (public.normalized_catalog_name(nombre)),
  (case when categoria in ('Alimentos','Arenas') then categoria else 'Accesorios' end)
) where not duplicado_historico;

-- The catalog does not publish proposer identity. Only operators may publish.
revoke select, insert, update, delete on public.products from public, anon, authenticated;
grant select (id,categoria,nombre,slug,descripcion,imagen,precio_referencia,puntuacion,
  cantidad_resenas,sponsored,created_at,publicado) on public.products to anon, authenticated;
grant insert (nombre,categoria,slug,descripcion,publicado,propuesto_por)
  on public.products to authenticated;

create policy "Verified accounts can propose unpublished products" on public.products
for insert to authenticated with check (
  propuesto_por = (select auth.uid())
  and not coalesce((select auth.jwt() ->> 'is_anonymous') = 'true', false)
  and not publicado
  and not duplicado_historico
  and char_length(public.normalized_catalog_name(nombre)) >= 2
  and char_length(nombre) <= 120
  and (descripcion is null or char_length(descripcion) <= 1000)
);

create function public.valid_product_review_reasons(reasons text[]) returns boolean
language sql immutable strict parallel safe
set search_path = pg_catalog
as $$
  select coalesce(array_ndims(reasons), 1) = 1
    and cardinality(reasons) = count(distinct reason)
    and coalesce(bool_and(reason in ('calidad','precio','aceptacion','facilidad','duracion','otro')), true)
  from unnest(reasons) as reason;
$$;

alter table public.reviews
  add column motivos text[] not null default '{}' check (public.valid_product_review_reasons(motivos)),
  add column duplicado_historico boolean not null default false,
  alter column comentario drop not null,
  drop constraint reviews_comentario_check,
  add constraint reviews_comment_length check (
    (product_id is not null and (comentario is null or char_length(btrim(comentario, E' \n\r\t')) between 1 and 3000)
      and (comentario is null or char_length(comentario) <= 3000))
    or (product_id is null and comentario is not null and char_length(comentario) between 12 and 3000
      and cardinality(motivos) = 0)
  );

with ranked as (
  select id, row_number() over (
    partition by product_id, user_id order by created_at, id
  ) as position
  from public.reviews
  where product_id is not null
)
update public.reviews r set duplicado_historico = true
from ranked d where r.id = d.id and d.position > 1;

create unique index reviews_community_user_product_uidx on public.reviews (product_id,user_id)
where product_id is not null and not duplicado_historico;

-- Historical comments and reviews of other targets keep their existing rules.
alter policy "Product reviews must come from their signed-in author" on public.reviews
with check (
  product_id is null or (
    user_id = (select auth.uid())
    and not coalesce((select auth.jwt() ->> 'is_anonymous') = 'true', false)
    and not duplicado_historico
    and concat_ws(' ', comentario, ventajas, desventajas) !~* '(https?://|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})'
    and (
      (moderation_state = 'pending' and estado = 'En revisión')
      or (
        moderation_state = 'approved' and estado = 'Publicada'
        and concat_ws(' ', comentario, ventajas, desventajas)
          !~* '\m(fraude|estafa|estafador(a)?|robo|ladrón|delito|negligencia|maltrato)\M'
      )
    )
    and business_response is null
    and video_metadata is null
    and cardinality(photos) = 0
    and helpful_count = 0 and unhelpful_count = 0
    and created_at = now() and updated_at = now()
  )
);

commit;
