import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DemoButton } from "@/components/demo-actions";
import { Card, Input, Label, PageTitle, SectionTitle } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Demo · Groups" };

export default function DemoGroupsPage() {
  const demo = getDemoData();
  return (
    <div className="space-y-8">
      <PageTitle sub="Make a crew for your squad, school or Discord and battle it out on your own leaderboard.">Groups</PageTitle>

      <section>
        <SectionTitle>My groups</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {demo.groups.map((g) => (
            <Link
              key={g.id}
              href={`/demo/groups/${g.id}`}
              className="flex items-center gap-4 rounded-2xl border border-line bg-panel/80 p-4 transition hover:border-violet-400/60"
            >
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-sky-500/30 text-3xl">
                {g.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-xl text-white">{g.name}</span>
                <span className="text-xs text-muted">{g.members.length} members · Owner</span>
              </span>
              <ChevronRight className="size-5 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-4 p-5">
          <SectionTitle>Create a group</SectionTitle>
          <div>
            <Label>Group name</Label>
            <Input placeholder="e.g. Tilted Towers Crew" />
          </div>
          <DemoButton className="w-full">Create group</DemoButton>
        </Card>
        <Card className="space-y-4 p-5">
          <SectionTitle>Join a group</SectionTitle>
          <div>
            <Label>Invite code</Label>
            <Input placeholder="ABCD1234" className="font-mono uppercase tracking-[0.3em]" />
          </div>
          <DemoButton variant="secondary" className="w-full">
            Join group
          </DemoButton>
        </Card>
      </div>
    </div>
  );
}
