import { Search, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import { FriendButton } from "@/components/friend-button";
import { InviteCard } from "@/components/invite-card";
import { PlayerRow } from "@/components/player-row";
import { Alert, Button, EmptyState, Input, PageTitle, SectionTitle } from "@/components/ui";
import { getFriendships, getMyProfile, getProfiles, searchAppUsers, type FriendStatus, type Profile } from "@/lib/data";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage({ searchParams }: { searchParams: Promise<{ q?: string; invited?: string }> }) {
  const me = (await getMyProfile())!;
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 40);
  const { friends, incoming, outgoing } = await getFriendships(me.id);
  const [friendProfiles, incomingProfiles, outgoingProfiles, results] = await Promise.all([
    getProfiles(friends),
    getProfiles(incoming),
    getProfiles(outgoing),
    q.length >= 2 ? searchAppUsers(q, me.id) : Promise.resolve(null),
  ]);

  const statusOf = (id: string): FriendStatus =>
    friends.includes(id) ? "friends" : incoming.includes(id) ? "incoming" : outgoing.includes(id) ? "outgoing" : "none";
  const byName = (a: Profile, b: Profile) => a.player.epic_name.localeCompare(b.player.epic_name);

  return (
    <div className="space-y-8">
      <PageTitle sub="Your squad on DropStats. Friends can see each other's stats, join groups together and battle on the leaderboards.">
        Friends
      </PageTitle>

      {sp.invited && <Alert kind="success">You&apos;re now friends! 🎉</Alert>}

      <div className="space-y-3">
        <form className="flex gap-2" role="search">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <Input name="q" defaultValue={q} placeholder="Find friends on DropStats" className="pl-11" aria-label="Search DropStats users" />
          </div>
          <Button type="submit">Search</Button>
        </form>
        <p className="text-xs text-muted">
          Only players with a DropStats account show up here. Looking for a pro? Use the <b>Compare</b> tab.
        </p>
      </div>

      {results && (
        <section>
          <SectionTitle>Results</SectionTitle>
          {results.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">Nobody called &ldquo;{q}&rdquo; on DropStats yet. Invite them!</p>
              <InviteCard code={me.invite_code} />
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((p) => (
                <PlayerRow
                  key={p.id}
                  player={p.player}
                  action={<FriendButton profileId={p.id} status={statusOf(p.id)} compact />}
                />
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
              <PlayerRow key={p.id} player={p.player} action={<FriendButton profileId={p.id} status="incoming" compact />} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>My friends ({friendProfiles.length})</SectionTitle>
        {friendProfiles.length === 0 ? (
          <EmptyState icon={<UserPlus className="size-10" />} title="No friends yet">
            Search for your squad above, or send them your invite link below.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {friendProfiles.sort(byName).map((p) => (
              <PlayerRow key={p.id} player={p.player} />
            ))}
          </div>
        )}
      </section>

      {outgoingProfiles.length > 0 && (
        <section>
          <SectionTitle>Sent requests</SectionTitle>
          <div className="space-y-2">
            {outgoingProfiles.map((p) => (
              <PlayerRow key={p.id} player={p.player} action={<FriendButton profileId={p.id} status="outgoing" compact />} />
            ))}
          </div>
        </section>
      )}

      {!results && <InviteCard code={me.invite_code} />}
    </div>
  );
}
