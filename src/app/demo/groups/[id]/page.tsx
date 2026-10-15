import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteCode } from "@/components/group-forms";
import { Leaderboard } from "@/components/leaderboard";
import { LeaderboardFilters } from "@/components/leaderboard-filters";
import { PlayerRow } from "@/components/player-row";
import { SectionTitle } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";
import { demoLeaderboard } from "@/lib/demo/leaderboard";
import { parseLeaderboardParams, type LeaderboardSearchParams } from "@/lib/leaderboard-params";

export const metadata: Metadata = { title: "Demo · Group" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<LeaderboardSearchParams> };

export default async function DemoGroupPage({ params, searchParams }: Props) {
  const { id } = await params;
  const demo = getDemoData();
  const group = demo.groups.find((g) => g.id === id);
  if (!group) notFound();
  const { showPros, ...opts } = parseLeaderboardParams(await searchParams);
  const members = group.members.map((m) => demo.players.get(m)!);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/demo/groups" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeft className="size-4" /> Groups
        </Link>
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/50 to-sky-500/40 text-4xl">
            {group.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-stroke truncate text-4xl text-white">{group.name}</h1>
            <p className="text-sm text-muted">{members.length} members</p>
          </div>
        </div>
      </div>

      <InviteCode code={group.inviteCode} groupName={group.name} />

      <section className="space-y-4">
        <SectionTitle>Leaderboard</SectionTitle>
        <LeaderboardFilters scopes={[]} scope={group.id} hideScope {...opts} showPros={showPros} hasPros />
        <Leaderboard entries={demoLeaderboard(demo, group.members, { ...opts, showPros })} metric={opts.metric} demo />
      </section>

      <section>
        <SectionTitle>Members</SectionTitle>
        <div className="space-y-2">
          {members.map((p) => (
            <PlayerRow
              key={p.epic_id}
              player={p}
              href={p.epic_id === demo.me.epic_id ? "/demo" : `/demo/player/${p.epic_id}`}
              action={
                p.epic_id === demo.me.epic_id ? (
                  <span className="rounded-full bg-yellow-300/15 px-2.5 py-1 text-[10px] font-bold uppercase text-yellow-300">
                    Owner
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
