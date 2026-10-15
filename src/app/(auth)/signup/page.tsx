import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const { invite } = await searchParams;
  return (
    <AuthShell title="Join the squad" sub="Link your Fortnite name and we'll start tracking your stats every day.">
      <SignUpForm invite={invite && /^[0-9a-f]{10}$/.test(invite) ? invite : undefined} />
    </AuthShell>
  );
}
