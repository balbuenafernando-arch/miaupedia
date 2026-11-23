begin;
alter table public.products add column publicado boolean not null default true;

create policy "Only published products appear in the catalog"
  on public.products as restrictive for select to anon, authenticated
  using (publicado);

create policy "Product reviews require a published product for public access"
  on public.reviews as restrictive for select to anon, authenticated
  using (
    product_id is null or user_id = (select auth.uid())
    or exists (select 1 from public.products p where p.id = product_id and p.publicado)
  );

create policy "Product reviews require a published product for submission"
  on public.reviews as restrictive for insert to authenticated
  with check (
    product_id is null
    or exists (select 1 from public.products p where p.id = product_id and p.publicado)
  );
commit;
