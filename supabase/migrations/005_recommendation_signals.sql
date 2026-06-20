-- Señales anónimas y mínimas para recomendaciones basadas en comportamiento real.
-- No expone nombre del gato, usuario, foto, peso ni fecha de nacimiento exacta.
create or replace function public.recommendation_signals()
returns table (
  cat_id uuid, breed text, birth_date text, sterilized boolean,
  lifestyle text, preferences text[], listing_id integer, would_choose_again boolean
)
language sql
security definer
set search_path = public
as $$
  select c.id, coalesce(c.raza, ''),
    case when c.fecha_nacimiento is null then '' else extract(year from c.fecha_nacimiento)::integer::text || '-01-01' end,
    coalesce(c.esterilizado, false), coalesce(c.tipo_vida, 'Interior'),
    coalesce(p.alimentos, '{}') || coalesce(p.arenas, '{}') || coalesce(p.juguetes, '{}'),
    f.listing_id, true
  from public.demo_follows f
  join public.cats c on c.user_id = f.user_id
  left join public.cat_preferences p on p.cat_id = c.id
  where auth.uid() is not null;
$$;

revoke all on function public.recommendation_signals() from public;
grant execute on function public.recommendation_signals() to authenticated;
