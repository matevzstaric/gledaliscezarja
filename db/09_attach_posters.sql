-- ============================================================
-- Wire each show's poster_url to the file uploaded to Storage.
-- Assumes you uploaded files named exactly as the show id (slug),
-- using .png. If you used .jpg or different names, edit the URLs.
-- ============================================================

-- Public URL pattern for a Supabase storage object in a public bucket:
--   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<filename>

update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/lepotica-in-zver.jpg'        where id = 'lepotica-in-zver';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/skrivni-strahovi.jpg'        where id = 'skrivni-strahovi';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/mladinska-eksperimentala.jpg' where id = 'mladinska-eksperimentala';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/goli-pianist.jpg'            where id = 'goli-pianist';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/ekskurzija.jpg'              where id = 'ekskurzija';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/kaj-bi-che-bi.jpg'           where id = 'kaj-bi-che-bi';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/enakokratki-trikotnik.jpg'   where id = 'enakokratki-trikotnik';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/sneguljcica.jpg'             where id = 'sneguljcica';
update public.shows set poster_url = 'https://ldlvwsgjjisfqangdcfw.supabase.co/storage/v1/object/public/posters/pepelka.jpg'                 where id = 'pepelka';
