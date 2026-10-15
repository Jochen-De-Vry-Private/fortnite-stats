import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { Leaderboard } from "@/components/leaderboard";
import { LeaderboardFilters } from "@/components/leaderboard-filters";
import { ButtonLink, EmptyState, PageTitle } from "@/components/ui";
import { buildLeaderboard, getFollowedPlayers, getFriendships, getGroup, getMyGroups, getMyProfile } from "@/lib/data";
import { parseLeaderboardParams, type LeaderboardSearchParams } from "@/lib/leaderboard-params";

export const metadata: Metadata = { title: "Leaderboards" };

export default async function LeaderboardsPage({ searchParams }: { searchParams: Promise<LeaderboardSearchParams> }) {
  const me = (await getMyProfile())!;
  const sp = await searchParams;
  const { showPros, ...opts } = parseLeaderboardParams(sp);

  const [groups, { friends }, followed] = await Promise.all([getMyGroups(), getFriendships(me.id), getFollowedPlayers()]);
  const scopes = [
    { value: "friends", label: "👥 Friends" },
    ...groups.map((g) => ({ value: g.id, label: `${g.emoji} ${g.name}` })),
  ];
  const scope = scopes.some((s) => s.value === sp.scope) ? sp.scope! : "friends";

  let memberIds: string[];
  if (scope === "friends") memberIds = [me.id, ...friends];
  else memberIds = (await getGroup(scope))?.memberIds ?? [me.id];

  const entries = await buildLeaderboard(memberIds, { ...opts, meId: me.id, pros: showPros ? followed : [] });

  return (
    <div className="space-y-6">
      <PageTitle sub="Who's carrying the squad? Compare lifetime stats or this week's grind.">Leaderboards</PageTitle>
      <LeaderboardFilters scopes={scopes} scope={scope} {...opts} showPros={showPros} hasPros={followed.length > 0} />
      {entries.length < 2 ? (
        <EmptyState icon={<Trophy className="size-10" />} title="It's lonely at the top">
          <p className="mb-4">Add friends, create a group or follow a pro to start competing.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <ButtonLink href="/friends">Find friends</ButtonLink>
            <ButtonLink href="/compare" variant="secondary">
              Follow a pro
            </ButtonLink>
          </div>
        </EmptyState>
      ) : (
        <Leaderboard entries={entries} metric={opts.metric} />
      )}
    </div>
  );
}
