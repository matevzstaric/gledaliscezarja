-- ============================================================
-- Gledališče Zarja Celje — seed data
-- ============================================================

-- ---------------- SHOWS ----------------
insert into public.shows (id, title, type, director, duration_minutes, description, pricing, season, status, display_order) values
('lepotica-in-zver', 'Lepotica in zver', 'Otroška', 'Urška Majcen', 40,
 'Letošnja pravljica nagovarja predvsem pojem lepote v današnjem svetu — kako jo najdemo in prepoznamo znotraj sebe, ne le zunaj. Spodbujanje prepoznave pristne lepote v vsakem posamezniku.',
 '{"A":10,"B":8,"C":6}'::jsonb, 'Sezona 2025/26', 'upcoming', 10),

('skrivni-strahovi', 'Skrivni strahovi na javnih krajih', 'Odrasla', 'Jaša Jamnik', 90,
 'Predstava v nastajanju — odrasel projekt sezone 2025/2026.',
 '{"A":15,"B":12,"C":9}'::jsonb, 'Sezona 2025/26', 'upcoming', 20),

('mladinska-eksperimentala', 'Mladinska eksperimentalna predstava', 'Eksperimentalna', 'Žiga Medvešek', 60,
 'Predstava v nastajanju — eksperimentalni projekt sezone.',
 '{"A":12,"B":10,"C":8}'::jsonb, 'Sezona 2025/26', 'upcoming', 30),

('goli-pianist', 'Goli pianist', 'Komedija', 'Jaša Jamnik', 70,
 'Absurdna komedija o stanovanjskem bloku, kjer vsak posega v intimo drugega. Skozi komične zaplete nastavi družbi zrcalo. Nagrajenec Festivala komedije Pekre 2025.',
 '{"A":18,"B":14,"C":10}'::jsonb, 'Stalni repertoar', 'active', 40),

('ekskurzija', 'Ekskurzija', 'Socialna komedija', 'Žiga Medvešek', 60,
 'Po motivih romana Očarljivi skupinski samomor. Skupina neznancev se odpravi na potovanje, ki jim za vedno spremeni življenje na bolje.',
 '{"A":14,"B":11,"C":8}'::jsonb, 'Stalni repertoar', 'active', 50),

('kaj-bi-che-bi', 'Kaj bi Che bi', 'Monokomedija', 'Nuša Komplet Peperko', 50,
 'Zabavni prelet življenja in dela enega največjih revolucionarjev — Ernesta Che Guevare. Učna ura zgodovine z iskreno željo po uporu.',
 '{"A":12,"B":10,"C":8}'::jsonb, 'Stalni repertoar', 'active', 60),

('enakokratki-trikotnik', 'Enakokratki trikotnik', 'Mladinska socialna drama', 'Žiga Medvešek', 45,
 'Mladinska socialna drama. Premiera junij 2024.',
 '{"A":10,"B":8,"C":6}'::jsonb, 'Stalni repertoar', 'active', 70),

('sneguljcica', 'Sneguljčica', 'Otroška', 'Žiga Medvešek', 30,
 'Kultna otroška pravljica o premoči dobrega nad zlim — o složnosti, različnosti in sožitju vseh drugačnosti.',
 '{"A":9,"B":7,"C":5}'::jsonb, 'Stalni repertoar', 'active', 80),

('pepelka', 'Pepelka', 'Otroška', 'Urška Majcen', 40,
 'Klasična pravljica o moči iskrene ljubezni, družbeni razslojenosti in povezanosti najbolj iskrenih bitij.',
 '{"A":10,"B":8,"C":6}'::jsonb, 'Stalni repertoar', 'active', 90)
on conflict (id) do nothing;

-- ---------------- PERFORMANCES ----------------
insert into public.performances (show_id, performance_date, performance_time) values
('lepotica-in-zver', '2026-12-03', '17:00'),
('lepotica-in-zver', '2026-12-04', '17:00'),
('lepotica-in-zver', '2026-12-05', '11:00'),
('skrivni-strahovi', '2026-10-09', '20:00'),
('skrivni-strahovi', '2026-10-23', '20:00'),
('skrivni-strahovi', '2026-11-06', '20:00'),
('goli-pianist',     '2026-05-22', '20:00'),
('goli-pianist',     '2026-06-05', '20:00'),
('ekskurzija',       '2026-06-12', '20:00'),
('ekskurzija',       '2026-06-13', '20:00'),
('sneguljcica',      '2026-05-30', '11:00'),
('pepelka',          '2026-05-23', '11:00')
on conflict (show_id, performance_date, performance_time) do nothing;

