-- ============================================================
-- Row Level Security: policies & helper function
-- ============================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Enable RLS on all tables
alter table public.shows             enable row level security;
alter table public.performances      enable row level security;
alter table public.ensemble_members  enable row level security;
alter table public.awards            enable row level security;
alter table public.sponsors          enable row level security;
alter table public.site_settings     enable row level security;
alter table public.admin_users       enable row level security;
alter table public.bookings          enable row level security;
alter table public.booking_seats     enable row level security;

-- PUBLIC READS
drop policy if exists "public_read_shows" on public.shows;
create policy "public_read_shows" on public.shows for select using (status in ('active','upcoming') or public.is_admin());

drop policy if exists "public_read_performances" on public.performances;
create policy "public_read_performances" on public.performances for select using (status in ('scheduled','sold_out') or public.is_admin());

drop policy if exists "public_read_ensemble" on public.ensemble_members;
create policy "public_read_ensemble" on public.ensemble_members for select using (active = true or public.is_admin());

drop policy if exists "public_read_awards" on public.awards;
create policy "public_read_awards" on public.awards for select using (true);

drop policy if exists "public_read_sponsors" on public.sponsors;
create policy "public_read_sponsors" on public.sponsors for select using (active = true or public.is_admin());

drop policy if exists "public_read_settings" on public.site_settings;
create policy "public_read_settings" on public.site_settings for select using (true);

drop policy if exists "public_read_booked_seats" on public.booking_seats;
create policy "public_read_booked_seats" on public.booking_seats for select using (true);

-- ADMIN POLICIES
drop policy if exists "admin_read_allowlist" on public.admin_users;
create policy "admin_read_allowlist" on public.admin_users for select using (public.is_admin());

drop policy if exists "admin_write_allowlist" on public.admin_users;
create policy "admin_write_allowlist" on public.admin_users for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_shows" on public.shows;
create policy "admin_write_shows" on public.shows for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_performances" on public.performances;
create policy "admin_write_performances" on public.performances for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_ensemble" on public.ensemble_members;
create policy "admin_write_ensemble" on public.ensemble_members for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_awards" on public.awards;
create policy "admin_write_awards" on public.awards for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_sponsors" on public.sponsors;
create policy "admin_write_sponsors" on public.sponsors for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_settings" on public.site_settings;
create policy "admin_write_settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_read_bookings" on public.bookings;
create policy "admin_read_bookings" on public.bookings for select using (public.is_admin());

drop policy if exists "admin_write_bookings" on public.bookings;
create policy "admin_write_bookings" on public.bookings for all using (public.is_admin()) with check (public.is_admin());
