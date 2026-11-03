-- Arki – perheen luonti (ajetaan kerran Supabasen SQL-editorissa)
--
-- 1. Kutsu ensin molemmat vanhemmat: Authentication → Users → Invite user.
-- 2. Kopioi tämä tiedosto SQL-editoriin, vaihda <...>-kohdat ja aja.
--    ÄLÄ tallenna täytettyä versiota repoon.
--
-- Värit: sage (salvia), clay (savi), slate (harmaansininen), ochre (okra).

with family as (
  insert into public.families (name, home_place_name, home_latitude, home_longitude)
  values ('<Perheen nimi>', 'Helsinki', 60.1699, 24.9384)
  returning id
)
insert into public.family_members (family_id, display_name, role, color, user_id, sort_order)
select family.id, m.display_name, m.role, m.color,
       (select id from auth.users where email = m.email), m.sort_order
from family,
  (values
    ('<Vanhempi 1>', 'parent', 'clay',  '<vanhempi1@example.com>', 1),
    ('<Vanhempi 2>', 'parent', 'slate', '<vanhempi2@example.com>', 2),
    ('<Lapsi 1>',    'child',  'sage',  null,                      3),
    ('<Lapsi 2>',    'child',  'ochre', null,                      4)
  ) as m(display_name, role, color, email, sort_order);

-- Tarkistus: molemmilla vanhemmilla pitää olla user_id.
select display_name, role, user_id is not null as has_login
from public.family_members order by sort_order;
