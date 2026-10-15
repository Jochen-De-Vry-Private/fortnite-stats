import { UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { acceptInvite } from "@/app/actions/social";
import { AuthShell } from "@/components/auth-shell";
import { Avatar } from "@/components/avatar";
import { SubmitButton } from "@/components/submit-button";
import { ButtonLink } from "@/components/ui";
import { getMyProfile } from "@/lib/data";
import { getInviter } from "@/lib/invites";
import { createAdminClient, getUser } from "@/lib/supabase/server";

type Props = { params: Promise<{ code: string }> };

export const metadata: Metadata = { title: "You're invited" };

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const inviter = await getInviter(createAdminClient(), code);
  if (!inviter) notFound();

  const user = await getUser();
  const me = user ? await getMyProfile() : null;
  if (user && !me) redirect("/onboarding");
  if (me?.id === inviter.id) redirect("/friends");

  const name = inviter.player.epic_name;
  return (
    <AuthShell title="You're invited!" sub={`${name} wants to compare Fortnite stats with you on DropStats.`}>
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-[#0f0b1e] p-4">
        <Avatar name={name} hue={inviter.player.avatar_hue} size="lg" />
        <div className="min-w-0">
          <div className="font-display truncate text-2xl text-white">{name}</div>
          <div className="text-sm text-muted">Join and you&apos;re friends right away.</div>
        </div>
      </div>

      {me ? (
        <form action={acceptInvite.bind(null, code)}>
          <SubmitButton className="w-full py-3.5 text-base" pendingText="Adding…">
            <UserPlus className="size-5" /> Add {name} as friend
          </SubmitButton>
        </form>
      ) : (
        <div className="space-y-3">
          <ButtonLink href={`/signup?invite=${code}`} className="w-full py-3.5 text-base">
            Create account
          </ButtonLink>
          <ButtonLink href={`/login?next=/invite/${code}`} variant="secondary" className="w-full py-3.5 text-base">
            I already have an account
          </ButtonLink>
        </div>
      )}
    </AuthShell>
  );
}
