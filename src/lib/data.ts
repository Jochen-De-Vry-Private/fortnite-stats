import "server-only";
import { cache } from "react";
import { createClient, getUser } from "./supabase/server";
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

export type Profile = {
  id: string;
  epic_id: string;
  epic_name: string;
  avatar_hue: number;
  battle_pass_level: number | null;
  battle_pass_progress: number | null;
  latest_stats: AllStats | null;
  last_synced_at: string | null;
  sync_error: string | null;
  created_at: string;
};

export type PublicProfile = Pick<Profile, "id" | "epic_name" | "avatar_hue">;

const PROFILE_COLUMNS =
  "id, epic_id, epic_name, avatar_hue, battle_pass_level, battle_pass_progress, latest_stats, last_synced_at, sync_error, created_at";

export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  return data as Profile | null;
});

export async function getProfile(id: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
  return data as Profile | null;
}

export async function getProfiles(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  return (data ?? []) as Profile[];
}

export async function getSnapshots(profileIds: string[], since: string, mode?: Mode): Promise<SnapshotRow[]> {
  if (profileIds.length === 0) return [];
  const supabase = await createClient();
  let query = supabase
    .from("stat_snapshots")
    .select("*")
    .in("profile_id", profileIds)
    .gte("snapshot_date", since)
    .order("snapshot_date", { ascending: true })
    .limit(10000);
  if (mode) query = query.eq("mode", mode);
  const { data } = await query;
  return (data ?? []) as SnapshotRow[];
}

export function groupByProfile(rows: SnapshotRow[]) {
  const map = new Map<string, SnapshotRow[]>();
  for (const r of rows) {
    const list = map.get(r.profile_id);
    if (list) list.push(r);
    else map.set(r.profile_id, [r]);
  }
  return map;
}

/** Snapshots per profile, sorted by date. Enough history to find each player's totals at `cutoff`. */
export async function getSnapshotsForPeriod(profileIds: string[], mode: Mode) {
  // Snapshots are written only on active days, so look back well past the
  // cutoff to find each player's baseline.
  return groupByProfile(await getSnapshots(profileIds, daysAgo(400), mode));
}

export type Friendship = {
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};

export async function getFriendships(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id, status, created_at")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
  const rows = (data ?? []) as Friendship[];
  const otherId = (f: Friendship) => (f.requester_id === userId ? f.addressee_id : f.requester_id);
  return {
    friends: rows.filter((f) => f.status === "accepted").map(otherId),
    incoming: rows.filter((f) => f.status === "pending" && f.addressee_id === userId).map(otherId),
    outgoing: rows.filter((f) => f.status === "pending" && f.requester_id === userId).map(otherId),
  };
}

export type FriendStatus = "self" | "friends" | "incoming" | "outgoing" | "none";

export async function getFriendStatus(userId: string, otherId: string): Promise<FriendStatus> {
  if (userId === otherId) return "self";
  const supabase = await createClient();
  const { data } = await supabase
    .from("friendships")
    .select("requester_id, status")
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${userId})`,
    )
    .maybeSingle();
  if (!data) return "none";
  if (data.status === "accepted") return "friends";
  return data.requester_id === userId ? "outgoing" : "incoming";
}

export type Group = {
  id: string;
  name: string;
  emoji: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

export async function getMyGroups(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("id, name, emoji, owner_id, invite_code, created_at, group_members(count)")
    .order("created_at", { ascending: true });
  void userId; // RLS already limits this to the user's groups.
  return (data ?? []).map((g) => ({
    ...(g as Group),
    memberCount: (g.group_members as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function getGroup(id: string) {
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, emoji, owner_id, invite_code, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!group) return null;
  const { data: members } = await supabase.from("group_members").select("profile_id").eq("group_id", id);
  return { group: group as Group, memberIds: (members ?? []).map((m) => m.profile_id as string) };
}

export type LeaderboardEntry = {
  profile: PublicProfile;
  value: number;
  totals: Totals;
  hasData: boolean;
};

export async function buildLeaderboard(
  profileIds: string[],
  opts: { metric: MetricKey; mode: Mode; input: Input; period: Period },
): Promise<LeaderboardEntry[]> {
  const profiles = await getProfiles(profileIds);
  const metric = METRICS[opts.metric];

  let snapshotsByProfile = new Map<string, SnapshotRow[]>();
  let cutoff = "";
  if (opts.period !== "lifetime") {
    cutoff = daysAgo(PERIOD_DAYS[opts.period]);
    snapshotsByProfile = await getSnapshotsForPeriod(profileIds, opts.mode);
  }

  const entries = profiles.map((p) => {
    // Period gains are tracked for "all inputs" only.
    const input = opts.period === "lifetime" ? opts.input : "all";
    const current = getModeStats(p.latest_stats, input, opts.mode);
    let totals = totalsFromStats(current);
    if (opts.period !== "lifetime") {
      const base = baselineFor(snapshotsByProfile.get(p.id) ?? [], cutoff);
      totals = base ? subtractTotals(totals, base) : totalsFromStats(null);
    }
    return {
      profile: { id: p.id, epic_name: p.epic_name, avatar_hue: p.avatar_hue },
      totals,
      value: metric.get(totals),
      hasData: totals.matches > 0,
    };
  });

  return entries.sort((a, b) => Number(b.hasData) - Number(a.hasData) || b.value - a.value);
}

/** Gains over the last `days` days for one profile (overall, all inputs). */
export async function getRecentGains(profile: Profile, days: number) {
  const cutoff = daysAgo(days);
  const rows = await getSnapshotsForPeriod([profile.id], "overall");
  const base = baselineFor(rows.get(profile.id) ?? [], cutoff);
  const current = totalsFromStats(getModeStats(profile.latest_stats, "all", "overall"));
  return base ? subtractTotals(current, base) : null;
}
