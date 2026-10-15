import type { Player } from "../players";
import { trendFromSnapshots } from "../stats";
import type { DemoData } from "./data";

/** StatsView props for a demo player, same shape as loadPlayerView. */
export function demoView(demo: DemoData, player: Player) {
  return {
    player: {
      epic_name: player.epic_name,
      avatar_hue: player.avatar_hue,
      battle_pass_level: player.battle_pass_level,
      battle_pass_progress: player.battle_pass_progress,
      last_synced_at: player.last_synced_at,
      sync_error: player.sync_error,
    },
    stats: player.latest_stats,
    trend: trendFromSnapshots(
      demo.snapshotRows.filter((r) => r.epic_id === player.epic_id && r.input === "all" && r.mode === "overall"),
    ),
    baselines: demo.playerBaselines(player),
  };
}
