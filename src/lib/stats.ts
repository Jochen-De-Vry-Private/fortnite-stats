import type { AllStats, Input, Mode, ModeStats } from "./fortnite/types";

// Additive totals: the part of the API stats that can be subtracted between
// two points in time to get gains over a period.
export type Totals = {
  score: number;
  wins: number;
  kills: number;
  deaths: number;
  matches: number;
  minutesPlayed: number;
  playersOutlived: number;
};

export type SnapshotRow = {
  epic_id: string;
  snapshot_date: string;
  mode: Mode;
  score: number;
  wins: number;
  kills: number;
  deaths: number;
  matches: number;
  minutes_played: number;
  players_outlived: number;
};

export const EMPTY_TOTALS: Totals = {
  score: 0,
  wins: 0,
  kills: 0,
  deaths: 0,
  matches: 0,
  minutesPlayed: 0,
  playersOutlived: 0,
};

export function totalsFromStats(s: ModeStats | null | undefined): Totals {
  if (!s) return EMPTY_TOTALS;
  return {
    score: s.score,
    wins: s.wins,
    kills: s.kills,
    deaths: s.deaths,
    matches: s.matches,
    minutesPlayed: s.minutesPlayed,
    playersOutlived: s.playersOutlived,
  };
}

export function totalsFromSnapshot(r: SnapshotRow): Totals {
  return {
    score: r.score,
    wins: r.wins,
    kills: r.kills,
    deaths: r.deaths,
    matches: r.matches,
    minutesPlayed: r.minutes_played,
    playersOutlived: r.players_outlived,
  };
}

export function subtractTotals(a: Totals, b: Totals): Totals {
  return {
    score: Math.max(0, a.score - b.score),
    wins: Math.max(0, a.wins - b.wins),
    kills: Math.max(0, a.kills - b.kills),
    deaths: Math.max(0, a.deaths - b.deaths),
    matches: Math.max(0, a.matches - b.matches),
    minutesPlayed: Math.max(0, a.minutesPlayed - b.minutesPlayed),
    playersOutlived: Math.max(0, a.playersOutlived - b.playersOutlived),
  };
}

export function getModeStats(stats: AllStats | null | undefined, input: Input, mode: Mode) {
  return stats?.[input]?.[mode] ?? null;
}

/** Snapshot rows to write for a fresh API response (input "all" only). */
export function snapshotRowsFromStats(epicId: string, stats: AllStats, date: string): SnapshotRow[] {
  const all = stats.all;
  if (!all) return [];
  return (Object.keys(all) as Mode[])
    .filter((mode) => all[mode])
    .map((mode) => {
      const t = totalsFromStats(all[mode]);
      return {
        epic_id: epicId,
        snapshot_date: date,
        mode,
        score: t.score,
        wins: t.wins,
        kills: t.kills,
        deaths: t.deaths,
        matches: t.matches,
        minutes_played: t.minutesPlayed,
        players_outlived: t.playersOutlived,
      };
    });
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return isoDate(d);
}

/**
 * Totals at the start of a period: the last snapshot on or before the cutoff,
 * or (for players who joined later) their first snapshot.
 * `rows` must be one player + one mode, sorted by date ascending.
 */
export function baselineFor(rows: SnapshotRow[], cutoff: string): Totals | null {
  if (rows.length === 0) return null;
  let base = rows[0];
  for (const r of rows) {
    if (r.snapshot_date <= cutoff) base = r;
    else break;
  }
  return totalsFromSnapshot(base);
}

export type TrendPoint = { date: string; wins: number; kills: number; matches: number; kd: number };

/** Per-active-day gains from consecutive snapshots of one player + mode (sorted ascending). */
export function trendFromSnapshots(rows: SnapshotRow[]): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = 1; i < rows.length; i++) {
    const gain = subtractTotals(totalsFromSnapshot(rows[i]), totalsFromSnapshot(rows[i - 1]));
    points.push({
      date: rows[i].snapshot_date,
      wins: gain.wins,
      kills: gain.kills,
      matches: gain.matches,
      kd: rows[i].deaths ? rows[i].kills / rows[i].deaths : rows[i].kills,
    });
  }
  return points;
}