-- ---------------- ENSEMBLE MEMBERS ----------------
insert into public.ensemble_members (full_name, role, group_name, position_title, display_order) values
('Alen Mastnak',        'Igralec',              'igralci', null, 10),
('Cvetka Videc',        'Igralka',              'igralci', null, 20),
('Cvetka Jovan Jekl',   'Igralka',              'igralci', null, 30),
('Luka Žerjav',         'Igralec',              'igralci', null, 40),
('Nejc Jezernik',       'Igralec',              'igralci', null, 50),
('Neža Strenčan',       'Igralka',              'igralci', null, 60),
('Niko Korenjak',       'Igralec',              'igralci', null, 70),
('Polonca Rošer',       'Igralka',              'igralci', null, 80),
('Srečko Centrih',      'Igralec',              'igralci', null, 90),
('Urška Majcen',        'Igralka, režiserka',   'igralci', null, 100),
('Žiga Medvešek',       'Igralec, režiser',     'igralci', null, 110),
('Živko Beškovnik',     'Igralec',              'igralci', null, 120),
('Karli Zidanšek',      'Tehnični skrbnik',     'tehnika', null, 10),
('Tomaž Krajnc',        'Režija',               'tehnika', null, 20),
('Jaša Jamnik',         'Režija',               'tehnika', null, 30),
('Nuša Komplet Peperko','Režija',               'tehnika', null, 40),
('Zala Grögl',          'UGC creator',          'tehnika', null, 50),
('Žiga Medvešek',       'Predsednik',           'vodstvo', 'Predsednik',     10),
('Urban Pajk',          'Podpredsednik',        'vodstvo', 'Podpredsednik',  20),
('Nada Jelen',          'Tajnica',              'vodstvo', 'Tajnica',        30),
('Silva Zidanšek',      'Blagajničarka',        'ostali',  'Blagajničarka',  10),
('Zala Grögl',          'UGC creator',          'ostali',  'UGC creator',    20),
('Karli Zidanšek',      'Tehnični skrbnik',     'ostali',  'Tehnični skrbnik', 30);

-- ---------------- AWARDS ----------------
insert into public.awards (year, category, recipient, role_or_description, show_title, is_highlight, display_order) values
(2002, 'Mestna občina Celje', null, 'Srebrni celjski grb za več kot 50 let delovanja na področju kulture', null, false, 10),
(2015, 'Mestna občina Celje', null, 'Priznanje Celjske Zvezde za najvidnejše dosežke', null, false, 20),
(1980, 'Sklad Staneta Severja', 'Cvetka Videc',     null,                              null, false, 100),
(1989, 'Sklad Staneta Severja', 'Srečko Centrih',   null,                              null, false, 110),
(2015, 'Sklad Staneta Severja', 'Nejc Jezernik',    null,                              null, false, 120),
(2017, 'Sklad Staneta Severja', 'Alen Mastnak',     null,                              null, false, 130),
(2011, 'Linhartova listina',    'Cvetka Jovan Jekl','Linhartova listina',              null, false, 200),
(2015, 'Linhartova listina',    'Živko Beškovnik',  'Linhartova plaketa',              null, false, 210),
(2019, 'Linhartova listina',    'Tomaž Krajnc',     'Zlati znak JSKD',                 null, false, 220),
(2013, 'Matiček - Linhartovo srečanje', 'Neža Strenčan', 'vloga Nora 1',          'Nora Nora', false, 300),
(2015, 'Matiček - Linhartovo srečanje', 'Nejc Jezernik', 'vloga Michael',         'Blazinec',  false, 310),
(2015, 'Matiček - Linhartovo srečanje', 'Žiga Medvešek', 'vloga Ariel',           'Blazinec',  false, 320),
(2015, 'Matiček - Linhartovo srečanje', 'Tomaž Krajnc',  'rezija predstave',      'Blazinec',  false, 330),
(2015, 'Matiček - Linhartovo srečanje', null,            'najboljša predstava strokovne komisije', 'Blazinec', false, 340),
(2007, 'Posebna priznanja', 'Živko Beškovnik', 'Čufarjeva plaketa, vloga Lovec',  'Gospod Lovec',          false, 400),
(2015, 'Posebna priznanja', 'Živko Beškovnik', 'posebno priznanje, vloga Tupolski','Blazinec',             false, 410),
(2016, 'Posebna priznanja', 'Tomaž Krajnc',    'posebno priznanje za rezijo',     'MacBeth',               false, 420),
(2022, 'Posebna priznanja', 'Žiga Medvešek',   'uprizoritev klasične drame',      'Pod svobodnim soncem',  false, 430),
(2025, 'Posebna priznanja', null,              'Najboljša predstava Festivala komedije Pekre', 'Goli pianist', true, 440),
(2015, 'Mednarodne nagrade - Repassage Fest', 'Alen Mastnak',  'igralec večera, vloga Katurian',     'Blazinec', false, 500),
(2015, 'Mednarodne nagrade - Repassage Fest', 'Nejc Jezernik', 'najboljša moška vloga, vloga Michael','Blazinec', false, 510),
(2011, 'Priznanja regijskih selektorjev', 'Urška Majcen',    'vloga Veronika',                            'Skrivnost gradu Ojstrica', false, 600),
(2015, 'Priznanja regijskih selektorjev', 'Alen Mastnak',    'vloga Katurian',                            'Blazinec',                 false, 610),
(2015, 'Priznanja regijskih selektorjev', 'Žiga Medvešek',   'vloga Ariel',                               'Blazinec',                 false, 620),
(2015, 'Priznanja regijskih selektorjev', 'Polonca Rošer',   'več vlog',                                  'Triko',                    false, 630),
(2017, 'Priznanja regijskih selektorjev', 'Žiga Medvešek',   'glavna moška vloga, vloga Vanja',           'Vanja',                    false, 640),
(2017, 'Priznanja regijskih selektorjev', 'Alen Mastnak',    'stranska moška vloga, vloga Astrov',        'Vanja',                    false, 650),
(2019, 'Priznanja regijskih selektorjev', 'Niko Korenjak',   'stranska moška vloga, vloga Hall',          'Plen',                     false, 660),
(2023, 'Priznanja regijskih selektorjev', 'Luka Žerjav',     'glavna moška vloga, vloga Mebiuse',         'Fiziki',                   false, 670),
(2023, 'Priznanja regijskih selektorjev', 'Srečko Centrih',  'stranska moška vloga, Inšpektor',           'Fiziki',                   false, 680),
(2023, 'Priznanja regijskih selektorjev', 'Urška Majcen',    'glavna ženska vloga, dr. Matilda Vonzahn',  'Fiziki',                   false, 690);

