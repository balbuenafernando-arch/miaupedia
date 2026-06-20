-- MIAUPEDIA MVP · Esquema PostgreSQL/Supabase
-- Ejecutar una vez en Supabase > SQL Editor. Auth administra auth.users.
create extension if not exists "pgcrypto";

create type public.business_type as enum ('Veterinaria','Pet Shop','Hotel Felino','Cuidador');
create type public.product_category as enum ('Alimentos','Arenas','Juguetes','Rascadores','Transportadoras','Fuentes de agua','Accesorios');
create type public.review_state as enum ('Nueva','En conversación','Resuelta','Cerrada');
create type public.reminder_type as enum ('Cumpleaños','Vacuna','Desparasitación');
create type public.trust_level as enum ('Básico','Activo','Confiable','Experto');

-- Perfil público mínimo asociado 1:1 con Supabase Auth.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, display_name text, role text not null default 'owner' check (role in ('owner','business','admin')),
  trust_level trust_level not null default 'Básico', onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.cats (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  nombre text not null, foto text, sexo text not null check (sexo in ('Hembra','Macho')), edad int check (edad between 0 and 30),
  fecha_nacimiento date, peso numeric(4,1) check (peso > 0), raza text, esterilizado boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.cat_preferences (
  id uuid primary key default gen_random_uuid(), cat_id uuid not null unique references public.cats(id) on delete cascade,
  alimentos text[] not null default '{}', arenas text[] not null default '{}', juguetes text[] not null default '{}'
);
create table public.peru_locations (
  id bigint generated always as identity primary key, departamento text not null, provincia text not null, distrito text not null,
  unique(departamento,provincia,distrito)
);
create table public.businesses (
  id uuid primary key default gen_random_uuid(), owner_id uuid references public.users(id) on delete set null, tipo business_type not null,
  nombre text not null, slug text not null unique, descripcion text, direccion text, departamento text default 'Lima', provincia text default 'Lima', distrito text not null,
  telefono text, sitio_web text, horario jsonb not null default '{}', imagen text, fotografias text[] not null default '{}', puntuacion numeric(2,1) not null default 0,
  cantidad_resenas int not null default 0, emergencia_24h boolean default false, hospitalizacion boolean default false, laboratorio boolean default false,
  ecografia boolean default false, cirugia boolean default false, atencion_frecuente_gatos boolean default false, exclusiva_gatos boolean default false,
  claimed boolean default false, featured boolean default false, created_at timestamptz default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), categoria product_category not null, nombre text not null, slug text not null unique,
  descripcion text, imagen text, precio_referencia numeric(10,2), puntuacion numeric(2,1) default 0, cantidad_resenas int default 0,
  sponsored boolean default false, created_at timestamptz default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade, product_id uuid references public.products(id) on delete cascade,
  puntuacion int not null check (puntuacion between 1 and 5), comentario text not null check (char_length(comentario) between 12 and 3000),
  estado review_state not null default 'Nueva', helpful_count int not null default 0, unhelpful_count int not null default 0,
  business_response text, moderation_state text not null default 'approved' check (moderation_state in ('pending','approved','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((business_id is not null)::int + (product_id is not null)::int = 1)
);
create table public.follows (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade, product_id uuid references public.products(id) on delete cascade,
  created_at timestamptz default now(), check ((business_id is not null)::int + (product_id is not null)::int = 1)
);
create unique index follows_business_unique on public.follows(user_id,business_id) where business_id is not null;
create unique index follows_product_unique on public.follows(user_id,product_id) where product_id is not null;
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  titulo text not null, mensaje text not null, tipo text, leida boolean not null default false, created_at timestamptz default now()
);
create table public.reminders (
  id uuid primary key default gen_random_uuid(), cat_id uuid not null references public.cats(id) on delete cascade,
  tipo reminder_type not null, fecha date not null, descripcion text not null, completed boolean default false, created_at timestamptz default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(), sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade, business_id uuid references public.businesses(id), created_at timestamptz default now(),
  check (sender_id <> receiver_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade, contenido text not null check (char_length(contenido) between 1 and 2000), created_at timestamptz default now()
);
create table public.collections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.users(id) on delete cascade,
  nombre text not null, created_at timestamptz default now(), unique(user_id,nombre)
);
create table public.collection_items (
  id uuid primary key default gen_random_uuid(), collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade, business_id uuid references public.businesses(id) on delete cascade,
  created_at timestamptz default now(), check ((business_id is not null)::int + (product_id is not null)::int = 1)
);
create table public.review_reports (
  id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade, reason text not null, status text default 'open', created_at timestamptz default now(),
  unique(review_id,reporter_id)
);
create table public.promotions (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null, description text, starts_at timestamptz, ends_at timestamptz, sponsored boolean default false, active boolean default true
);
create table public.business_metrics (
  business_id uuid primary key references public.businesses(id) on delete cascade, profile_views int default 0, updated_at timestamptz default now()
);

-- Índices para las búsquedas principales.
create index businesses_district_idx on public.businesses(distrito);
create index businesses_type_idx on public.businesses(tipo);
create index products_category_idx on public.products(categoria);
create index reviews_business_idx on public.reviews(business_id,created_at desc);
create index reviews_product_idx on public.reviews(product_id,created_at desc);
create index reminders_date_idx on public.reminders(fecha);

-- Crea perfil y colecciones iniciales tras un registro Auth.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.users(id,email,display_name) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'display_name','Miauamigo'));
  insert into public.collections(user_id,nombre) values(new.id,'Favoritos'),(new.id,'Quiero comprar'),(new.id,'Veterinarias guardadas'),(new.id,'Productos para probar');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- RLS: contenido público legible; datos personales solo para su propietario.
