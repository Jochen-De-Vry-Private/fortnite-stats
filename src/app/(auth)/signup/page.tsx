import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <AuthShell title="Join the squad" sub="Link your Fortnite name and we'll start tracking your stats every day.">
      <SignUpForm />
    </AuthShell>
  );
}
