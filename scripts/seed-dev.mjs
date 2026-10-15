// LOCAL DEVELOPMENT ONLY: creates fake players with 40 days of stat history.
// Fake app users are befriended with every real profile and put in a group;
// fake "pros" (no app account) are followed by every real profile.
// Run: npm run seed:dev
import { createHash } from "node:crypto";
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
  { name: "ProBoxMaster", skill: 6.5, wins: 0.24, pace: 14, pro: true },
  { name: "CashCupKing", skill: 5.2, wins: 0.19, pace: 11, pro: true },
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

const epicIdFor = (name) => createHash("md5").update(`fake:${name}`).digest("hex");
const fakeEpicIds = new Set(FAKES.map((f) => epicIdFor(f.name)));

const { data: allProfiles } = await admin.from("profiles").select("id, epic_id, player:players!profiles_epic_id_fkey!inner(epic_name)");
const realProfiles = (allProfiles ?? []).filter((p) => !fakeEpicIds.has(p.epic_id));
const fakeUserIds = [];
const proEpicIds = [];

for (const [i, f] of FAKES.entries()) {
  const epicId = epicIdFor(f.name);

  // Build 40 days of cumulative totals per mode.
  const totals = Object.fromEntries(Object.keys(MODE_SPLIT).map((m) => [m, { score: 0, wins: 0, kills: 0, deaths: 0, matches: 0, minutesPlayed: 0, playersOutlived: 0 }]));
  const base = (f.pro ? 2500 : 200) + i * 150;
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
  let latest;
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
      rows.push({ epic_id: epicId, snapshot_date: day(d), mode: m, score: t.score, wins: t.wins, kills: t.kills, deaths: t.deaths, matches: t.matches, minutes_played: t.minutesPlayed, players_outlived: t.playersOutlived });
    }
    if (d === 0) {
      latest = { all: { overall: modeStats(overall), ...Object.fromEntries(Object.entries(totals).map(([m, t]) => [m, modeStats(t)])) } };
    }
  }

  const { error: playerError } = await admin.from("players").upsert({
    epic_id: epicId, epic_name: f.name, battle_pass_level: 20 + i * 17, battle_pass_progress: (i * 23) % 100,
    latest_stats: latest, last_synced_at: new Date().toISOString(),
  });
  if (playerError) throw playerError;
  await admin.from("stat_snapshots").delete().eq("epic_id", epicId);
  const { error: snapError } = await admin.from("stat_snapshots").insert(rows);
  if (snapError) throw snapError;

  if (f.pro) {
    proEpicIds.push(epicId);
    continue;
  }

  const email = `${f.name.toLowerCase()}@dropstats.test`;
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: "localtest-pass-1", email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const { error: profileError } = await admin.from("profiles").upsert({ id: user.id, epic_id: epicId });
  if (profileError) throw profileError;
  fakeUserIds.push(user.id);
}

for (const p of realProfiles) {
  // Accepted friendships with the first 4 fake users; the last one sends a pending request.
  for (const [i, id] of fakeUserIds.entries()) {
    await admin.from("friendships").delete().or(`and(requester_id.eq.${id},addressee_id.eq.${p.id}),and(requester_id.eq.${p.id},addressee_id.eq.${id})`);
    await admin.from("friendships").insert({ requester_id: id, addressee_id: p.id, status: i < 4 ? "accepted" : "pending" });
  }
  for (const epicId of proEpicIds) {
    await admin.from("follows").upsert({ profile_id: p.id, epic_id: epicId }, { onConflict: "profile_id,epic_id" });
  }
  const { data: existing } = await admin.from("groups").select("id").eq("owner_id", p.id).eq("name", "Tilted Towers Crew").maybeSingle();
  if (!existing) {
    const { data: g } = await admin.from("groups").insert({ name: "Tilted Towers Crew", emoji: "🔥", owner_id: p.id }).select("id").single();
    await admin.from("group_members").insert([p.id, ...fakeUserIds.slice(0, 3)].map((profile_id) => ({ group_id: g.id, profile_id })));
  }
  console.log(`Seeded friends, follows + group for ${p.player.epic_name}`);
}
console.log(`Seeded ${fakeUserIds.length} fake users and ${proEpicIds.length} fake pros (password: localtest-pass-1)`);
