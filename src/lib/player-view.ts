import "server-only";
import type { StatsViewPlayer } from "@/components/stats-view";
import { getBaselines, getOverallHistory, type Player } from "./data";
import { playerBaselines } from "./players";
import { daysAgo, trendFromSnapshots } from "./stats";

/** Everything the StatsView needs for one player. */
export async function loadPlayerView(player: Player) {
  const ids = [player.epic_id];
  const [history, week, month, year] = await Promise.all([
    getOverallHistory(player.epic_id, daysAgo(120)),
    getBaselines(ids, "7d"),
    getBaselines(ids, "30d"),
    getBaselines(ids, "365d"),
  ]);
  const view: StatsViewPlayer = {
    epic_name: player.epic_name,
    avatar_hue: player.avatar_hue,
    battle_pass_level: player.battle_pass_level,
    battle_pass_progress: player.battle_pass_progress,
    last_synced_at: player.last_synced_at,
    sync_error: player.sync_error,
  };
  return {
    player: view,
    stats: player.latest_stats,
    trend: trendFromSnapshots(history),
    baselines: playerBaselines(player.epic_id, { "7d": week, "30d": month, "365d": year }),
  };
}
