"use server";

import { revalidatePath } from "next/cache";
import { getMyProfile } from "@/lib/data";
import { createAdminClient } from "@/lib/supabase/server";
import { syncProfile } from "@/lib/sync";

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;

export async function refreshMyStats(): Promise<{ error?: string; ok?: boolean }> {
  const profile = await getMyProfile();
  if (!profile) return { error: "Not signed in." };

  if (profile.last_synced_at && Date.now() - Date.parse(profile.last_synced_at) < REFRESH_COOLDOWN_MS) {
    return { error: "Stats were just updated. You can refresh again in a few minutes." };
  }

  const result = await syncProfile(createAdminClient(), profile);
  revalidatePath("/", "layout");
  return result.ok ? { ok: true } : { error: result.message };
}
