import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const INVITE_CODE_RE = /^[0-9a-f]{10}$/;

export async function getInviter(admin: SupabaseClient, code: string) {
  if (!INVITE_CODE_RE.test(code)) return null;
  const { data } = await admin
    .from("profiles")
    .select("id, player:players!profiles_epic_id_fkey!inner(epic_name, avatar_hue)")
    .eq("invite_code", code)
    .maybeSingle();
  return data as unknown as { id: string; player: { epic_name: string; avatar_hue: number } } | null;
}

/**
 * Makes the invite link's owner and `userId` friends straight away. Opening
 * someone's invite link counts as both sides agreeing. Needs the admin client
 * because users can't create accepted friendships themselves.
 */
export async function applyInvite(admin: SupabaseClient, userId: string, code: string) {
  const inviter = await getInviter(admin, code);
  if (!inviter || inviter.id === userId) return null;

  // Replace any pending request between the two, in either direction.
  await admin
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${inviter.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${inviter.id})`,
    );
  const { error } = await admin
    .from("friendships")
    .insert({ requester_id: inviter.id, addressee_id: userId, status: "accepted" });
  if (error) throw error;
  return inviter;
}
