-- Separates Fortnite players from app accounts so that players who never
-- signed up (pros, anyone looked up on the Compare tab) can be followed and
-- get the same daily history. Also adds follows and friend invite codes.
-- Existing profiles and snapshots are migrated in place.

-- ---------------------------------------------------------------------------
-- Players: any Fortnite account the app knows about.
-- ---------------------------------------------------------------------------
create table public.players (
  epic_id text primary key,
  epic_name text not null,
  avatar_hue int not null default floor(random() * 360)::int,
  battle_pass_level int,
  battle_pass_progress int,
  -- Full "stats" object from the last successful API call (all inputs/modes).
  latest_stats jsonb,
  last_synced_at timestamptz,
  -- Set when the last sync failed (e.g. 'private' when stats are hidden in-game).
  sync_error text,
  created_at timestamptz not null default now()
);

insert into public.players
  (epic_id, epic_name, avatar_hue, battle_pass_level, battle_pass_progress, latest_stats, last_synced_at, sync_error, created_at)
select epic_id, epic_name, avatar_hue, battle_pass_level, battle_pass_progress, latest_stats, last_synced_at, sync_error, created_at
from public.profiles;

create index players_epic_name_trgm on public.players using gin (epic_name gin_trgm_ops);
create index players_epic_name_lower on public.players (lower(epic_name));
create index players_last_synced_at on public.players (last_synced_at nulls first);

alter table public.players enable row level security;

create policy "Signed-in users can view players"
  on public.players for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Snapshots now belong to players instead of app accounts.
-- ---------------------------------------------------------------------------
alter table public.stat_snapshots add column epic_id text;
update public.stat_snapshots s set epic_id = p.epic_id from public.profiles p where p.id = s.profile_id;
alter table public.stat_snapshots drop constraint stat_snapshots_pkey;
alter table public.stat_snapshots drop column profile_id;
alter table public.stat_snapshots alter column epic_id set not null;
alter table public.stat_snapshots add primary key (epic_id, mode, snapshot_date);
alter table public.stat_snapshots
  add constraint stat_snapshots_epic_id_fkey foreign key (epic_id)
  references public.players (epic_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Profiles keep only the account link; stats live on the player.
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop column epic_name,
  drop column avatar_hue,
  drop column battle_pass_level,
  drop column battle_pass_progress,
  drop column latest_stats,
  drop column last_synced_at,
  drop column sync_error;

alter table public.profiles
  add constraint profiles_epic_id_fkey foreign key (epic_id) references public.players (epic_id);

-- Personal invite link code: /invite/<code> makes the visitor your friend.
alter table public.profiles
  add column invite_code text not null unique default lower(substr(md5(random()::text), 1, 10));

-- ---------------------------------------------------------------------------
-- Follows: players (pros or anyone) a user keeps an eye on. Private per user.
-- ---------------------------------------------------------------------------
create table public.follows (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  epic_id text not null references public.players (epic_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, epic_id)
);

create index follows_epic_id on public.follows (epic_id);

alter table public.follows enable row level security;

create policy "Users can view their follows"
  on public.follows for select to authenticated
  using (profile_id = (select auth.uid()));

create policy "Users can follow players"
  on public.follows for insert to authenticated
  with check (profile_id = (select auth.uid()));

create policy "Users can unfollow players"
  on public.follows for delete to authenticated
  using (profile_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Daily sync covers players linked to an account or followed by someone.
-- Players only ever looked up once are not refreshed.
-- ---------------------------------------------------------------------------
create function public.players_due_for_sync(stale_before timestamptz, max_rows int)
returns setof public.players
language sql stable security definer set search_path = ''
as $$
  select p.*
  from public.players p
  where (p.last_synced_at is null or p.last_synced_at < stale_before)
    and (
      exists (select 1 from public.profiles pr where pr.epic_id = p.epic_id)
      or exists (select 1 from public.follows f where f.epic_id = p.epic_id)
    )
  order by p.last_synced_at nulls first
  limit max_rows;
$$;

revoke execute on function public.players_due_for_sync(timestamptz, int) from public, anon, authenticated;
grant execute on function public.players_due_for_sync(timestamptz, int) to service_role;
