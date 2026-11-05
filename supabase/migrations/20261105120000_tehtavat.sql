-- Arki – Tehtävät
--
-- Perheen yhteinen tehtävälista. Ei muuta olemassa olevia tauluja.
--
-- Laajennettavuus myöhemmin (ei toteutettu nyt): toistuvat tehtävät
-- (recurrence), muistutukset (remind_at), alitehtävät (parent_id),
-- historia (task_events-taulu) ja kalenteritapahtumasta luonti
-- (source_event_id) – kaikki uusina valinnaisina sarakkeina tai tauluina.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text check (char_length(description) <= 2000),
  status text not null default 'open' check (status in ('open', 'done')),
  priority text not null default 'normal' check (priority in ('normal', 'high')),
  -- Tekstikenttä: uusia kategorioita voi lisätä muuttamalla vain rajoitetta.
  category text check (category in ('home', 'kids', 'errands', 'other')),
  due_date date,
  -- Vastuuhenkilö = perheen kirjautumistunnus; null = koko perhe.
  assigned_to uuid references auth.users (id) on delete set null,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_family_status_idx on public.tasks (family_id, status, due_date);

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Valmistumistiedot asetetaan aina tietokannassa tilan muuttuessa.
create function public.set_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status <> 'done') then
    new.completed_at = now();
    new.completed_by = auth.uid();
  elsif new.status = 'open' then
    new.completed_at = null;
    new.completed_by = null;
  end if;
  return new;
end;
$$;

create trigger tasks_completion before insert or update on public.tasks
  for each row execute function public.set_task_completion();

-- ---------------------------------------------------------------------------
-- Pääsynhallinta: oman perheen tehtävät, ei mitään kirjautumattomalle.
-- ---------------------------------------------------------------------------

alter table public.tasks enable row level security;

revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;

-- Vastuuhenkilön pitää olla oman perheen jäsen (tai ei ketään).
create function public.is_family_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.family_members
    where user_id = target
      and family_id = (select public.current_family_id())
  )
$$;

revoke all on function public.is_family_user(uuid) from public, anon;
grant execute on function public.is_family_user(uuid) to authenticated;

create policy "Oman perheen tehtävät: luku" on public.tasks
  for select to authenticated
  using (family_id = (select public.current_family_id()));

create policy "Oman perheen tehtävät: lisäys" on public.tasks
  for insert to authenticated
  with check (
    family_id = (select public.current_family_id())
    and (assigned_to is null or public.is_family_user(assigned_to))
  );

create policy "Oman perheen tehtävät: muokkaus" on public.tasks
  for update to authenticated
  using (family_id = (select public.current_family_id()))
  with check (
    family_id = (select public.current_family_id())
    and (assigned_to is null or public.is_family_user(assigned_to))
  );

create policy "Oman perheen tehtävät: poisto" on public.tasks
  for delete to authenticated
  using (family_id = (select public.current_family_id()));

-- Muutokset välittyvät heti toisen vanhemman laitteelle.
alter publication supabase_realtime add table public.tasks;
