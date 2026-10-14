import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FriendButton } from "@/components/friend-button";
import { StatsView } from "@/components/stats-view";
import { getFriendStatus, getMyProfile, getProfile } from "@/lib/data";
import { loadPlayerView } from "@/lib/player-view";
import { isUuid } from "@/lib/stats";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = isUuid(id) ? await getProfile(id) : null;
  return { title: profile?.epic_name ?? "Player" };
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const me = await getMyProfile();
  if (me?.id === id) redirect("/dashboard");

  const profile = await getProfile(id);
  if (!profile) notFound();
  const [view, status] = await Promise.all([loadPlayerView(profile), getFriendStatus(me!.id, id)]);

  return <StatsView {...view} actions={<FriendButton profileId={id} status={status} />} />;
}
