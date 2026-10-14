-- DropStats schema: profiles (linked Epic accounts), daily stat snapshots,
-- friendships, groups. All tables use row-level security; writes that need
-- validation (linking an Epic account, syncing stats) go through the server
-- with the service-role key.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Profiles: one per app user, linked to exactly one Epic account.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  epic_id text not null unique,
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

create index profiles_epic_name_trgm on public.profiles using gin (epic_name gin_trgm_ops);
create index profiles_last_synced_at on public.profiles (last_synced_at nulls first);

alter table public.profiles enable row level security;

create policy "Signed-in users can view profiles"
  on public.profiles for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Stat snapshots: lifetime totals per mode (input "all"), stored only on days
-- the totals changed. Differences between snapshots give weekly/monthly gains.
-- ---------------------------------------------------------------------------
create table public.stat_snapshots (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  snapshot_date date not null default current_date,
  mode text not null check (mode in ('overall', 'solo', 'duo', 'squad', 'ltm')),
  score int not null default 0,
  wins int not null default 0,
  kills int not null default 0,
  deaths int not null default 0,
  matches int not null default 0,
  minutes_played int not null default 0,
  players_outlived int not null default 0,
  primary key (profile_id, mode, snapshot_date)
);

alter table public.stat_snapshots enable row level security;

create policy "Signed-in users can view snapshots"
  on public.stat_snapshots for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Friendships: a request from requester to addressee, accepted by addressee.
-- ---------------------------------------------------------------------------
create table public.friendships (
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Only one friendship row per pair, whichever direction it was sent in.
create unique index friendships_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy "Participants can view friendships"
  on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create policy "Users can send friend requests"
  on public.friendships for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');

create policy "Addressee can accept requests"
  on public.friendships for update to authenticated
  using (addressee_id = (select auth.uid()))
  with check (status = 'accepted');

create policy "Participants can remove friendships"
  on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));

create function public.are_friends(a uuid, b uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b) or (requester_id = b and addressee_id = a))
  );
$$;

-- ---------------------------------------------------------------------------
-- Groups: named crews with an invite code. Members see each other's ranking.
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  emoji text not null default '🎮' check (char_length(emoji) <= 8),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 8)),
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, profile_id)
);

create index group_members_profile on public.group_members (profile_id);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

create function public.is_group_member(g uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.group_members
    where group_id = g and profile_id = (select auth.uid())
  );
$$;

create function public.is_group_owner(g uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.groups where id = g and owner_id = (select auth.uid())
  );
$$;

create policy "Members can view their groups"
  on public.groups for select to authenticated
  using (public.is_group_member(id));

create policy "Owner can update group"
  on public.groups for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Owner can delete group"
  on public.groups for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy "Members can view group members"
  on public.group_members for select to authenticated
  using (public.is_group_member(group_id));

-- Members may add their own friends to a group.
create policy "Members can add friends"
  on public.group_members for insert to authenticated
  with check (
    public.is_group_member(group_id)
    and public.are_friends((select auth.uid()), profile_id)
  );

-- Members may leave; the owner may remove anyone.
create policy "Leave or remove members"
  on public.group_members for delete to authenticated
  using (profile_id = (select auth.uid()) or public.is_group_owner(group_id));

-- Creating a group and adding its owner must happen together (the owner can't
-- see the group until they're a member), so it goes through a function.
create function public.create_group(group_name text, group_emoji text default '🎮')
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  insert into public.groups (name, emoji, owner_id)
  values (trim(group_name), coalesce(nullif(trim(group_emoji), ''), '🎮'), (select auth.uid()))
  returning id into new_id;
  insert into public.group_members (group_id, profile_id) values (new_id, (select auth.uid()));
  return new_id;
end;
$$;

create function public.join_group(code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  gid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  select id into gid from public.groups where invite_code = upper(trim(code));
  if gid is null then
    raise exception 'Invalid invite code';
  end if;
  insert into public.group_members (group_id, profile_id)
  values (gid, (select auth.uid()))
  on conflict do nothing;
  return gid;
end;
$$;

revoke execute on function public.are_friends(uuid, uuid) from public, anon;
revoke execute on function public.is_group_member(uuid) from public, anon;
revoke execute on function public.is_group_owner(uuid) from public, anon;
revoke execute on function public.create_group(text, text) from public, anon;
revoke execute on function public.join_group(text) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.create_group(text, text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
