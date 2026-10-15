import { Check, Search, Share2, X } from "lucide-react";
import type { Metadata } from "next";
import { DemoButton } from "@/components/demo-actions";
import { PlayerRow } from "@/components/player-row";
import { Input, PageTitle, SectionTitle } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Demo · Friends" };

export default function DemoFriendsPage() {
  const demo = getDemoData();
  return (
    <div className="space-y-8">
      <PageTitle sub="Your squad on DropStats. Friends can see each other's stats, join groups together and battle on the leaderboards.">
        Friends
      </PageTitle>

      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <Input placeholder="Find friends on DropStats" className="pl-11" aria-label="Search DropStats users" />
          </div>
          <DemoButton>Search</DemoButton>
        </div>
        <p className="text-xs text-muted">
          Only players with a DropStats account show up here. Looking for a pro? Use the <b>Compare</b> tab.
        </p>
      </div>

      <section>
        <SectionTitle>Friend requests</SectionTitle>
        <PlayerRow
          player={demo.incoming}
          href={`/demo/player/${demo.incoming.epic_id}`}
          action={
            <div className="flex gap-2">
              <DemoButton className="px-3 py-2 text-xs" label="Accept">
                <Check className="size-4" />
                <span className="hidden sm:inline">Accept</span>
              </DemoButton>
              <DemoButton variant="secondary" className="px-3 py-2 text-xs" label="Decline">
                <X className="size-4" />
              </DemoButton>
            </div>
          }
        />
      </section>

      <section>
        <SectionTitle>My friends ({demo.friends.length})</SectionTitle>
        <div className="space-y-2">
          {[...demo.friends]
            .sort((a, b) => a.epic_name.localeCompare(b.epic_name))
            .map((p) => (
              <PlayerRow key={p.epic_id} player={p} href={`/demo/player/${p.epic_id}`} />
            ))}
        </div>
      </section>

      <div className="rounded-2xl border border-dashed border-yellow-300/50 bg-yellow-300/5 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white">Friend not on DropStats yet?</p>
            <p className="mt-0.5 text-sm text-muted">
              Send them your invite link. When they sign up with it, you&apos;re friends automatically.
            </p>
          </div>
          <DemoButton className="size-11 p-0" label="Share invite link">
            <Share2 className="size-5" />
          </DemoButton>
        </div>
      </div>
    </div>
  );
}
