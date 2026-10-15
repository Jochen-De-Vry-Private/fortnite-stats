import { Swords } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { FriendButton } from "@/components/friend-button";
import { StatsView } from "@/components/stats-view";
import { ButtonLink } from "@/components/ui";
import { getFriendStatus, getMyProfile, getPlayer, getProfileByEpicId, isFollowing } from "@/lib/data";
import { loadPlayerView } from "@/lib/player-view";
import { isEpicId } from "@/lib/stats";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureFresh } from "@/lib/sync";

type Props = { params: Promise<{ epicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { epicId } = await params;
  const player = isEpicId(epicId) ? await getPlayer(epicId) : null;
  return { title: player?.epic_name ?? "Player" };
}

export default async function PlayerPage({ params }: Props) {
  const { epicId } = await params;
  if (!isEpicId(epicId)) notFound();
  const me = (await getMyProfile())!;
  if (me.epic_id === epicId) redirect("/dashboard");

  let player = await getPlayer(epicId);
  if (!player) notFound();
  if (await ensureFresh(createAdminClient(), player, 6)) player = (await getPlayer(epicId))!;

  const [view, account, following] = await Promise.all([
    loadPlayerView(player),
    getProfileByEpicId(epicId),
    isFollowing(epicId),
  ]);
  const friendStatus = account ? await getFriendStatus(me.id, account.id) : null;

  return (
    <StatsView
      {...view}
      actions={
        <div className="flex flex-wrap gap-2">
          {account && friendStatus && <FriendButton profileId={account.id} status={friendStatus} compact />}
          <FollowButton epicId={epicId} following={following} compact />
          <ButtonLink href={`/compare/${epicId}`} variant="secondary" className="px-3 py-2 text-xs" aria-label="Compare with me">
            <Swords className="size-4" />
            <span className="hidden sm:inline">Compare</span>
          </ButtonLink>
        </div>
      }
    />
  );
}
