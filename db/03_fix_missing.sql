-- Create the 5 missing tables
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  tier text not null,
  website_url text,
  display_order integer default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  description text,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  email text primary key,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  performance_id uuid not null references public.performances(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  total_eur numeric(10,2) not null,
  status text not null default 'pending',
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
  unique(performance_id, row_num, seat_num)
);

-- Bootstrap admin user
insert into public.admin_users (email, full_name)
values ('matevz.staric@gmail.com', 'Matevz Staric')
on conflict (email) do nothing;
