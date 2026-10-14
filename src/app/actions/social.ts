"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/stats";
import { createClient, getUser } from "@/lib/supabase/server";

async function requireUser(...ids: unknown[]) {
  // Action arguments come from the client, and some end up in PostgREST filters.
  if (!ids.every(isUuid)) throw new Error("Invalid id");
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function sendFriendRequest(otherId: string) {
  const user = await requireUser(otherId);
  const supabase = await createClient();

  // If they already asked us, sending a request back means accepting it.
  const { data: incoming } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", otherId)
    .eq("addressee_id", user.id)
    .select("requester_id");
  if (!incoming?.length) {
    await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: otherId });
  }
  revalidatePath("/", "layout");
}

export async function acceptFriendRequest(otherId: string) {
  const user = await requireUser(otherId);
  const supabase = await createClient();
  await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", otherId)
    .eq("addressee_id", user.id);
  revalidatePath("/", "layout");
}

/** Removes a friend, cancels a sent request or declines a received one. */
export async function removeFriend(otherId: string) {
  const user = await requireUser(otherId);
  const supabase = await createClient();
  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${otherId}),and(requester_id.eq.${otherId},addressee_id.eq.${user.id})`,
    );
  revalidatePath("/", "layout");
}

export type GroupFormState = { error?: string } | undefined;

export async function createGroup(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const emoji = String(formData.get("emoji") ?? "🎮").trim();
  if (!name || name.length > 40) return { error: "Group name must be 1–40 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", { group_name: name, group_emoji: emoji });
  if (error) return { error: error.message };
  redirect(`/groups/${data}`);
}

export async function joinGroup(_prev: GroupFormState, formData: FormData): Promise<GroupFormState> {
  await requireUser();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter an invite code." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_group", { code });
  if (error) return { error: error.message.includes("Invalid") ? "No group found with that code." : error.message };
  redirect(`/groups/${data}`);
}

export async function addToGroup(groupId: string, profileId: string) {
  await requireUser(groupId, profileId);
  const supabase = await createClient();
  await supabase.from("group_members").insert({ group_id: groupId, profile_id: profileId });
  revalidatePath(`/groups/${groupId}`);
}

export async function removeFromGroup(groupId: string, profileId: string) {
  const user = await requireUser(groupId, profileId);
  const supabase = await createClient();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("profile_id", profileId);
  if (profileId === user.id) redirect("/groups");
  revalidatePath(`/groups/${groupId}`);
}

export async function deleteGroup(groupId: string) {
  await requireUser(groupId);
  const supabase = await createClient();
  await supabase.from("groups").delete().eq("id", groupId);
  redirect("/groups");
}
