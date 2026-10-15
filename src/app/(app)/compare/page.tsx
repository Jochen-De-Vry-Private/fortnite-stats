import { Star, Swords } from "lucide-react";
import type { Metadata } from "next";
import { CompareSearch } from "@/components/compare-search";
import { PlayerRow } from "@/components/player-row";
import { Card, EmptyState, PageTitle, SectionTitle } from "@/components/ui";
import { getFollowedPlayers } from "@/lib/data";

export const metadata: Metadata = { title: "Compare" };

export default async function ComparePage() {
  const followed = await getFollowedPlayers();

  return (
    <div className="space-y-8">
      <PageTitle sub="Look up any player, pros included, and see how you stack up. Follow them to track their progress and race them on your leaderboards.">
        Compare
      </PageTitle>

      <Card className="p-4 sm:p-5">
        <CompareSearch />
      </Card>

      <section>
        <SectionTitle>Following ({followed.length})</SectionTitle>
        {followed.length === 0 ? (
          <EmptyState icon={<Star className="size-10" />} title="Not following anyone yet">
            Search a pro above, then tap <b>Follow</b> to keep their stats and daily history.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {followed.map((p) => (
              <PlayerRow
                key={p.epic_id}
                player={p}
                href={`/compare/${p.epic_id}`}
                action={<Swords className="size-5 shrink-0 text-muted" aria-hidden />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
