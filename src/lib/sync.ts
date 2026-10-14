import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchStatsByAccountId, type FetchStatsResult } from "./fortnite/api";
import type { FortniteStatsData } from "./fortnite/types";
import { isoDate, snapshotRowsFromStats } from "./stats";

type ProfileForSync = {
  id: string;
  epic_id: string;
  latest_stats: FortniteStatsData["stats"] | null;
};

/**
 * Stores a fresh API response for a profile. A snapshot is written only when
 * the overall match count changed (or none exists yet), which keeps the
 * history table small for inactive players.
 */
export async function saveStats(
  admin: SupabaseClient,
  profile: ProfileForSync,
  data: FortniteStatsData,
) {
  const now = new Date();
  const { error } = await admin
    .from("profiles")
    .update({
      epic_name: data.account.name,
      battle_pass_level: data.battlePass?.level ?? null,
      battle_pass_progress: data.battlePass?.progress ?? null,
      latest_stats: data.stats,
      last_synced_at: now.toISOString(),
      sync_error: null,
    })
    .eq("id", profile.id);
  if (error) throw error;

  const prevMatches = profile.latest_stats?.all?.overall?.matches;
  const newMatches = data.stats.all?.overall?.matches;
  if (prevMatches !== undefined && prevMatches === newMatches) return;

  const rows = snapshotRowsFromStats(profile.id, data.stats, isoDate(now));
  if (rows.length === 0) return;
  const { error: snapError } = await admin
    .from("stat_snapshots")
    .upsert(rows, { onConflict: "profile_id,mode,snapshot_date" });
  if (snapError) throw snapError;
}

export async function syncProfile(admin: SupabaseClient, profile: ProfileForSync): Promise<FetchStatsResult> {
  const result = await fetchStatsByAccountId(profile.epic_id);
  if (result.ok) {
    await saveStats(admin, profile, result.data);
  } else if (result.error === "private" || result.error === "not_found") {
    // Remember the failure so the UI can explain it; don't retry until tomorrow.
    await admin
      .from("profiles")
      .update({ sync_error: result.error, last_synced_at: new Date().toISOString() })
      .eq("id", profile.id);
  }
  return result;
}
