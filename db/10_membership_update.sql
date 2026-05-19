-- ============================================================
-- Membership update — replace ensemble list, fix "ostali"
-- ============================================================

-- 1. Replace the entire "igralci" group with the new 31-person list
delete from public.ensemble_members where group_name = 'igralci';

insert into public.ensemble_members (full_name, role, group_name, display_order) values
('Urška Majcen',           'Igralka, režiserka', 'igralci', 10),
('Ana Klincov',            'Članica',            'igralci', 20),
('Ana Avbreht',            'Članica',            'igralci', 30),
('Anita Repnik',           'Članica',            'igralci', 40),
('Benjamin Mencigar',      'Član',               'igralci', 50),
('Cvetka Videc',           'Igralka',            'igralci', 60),
('Kaja Kmecl',             'Članica',            'igralci', 70),
('Katja Tomažič',          'Članica',            'igralci', 80),
('Kristjan Anej Kramar',   'Član',               'igralci', 90),
('Lejla Ibrahimović',      'Članica',            'igralci', 100),
('Maja Erman',             'Članica',            'igralci', 110),
('Marija Sirk',            'Članica',            'igralci', 120),
('Matevž Starič',          'Član',               'igralci', 130),
('Matjaž Šteiner',         'Član',               'igralci', 140),
('Neja Ropotar - Špelca',  'Članica',            'igralci', 150),
('Nada Jelen',             'Tajnica',            'igralci', 160),
('Neja Mirnik',            'Članica',            'igralci', 170),
('Neli Kamenšek Zatler',   'Članica',            'igralci', 180),
('Niko Korenjak',          'Igralec',            'igralci', 190),
('Sara Tamše',             'Članica',            'igralci', 200),
('Srečko Centrih',         'Igralec',            'igralci', 210),
('Tadej Tiger',            'Član',               'igralci', 220),
('Urban Pajk',             'Podpredsednik',      'igralci', 230),
('Urban Skok',             'Član',               'igralci', 240),
('Vid Žveglič',            'Član',               'igralci', 250),
('Vili Pajk',              'Član',               'igralci', 260),
('Zala Grögl',             'UGC creator',        'igralci', 270),
('Živko Beškovnik',        'Igralec',            'igralci', 280),
('Živa Zorko Centrih',     'Članica',            'igralci', 290),
('Žiga Bedrač',            'Član',               'igralci', 300),
('Žiga Medvešek',          'Igralec, režiser',   'igralci', 310);

-- 2. Remove Silva and Karli from "ostali"
delete from public.ensemble_members
where group_name = 'ostali'
  and full_name in ('Silva Zidanšek', 'Karli Zidanšek');

-- 3. Add Matevž Starič to "ostali" with Marketing role
insert into public.ensemble_members (full_name, role, group_name, position_title, display_order)
values ('Matevž Starič', 'Marketing', 'ostali', 'Marketing', 15);

-- 4. Teatrarij (youth/junior ensemble)
delete from public.ensemble_members where group_name = 'teatrarij';
insert into public.ensemble_members (full_name, role, group_name, display_order) values
('Sola Novak',             'Članica', 'teatrarij', 10),
('Neja Ropotar - Špelca',  'Članica', 'teatrarij', 20),
('Lina Pečenko',           'Članica', 'teatrarij', 30),
('Pia Rejc Vipotnik',      'Članica', 'teatrarij', 40),
('Gašper Rizmal',          'Član',    'teatrarij', 50),
('Maruša Bevc Ribarič',    'Članica', 'teatrarij', 60),
('Nejc Bevc Ribarič',      'Član',    'teatrarij', 70),
('Milenca Stepišnik',      'Članica', 'teatrarij', 80),
('Ajda Verblač',           'Članica', 'teatrarij', 90),
('Eneja Cvetič',           'Članica', 'teatrarij', 100),
('Lara Ignjatovič',        'Članica', 'teatrarij', 110);
