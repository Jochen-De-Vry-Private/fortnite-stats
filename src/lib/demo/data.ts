// Dummy data for the public /demo pages. Deterministic (seeded random), with
// dates relative to today so weekly/monthly views always have data.
import { SAMPLE_STATS } from "../fortnite/sample";
import type { AllStats, Mode, ModeStats } from "../fortnite/types";
import { groupByPlayer, recentGains, type Player } from "../players";
import { daysAgo, totalsFromStats, type SnapshotRow, type Totals } from "../stats";

const MODES_SPLIT: Record<Exclude<Mode, "overall">, number> = { solo: 0.15, duo: 0.2, squad: 0.1, ltm: 0.55 };
const HISTORY_DAYS = 40;

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function toModeStats(t: Totals): ModeStats {
  return {
    score: t.score,
    scorePerMin: t.minutesPlayed ? t.score / t.minutesPlayed : 0,
    scorePerMatch: t.matches ? t.score / t.matches : 0,
    wins: t.wins,
    top10: Math.round(t.matches * 0.2),
    top25: Math.round(t.matches * 0.35),
    kills: t.kills,
    killsPerMin: t.minutesPlayed ? t.kills / t.minutesPlayed : 0,
    killsPerMatch: t.matches ? t.kills / t.matches : 0,
    deaths: t.deaths,
    kd: t.deaths ? t.kills / t.deaths : t.kills,
    matches: t.matches,
    winRate: t.matches ? (t.wins / t.matches) * 100 : 0,
    minutesPlayed: t.minutesPlayed,
    playersOutlived: t.playersOutlived,
    lastModified: new Date().toISOString(),
  };
}

function addTotals(a: Totals, b: Totals): Totals {
  return {
    score: a.score + b.score,
    wins: a.wins + b.wins,
    kills: a.kills + b.kills,
    deaths: a.deaths + b.deaths,
    matches: a.matches + b.matches,
    minutesPlayed: a.minutesPlayed + b.minutesPlayed,
    playersOutlived: a.playersOutlived + b.playersOutlived,
  };
}

function dayGain(matchesPerDay: number, skill: number, winRate: number, rand: () => number): Totals {
  const matches = Math.max(1, Math.round(matchesPerDay * (0.4 + rand() * 1.2)));
  // Random rounding, so low win rates still produce the occasional win.
  const wins = Math.min(matches, Math.floor(matches * winRate * (0.4 + rand() * 1.2) + rand()));
  const deaths = matches - wins;
  return {
    matches,
    wins,
    deaths,
    kills: Math.round(deaths * skill * (0.6 + rand() * 0.8)),
    minutesPlayed: matches * 7,
    score: matches * 190,
    playersOutlived: matches * 38,
  };
}

function snapshotRow(epicId: string, date: string, mode: Mode, t: Totals): SnapshotRow {
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
}

type Spec = { name: string; hue: number; skill: number; winRate: number; pace: number; startMatches: number; seed: number };

/** A fake player: starting totals, then 40 days of activity up to today. */
function makePlayer(spec: Spec): { player: Player; snapshots: SnapshotRow[] } {
  const rand = rng(spec.seed);
  const epicId = spec.name.toLowerCase();
  const modes = Object.keys(MODES_SPLIT) as (keyof typeof MODES_SPLIT)[];
  const totals = Object.fromEntries(
    modes.map((m) => {
      const matches = Math.round(spec.startMatches * MODES_SPLIT[m]);
      const wins = Math.round(matches * spec.winRate);
      const deaths = matches - wins;
      return [m, { matches, wins, deaths, kills: Math.round(deaths * spec.skill), minutesPlayed: matches * 7, score: matches * 190, playersOutlived: matches * 38 }];
    }),
  ) as Record<(typeof modes)[number], Totals>;

  const snapshots: SnapshotRow[] = [];
  for (let d = HISTORY_DAYS; d >= 0; d--) {
    if (d > 0 && rand() > 0.6) continue; // not every day is a gaming day
    for (const m of modes) totals[m] = addTotals(totals[m], dayGain(spec.pace * MODES_SPLIT[m], spec.skill, spec.winRate, rand));
    const overall = modes.reduce((acc, m) => addTotals(acc, totals[m]), totalsFromStats(null));
    const date = daysAgo(d);
    snapshots.push(snapshotRow(epicId, date, "overall", overall));
    for (const m of modes) snapshots.push(snapshotRow(epicId, date, m, totals[m]));
  }

  const overall = modes.reduce((acc, m) => addTotals(acc, totals[m]), totalsFromStats(null));
  const all = { overall: toModeStats(overall), ...Object.fromEntries(modes.map((m) => [m, toModeStats(totals[m])])) };
  return {
    player: {
      epic_id: epicId,
      epic_name: spec.name,
      avatar_hue: spec.hue,
      battle_pass_level: 10 + (spec.seed % 90),
      battle_pass_progress: (spec.seed * 7) % 100,
      latest_stats: { all } as AllStats,
      last_synced_at: new Date(Date.now() - 2 * 3600_000).toISOString(),
      sync_error: null,
    },
    snapshots,
  };
}

