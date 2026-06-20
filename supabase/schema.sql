create extension if not exists "uuid-ossp";

create type public.user_role as enum ('owner','business','admin');
create type public.review_status as enum ('new','in_conversation','resolved','closed');

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  role user_role not null default 'owner',
  trust_level text not null default 'Básico',
  created_at timestamptz not null default now()
);
create table public.cats (
  id uuid primary key default uuid_generate_v4(), owner_id uuid not null references public.profiles on delete cascade,
  name text not null, photo_url text, sex text, birth_date date, weight_kg numeric(4,1), breed text,
  sterilized boolean default false, preferences jsonb default '{}'::jsonb, created_at timestamptz default now()
);
create table public.listings (
  id uuid primary key default uuid_generate_v4(), owner_id uuid references public.profiles,
  name text not null, category text not null, description text, address text, district text,
  phone text, website text, hours jsonb, photos text[], price_from numeric(10,2), claimed boolean default false,
  sponsored boolean default false, created_at timestamptz default now()
);
create table public.reviews (
  id uuid primary key default uuid_generate_v4(), listing_id uuid not null references public.listings on delete cascade,
  author_id uuid not null references public.profiles, rating int check (rating between 1 and 5), comment text not null,
  status review_status default 'new', helpful_count int default 0, business_response text,
  moderation_state text default 'pending', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.follows (
  user_id uuid references public.profiles on delete cascade, listing_id uuid references public.listings on delete cascade,
  created_at timestamptz default now(), primary key(user_id,listing_id)
);
create table public.reminders (
  id uuid primary key default uuid_generate_v4(), cat_id uuid references public.cats on delete cascade,
  kind text check (kind in ('birthday','vaccine','deworming')), title text not null, due_at timestamptz not null,
  completed boolean default false, created_at timestamptz default now()
);
create table public.reports (
  id uuid primary key default uuid_generate_v4(), reporter_id uuid references public.profiles,
  review_id uuid references public.reviews on delete cascade, reason text not null, state text default 'open', created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.cats enable row level security;
alter table public.listings enable row level security;
alter table public.reviews enable row level security;
alter table public.follows enable row level security;
alter table public.reminders enable row level security;

create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Owners manage own profile" on public.profiles for all using (auth.uid() = id);
create policy "Owners manage cats" on public.cats for all using (auth.uid() = owner_id);
create policy "Listings are public" on public.listings for select using (true);
create policy "Claimed owners update listings" on public.listings for update using (auth.uid() = owner_id);
create policy "Reviews are public" on public.reviews for select using (moderation_state <> 'rejected');
create policy "Users create reviews" on public.reviews for insert with check (auth.uid() = author_id);
create policy "Authors update reviews" on public.reviews for update using (auth.uid() = author_id);
create policy "Users manage follows" on public.follows for all using (auth.uid() = user_id);
create policy "Users manage reminders" on public.reminders for all using (exists (select 1 from public.cats where cats.id = reminders.cat_id and cats.owner_id = auth.uid()));
