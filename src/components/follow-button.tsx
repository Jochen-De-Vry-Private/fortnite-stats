"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { useTransition } from "react";
import { followPlayer, unfollowPlayer } from "@/app/actions/stats";

/**
 * Not following: dark outlined button with an empty star.
 * Following: gold-tinted button with a filled, glowing star.
 */
export function FollowButton({ epicId, following, compact }: { epicId: string; following: boolean; compact?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <FollowToggle
      following={following}
      compact={compact}
      disabled={pending}
      onClick={() => start(() => (following ? unfollowPlayer(epicId) : followPlayer(epicId)))}
    />
  );
}

export function FollowToggle({
  following,
  compact,
  disabled,
  onClick,
}: {
  following: boolean;
  compact?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={following}
      title={following ? "You follow this player. Tap to unfollow" : "Follow to track their progress"}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-bold uppercase tracking-wide transition active:translate-y-[1px] disabled:opacity-50",
        compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
        following
          ? "border-yellow-300 bg-yellow-300/20 text-yellow-200 shadow-[0_0_16px_-4px_rgb(253_224_71/0.6)] hover:bg-yellow-300/30"
          : "border-white/25 bg-black/30 text-white hover:border-yellow-300/70 hover:text-yellow-200",
      )}
    >
      <Star
        className={clsx(
          "size-4 transition",
          following ? "fill-yellow-300 text-yellow-300 drop-shadow-[0_0_6px_rgb(253_224_71/0.8)]" : "fill-transparent",
        )}
        strokeWidth={following ? 2 : 2.5}
      />
      {following ? "Following" : "Follow"}
    </button>
  );
}
