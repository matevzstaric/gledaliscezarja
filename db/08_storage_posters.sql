-- ============================================================
-- Create public 'posters' bucket for show poster images
-- ============================================================

-- Create the bucket (public so anon visitors can load images directly)
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do update set public = true;

-- ---------- RLS policies on storage.objects ----------
-- Drop any prior versions of our policies (idempotent re-run)
drop policy if exists "public_read_posters"  on storage.objects;
drop policy if exists "admin_write_posters"  on storage.objects;
drop policy if exists "admin_update_posters" on storage.objects;
drop policy if exists "admin_delete_posters" on storage.objects;

-- Anyone can read poster files
create policy "public_read_posters"
  on storage.objects
  for select
  using (bucket_id = 'posters');

-- Only allowlisted admins can upload / update / delete
create policy "admin_write_posters"
  on storage.objects
  for insert
  with check (bucket_id = 'posters' and public.is_admin());

create policy "admin_update_posters"
  on storage.objects
  for update
  using (bucket_id = 'posters' and public.is_admin())
  with check (bucket_id = 'posters' and public.is_admin());

create policy "admin_delete_posters"
  on storage.objects
  for delete
  using (bucket_id = 'posters' and public.is_admin());
