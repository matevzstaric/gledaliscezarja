-- ============================================================
-- 'portraits' bucket for ensemble member photos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('portraits', 'portraits', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_portraits"  on storage.objects;
drop policy if exists "admin_write_portraits"  on storage.objects;
drop policy if exists "admin_update_portraits" on storage.objects;
drop policy if exists "admin_delete_portraits" on storage.objects;

create policy "public_read_portraits"
  on storage.objects for select
  using (bucket_id = 'portraits');

create policy "admin_write_portraits"
  on storage.objects for insert
  with check (bucket_id = 'portraits' and public.is_admin());

create policy "admin_update_portraits"
  on storage.objects for update
  using (bucket_id = 'portraits' and public.is_admin())
  with check (bucket_id = 'portraits' and public.is_admin());

create policy "admin_delete_portraits"
  on storage.objects for delete
  using (bucket_id = 'portraits' and public.is_admin());

-- Same for sponsor logos
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_logos"  on storage.objects;
drop policy if exists "admin_write_logos"  on storage.objects;
drop policy if exists "admin_update_logos" on storage.objects;
drop policy if exists "admin_delete_logos" on storage.objects;

create policy "public_read_logos"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "admin_write_logos"
  on storage.objects for insert
  with check (bucket_id = 'logos' and public.is_admin());

create policy "admin_update_logos"
  on storage.objects for update
  using (bucket_id = 'logos' and public.is_admin())
  with check (bucket_id = 'logos' and public.is_admin());

create policy "admin_delete_logos"
  on storage.objects for delete
  using (bucket_id = 'logos' and public.is_admin());
