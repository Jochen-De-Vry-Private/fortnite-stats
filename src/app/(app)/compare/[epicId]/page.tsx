import { ArrowLeft, BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { HeadToHead } from "@/components/head-to-head";
import { ButtonLink } from "@/components/ui";
import { getMyProfile, getPlayer, getRecentGains, isFollowing } from "@/lib/data";
import { isEpicId } from "@/lib/stats";
import { createAdminClient } from "@/lib/supabase/server";
import { ensureFresh } from "@/lib/sync";

type Props = { params: Promise<{ epicId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { epicId } = await params;
  const player = isEpicId(epicId) ? await getPlayer(epicId) : null;
  return { title: player ? `You vs ${player.epic_name}` : "Compare" };
}

export default async function CompareWithPage({ params }: Props) {
  const { epicId } = await params;
  if (!isEpicId(epicId)) notFound();
  const me = (await getMyProfile())!;
  if (me.epic_id === epicId) redirect("/dashboard");

  let them = await getPlayer(epicId);
  if (!them) notFound();
  // Players nobody follows aren't in the daily sync, so refresh stale ones on view.
  if (await ensureFresh(createAdminClient(), them, 6)) them = (await getPlayer(epicId))!;

  const [following, myWeekly, theirWeekly] = await Promise.all([
    isFollowing(epicId),
    getRecentGains(me.player, 7),
    getRecentGains(them, 7),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/compare" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeft className="size-4" /> Compare
        </Link>
        <div className="flex gap-2">
          <ButtonLink href={`/player/${epicId}`} variant="secondary" className="px-3 py-2 text-xs">
            <BarChart3 className="size-4" /> Full stats
          </ButtonLink>
          <FollowButton epicId={epicId} following={following} compact />
        </div>
      </div>

      {them.sync_error === "private" && !them.latest_stats ? (
        <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          {them.epic_name}&apos;s stats are private, so there&apos;s nothing to compare.
        </p>
      ) : (
        <HeadToHead
          me={{ name: me.player.epic_name, hue: me.player.avatar_hue, stats: me.player.latest_stats, weekly: myWeekly }}
          // Only followed players have daily history, so weekly gains for others would be misleading.
          them={{ name: them.epic_name, hue: them.avatar_hue, stats: them.latest_stats, weekly: following ? theirWeekly : null }}
        />
      )}
    </div>
  );
}
