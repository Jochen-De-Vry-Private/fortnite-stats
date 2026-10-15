import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RefreshButton } from "@/components/refresh-button";
import { StatsView } from "@/components/stats-view";
import { getMyProfile } from "@/lib/data";
import { loadPlayerView } from "@/lib/player-view";

export const metadata: Metadata = { title: "My stats" };

export default async function DashboardPage() {
  const profile = await getMyProfile();
  if (!profile) redirect("/onboarding");
  const view = await loadPlayerView(profile.player);

  return <StatsView {...view} actions={<RefreshButton />} />;
}
