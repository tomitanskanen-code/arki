-- Arki – vaihe 2: perusrakenne
--
-- Perhe, perheenjäsenet, käyttäjäasetukset ja kauppalista.
-- Kalenteritaulut lisätään vaiheessa 3 omana migraationaan.
--
-- Tietoturvamalli:
--   * Jokaisessa taulussa Row Level Security (RLS).
--   * Käyttäjä näkee vain oman perheensä rivit. Perhe päätellään
--     family_members.user_id -sarakkeesta.
--   * Kirjautumattomalla (anon) roolilla ei ole mitään oikeuksia.
--   * Perheen ja jäsenten luonti tehdään ylläpitäjänä SQL-editorissa
--     (supabase/seed-family.example.sql), ei sovelluksesta.

-- ---------------------------------------------------------------------------
-- Taulut
-- ---------------------------------------------------------------------------

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  time_zone text not null default 'Europe/Helsinki',
  home_place_name text not null default 'Helsinki'
    check (char_length(home_place_name) between 1 and 60),
  home_latitude double precision not null default 60.1699
    check (home_latitude between -90 and 90),
  home_longitude double precision not null default 24.9384
    check (home_longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  role text not null check (role in ('parent', 'child')),
  color text not null check (color in ('sage', 'clay', 'slate', 'ochre')),
  -- Vain vanhemmilla on kirjautumistunnus. Yksi tunnus kuuluu yhteen perheeseen.
  user_id uuid unique references auth.users (id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (user_id is null or role = 'parent')
);

create index family_members_family_id_idx on public.family_members (family_id);

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  default_calendar_view text not null default 'day'
    check (default_calendar_view in ('day', 'week')),
  updated_at timestamptz not null default now()
);

create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_purchased boolean not null default false,
  purchased_at timestamptz,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_list_items_family_idx
  on public.shopping_list_items (family_id, is_purchased);

-- ---------------------------------------------------------------------------
-- updated_at päivittyy automaattisesti
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger families_updated_at before update on public.families
  for each row execute function public.set_updated_at();
create trigger user_preferences_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();
create trigger shopping_list_items_updated_at before update on public.shopping_list_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Pääsynhallinta
-- ---------------------------------------------------------------------------

-- Kirjautuneen käyttäjän perhe. security definer, jotta funktio voi lukea
-- family_members-taulua RLS:n ohi ilman ikuista silmukkaa käytännöissä.
create function public.current_family_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select family_id
  from public.family_members
  where user_id = (select auth.uid())
$$;

revoke all on function public.current_family_id() from public, anon;
grant execute on function public.current_family_id() to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.user_preferences enable row level security;
alter table public.shopping_list_items enable row level security;

-- Kirjautumaton rooli ei pääse tauluihin lainkaan.
revoke all on public.families, public.family_members,
  public.user_preferences, public.shopping_list_items from anon;

grant select, update on public.families to authenticated;
grant select on public.family_members to authenticated;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant select, insert, update, delete on public.shopping_list_items to authenticated;

-- Perhe: oma perhe luettavissa ja päivitettävissä (esim. kotipaikkakunta).
create policy "Oma perhe: luku" on public.families
  for select to authenticated
  using (id = (select public.current_family_id()));

create policy "Oma perhe: päivitys" on public.families
  for update to authenticated
  using (id = (select public.current_family_id()))
  with check (id = (select public.current_family_id()));

-- Jäsenet: vain luku sovelluksesta.
create policy "Oman perheen jäsenet: luku" on public.family_members
  for select to authenticated
  using (family_id = (select public.current_family_id()));

-- Käyttäjäasetukset: vain omat.
create policy "Omat asetukset" on public.user_preferences
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Kauppalista: oman perheen tuotteet.
create policy "Oman perheen kauppalista: luku" on public.shopping_list_items
  for select to authenticated
  using (family_id = (select public.current_family_id()));

create policy "Oman perheen kauppalista: lisäys" on public.shopping_list_items
  for insert to authenticated
  with check (family_id = (select public.current_family_id()));

create policy "Oman perheen kauppalista: päivitys" on public.shopping_list_items
  for update to authenticated
  using (family_id = (select public.current_family_id()))
  with check (family_id = (select public.current_family_id()));

create policy "Oman perheen kauppalista: poisto" on public.shopping_list_items
  for delete to authenticated
  using (family_id = (select public.current_family_id()));

-- ---------------------------------------------------------------------------
-- Realtime: kauppalistan muutokset välittyvät heti toiselle vanhemmalle.
-- Realtime noudattaa samoja RLS-käytäntöjä.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.shopping_list_items;
