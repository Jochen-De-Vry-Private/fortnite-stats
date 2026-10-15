// Player and leaderboard types plus the pure ranking logic, shared by the
// database-backed pages and the public demo.
import type { AllStats, Input, Mode } from "./fortnite/types";
import {
  METRICS,
  PERIOD_DAYS,
  baselineFor,
  daysAgo,
  getModeStats,
  subtractTotals,
  totalsFromStats,
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

export function groupByPlayer(rows: SnapshotRow[]) {
  const map = new Map<string, SnapshotRow[]>();
  for (const r of rows) {
    const list = map.get(r.epic_id);
    if (list) list.push(r);
    else map.set(r.epic_id, [r]);
  }
  return map;
}

/**
 * Ranks players on one metric. For "this week"/"this month", `snapshots` must
 * hold each player's history in `opts.mode`, sorted by date.
 */
export function rankPlayers(
  rows: { player: Player; kind: LeaderboardKind }[],
  snapshots: Map<string, SnapshotRow[]>,
  opts: LeaderboardOptions,
): LeaderboardEntry[] {
  const metric = METRICS[opts.metric];
  const cutoff = opts.period === "lifetime" ? "" : daysAgo(PERIOD_DAYS[opts.period]);

  const entries = rows.map(({ player, kind }) => {
    // Period gains are tracked for "all inputs" only.
    const input = opts.period === "lifetime" ? opts.input : "all";
    let totals = totalsFromStats(getModeStats(player.latest_stats, input, opts.mode));
    if (cutoff) {
      const base = baselineFor(snapshots.get(player.epic_id) ?? [], cutoff);
      totals = base ? subtractTotals(totals, base) : totalsFromStats(null);
    }
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

/** Gains since `days` days ago (overall, all inputs), from a player's overall snapshots sorted by date. */
export function recentGains(player: Player, overallSnapshots: SnapshotRow[], days: number) {
  const base = baselineFor(overallSnapshots, daysAgo(days));
  const current = totalsFromStats(getModeStats(player.latest_stats, "all", "overall"));
  return base ? subtractTotals(current, base) : null;
}
