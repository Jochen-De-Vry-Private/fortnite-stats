import "server-only";
import type { StatsViewPlayer } from "@/components/stats-view";
import { getRecentGains, getSnapshots, type Profile } from "./data";
import { daysAgo, trendFromSnapshots } from "./stats";

/** Everything the StatsView needs for one profile. */
export async function loadPlayerView(profile: Profile) {
  const [snapshots, weekly] = await Promise.all([
    getSnapshots([profile.id], daysAgo(120), "overall"),
    getRecentGains(profile, 7),
  ]);
  const player: StatsViewPlayer = {
    epic_name: profile.epic_name,
    avatar_hue: profile.avatar_hue,
    battle_pass_level: profile.battle_pass_level,
    battle_pass_progress: profile.battle_pass_progress,
    last_synced_at: profile.last_synced_at,
    sync_error: profile.sync_error,
  };
  return { player, stats: profile.latest_stats, trend: trendFromSnapshots(snapshots), weekly };
}
