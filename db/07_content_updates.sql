-- ============================================================
-- Content updates for 3 shows
-- ============================================================

-- 1. Rename "Mladinska eksperimentala" → "Zvezde nad bodečo žico"
update public.shows set
  title = 'Zvezde nad bodečo žico',
  duration_minutes = 45,
  type = 'Avtorski projekt',
  description = $$Predstava je dokumentarističen opomnik, ki na primeru Holokavsta in dogajanja med letoma 1935 in 1945 prikazuje absurdnost delitve ljudi na večvredne in manjvredne, ter absurdnosti vseh grozot, ki jih s seboj prinašajo vojne. Mladi se učimo o napakah zgodovine, medtem ko spremljamo kako se le-te nenehno ponavljajo. Mladi si vojn in vsega kar vojne s seboj prinašajo ne želimo, tega ne razumemo in še najmanj podpiramo.$$
where id = 'mladinska-eksperimentala';

-- 2. Skrivni strahovi na javnih krajih — new description & duration
update public.shows set
  duration_minutes = 100,
  description = $$Ves svet je kot v istem bloku doma. Nekatere sostanovalce redno srečujemo in prijazno pozdravljamo, druge poznamo le na videz, ene prehitimo na stopnicah, z drugimi obtičimo v dvigalu, s tretjimi se vabimo na nikoli popito kavo, za nekatere vemo le po nerazločnem vpitju nekaj nadstropij višje ali nižje, za eno natančno opazimo, da so vedno drugače oblečeni, drugi so le vsiljiv vonj po kuhanju, čistilih ali kajenju na nasprotni strani hodnika, za nekaterimi se zvedavo ozremo in z nekakšno skrito željo oprezamo za njimi skozi režo priprtih vrat, za nekatere sploh ne vemo, da so umrli, za druge niti da so živeli.

A prav vsi pustijo sled v našem življenju. Nekateri neznaten prahec, drugi veliko, trajno brazgotino. Tretji čudovito, nepozabno mojstrovino. Pa se vedno tega niti ne zavedamo. Pač tu smo. Vsak posebej in vsi skupaj v nepregledni množici podobnih. Sami.

Kot trdi grafit, ki bi lahko bil ob vhodu tega bloka, v resnici pa je doma v nekem tujem mestu. Tu je zapisan po najboljših močeh mojega spomina in razumevanja pisave:

Letimo gladko čez vse…
Je nekdo med padanjem zakričal?
Ali je samo veter
Tako sam?

— Jaša Jamnik$$
where id = 'skrivni-strahovi';

-- 3. Enakokratki trikotnik → Enakokraki trikotnik (title fix), new description & duration
update public.shows set
  title = 'Enakokraki trikotnik',
  duration_minutes = 45,
  description = $$Mladi so skozi voden proces raziskovali čustveno in družbeno funkcioniranje odnose v ustanovah za duševno zdravje. Vse pogosteje se v svojem življenju mladi srečujejo s sodobnimi hibami in pritiski okolja, ki lahko velikokrat na žalost konkretno pripomorejo k razvoju duševnih stisk ali bolezni. Razmišljujoči in kritični mladini je tematika duševnih stisk blizu ter jih v smislu raziskovanja tudi zanima.$$
where id = 'enakokratki-trikotnik';
