import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LinkAccountForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";
import { getMyProfile } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Link your account" };

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (await getMyProfile()) redirect("/dashboard");

  return (
    <AuthShell title="Link your account" sub="One last step: which Fortnite player are you?">
      <LinkAccountForm defaultName={user.user_metadata?.epic_name} />
    </AuthShell>
  );
}
