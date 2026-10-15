"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchStatsByName } from "@/lib/fortnite/api";
import type { AccountType, FortniteStatsData } from "@/lib/fortnite/types";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";
import { applyInvite } from "@/lib/invites";
import { saveStats } from "@/lib/sync";

export type FormState = { error?: string; message?: string } | undefined;

const ACCOUNT_TYPES: AccountType[] = ["epic", "psn", "xbl"];

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/** Looks up an Epic name and checks nobody has claimed it yet. */
async function lookupUnclaimedAccount(
  name: string,
  accountType: AccountType,
): Promise<{ data: FortniteStatsData } | { error: string }> {
  if (!name) return { error: "Enter your Fortnite (Epic) username." };
  const result = await fetchStatsByName(name, accountType);
  if (!result.ok) return { error: result.message };

  const admin = createAdminClient();
  const { data: existing, error } = await admin
    .from("profiles")
    .select("id")
    .eq("epic_id", result.data.account.id)
    .maybeSingle();
  if (error) {
    console.error("profile lookup failed", error);
    return { error: "Our database isn't reachable right now. Try again later." };
  }
  if (existing) return { error: `${result.data.account.name} is already linked to another account.` };
  return { data: result.data };
}

async function linkAccount(userId: string, data: FortniteStatsData, inviteCode?: string) {
  const admin = createAdminClient();
  // The player row may already exist (e.g. someone looked them up on Compare).
  const { data: existing } = await admin
    .from("players")
    .select("latest_stats")
    .eq("epic_id", data.account.id)
    .maybeSingle();
  await saveStats(admin, existing?.latest_stats ?? null, data);

  const { error } = await admin.from("profiles").insert({ id: userId, epic_id: data.account.id });
  if (error) {
    if (error.code === "23505") return `${data.account.name} is already linked to another account.`;
    throw error;
  }
  if (inviteCode) await applyInvite(admin, userId, inviteCode);
  return null;
}

function readAccountType(formData: FormData): AccountType {
  const value = formData.get("accountType");
  return ACCOUNT_TYPES.includes(value as AccountType) ? (value as AccountType) : "epic";
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const epicName = String(formData.get("epicName") ?? "").trim();
  const accountType = readAccountType(formData);
  const inviteCode = String(formData.get("invite") ?? "").trim() || undefined;

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const lookup = await lookupUnclaimedAccount(epicName, accountType);
  if ("error" in lookup) return { error: lookup.error };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
      // Remembered so onboarding can prefill the name after email confirmation.
      data: { epic_name: lookup.data.account.name, account_type: accountType, invite_code: inviteCode },
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Sign-up failed. Try again." };

  if (!data.session) {
    return { message: "Almost there! Check your email and click the link to activate your account." };
  }

  const linkError = await linkAccount(data.user.id, lookup.data, inviteCode);
  if (linkError) return { error: linkError };
  redirect("/dashboard");
}

export async function linkEpicAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");

  const lookup = await lookupUnclaimedAccount(
    String(formData.get("epicName") ?? "").trim(),
    readAccountType(formData),
  );
  if ("error" in lookup) return { error: lookup.error };

  // Invite from a sign-up that needed email confirmation first.
  const linkError = await linkAccount(user.id, lookup.data, user.user_metadata?.invite_code);
  if (linkError) return { error: linkError };
  redirect("/dashboard");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message };

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/recovery`,
  });
  // Rate limiting is the only error worth showing; anything else would reveal
  // whether an account exists for this email.
  if (error?.status === 429) return { error: "Too many reset emails. Wait a few minutes and try again." };
  if (error) console.error("password reset failed", error);
  return {
    message: "If there's an account for that email, a reset link is on its way. Open it on this device.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) return { error: "Your reset link expired. Request a new one." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "The passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard");
}
