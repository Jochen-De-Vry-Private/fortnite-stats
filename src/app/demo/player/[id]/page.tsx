import { Swords, UserCheck } from "lucide-react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DemoButton, DemoFollow } from "@/components/demo-actions";
import { StatsView } from "@/components/stats-view";
import { ButtonLink } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";
import { demoView } from "@/lib/demo/view";

export const metadata: Metadata = { title: "Demo · Player" };

export default async function DemoPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = getDemoData();
  if (id === demo.me.epic_id) redirect("/demo");
  const player = demo.players.get(id);
  if (!player) notFound();
  const isFriend = demo.friends.some((f) => f.epic_id === id);
  const isPro = demo.pros.some((p) => p.epic_id === id);

  return (
    <StatsView
      {...demoView(demo, player)}
      actions={
        <div className="flex flex-wrap gap-2">
          {isFriend && (
            <DemoButton variant="secondary" className="px-3 py-2 text-xs" label="Friends">
              <UserCheck className="size-4" /> <span className="hidden sm:inline">Friends</span>
            </DemoButton>
          )}
          <DemoFollow initial={isPro} compact />
          <ButtonLink href={`/demo/compare/${id}`} variant="secondary" className="px-3 py-2 text-xs" aria-label="Compare with me">
            <Swords className="size-4" />
            <span className="hidden sm:inline">Compare</span>
          </ButtonLink>
        </div>
      }
    />
  );
}
