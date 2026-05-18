-- ============================================================
-- Migrate to new pricing model + real Zarja dvorana seat layout
-- ============================================================

-- ---------------- NEW PRICING MODEL ----------------
-- Each show defines absolute prices per ticket-type category.
update public.shows set pricing = '{"polna": 10, "studentska": 8, "upokojenska": 8, "otroska": 6}'::jsonb where id = 'lepotica-in-zver';
update public.shows set pricing = '{"polna": 15, "studentska": 12, "upokojenska": 12, "otroska": 9}'::jsonb where id = 'skrivni-strahovi';
update public.shows set pricing = '{"polna": 12, "studentska": 10, "upokojenska": 10, "otroska": 7}'::jsonb where id = 'mladinska-eksperimentala';
update public.shows set pricing = '{"polna": 15, "studentska": 12, "upokojenska": 12, "otroska": 9}'::jsonb where id = 'goli-pianist';
update public.shows set pricing = '{"polna": 12, "studentska": 10, "upokojenska": 10, "otroska": 7}'::jsonb where id = 'ekskurzija';
update public.shows set pricing = '{"polna": 12, "studentska": 10, "upokojenska": 10, "otroska": 7}'::jsonb where id = 'kaj-bi-che-bi';
update public.shows set pricing = '{"polna": 10, "studentska": 8, "upokojenska": 8, "otroska": 6}'::jsonb where id = 'enakokratki-trikotnik';
update public.shows set pricing = '{"polna": 8, "studentska": 8, "upokojenska": 8, "otroska": 5}'::jsonb where id = 'sneguljcica';
update public.shows set pricing = '{"polna": 8, "studentska": 8, "upokojenska": 8, "otroska": 5}'::jsonb where id = 'pepelka';

-- ---------------- NEW SEAT SCHEMA ----------------
-- Drop and recreate booking_seats with section-based layout.
-- Safe since no real bookings yet.
drop table if exists public.booking_seats cascade;

create table public.booking_seats (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  performance_id uuid not null references public.performances(id),
  row_num integer not null check (row_num between 1 and 10),
  side text not null check (side in ('L','R')),
  seat_num integer not null check (seat_num between 1 and 9),
  ticket_type text not null default 'polna',
  price_eur numeric(10,2) not null,
  unique(performance_id, row_num, side, seat_num)
);

-- Re-enable RLS
alter table public.booking_seats enable row level security;

-- Public can see which seats are taken (needed for the seat picker)
drop policy if exists "public_read_booked_seats" on public.booking_seats;
create policy "public_read_booked_seats" on public.booking_seats
  for select using (true);

-- Admins can write
drop policy if exists "admin_write_booked_seats" on public.booking_seats;
create policy "admin_write_booked_seats" on public.booking_seats
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------- DISCOUNT CATEGORY LABELS ----------------
-- Site-wide labels for the four ticket types. Editable in site_settings.
insert into public.site_settings (key, value, description) values
  ('ticket_label_polna',        'Polna cena',           'Polna cena vstopnice'),
  ('ticket_label_studentska',   'Študentska / dijaška', 'Popust za študente in dijake'),
  ('ticket_label_upokojenska',  'Upokojenska',          'Popust za upokojence'),
  ('ticket_label_otroska',      'Otroška (do 12 let)',  'Popust za otroke')
on conflict (key) do nothing;
