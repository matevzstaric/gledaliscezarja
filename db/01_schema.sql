-- ============================================================
-- Gledališče Zarja Celje — database schema
-- Run this in Supabase SQL Editor (paste & Run).
-- Safe to re-run: uses 'if not exists' where possible.
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- SHOWS ------------------------------------------------------
create table if not exists public.shows (
  id text primary key,                          -- slug, e.g. 'goli-pianist'
  title text not null,
  type text not null,                           -- 'Otroška', 'Komedija', etc.
  director text not null,
  duration_minutes integer not null,
  description text,
  pricing jsonb not null default '{"A":15,"B":12,"C":9}'::jsonb,
  poster_url text,                              -- Supabase Storage URL
  poster_title text,                            -- stylized text for the placeholder poster
  season text,                                  -- 'Sezona 2025/26', etc.
  status text not null default 'active',        -- 'active' | 'archived' | 'upcoming'
  display_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- PERFORMANCES -----------------------------------------------
create table if not exists public.performances (
  id uuid primary key default gen_random_uuid(),
  show_id text not null references public.shows(id) on delete cascade,
  performance_date date not null,
  performance_time time not null,
  status text not null default 'scheduled',     -- 'scheduled' | 'cancelled' | 'sold_out'
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(show_id, performance_date, performance_time)
);

create index if not exists performances_date_idx on public.performances(performance_date);

-- ENSEMBLE MEMBERS -------------------------------------------
create table if not exists public.ensemble_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null,                           -- 'Igralec', 'Režiserka', etc.
  group_name text not null,                     -- 'igralci' | 'tehnika' | 'vodstvo' | 'ostali'
  position_title text,                          -- 'Predsednik', 'Tajnica' (for leadership)
  portrait_url text,
  display_order integer default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- AWARDS -----------------------------------------------------
create table if not exists public.awards (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  category text not null,                       -- e.g. 'Sklad Staneta Severja'
  recipient text,                               -- person name (nullable for production awards)
  role_or_description text,                     -- 'vloga Katurian' / 'Srebrni celjski grb'
  show_title text,                              -- 'Blazinec' (nullable)
  is_highlight boolean default false,           -- show on home news strip
  display_order integer default 0,
  created_at timestamptz not null default now()
);

create index if not exists awards_year_idx on public.awards(year desc);

-- SPONSORS ---------------------------------------------------
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  tier text not null,                           -- 'sponsor' | 'donor' | 'media'
  website_url text,
  display_order integer default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- SITE SETTINGS (key/value) ----------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text,
  description text,                             -- humans editing this should see why it exists
  updated_at timestamptz not null default now()
);

-- ADMIN ALLOWLIST --------------------------------------------
-- A simple list of email addresses allowed to admin the site.
-- Supabase Auth handles the actual sign-in; we just check membership here.
create table if not exists public.admin_users (
  email text primary key,
  full_name text,
  created_at timestamptz not null default now()
);

-- BOOKINGS (phase 2) -----------------------------------------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  total_eur numeric(10,2) not null,
  status text not null default 'pending',       -- pending | paid | refunded | cancelled
  stripe_session_id text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_performance_idx on public.bookings(performance_id);
create index if not exists bookings_email_idx on public.bookings(customer_email);

create table if not exists public.booking_seats (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  performance_id uuid not null references public.performances(id),
  row_num integer not null check (row_num between 1 and 10),
  seat_num integer not null check (seat_num between 1 and 15),
  tier text not null,
  price_eur numeric(10,2) not null,
  unique(performance_id, row_num, seat_num)     -- prevents double-booking the same seat
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- updated_at auto-bump
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_shows on public.shows;
create trigger set_updated_at_shows before update on public.shows
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_performances on public.performances;
create trigger set_updated_at_performances before update on public.performances
  for each row execute function public.set_updated_at();

-- Is the current authenticated user in the admin allowlist?
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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.shows             enable row level security;
alter table public.performances      enable row level security;
alter table public.ensemble_members  enable row level security;
alter table public.awards            enable row level security;
alter table public.sponsors          enable row level security;
alter table public.site_settings     enable row level security;
alter table public.admin_users       enable row level security;
alter table public.bookings          enable row level security;
alter table public.booking_seats     enable row level security;

-- ---- PUBLIC READS ------------------------------------------
-- Anyone (anon key) can read active content
drop policy if exists "public_read_shows" on public.shows;
create policy "public_read_shows" on public.shows
  for select using (status in ('active','upcoming') or public.is_admin());

drop policy if exists "public_read_performances" on public.performances;
create policy "public_read_performances" on public.performances
  for select using (status in ('scheduled','sold_out') or public.is_admin());

drop policy if exists "public_read_ensemble" on public.ensemble_members;
create policy "public_read_ensemble" on public.ensemble_members
  for select using (active = true or public.is_admin());

drop policy if exists "public_read_awards" on public.awards;
create policy "public_read_awards" on public.awards
  for select using (true);

drop policy if exists "public_read_sponsors" on public.sponsors;
create policy "public_read_sponsors" on public.sponsors
  for select using (active = true or public.is_admin());

drop policy if exists "public_read_settings" on public.site_settings;
create policy "public_read_settings" on public.site_settings
  for select using (true);

-- Booked seats are needed by the booking page (to grey them out)
drop policy if exists "public_read_booked_seats" on public.booking_seats;
create policy "public_read_booked_seats" on public.booking_seats
  for select using (true);

-- ---- ADMIN ALLOWLIST POLICIES -------------------------------
drop policy if exists "admin_read_allowlist" on public.admin_users;
create policy "admin_read_allowlist" on public.admin_users
  for select using (public.is_admin());

drop policy if exists "admin_write_allowlist" on public.admin_users;
create policy "admin_write_allowlist" on public.admin_users
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- ADMIN WRITES ON ALL CONTENT ----------------------------
drop policy if exists "admin_write_shows" on public.shows;
create policy "admin_write_shows" on public.shows
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_performances" on public.performances;
create policy "admin_write_performances" on public.performances
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_ensemble" on public.ensemble_members;
create policy "admin_write_ensemble" on public.ensemble_members
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_awards" on public.awards;
create policy "admin_write_awards" on public.awards
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_sponsors" on public.sponsors;
create policy "admin_write_sponsors" on public.sponsors
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_write_settings" on public.site_settings;
create policy "admin_write_settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- BOOKINGS: admins read everything; writes go via server later ---
drop policy if exists "admin_read_bookings" on public.bookings;
create policy "admin_read_bookings" on public.bookings
  for select using (public.is_admin());

drop policy if exists "admin_write_bookings" on public.bookings;
create policy "admin_write_bookings" on public.bookings
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- BOOTSTRAP: add yourself as the first admin
-- ============================================================
insert into public.admin_users (email, full_name)
values ('matevz.staric@gmail.com', 'Matevž Starič')
on conflict (email) do nothing;
