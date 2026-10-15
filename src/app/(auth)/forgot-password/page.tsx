import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Forgot password?" sub="Enter your email and we'll send you a link to choose a new one.">
      <ForgotPasswordForm
        error={error === "expired" ? "That reset link is invalid or expired. Request a new one below." : undefined}
      />
    </AuthShell>
  );
}
