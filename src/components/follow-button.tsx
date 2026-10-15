"use client";

import { Star } from "lucide-react";
import { useTransition } from "react";
import { followPlayer, unfollowPlayer } from "@/app/actions/stats";
import { Button } from "./ui";

export function FollowButton({ epicId, following, compact }: { epicId: string; following: boolean; compact?: boolean }) {
  const [pending, start] = useTransition();
  const size = compact ? "px-3 py-2 text-xs" : "";
  return following ? (
    <Button
      variant="secondary"
      className={size}
      disabled={pending}
      onClick={() => start(() => unfollowPlayer(epicId))}
      aria-label="Unfollow"
      title="Following. Tap to unfollow"
    >
      <Star className="size-4 fill-yellow-300 text-yellow-300" />
      <span className={compact ? "hidden sm:inline" : undefined}>Following</span>
    </Button>
  ) : (
    <Button className={size} disabled={pending} onClick={() => start(() => followPlayer(epicId))} aria-label="Follow">
      <Star className="size-4" />
      <span className={compact ? "hidden sm:inline" : undefined}>Follow</span>
    </Button>
  );
}
