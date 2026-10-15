import type { Metadata } from "next";
import { Leaderboard } from "@/components/leaderboard";
import { LeaderboardFilters } from "@/components/leaderboard-filters";
import { PageTitle } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";
import { demoLeaderboard } from "@/lib/demo/leaderboard";
import { parseLeaderboardParams, type LeaderboardSearchParams } from "@/lib/leaderboard-params";

export const metadata: Metadata = { title: "Demo · Leaderboards" };

export default async function DemoLeaderboardsPage({ searchParams }: { searchParams: Promise<LeaderboardSearchParams> }) {
  const sp = await searchParams;
  const { showPros, ...opts } = parseLeaderboardParams(sp);
  const demo = getDemoData();

  const scopes = [
    { value: "friends", label: "👥 Friends" },
    ...demo.groups.map((g) => ({ value: g.id, label: `${g.emoji} ${g.name}` })),
  ];
  const group = demo.groups.find((g) => g.id === sp.scope);
  const scope = group?.id ?? "friends";
  const memberIds = group ? group.members : [demo.me.epic_id, ...demo.friends.map((f) => f.epic_id)];

  return (
    <div className="space-y-6">
      <PageTitle sub="Who's carrying the squad? Compare lifetime stats or this week's grind. Try the filters!">
        Leaderboards
      </PageTitle>
      <LeaderboardFilters scopes={scopes} scope={scope} {...opts} showPros={showPros} hasPros />
      <Leaderboard entries={demoLeaderboard(demo, memberIds, { ...opts, showPros })} metric={opts.metric} demo />
    </div>
  );
}
