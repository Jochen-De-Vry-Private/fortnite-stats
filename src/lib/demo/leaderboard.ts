import { leaderboardRows, rankPlayers, type LeaderboardOptions } from "../players";
import type { DemoData } from "./data";

/** Demo leaderboard for a set of member ids (epic ids), using the real ranking code. */
export function demoLeaderboard(demo: DemoData, memberIds: string[], opts: LeaderboardOptions & { showPros: boolean }) {
  const members = memberIds
    .map((id) => demo.players.get(id))
    .filter((p) => p !== undefined)
    .map((player) => ({ player, isMe: player.epic_id === demo.me.epic_id }));
  const rows = leaderboardRows(members, opts.showPros ? demo.pros : []);
  return rankPlayers(rows, opts.period === "lifetime" ? null : demo.baselines(opts.period), opts);
}