do $$ declare t text; begin foreach t in array array['users','cats','cat_preferences','businesses','products','reviews','follows','notifications','reminders','conversations','messages','collections','collection_items','review_reports','promotions','business_metrics'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy "public users" on public.users for select using (true);
create policy "own user" on public.users for update using (auth.uid()=id);
create policy "public businesses" on public.businesses for select using (true);
create policy "owners update business" on public.businesses for update using (auth.uid()=owner_id);
create policy "public products" on public.products for select using (true);
create policy "public approved reviews" on public.reviews for select using (moderation_state='approved');
create policy "authors insert reviews" on public.reviews for insert with check (auth.uid()=user_id);
create policy "authors update reviews" on public.reviews for update using (auth.uid()=user_id);
create policy "authors delete reviews" on public.reviews for delete using (auth.uid()=user_id);
create policy "own cats" on public.cats for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own cat preferences" on public.cat_preferences for all using (exists(select 1 from public.cats c where c.id=cat_id and c.user_id=auth.uid()));
create policy "own follows" on public.follows for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own notifications" on public.notifications for select using (auth.uid()=user_id);
create policy "own reminders" on public.reminders for all using (exists(select 1 from public.cats c where c.id=cat_id and c.user_id=auth.uid()));
create policy "conversation members" on public.conversations for select using (auth.uid() in (sender_id,receiver_id));
create policy "start conversation" on public.conversations for insert with check (auth.uid()=sender_id);
create policy "conversation messages" on public.messages for select using (exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in (c.sender_id,c.receiver_id)));
create policy "send messages" on public.messages for insert with check (auth.uid()=sender_id and exists(select 1 from public.conversations c where c.id=conversation_id and auth.uid() in (c.sender_id,c.receiver_id)));
create policy "own collections" on public.collections for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own collection items" on public.collection_items for all using (exists(select 1 from public.collections c where c.id=collection_id and c.user_id=auth.uid()));
create policy "report reviews" on public.review_reports for insert with check (auth.uid()=reporter_id);
create policy "own reports" on public.review_reports for select using (auth.uid()=reporter_id);
create policy "public promotions" on public.promotions for select using (active=true);

-- Los administradores pueden moderar sin exponer esta capacidad al cliente normal.
create policy "admin moderation" on public.reviews for all using (exists(select 1 from public.users u where u.id=auth.uid() and u.role='admin'));
