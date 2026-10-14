// LOCAL DEVELOPMENT ONLY: creates fake players with 40 days of stat history,
// befriends them with every existing real profile and puts everyone in a group.
// Run: npm run seed:dev
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!url?.includes("127.0.0.1") && !url?.includes("localhost")) {
  console.error("Refusing to seed a non-local Supabase:", url);
  process.exit(1);
}
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

const FAKES = [
  { name: "NoScopeNova", skill: 1.6, wins: 0.07, pace: 9 },
  { name: "LlamaLord", skill: 3.4, wins: 0.12, pace: 6 },
  { name: "BushCamper99", skill: 0.8, wins: 0.03, pace: 12 },
  { name: "CrankItCarl", skill: 2.1, wins: 0.06, pace: 4 },
  { name: "ZeroBuildZoe", skill: 4.8, wins: 0.15, pace: 7 },
];

const MODE_SPLIT = { solo: 0.15, duo: 0.2, squad: 0.1, ltm: 0.55 };
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function modeStats(t) {
  const kd = t.deaths ? t.kills / t.deaths : t.kills;
  return {
    score: t.score, scorePerMin: t.minutesPlayed ? t.score / t.minutesPlayed : 0, scorePerMatch: t.matches ? t.score / t.matches : 0,
    wins: t.wins, top10: Math.round(t.matches * 0.2), top25: Math.round(t.matches * 0.35),
    kills: t.kills, killsPerMin: t.minutesPlayed ? t.kills / t.minutesPlayed : 0, killsPerMatch: t.matches ? t.kills / t.matches : 0,
    deaths: t.deaths, kd, matches: t.matches, winRate: t.matches ? (t.wins / t.matches) * 100 : 0,
    minutesPlayed: t.minutesPlayed, playersOutlived: t.playersOutlived, lastModified: new Date().toISOString(),
  };
}

const day = (n) => new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);

const { data: realProfiles } = await admin.from("profiles").select("id, epic_name").not("epic_id", "like", "fake-%");
const fakeIds = [];

for (const [i, f] of FAKES.entries()) {
  const email = `${f.name.toLowerCase()}@dropstats.test`;
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: "localtest-pass-1", email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  fakeIds.push(user.id);

  // Build 40 days of cumulative totals per mode.
  const totals = Object.fromEntries(Object.keys(MODE_SPLIT).map((m) => [m, { score: 0, wins: 0, kills: 0, deaths: 0, matches: 0, minutesPlayed: 0, playersOutlived: 0 }]));
  const base = 200 + i * 150;
  for (const m in totals) {
    const t = totals[m];
    t.matches = Math.round(base * MODE_SPLIT[m] * 4);
    t.wins = Math.round(t.matches * f.wins);
    t.deaths = t.matches - t.wins;
    t.kills = Math.round(t.deaths * f.skill);
    t.minutesPlayed = t.matches * 7;
    t.score = t.matches * 180;
    t.playersOutlived = t.matches * 40;
  }
  const rows = [];
  for (let d = 40; d >= 0; d--) {
    if (rand() > 0.6 && d !== 0) continue; // not every day is a gaming day
    for (const m in totals) {
      const t = totals[m];
      const matches = Math.round(f.pace * MODE_SPLIT[m] * (0.5 + rand()));
      const wins = Math.round(matches * f.wins * (0.5 + rand()));
      t.matches += matches; t.wins += wins; t.deaths += matches - wins;
      t.kills += Math.round((matches - wins) * f.skill * (0.6 + rand() * 0.8));
      t.minutesPlayed += matches * 7; t.score += matches * 180; t.playersOutlived += matches * 40;
    }
    const overall = Object.values(totals).reduce((a, t) => {
      for (const k in t) a[k] = (a[k] ?? 0) + t[k];
      return a;
    }, {});
    for (const [m, t] of [...Object.entries(totals), ["overall", overall]]) {
      rows.push({ profile_id: user.id, snapshot_date: day(d), mode: m, score: t.score, wins: t.wins, kills: t.kills, deaths: t.deaths, matches: t.matches, minutes_played: t.minutesPlayed, players_outlived: t.playersOutlived });
    }
    if (d === 0) {
      var latest = { all: { overall: modeStats(overall), ...Object.fromEntries(Object.entries(totals).map(([m, t]) => [m, modeStats(t)])) } };
    }
  }

  await admin.from("profiles").upsert({
    id: user.id, epic_id: `fake-${f.name}`, epic_name: f.name, battle_pass_level: 20 + i * 17, battle_pass_progress: (i * 23) % 100,
    latest_stats: latest, last_synced_at: new Date().toISOString(),
  });
  await admin.from("stat_snapshots").delete().eq("profile_id", user.id);
  await admin.from("stat_snapshots").insert(rows);
}

for (const p of realProfiles ?? []) {
  // Accepted friendships with the first 4 fakes; the last one sends a pending request.
  for (const [i, id] of fakeIds.entries()) {
    await admin.from("friendships").upsert(
      { requester_id: id, addressee_id: p.id, status: i < 4 ? "accepted" : "pending" },
      { onConflict: "requester_id,addressee_id" },
    );
  }
  const { data: g } = await admin.from("groups").insert({ name: "Tilted Towers Crew", emoji: "🔥", owner_id: p.id }).select("id").single();
  await admin.from("group_members").insert([p.id, ...fakeIds.slice(0, 3)].map((profile_id) => ({ group_id: g.id, profile_id })));
  console.log(`Seeded friends + group for ${p.epic_name}`);
}
console.log(`Seeded ${FAKES.length} fake players (password: localtest-pass-1)`);
