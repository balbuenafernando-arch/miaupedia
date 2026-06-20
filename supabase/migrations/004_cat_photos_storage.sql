-- Bucket público para fotos de perfil de gatos.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('cat-photos','cat-photos',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "owners upload cat photos" on storage.objects;
create policy "owners upload cat photos" on storage.objects for insert to authenticated
with check (bucket_id='cat-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "owners update cat photos" on storage.objects;
create policy "owners update cat photos" on storage.objects for update to authenticated
using (bucket_id='cat-photos' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "owners delete cat photos" on storage.objects;
create policy "owners delete cat photos" on storage.objects for delete to authenticated
using (bucket_id='cat-photos' and (storage.foldername(name))[1]=auth.uid()::text);
