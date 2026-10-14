import { Search, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { FriendButton } from "@/components/friend-button";
import { PlayerRow } from "@/components/player-row";
import { Button, EmptyState, Input, PageTitle, SectionTitle } from "@/components/ui";
import { getFriendships, getMyProfile, getProfiles, type FriendStatus, type Profile } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Friends" };

async function searchPlayers(q: string, excludeId: string) {
  const supabase = await createClient();
  const pattern = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const { data } = await supabase
    .from("profiles")
    .select("id, epic_id, epic_name, avatar_hue, battle_pass_level, battle_pass_progress, latest_stats, last_synced_at, sync_error, created_at")
    .ilike("epic_name", pattern)
    .neq("id", excludeId)
    .order("epic_name")
    .limit(20);
  return (data ?? []) as Profile[];
}

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = (await getMyProfile())!;
  const q = ((await searchParams).q ?? "").trim().slice(0, 40);
  const { friends, incoming, outgoing } = await getFriendships(me.id);
  const [friendProfiles, incomingProfiles, outgoingProfiles, results] = await Promise.all([
    getProfiles(friends),
    getProfiles(incoming),
    getProfiles(outgoing),
    q.length >= 2 ? searchPlayers(q, me.id) : Promise.resolve(null),
  ]);

  const statusOf = (id: string): FriendStatus =>
    friends.includes(id) ? "friends" : incoming.includes(id) ? "incoming" : outgoing.includes(id) ? "outgoing" : "none";
  const byName = (a: Profile, b: Profile) => a.epic_name.localeCompare(b.epic_name);

  return (
    <div className="space-y-8">
      <PageTitle sub="Find your squad. Add friends to compare stats and battle on the leaderboards.">Friends</PageTitle>

      <form className="flex gap-2" role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <Input name="q" defaultValue={q} placeholder="Search players by Fortnite name" className="pl-11" aria-label="Search players" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {results && (
        <section>
          <SectionTitle>Results</SectionTitle>
          {results.length === 0 ? (
            <p className="text-sm text-muted">
              No players named &ldquo;{q}&rdquo; on DropStats yet. Invite them to sign up!
            </p>
          ) : (
            <div className="space-y-2">
              {results.map((p) => (
                <PlayerRow key={p.id} profile={p} action={<FriendButton profileId={p.id} status={statusOf(p.id)} compact />} />
              ))}
            </div>
          )}
        </section>
      )}

      {incomingProfiles.length > 0 && (
        <section>
          <SectionTitle>Friend requests</SectionTitle>
          <div className="space-y-2">
            {incomingProfiles.map((p) => (
              <PlayerRow key={p.id} profile={p} action={<FriendButton profileId={p.id} status="incoming" compact />} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>My friends ({friendProfiles.length})</SectionTitle>
        {friendProfiles.length === 0 ? (
          <EmptyState icon={<UserPlus className="size-10" />} title="No friends yet">
            Search for your squad above and send them a request.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {friendProfiles.sort(byName).map((p) => (
              <PlayerRow key={p.id} profile={p} />
            ))}
          </div>
        )}
      </section>

      {outgoingProfiles.length > 0 && (
        <section>
          <SectionTitle>Sent requests</SectionTitle>
          <div className="space-y-2">
            {outgoingProfiles.map((p) => (
              <PlayerRow key={p.id} profile={p} action={<FriendButton profileId={p.id} status="outgoing" compact />} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
