-- Public demo photo bucket used by item, event, guide and recycling uploads.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'item-photos',
  'item-photos',
  true,
  10 * 1024 * 1024,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types,
    updated_at = now();

drop policy if exists item_photos_select_public on storage.objects;
create policy item_photos_select_public on storage.objects
  for select
  to public
  using (bucket_id = 'item-photos');

drop policy if exists item_photos_insert_authenticated on storage.objects;
create policy item_photos_insert_authenticated on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'item-photos'
    and path_tokens[1] in ('items', 'events', 'giveaways', 'guides', 'recycling', 'sponsors')
  );

drop policy if exists item_photos_update_owner on storage.objects;
create policy item_photos_update_owner on storage.objects
  for update
  to authenticated
  using (bucket_id = 'item-photos' and owner_id = auth.uid()::text)
  with check (bucket_id = 'item-photos' and owner_id = auth.uid()::text);

drop policy if exists item_photos_delete_owner on storage.objects;
create policy item_photos_delete_owner on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'item-photos' and owner_id = auth.uid()::text);