export function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export type Period = "lifetime" | "7d" | "30d";

export const PERIOD_LABELS: Record<Period, string> = {
  lifetime: "Lifetime",
  "7d": "This week",
  "30d": "This month",
};

export const PERIOD_DAYS: Record<Exclude<Period, "lifetime">, number> = { "7d": 7, "30d": 30 };

export type MetricKey =
  | "wins"
  | "kd"
  | "winRate"
  | "kills"
  | "matches"
  | "killsPerMatch"
  | "hoursPlayed"
  | "score";

export const METRICS: Record<
  MetricKey,
  { label: string; short: string; get: (t: Totals) => number; format: (v: number) => string }
> = {
  wins: { label: "Wins", short: "Wins", get: (t) => t.wins, format: fmtInt },
  kd: { label: "K/D ratio", short: "K/D", get: (t) => (t.deaths ? t.kills / t.deaths : t.kills), format: (v) => v.toFixed(2) },
  winRate: {
    label: "Win rate",
    short: "Win %",
    get: (t) => (t.matches ? (t.wins / t.matches) * 100 : 0),
    format: (v) => `${v.toFixed(1)}%`,
  },
  kills: { label: "Eliminations", short: "Elims", get: (t) => t.kills, format: fmtInt },
  matches: { label: "Matches played", short: "Matches", get: (t) => t.matches, format: fmtInt },
  killsPerMatch: {
    label: "Elims per match",
    short: "Elims/match",
    get: (t) => (t.matches ? t.kills / t.matches : 0),
    format: (v) => v.toFixed(2),
  },
  hoursPlayed: { label: "Hours played", short: "Hours", get: (t) => t.minutesPlayed / 60, format: (v) => fmtInt(Math.round(v)) },
  score: { label: "Score", short: "Score", get: (t) => t.score, format: fmtInt },
};

export function fmtInt(v: number) {
  return Math.round(v).toLocaleString("en-US");
}

export function fmtCompact(v: number) {
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

// Fun K/D-based tiers shown as a badge on profiles.
export type Rank = { name: string; min: number; gradient: string; glow: string; text: string };

export const RANKS: Rank[] = [
  { name: "Bronze", min: 0, gradient: "from-amber-700 to-amber-900", glow: "shadow-amber-700/40", text: "text-amber-300" },
  { name: "Silver", min: 0.6, gradient: "from-slate-300 to-slate-500", glow: "shadow-slate-300/40", text: "text-slate-200" },
  { name: "Gold", min: 1, gradient: "from-yellow-300 to-amber-500", glow: "shadow-yellow-400/50", text: "text-yellow-300" },
  { name: "Platinum", min: 1.5, gradient: "from-cyan-300 to-teal-500", glow: "shadow-cyan-300/50", text: "text-cyan-200" },
  { name: "Diamond", min: 2.2, gradient: "from-sky-400 to-indigo-500", glow: "shadow-sky-400/50", text: "text-sky-300" },
  { name: "Elite", min: 3, gradient: "from-fuchsia-400 to-purple-600", glow: "shadow-fuchsia-400/50", text: "text-fuchsia-300" },
  { name: "Champion", min: 4.5, gradient: "from-orange-400 to-rose-600", glow: "shadow-orange-400/60", text: "text-orange-300" },
  { name: "Unreal", min: 7, gradient: "from-pink-400 via-violet-500 to-cyan-400", glow: "shadow-violet-400/60", text: "text-violet-200" },
];

export function rankForKd(kd: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) if (kd >= r.min) rank = r;
  return rank;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

const EPIC_ID_RE = /^[0-9a-f]{32}$/;

export function isEpicId(v: unknown): v is string {
  return typeof v === "string" && EPIC_ID_RE.test(v);
}
