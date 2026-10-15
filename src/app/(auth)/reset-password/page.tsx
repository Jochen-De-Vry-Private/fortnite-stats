import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "New password" };

// Reached from the reset email (via /auth/recovery, which signs the user in),
// or by a signed-in user who wants to change their password.
export default function ResetPasswordPage() {
  return (
    <AuthShell title="New password" sub="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
