import clsx from "clsx";
import { Crown } from "lucide-react";
import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/data";
import { METRICS, type MetricKey } from "@/lib/stats";
import { Avatar } from "./avatar";

const PODIUM = [
  { place: 2, ring: "ring-slate-300", bar: "from-slate-300/80 to-slate-500/40 h-20", label: "text-slate-200" },
  { place: 1, ring: "ring-yellow-300", bar: "from-yellow-300/90 to-amber-600/40 h-28", label: "text-yellow-300" },
  { place: 3, ring: "ring-amber-600", bar: "from-amber-600/80 to-amber-900/40 h-14", label: "text-amber-500" },
];

export function Leaderboard({ entries, metric, meId }: { entries: LeaderboardEntry[]; metric: MetricKey; meId: string }) {
  const m = METRICS[metric];
  const top = entries.slice(0, 3);

  return (
    <div className="space-y-4">
      {top.length >= 2 && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {PODIUM.map(({ place, ring, bar, label }) => {
            const e = top[place - 1];
            if (!e) return <div key={place} />;
            return (
              <Link key={place} href={`/player/${e.profile.id}`} className="group flex flex-col items-center text-center">
                {place === 1 && <Crown className="mb-1 size-7 fill-yellow-300 text-yellow-300 drop-shadow-[0_0_10px_rgb(253_224_71/0.7)]" />}
                <Avatar
                  name={e.profile.epic_name}
                  hue={e.profile.avatar_hue}
                  size={place === 1 ? "lg" : "md"}
                  className={clsx("ring-4 transition group-hover:scale-105", ring)}
                />
                <div className="mt-2 w-full truncate text-sm font-bold text-white">{e.profile.epic_name}</div>
                <div className={clsx("font-display text-2xl sm:text-3xl", label)}>{e.hasData ? m.format(e.value) : "–"}</div>
                <div className={clsx("mt-2 grid w-full place-items-center rounded-t-xl bg-gradient-to-b", bar)}>
                  <span className="font-display text-3xl text-white/90 text-stroke">{place}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ol className="space-y-2">
        {entries.map((e, i) => (
          <li key={e.profile.id}>
            <Link
              href={`/player/${e.profile.id}`}
              className={clsx(
                "flex items-center gap-3 rounded-2xl border p-3 transition hover:border-violet-400/60",
                e.profile.id === meId ? "border-yellow-300/60 bg-yellow-300/10" : "border-line bg-panel/80",
              )}
            >
              <span
                className={clsx(
                  "font-display w-8 text-center text-2xl",
                  i === 0 ? "text-yellow-300" : i === 1 ? "text-slate-200" : i === 2 ? "text-amber-500" : "text-muted",
                )}
              >
                {i + 1}
              </span>
              <Avatar name={e.profile.epic_name} hue={e.profile.avatar_hue} size="sm" />
              <span className="min-w-0 flex-1 truncate font-bold text-white">
                {e.profile.epic_name}
                {e.profile.id === meId && <span className="ml-2 text-xs font-bold uppercase text-yellow-300">You</span>}
              </span>
              <span className="text-right">
                <span className="block text-lg font-extrabold tabular-nums text-white">{e.hasData ? m.format(e.value) : "–"}</span>
                <span className="block text-[11px] tabular-nums text-muted">{e.totals.matches.toLocaleString("en-US")} matches</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