/** "You": the example API response, with history walked backwards from today's totals. */
function makeMe(): { player: Player; snapshots: SnapshotRow[] } {
  const rand = rng(7);
  const epicId = "dr.duder";
  const all = SAMPLE_STATS.stats.all!;
  const modes = (Object.keys(MODES_SPLIT) as (keyof typeof MODES_SPLIT)[]).filter((m) => all[m]);
  let current = Object.fromEntries(modes.map((m) => [m, totalsFromStats(all[m])])) as Record<string, Totals>;
  // The API's "overall" isn't exactly the sum of the modes, so it's tracked separately.
  let currentOverall = totalsFromStats(all.overall);
  const minus = (t: Totals, g: Totals): Totals => ({
    score: Math.max(0, t.score - g.score),
    wins: Math.max(0, t.wins - g.wins),
    kills: Math.max(0, t.kills - g.kills),
    deaths: Math.max(0, t.deaths - g.deaths),
    matches: Math.max(0, t.matches - g.matches),
    minutesPlayed: Math.max(0, t.minutesPlayed - g.minutesPlayed),
    playersOutlived: Math.max(0, t.playersOutlived - g.playersOutlived),
  });

  const snapshots: SnapshotRow[] = [];
  for (let d = 0; d <= HISTORY_DAYS; d++) {
    if (d > 0 && rand() > 0.55) continue;
    const date = daysAgo(d);
    snapshots.push(snapshotRow(epicId, date, "overall", currentOverall));
    for (const m of modes) snapshots.push(snapshotRow(epicId, date, m, current[m]));
    // Step back one active day.
    const gains = Object.fromEntries(modes.map((m) => [m, dayGain(10 * MODES_SPLIT[m], 2.4, 0.05, rand)]));
    current = Object.fromEntries(modes.map((m) => [m, minus(current[m], gains[m])]));
    currentOverall = minus(currentOverall, modes.reduce((acc, m) => addTotals(acc, gains[m]), totalsFromStats(null)));
  }
  snapshots.sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));

  return {
    player: {
      epic_id: epicId,
      epic_name: SAMPLE_STATS.account.name,
      avatar_hue: 265,
      battle_pass_level: SAMPLE_STATS.battlePass?.level ?? null,
      battle_pass_progress: SAMPLE_STATS.battlePass?.progress ?? null,
      latest_stats: SAMPLE_STATS.stats,
      last_synced_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
      sync_error: null,
    },
    snapshots,
  };
}

export type DemoGroup = { id: string; name: string; emoji: string; inviteCode: string; members: string[] };

export function getDemoData() {
  const me = makeMe();
  const friends = [
    makePlayer({ name: "NoScopeNova", hue: 190, skill: 1.6, winRate: 0.07, pace: 9, startMatches: 900, seed: 11 }),
    makePlayer({ name: "LlamaLord", hue: 95, skill: 3.4, winRate: 0.12, pace: 6, startMatches: 1300, seed: 23 }),
    makePlayer({ name: "BushCamper99", hue: 70, skill: 0.8, winRate: 0.03, pace: 12, startMatches: 2000, seed: 31 }),
    makePlayer({ name: "CrankItCarl", hue: 220, skill: 2.1, winRate: 0.06, pace: 4, startMatches: 2500, seed: 47 }),
  ];
  const incoming = makePlayer({ name: "ZeroBuildZoe", hue: 320, skill: 4.8, winRate: 0.15, pace: 7, startMatches: 3000, seed: 53 });
  const pros = [
    makePlayer({ name: "ProBoxMaster", hue: 20, skill: 6.5, winRate: 0.24, pace: 14, startMatches: 12000, seed: 61 }),
    makePlayer({ name: "CashCupKing", hue: 45, skill: 5.2, winRate: 0.19, pace: 11, startMatches: 13000, seed: 73 }),
  ];

  const everyone = [me, ...friends, incoming, ...pros];
  const players = new Map(everyone.map((p) => [p.player.epic_id, p.player]));
  const snapshotRows = everyone.flatMap((p) => p.snapshots);

  const groups: DemoGroup[] = [
    { id: "tilted-towers-crew", name: "Tilted Towers Crew", emoji: "🔥", inviteCode: "TILT2026", members: ["dr.duder", "noscopenova", "llamalord", "bushcamper99"] },
    { id: "friday-night-squad", name: "Friday Night Squad", emoji: "🍕", inviteCode: "PIZZA4EV", members: ["dr.duder", "crankitcarl", "llamalord"] },
  ];

  return {
    me: me.player,
    friends: friends.map((f) => f.player),
    incoming: incoming.player,
    pros: pros.map((p) => p.player),
    groups,
    players,
    /** Snapshots for one mode, grouped per player and sorted by date. */
    snapshotsFor: (mode: Mode) => groupByPlayer(snapshotRows.filter((r) => r.mode === mode)),
    weeklyGains: (p: Player) =>
      recentGains(p, snapshotRows.filter((r) => r.epic_id === p.epic_id && r.mode === "overall"), 7),
  };
}

export type DemoData = ReturnType<typeof getDemoData>;
