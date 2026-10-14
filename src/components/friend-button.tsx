"use client";

import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import { useTransition } from "react";
import { acceptFriendRequest, removeFriend, sendFriendRequest } from "@/app/actions/social";
import type { FriendStatus } from "@/lib/data";
import { Button } from "./ui";

export function FriendButton({ profileId, status, compact }: { profileId: string; status: FriendStatus; compact?: boolean }) {
  const [pending, start] = useTransition();
  const run = (fn: (id: string) => Promise<void>) => () => start(() => fn(profileId));
  const size = compact ? "px-3 py-2 text-xs" : "";
  const label = (text: string) => <span className={compact ? "hidden sm:inline" : undefined}>{text}</span>;

  switch (status) {
    case "self":
      return null;
    case "friends":
      return (
        <Button
          variant="secondary"
          className={size}
          disabled={pending}
          onClick={() => {
            if (confirm("Remove this friend?")) run(removeFriend)();
          }}
        >
          <UserCheck className="size-4" /> {label("Friends")}
        </Button>
      );
    case "outgoing":
      return (
        <Button variant="secondary" className={size} disabled={pending} onClick={run(removeFriend)} title="Cancel request">
          <Clock className="size-4" /> {label("Requested")}
        </Button>
      );
    case "incoming":
      return (
        <div className="flex gap-2">
          <Button className={size} disabled={pending} onClick={run(acceptFriendRequest)} aria-label="Accept">
            <Check className="size-4" /> {label("Accept")}
          </Button>
          <Button variant="secondary" className={size} disabled={pending} onClick={run(removeFriend)} aria-label="Decline">
            <X className="size-4" />
          </Button>
        </div>
      );
    case "none":
      return (
        <Button className={size} disabled={pending} onClick={run(sendFriendRequest)} aria-label="Add friend">
          <UserPlus className="size-4" /> {label("Add friend")}
        </Button>
      );
  }
}
