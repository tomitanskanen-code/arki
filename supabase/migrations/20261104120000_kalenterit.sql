-- Arki – vaihe 3: kalenterit
--
-- calendar_sources   – ICS-syötteet (Wilma, myClub, Google). Syötteen osoite
--                      on salaisuus: se tallennetaan sovelluksen salaamana
--                      (AES-256-GCM, avain vain palvelimen ympäristömuuttujassa).
-- calendar_events    – syötteistä luetut tapahtumat yhteisessä muodossa.
-- manual_schedules   – käsin syötetty viikkorytmi (esim. esikoulu).

create table public.calendar_sources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  kind text not null check (kind in ('google', 'wilma', 'myclub', 'ics')),
  name text not null check (char_length(name) between 1 and 60),
  -- Kenen kalenteri; null = koko perhe.
  member_id uuid references public.family_members (id) on delete set null,
  -- Salattu syöteosoite (muoto v1:iv:tag:data). Ei koskaan selaimeen.
  encrypted_url text not null,
  -- Palvelimen nimi näytettäväksi asetuksissa (esim. porvoo.inschool.fi).
  url_host text not null,
  enabled boolean not null default true,
  sync_status text not null default 'pending'
    check (sync_status in ('ok', 'error', 'pending')),
  last_synced_at timestamptz,
  last_attempt_at timestamptz,
  last_error text,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_sources_family_idx on public.calendar_sources (family_id);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  source_id uuid not null references public.calendar_sources (id) on delete cascade,
  -- Lähteen UID + esiintymän tunniste: estää saman tapahtuman tuplaantumisen.
  external_uid text not null,
  occurrence_key text not null,
  title text not null,
  location text,
  description text,
  category text not null
    check (category in ('school', 'hobby', 'work', 'family', 'other')),
  all_day boolean not null,
  starts_at timestamptz,
  ends_at timestamptz,
  start_date date,
  end_date date,
  -- Synkronointikierroksen tunniste: kierroksella näkymättömät rivit poistetaan.
  sync_token uuid not null,
  updated_at timestamptz not null default now(),
  unique (source_id, external_uid, occurrence_key),
  check (
    (all_day and start_date is not null and end_date is not null)
    or (not all_day and starts_at is not null and ends_at is not null)
  )
);

create index calendar_events_timed_idx
  on public.calendar_events (family_id, starts_at) where not all_day;
create index calendar_events_all_day_idx
  on public.calendar_events (family_id, start_date) where all_day;
create index calendar_events_source_idx on public.calendar_events (source_id);

create table public.manual_schedules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  member_id uuid not null references public.family_members (id) on delete cascade,
  title text not null default 'Esikoulu' check (char_length(title) between 1 and 60),
  -- ISO-viikonpäivä: 1 = maanantai … 7 = sunnuntai
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index manual_schedules_family_idx on public.manual_schedules (family_id);

create trigger calendar_sources_updated_at before update on public.calendar_sources
  for each row execute function public.set_updated_at();
create trigger calendar_events_updated_at before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Pääsynhallinta: oman perheen rivit, ei mitään kirjautumattomalle.
-- ---------------------------------------------------------------------------

alter table public.calendar_sources enable row level security;
alter table public.calendar_events enable row level security;
alter table public.manual_schedules enable row level security;

revoke all on public.calendar_sources, public.calendar_events,
  public.manual_schedules from anon;

grant select, insert, update, delete on public.calendar_sources to authenticated;
grant select, insert, update, delete on public.calendar_events to authenticated;
grant select, insert, update, delete on public.manual_schedules to authenticated;

create policy "Oman perheen kalenterilähteet" on public.calendar_sources
  for all to authenticated
  using (family_id = (select public.current_family_id()))
  with check (family_id = (select public.current_family_id()));

create policy "Oman perheen tapahtumat" on public.calendar_events
  for all to authenticated
  using (family_id = (select public.current_family_id()))
  with check (family_id = (select public.current_family_id()));

create policy "Oman perheen viikkorytmit" on public.manual_schedules
  for all to authenticated
  using (family_id = (select public.current_family_id()))
  with check (family_id = (select public.current_family_id()));
