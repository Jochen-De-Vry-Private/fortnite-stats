import "server-only";
import { cache } from "react";
import { createClient, getUser } from "./supabase/server";
import {
  gainsSince,
  leaderboardRows,
  rankPlayers,
  toBaselineMap,
  type BaselineMap,
  type LeaderboardEntry,
  type LeaderboardOptions,
  type Player,
} from "./players";
import { PERIOD_DAYS, daysAgo, type GainPeriod, type SnapshotRow } from "./stats";

export type { LeaderboardEntry, Player, PublicPlayer } from "./players";

/** An app account and the player it's linked to. */
export type Profile = {
  id: string;
  epic_id: string;
  invite_code: string;
  player: Player;
};

const PLAYER_COLUMNS =
  "epic_id, epic_name, avatar_hue, battle_pass_level, battle_pass_progress, latest_stats, last_synced_at, sync_error";
const PROFILE_COLUMNS = `id, epic_id, invite_code, player:players!profiles_epic_id_fkey!inner(${PLAYER_COLUMNS})`;

export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  return data as unknown as Profile | null;
});

export async function getProfiles(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).in("id", ids);
  return (data ?? []) as unknown as Profile[];
}

/** The app account linked to a player, if they have one. */
export async function getProfileByEpicId(epicId: string): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("epic_id", epicId).maybeSingle();
  return data;
}

export async function getPlayer(epicId: string): Promise<Player | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("players").select(PLAYER_COLUMNS).eq("epic_id", epicId).maybeSingle();
  return data as Player | null;
}

export async function getPlayers(epicIds: string[]): Promise<Player[]> {
  if (epicIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("players").select(PLAYER_COLUMNS).in("epic_id", epicIds);
  return (data ?? []) as Player[];
}

export async function searchAppUsers(q: string, excludeId: string): Promise<Profile[]> {
  const supabase = await createClient();
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .ilike("player.epic_name", pattern)
    .neq("id", excludeId)
    .limit(20);
  return ((data ?? []) as unknown as Profile[]).sort((a, b) => a.player.epic_name.localeCompare(b.player.epic_name));
}

/** Overall, all-inputs history, used for the progress chart. */
export async function getOverallHistory(epicId: string, since: string): Promise<SnapshotRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stat_snapshots")
    .select("*")
    .eq("epic_id", epicId)
    .eq("input", "all")
    .eq("mode", "overall")
    .gte("snapshot_date", since)
    .order("snapshot_date", { ascending: true })
    .limit(1000);
  return (data ?? []) as SnapshotRow[];
}

/** Period-start totals for every input + mode of the given players. */
export async function getBaselines(epicIds: string[], period: GainPeriod): Promise<BaselineMap> {
  if (epicIds.length === 0) return new Map();
  const cutoff = daysAgo(PERIOD_DAYS[period]);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("snapshot_baselines", { epic_ids: epicIds, cutoff });
  if (error) throw error;
  return toBaselineMap((data ?? []) as SnapshotRow[], cutoff);
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

export async function getFollowedPlayers(): Promise<Player[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("follows")
    .select(`created_at, player:players!inner(${PLAYER_COLUMNS})`)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { player: Player }[]).map((f) => f.player);
}

export async function isFollowing(epicId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("follows").select("epic_id").eq("epic_id", epicId).maybeSingle();
  return !!data;
}

export type Group = {
  id: string;
  name: string;
  emoji: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

export async function getMyGroups() {
  const supabase = await createClient();
  // Row-level security limits this to the signed-in user's groups.
  const { data } = await supabase
    .from("groups")
    .select("id, name, emoji, owner_id, invite_code, created_at, group_members(count)")
    .order("created_at", { ascending: true });
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

/**
 * Ranks app users (by profile id) plus optional extra players (followed pros)
 * on one metric. Players appearing in both lists are counted once.
 */
export async function buildLeaderboard(
  profileIds: string[],
  opts: LeaderboardOptions & { meId: string; pros: Player[] },
): Promise<LeaderboardEntry[]> {
  const profiles = await getProfiles(profileIds);
  const rows = leaderboardRows(
    profiles.map((p) => ({ player: p.player, isMe: p.id === opts.meId })),
    opts.pros,
  );
  const baselines =
    opts.period === "lifetime"
      ? null
      : await getBaselines(
          rows.map((r) => r.player.epic_id),
          opts.period,
        );
  return rankPlayers(rows, baselines, opts);
}

/** Gains over the last 7 days for one player (overall, all inputs). */
export async function getWeeklyGains(player: Player) {
  return gainsSince(player, await getBaselines([player.epic_id], "7d"), "all", "overall");
}
