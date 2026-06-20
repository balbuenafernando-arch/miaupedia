-- Persistencia de fichas demo durante pruebas con sesiones Supabase existentes.
alter table public.reviews add column if not exists demo_listing_id int;
alter table public.reviews drop constraint if exists reviews_check;
alter table public.reviews drop constraint if exists reviews_single_target;
alter table public.reviews add constraint reviews_single_target check (
  (business_id is not null)::int + (product_id is not null)::int + (demo_listing_id is not null)::int = 1
);

create table if not exists public.demo_follows (
  user_id uuid not null references public.users(id) on delete cascade,
  listing_id int not null,
  created_at timestamptz default now(),
  primary key(user_id,listing_id)
);
alter table public.demo_follows enable row level security;
drop policy if exists "own demo follows" on public.demo_follows;
create policy "own demo follows" on public.demo_follows for all
  using (auth.uid()=user_id) with check (auth.uid()=user_id);
