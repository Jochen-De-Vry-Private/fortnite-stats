import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteCode } from "@/components/group-forms";
import { AddToGroupButton, LeaveGroupButton, RemoveMemberButton } from "@/components/group-member-actions";
import { Leaderboard } from "@/components/leaderboard";
import { LeaderboardFilters } from "@/components/leaderboard-filters";
import { PlayerRow } from "@/components/player-row";
import { Card, SectionTitle } from "@/components/ui";
import { buildLeaderboard, getFriendships, getGroup, getMyProfile, getProfiles } from "@/lib/data";
import { parseLeaderboardParams, type LeaderboardSearchParams } from "@/lib/leaderboard-params";
import { isUuid } from "@/lib/stats";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<LeaderboardSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = isUuid(id) ? await getGroup(id) : null;
  return { title: data?.group.name ?? "Group" };
}

export default async function GroupPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const me = (await getMyProfile())!;
  const data = await getGroup(id);
  if (!data) notFound();
  const { group, memberIds } = data;
  const isOwner = group.owner_id === me.id;
  const opts = parseLeaderboardParams(await searchParams);

  const [entries, members, { friends }] = await Promise.all([
    buildLeaderboard(memberIds, opts),
    getProfiles(memberIds),
    getFriendships(me.id),
  ]);
  const addable = await getProfiles(friends.filter((f) => !memberIds.includes(f)));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/groups" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeft className="size-4" /> Groups
        </Link>
        <div className="flex items-center gap-4">
          <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/50 to-sky-500/40 text-4xl">
            {group.emoji}
          </span>
          <div className="min-w-0">
            <h1 className="font-display text-stroke truncate text-4xl text-white">{group.name}</h1>
            <p className="text-sm text-muted">
              {memberIds.length} {memberIds.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
      </div>

      <InviteCode code={group.invite_code} groupName={group.name} />

      <section className="space-y-4">
        <SectionTitle>Leaderboard</SectionTitle>
        <LeaderboardFilters scopes={[]} scope={group.id} hideScope {...opts} />
        <Leaderboard entries={entries} metric={opts.metric} meId={me.id} />
      </section>

      <section>
        <SectionTitle>Members</SectionTitle>
        <div className="space-y-2">
          {members.map((p) => (
            <PlayerRow
              key={p.id}
              profile={p}
              action={
                p.id === group.owner_id ? (
                  <span className="rounded-full bg-yellow-300/15 px-2.5 py-1 text-[10px] font-bold uppercase text-yellow-300">
                    Owner
                  </span>
                ) : isOwner ? (
                  <RemoveMemberButton groupId={group.id} profileId={p.id} />
                ) : undefined
              }
            />
          ))}
        </div>
      </section>

      {addable.length > 0 && (
        <Card className="p-5">
          <SectionTitle>Add friends</SectionTitle>
          <div className="space-y-2">
            {addable.map((p) => (
              <PlayerRow key={p.id} profile={p} action={<AddToGroupButton groupId={group.id} profileId={p.id} />} />
            ))}
          </div>
        </Card>
      )}

      <div className="flex justify-end">
        <LeaveGroupButton groupId={group.id} meId={me.id} isOwner={isOwner} />
      </div>
    </div>
  );
}
