"use client";

import Link from "next/link";
import { useActionState } from "react";
import { linkEpicAccount, requestPasswordReset, signIn, signUp, updatePassword } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";
import { Alert, Input, Label } from "./ui";

function AccountTypeSelect() {
  return (
    <div>
      <Label htmlFor="accountType">Platform account</Label>
      <select
        id="accountType"
        name="accountType"
        defaultValue="epic"
        className="w-full rounded-xl border border-line bg-[#0f0b1e] px-4 py-3 text-base text-white outline-none focus:border-violet-400"
      >
        <option value="epic">Epic Games</option>
        <option value="psn">PlayStation</option>
        <option value="xbl">Xbox</option>
      </select>
    </div>
  );
}

function EpicNameField({ defaultValue }: { defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor="epicName">Fortnite username</Label>
      <Input
        id="epicName"
        name="epicName"
        required
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="e.g. Dr.Duder"
        defaultValue={defaultValue}
      />
      <p className="mt-1.5 text-xs text-muted">Your display name in Fortnite. We use it to pull your stats.</p>
    </div>
  );
}

export function SignUpForm({ invite }: { invite?: string }) {
  const [state, action] = useActionState(signUp, undefined);
  if (state?.message) return <Alert kind="success">{state.message}</Alert>;

  return (
    <form action={action} className="space-y-4">
      {invite && <input type="hidden" name="invite" value={invite} />}
      <EpicNameField />
      <AccountTypeSelect />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <SubmitButton className="w-full py-3.5 text-base" pendingText="Finding your stats…">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-yellow-300 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function SignInForm({ next, error }: { next?: string; error?: string }) {
  const [state, action] = useActionState(signIn, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs font-bold text-yellow-300 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      {(state?.error || error) && <Alert>{state?.error ?? error}</Alert>}
      <SubmitButton className="w-full py-3.5 text-base" pendingText="Logging in…">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-bold text-yellow-300 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function LinkAccountForm({ defaultName }: { defaultName?: string }) {
  const [state, action] = useActionState(linkEpicAccount, undefined);
  return (
    <form action={action} className="space-y-4">
      <EpicNameField defaultValue={defaultName} />
      <AccountTypeSelect />
      {state?.error && <Alert>{state.error}</Alert>}
      <SubmitButton className="w-full py-3.5 text-base" pendingText="Finding your stats…">
        Link account
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm({ error }: { error?: string }) {
  const [state, action] = useActionState(requestPasswordReset, undefined);
  if (state?.message) return <Alert kind="success">{state.message}</Alert>;

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      {(state?.error || error) && <Alert>{state?.error ?? error}</Alert>}
      <SubmitButton className="w-full py-3.5 text-base" pendingText="Sending…">
        Send reset link
      </SubmitButton>
      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-bold text-yellow-300 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      <div>
        <Label htmlFor="confirm">Repeat new password</Label>
        <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <SubmitButton className="w-full py-3.5 text-base" pendingText="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
