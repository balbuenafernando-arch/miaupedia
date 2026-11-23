begin;

alter table public.reviews
  add column ventajas text check (char_length(ventajas) <= 500),
  add column desventajas text check (char_length(desventajas) <= 500);

grant select on public.products, public.reviews to anon, authenticated;
grant insert on public.reviews to authenticated;
-- The existing moderation policy reads the profile role for authenticated callers.
grant select (id, role) on public.users to authenticated;
alter policy "admin moderation" on public.reviews to authenticated;

create policy "Authors can read their own product reviews"
  on public.reviews for select to authenticated
  using (product_id is not null and user_id = (select auth.uid()));

-- Restrictive policies also apply when another existing policy grants access.
create policy "Product reviews are public when approved"
  on public.reviews as restrictive for select to anon, authenticated
  using (
    product_id is null
    or moderation_state = 'approved'
    or user_id = (select auth.uid())
  );

create policy "Product reviews must come from their signed-in author"
  on public.reviews as restrictive for insert to anon, authenticated
  with check (
    product_id is null or (
      user_id = (select auth.uid())
      and not coalesce((select auth.jwt() ->> 'is_anonymous') = 'true', false)
      and char_length(btrim(comentario, E' \n\r\t')) >= 12
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

-- Product moderation is managed from the dashboard by a database operator.
create policy "Product reviews are moderated by database operators"
  on public.reviews as restrictive for update to anon, authenticated
  using (product_id is null)
  with check (product_id is null);

create policy "Only authors can delete their product reviews through the API"
  on public.reviews as restrictive for delete to anon, authenticated
  using (product_id is null or user_id = (select auth.uid()));

create index reviews_public_product_page_idx
  on public.reviews (product_id, created_at desc, id desc)
  where product_id is not null and moderation_state = 'approved';

commit;
