import { ChevronRight, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateGroupForm, JoinGroupForm } from "@/components/group-forms";
import { Card, EmptyState, PageTitle, SectionTitle } from "@/components/ui";
import { getMyGroups, getMyProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  const me = (await getMyProfile())!;
  const groups = await getMyGroups();

  return (
    <div className="space-y-8">
      <PageTitle sub="Make a crew for your squad, school or Discord and battle it out on your own leaderboard.">
        Groups
      </PageTitle>

      <section>
        <SectionTitle>My groups</SectionTitle>
        {groups.length === 0 ? (
          <EmptyState icon={<UsersRound className="size-10" />} title="No groups yet">
            Create one below or join with an invite code from a friend.
          </EmptyState>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-panel/80 p-4 transition hover:border-violet-400/60"
              >
                <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/40 to-sky-500/30 text-3xl">
                  {g.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-xl text-white">{g.name}</span>
                  <span className="text-xs text-muted">
                    {g.memberCount} {g.memberCount === 1 ? "member" : "members"}
                    {g.owner_id === me.id && " · Owner"}
                  </span>
                </span>
                <ChevronRight className="size-5 text-muted" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>Create a group</SectionTitle>
          <CreateGroupForm />
        </Card>
        <Card className="p-5">
          <SectionTitle>Join a group</SectionTitle>
          <JoinGroupForm />
        </Card>
      </div>
    </div>
  );
}
