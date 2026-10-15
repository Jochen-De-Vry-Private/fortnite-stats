"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMyProfile } from "@/lib/data";
import type { AccountType } from "@/lib/fortnite/types";
import { isEpicId } from "@/lib/stats";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";
import { lookupPlayer, syncPlayer } from "@/lib/sync";

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;

export async function refreshMyStats(): Promise<{ error?: string; ok?: boolean }> {
  const profile = await getMyProfile();
  if (!profile) return { error: "Not signed in." };
  const { player } = profile;

  if (player.last_synced_at && Date.now() - Date.parse(player.last_synced_at) < REFRESH_COOLDOWN_MS) {
    return { error: "Stats were just updated. You can refresh again in a few minutes." };
  }

  const result = await syncPlayer(createAdminClient(), player);
  revalidatePath("/", "layout");
  return result.ok ? { ok: true } : { error: result.message };
}

export type LookupState = { error?: string } | undefined;

/** Compare tab search: finds any Fortnite player and opens the head-to-head. */
export async function lookupAndCompare(_prev: LookupState, formData: FormData): Promise<LookupState> {
  if (!(await getUser())) redirect("/login");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("accountType") ?? "epic");
  const accountType: AccountType = type === "psn" || type === "xbl" ? type : "epic";
  if (name.length < 2 || name.length > 40) return { error: "Enter a Fortnite username." };

  const result = await lookupPlayer(createAdminClient(), name, accountType);
  if (!result.ok) return { error: result.message };
  redirect(`/compare/${result.epicId}`);
}

export async function followPlayer(epicId: string) {
  const user = await getUser();
  if (!user || !isEpicId(epicId)) return;
  const supabase = await createClient();
  await supabase.from("follows").upsert({ profile_id: user.id, epic_id: epicId }, { onConflict: "profile_id,epic_id" });
  revalidatePath("/", "layout");
}

export async function unfollowPlayer(epicId: string) {
  const user = await getUser();
  if (!user || !isEpicId(epicId)) return;
  const supabase = await createClient();
  await supabase.from("follows").delete().eq("profile_id", user.id).eq("epic_id", epicId);
  revalidatePath("/", "layout");
}
