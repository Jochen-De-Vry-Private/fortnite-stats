import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getFriendships, getMyProfile } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getMyProfile();
  if (!profile) redirect("/onboarding");
  const { incoming } = await getFriendships(profile.id);

  return (
    <>
      <AppNav name={profile.player.epic_name} hue={profile.player.avatar_hue} pendingRequests={incoming.length} />
      <main className="mx-auto max-w-5xl px-4 pt-5 pb-28 md:pb-12">{children}</main>
    </>
  );
}
