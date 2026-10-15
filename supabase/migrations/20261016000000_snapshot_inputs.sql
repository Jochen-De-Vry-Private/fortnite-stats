-- Snapshots per input type (keyboard & mouse, controller, touch), not just
-- "all inputs", so period gains and leaderboards can be filtered by input.
-- Existing rows are the "all" input.

alter table public.stat_snapshots
  add column input text not null default 'all'
  check (input in ('all', 'keyboardMouse', 'gamepad', 'touch'));

alter table public.stat_snapshots drop constraint stat_snapshots_pkey;
alter table public.stat_snapshots add primary key (epic_id, input, mode, snapshot_date);

-- Starting point for the per-input history: today's totals for every input
-- other than "all" (which already has history), from each player's last sync.
insert into public.stat_snapshots
  (epic_id, snapshot_date, input, mode, score, wins, kills, deaths, matches, minutes_played, players_outlived)
select
  p.epic_id, current_date, i.key, m.key,
  coalesce((m.value ->> 'score')::numeric, 0)::int,
  coalesce((m.value ->> 'wins')::numeric, 0)::int,
  coalesce((m.value ->> 'kills')::numeric, 0)::int,
  coalesce((m.value ->> 'deaths')::numeric, 0)::int,
  coalesce((m.value ->> 'matches')::numeric, 0)::int,
  coalesce((m.value ->> 'minutesPlayed')::numeric, 0)::int,
  coalesce((m.value ->> 'playersOutlived')::numeric, 0)::int
from public.players p
cross join lateral jsonb_each(p.latest_stats) i
cross join lateral jsonb_each(i.value) m
where p.latest_stats is not null
  and i.key in ('keyboardMouse', 'gamepad', 'touch')
  and jsonb_typeof(i.value) = 'object'
  and jsonb_typeof(m.value) = 'object'
  and m.key in ('overall', 'solo', 'duo', 'squad', 'ltm')
on conflict do nothing;

-- Totals at the start of a period, one row per player + input + mode: the
-- latest snapshot on or before `cutoff`, or for players tracked only since
-- later, their first snapshot after it. Runs with the caller's permissions.
create function public.snapshot_baselines(epic_ids text[], cutoff date)
returns setof public.stat_snapshots
language sql stable set search_path = ''
as $$
  select distinct on (s.epic_id, s.input, s.mode) s.*
  from public.stat_snapshots s
  where s.epic_id = any (epic_ids)
  order by
    s.epic_id, s.input, s.mode,
    (s.snapshot_date <= cutoff) desc,
    case when s.snapshot_date <= cutoff then s.snapshot_date end desc nulls last,
    s.snapshot_date asc;
$$;

revoke execute on function public.snapshot_baselines(text[], date) from public, anon;
grant execute on function public.snapshot_baselines(text[], date) to authenticated, service_role;
