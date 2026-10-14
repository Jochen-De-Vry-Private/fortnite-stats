import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { syncProfile } from "@/lib/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STALE_AFTER_HOURS = 20;
const BATCH_LIMIT = 300;
const CONCURRENCY = 4;
const TIME_BUDGET_MS = 50_000;

/**
 * Refreshes every player not synced in the last 20 hours, oldest first.
 * Called daily by Vercel Cron. If there are more players than fit in one run,
 * it can be called repeatedly (e.g. hourly from Supabase pg_cron); each call
 * picks up where the last left off.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const started = Date.now();
  const admin = createAdminClient();
  const staleBefore = new Date(started - STALE_AFTER_HOURS * 3600_000).toISOString();

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, epic_id, latest_stats")
    .or(`last_synced_at.is.null,last_synced_at.lt."${staleBefore}"`)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_LIMIT);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const queue = [...(profiles ?? [])];
  const counts = { synced: 0, failed: 0, remaining: 0 };
  let rateLimited = false;

  async function worker() {
    while (queue.length > 0 && !rateLimited && Date.now() - started < TIME_BUDGET_MS) {
      const profile = queue.shift()!;
      try {
        const result = await syncProfile(admin, profile);
        if (result.ok) counts.synced++;
        else {
          counts.failed++;
          if (result.error === "rate_limited") rateLimited = true;
        }
      } catch (e) {
        counts.failed++;
        console.error("sync failed", profile.id, e);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  counts.remaining = queue.length;
  return NextResponse.json({ ...counts, rateLimited, ms: Date.now() - started });
}
