import { Search, Swords } from "lucide-react";
import type { Metadata } from "next";
import { DemoButton } from "@/components/demo-actions";
import { PlayerRow } from "@/components/player-row";
import { Card, Input, PageTitle, SectionTitle } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Demo · Compare" };

export default function DemoComparePage() {
  const demo = getDemoData();
  return (
    <div className="space-y-8">
      <PageTitle sub="Look up any player, pros included, and see how you stack up. Follow them to track their progress and race them on your leaderboards.">
        Compare
      </PageTitle>

      <Card className="p-4 sm:p-5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <Input placeholder="Any Fortnite username, e.g. a pro" className="pl-11" aria-label="Fortnite username" />
          </div>
          <DemoButton>Compare</DemoButton>
        </div>
      </Card>

      <section>
        <SectionTitle>Following ({demo.pros.length})</SectionTitle>
        <p className="mb-3 text-sm text-muted">Tap a player to see the head-to-head.</p>
        <div className="space-y-2">
          {demo.pros.map((p) => (
            <PlayerRow
              key={p.epic_id}
              player={p}
              href={`/demo/compare/${p.epic_id}`}
              action={<Swords className="size-5 shrink-0 text-muted" aria-hidden />}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Or compare with a friend</SectionTitle>
        <div className="space-y-2">
          {demo.friends.slice(0, 2).map((p) => (
            <PlayerRow
              key={p.epic_id}
              player={p}
              href={`/demo/compare/${p.epic_id}`}
              action={<Swords className="size-5 shrink-0 text-muted" aria-hidden />}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
