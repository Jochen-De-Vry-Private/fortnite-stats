import "server-only";
import type { StatsViewPlayer } from "@/components/stats-view";
import { getRecentGains, getSnapshots, type Player } from "./data";
import { daysAgo, trendFromSnapshots } from "./stats";

/** Everything the StatsView needs for one player. */
export async function loadPlayerView(player: Player) {
  const [snapshots, weekly] = await Promise.all([
    getSnapshots([player.epic_id], daysAgo(120), "overall"),
    getRecentGains(player, 7),
  ]);
  const view: StatsViewPlayer = {
    epic_name: player.epic_name,
    avatar_hue: player.avatar_hue,
    battle_pass_level: player.battle_pass_level,
    battle_pass_progress: player.battle_pass_progress,
    last_synced_at: player.last_synced_at,
    sync_error: player.sync_error,
  };
  return { player: view, stats: player.latest_stats, trend: trendFromSnapshots(snapshots), weekly };
}