-- ---------------- SPONSORS ----------------
insert into public.sponsors (name, tier, display_order) values
('JSKD',                'sponsor', 10),
('MOC',                 'sponsor', 20),
('ZKD Celje',           'sponsor', 30),
('Grafika Gracer',      'sponsor', 40),
('Bimex',               'sponsor', 50),
('AGRAM gradbeništvo',  'sponsor', 60),
('MANSION',             'sponsor', 70),
('Kopirnica TOMI',      'sponsor', 80),
('XREARTIST',           'sponsor', 90),
('AHAC',                'sponsor', 100),
('Novi Tednik',         'media',   10),
('Radio Celje',         'media',   20),
('TV Celje',            'media',   30),
('Celje.info',          'media',   40),
('Celjan',              'media',   50),
('V Celu dogaja',       'media',   60);

-- ---------------- SITE SETTINGS ----------------
insert into public.site_settings (key, value, description) values
('contact_email_general',  'info@kud-zarja.si',                'Splošni e-naslov'),
('contact_email_tech',     'tehnika@kud-zarja.si',             'E-naslov za tehniko'),
('contact_phone_president','041 744 654',                      'Telefon predsednika (Žiga Medvešek)'),
('contact_phone_vicepres', '051 687 954',                      'Telefon podpredsednika (Urban Pajk)'),
('address_line1',          'Kulturniška ulica 4',              'Naslov, vrstica 1'),
('address_line2',          '3000 Celje',                       'Naslov, vrstica 2'),
('legal_name',             'Kulturno umetniško društvo Zarja Trnovlje — Celje', 'Polno pravno ime'),
('tax_number',             'SI83484388',                       'Davčna številka'),
('registration_number',    '5015103000',                       'Matična številka'),
('news_strip_text',        'Predstava Goli pianist prejela nagrado za najboljšo predstavo Festivala komedije Pekre 2025.', 'Besedilo v rdečem traku na vrhu domače strani'),
('news_strip_link_url',    '/o-nas.html#nagrade',              'Povezava ob novici v traku'),
('news_strip_link_text',   'Vse nagrade →',                    'Besedilo povezave v traku'),
('hero_eyebrow',           'Premiera sezone',                  'Manjše besedilo nad naslovom v glavni sliki'),
('hero_featured_show_id',  'lepotica-in-zver',                 'ID predstave, ki se prikaže v glavni sliki domače strani')
on conflict (key) do nothing;
