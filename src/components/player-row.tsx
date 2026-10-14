import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Profile } from "@/lib/data";
import { fmtInt } from "@/lib/stats";
import { Avatar } from "./avatar";
import { RankBadge } from "./rank-badge";

export function PlayerRow({ profile, action }: { profile: Profile; action?: ReactNode }) {
  const s = profile.latest_stats?.all?.overall;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel/80 p-3 transition hover:border-violet-400/50">
      <Link href={`/player/${profile.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={profile.epic_name} hue={profile.avatar_hue} />
        <div className="min-w-0">
          <div className="truncate font-bold text-white">{profile.epic_name}</div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-muted">
            {s ? (
              <>
                <span className="shrink-0">
                  <RankBadge kd={s.kd} size="sm" />
                </span>
                <span className="truncate tabular-nums">
                  {fmtInt(s.wins)} wins · {s.kd.toFixed(2)} K/D
                </span>
              </>
            ) : (
              <span>No stats yet</span>
            )}
          </div>
        </div>
        {!action && <ChevronRight className="ml-auto size-5 shrink-0 text-muted" />}
      </Link>
      {action}
    </div>
  );
}
