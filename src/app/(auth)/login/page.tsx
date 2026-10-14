import type { Metadata } from "next";
import { SignInForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" sub="Log in to check your stats and see who's on top.">
      <SignInForm
        next={next}
        error={error === "confirm" ? "That confirmation link is invalid or expired. Try logging in." : undefined}
      />
    </AuthShell>
  );
}
