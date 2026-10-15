import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchStatsByAccountId, fetchStatsByName, type FetchStatsResult } from "./fortnite/api";
import type { AccountType, AllStats, FortniteStatsData } from "./fortnite/types";
import { isoDate, snapshotRowsFromStats } from "./stats";

type PlayerForSync = { epic_id: string; latest_stats: AllStats | null };

/**
 * Stores a fresh API response, creating the player row if needed. Snapshot
 * rows are written only for input + mode combinations whose match count
 * changed, which keeps the history table small.
 */
export async function saveStats(admin: SupabaseClient, previous: AllStats | null, data: FortniteStatsData) {
  const now = new Date();
  const epicId = data.account.id;
  const { error } = await admin.from("players").upsert(
    {
      epic_id: epicId,
      epic_name: data.account.name,
      battle_pass_level: data.battlePass?.level ?? null,
      battle_pass_progress: data.battlePass?.progress ?? null,
      latest_stats: data.stats,
      last_synced_at: now.toISOString(),
      sync_error: null,
    },
    { onConflict: "epic_id" },
  );
  if (error) throw error;

  const rows = snapshotRowsFromStats(epicId, data.stats, previous, isoDate(now));
  if (rows.length === 0) return;
  const { error: snapError } = await admin
    .from("stat_snapshots")
    .upsert(rows, { onConflict: "epic_id,input,mode,snapshot_date" });
  if (snapError) throw snapError;
}

export async function syncPlayer(admin: SupabaseClient, player: PlayerForSync): Promise<FetchStatsResult> {
  const result = await fetchStatsByAccountId(player.epic_id);
  if (result.ok) {
    await saveStats(admin, player.latest_stats, result.data);
  } else if (result.error === "private" || result.error === "not_found") {
    // Remember the failure so the UI can explain it; don't retry until tomorrow.
    await admin
      .from("players")
      .update({ sync_error: result.error, last_synced_at: new Date().toISOString() })
      .eq("epic_id", player.epic_id);
  }
  return result;
}

const LOOKUP_CACHE_MS = 60 * 60 * 1000;

/**
 * Finds any Fortnite player by name for the Compare tab. Reuses a stored copy
 * synced within the last hour, otherwise asks the API and stores the result.
 */
export async function lookupPlayer(
  admin: SupabaseClient,
  name: string,
  accountType: AccountType,
): Promise<{ ok: true; epicId: string } | { ok: false; message: string }> {
  const { data: cached } = await admin
    .from("players")
    .select("epic_id, last_synced_at, sync_error")
    .ilike("epic_name", name.replace(/[\\%_]/g, (c) => `\\${c}`))
    .order("last_synced_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (
    cached?.last_synced_at &&
    !cached.sync_error &&
    accountType === "epic" &&
    Date.now() - Date.parse(cached.last_synced_at) < LOOKUP_CACHE_MS
  ) {
    return { ok: true, epicId: cached.epic_id };
  }

  const result = await fetchStatsByName(name, accountType);
  if (!result.ok) return { ok: false, message: result.message };

  const { data: existing } = await admin
    .from("players")
    .select("latest_stats")
    .eq("epic_id", result.data.account.id)
    .maybeSingle();
  await saveStats(admin, existing?.latest_stats ?? null, result.data);
  return { ok: true, epicId: result.data.account.id };
}

/** Refreshes a player whose data is older than `maxAgeHours` (e.g. when someone opens their page). */
export async function ensureFresh(admin: SupabaseClient, player: PlayerForSync & { last_synced_at: string | null }, maxAgeHours: number) {
  if (player.last_synced_at && Date.now() - Date.parse(player.last_synced_at) < maxAgeHours * 3600_000) return false;
  const result = await syncPlayer(admin, player);
  return result.ok;
}
