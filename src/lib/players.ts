// Player and leaderboard types plus the pure ranking logic, shared by the
// database-backed pages and the public demo.
import type { AllStats, Input, Mode } from "./fortnite/types";
import {
  METRICS,
  getModeStats,
  subtractTotals,
  totalsFromSnapshot,
  totalsFromStats,
  type GainPeriod,
  type MetricKey,
  type Period,
  type SnapshotRow,
  type Totals,
} from "./stats";

/** Any Fortnite account the app knows about (app users, followed pros, looked-up players). */
export type Player = {
  epic_id: string;
  epic_name: string;
  avatar_hue: number;
  battle_pass_level: number | null;
  battle_pass_progress: number | null;
  latest_stats: AllStats | null;
  last_synced_at: string | null;
  sync_error: string | null;
};

export type PublicPlayer = Pick<Player, "epic_id" | "epic_name" | "avatar_hue">;

export type LeaderboardKind = "me" | "member" | "pro";

export type LeaderboardEntry = {
  player: PublicPlayer;
  kind: LeaderboardKind;
  value: number;
  totals: Totals;
  hasData: boolean;
};

export type LeaderboardOptions = { metric: MetricKey; mode: Mode; input: Input; period: Period };

/** Totals at the start of a period. `since` is set when tracking began after the period started. */
export type Baseline = { totals: Totals; since: string | null };

/** Baselines keyed by `baselineKey(epicId, input, mode)`. */
export type BaselineMap = Map<string, Baseline>;

export const baselineKey = (epicId: string, input: Input, mode: Mode) => `${epicId}|${input}|${mode}`;

/** Turns rows from the snapshot_baselines database function into a lookup map. */
export function toBaselineMap(rows: SnapshotRow[], cutoff: string): BaselineMap {
  return new Map(
    rows.map((r) => [
      baselineKey(r.epic_id, r.input, r.mode),
      { totals: totalsFromSnapshot(r), since: r.snapshot_date > cutoff ? r.snapshot_date : null },
    ]),
  );
}

/**
 * Same selection as the snapshot_baselines database function, in memory (for
 * the demo): per player + input + mode, the latest row on or before `cutoff`,
 * else the first row after it.
 */
export function pickBaselineRows(rows: SnapshotRow[], cutoff: string): SnapshotRow[] {
  const best = new Map<string, SnapshotRow>();
  for (const r of rows) {
    const key = baselineKey(r.epic_id, r.input, r.mode);
    const cur = best.get(key);
    const before = r.snapshot_date <= cutoff;
    const curBefore = cur ? cur.snapshot_date <= cutoff : false;
    if (
      !cur ||
      (before && (!curBefore || r.snapshot_date > cur.snapshot_date)) ||
      (!before && !curBefore && r.snapshot_date < cur.snapshot_date)
    ) {
      best.set(key, r);
    }
  }
  return [...best.values()];
}

/** Gains since a baseline, or null when the player has no history for this input + mode. */
export function gainsSince(player: Player, baselines: BaselineMap, input: Input, mode: Mode) {
  const base = baselines.get(baselineKey(player.epic_id, input, mode));
  if (!base) return null;
  return subtractTotals(totalsFromStats(getModeStats(player.latest_stats, input, mode)), base.totals);
}

/**
 * Ranks players on one metric. For periods other than lifetime, `baselines`
 * must hold the period-start totals (see toBaselineMap).
 */
export function rankPlayers(
  rows: { player: Player; kind: LeaderboardKind }[],
  baselines: BaselineMap | null,
  opts: LeaderboardOptions,
): LeaderboardEntry[] {
  const metric = METRICS[opts.metric];

  const entries = rows.map(({ player, kind }) => {
    const totals =
      opts.period === "lifetime" || !baselines
        ? totalsFromStats(getModeStats(player.latest_stats, opts.input, opts.mode))
        : (gainsSince(player, baselines, opts.input, opts.mode) ?? totalsFromStats(null));
    return {
      player: { epic_id: player.epic_id, epic_name: player.epic_name, avatar_hue: player.avatar_hue },
      kind,
      totals,
      value: metric.get(totals),
      hasData: totals.matches > 0,
    };
  });

  return entries.sort((a, b) => Number(b.hasData) - Number(a.hasData) || b.value - a.value);
}

/** Merges app users and followed players into leaderboard rows, counting each player once. */
export function leaderboardRows(members: { player: Player; isMe: boolean }[], pros: Player[]) {
  const rows: { player: Player; kind: LeaderboardKind }[] = members.map((m) => ({
    player: m.player,
    kind: m.isMe ? "me" : "member",
  }));
  const seen = new Set(rows.map((r) => r.player.epic_id));
  for (const pro of pros) if (!seen.has(pro.epic_id)) rows.push({ player: pro, kind: "pro" });
  return rows;
}

/** One player's period-start totals per period, keyed by `${input}|${mode}`. Plain object, safe to pass to the client. */
export type PlayerBaselines = Record<GainPeriod, Record<string, Baseline>>;

export function playerBaselines(epicId: string, maps: Record<GainPeriod, BaselineMap>): PlayerBaselines {
  const prefix = `${epicId}|`;
  const pick = (map: BaselineMap) =>
    Object.fromEntries([...map].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]));
  return { "7d": pick(maps["7d"]), "30d": pick(maps["30d"]), "365d": pick(maps["365d"]) };
}
