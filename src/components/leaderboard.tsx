import clsx from "clsx";
import { Crown, Star } from "lucide-react";
import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/data";
import { METRICS, type MetricKey } from "@/lib/stats";
import { Avatar } from "./avatar";

const PODIUM = [
  { place: 2, ring: "ring-slate-300", bar: "from-slate-300/80 to-slate-500/40 h-20", label: "text-slate-200" },
  { place: 1, ring: "ring-yellow-300", bar: "from-yellow-300/90 to-amber-600/40 h-28", label: "text-yellow-300" },
  { place: 3, ring: "ring-amber-600", bar: "from-amber-600/80 to-amber-900/40 h-14", label: "text-amber-500" },
];

export function Leaderboard({ entries, metric, demo }: { entries: LeaderboardEntry[]; metric: MetricKey; demo?: boolean }) {
  const m = METRICS[metric];
  const hrefFor = (e: LeaderboardEntry) =>
    demo
      ? e.kind === "me" ? "/demo" : `/demo/player/${e.player.epic_id}`
      : e.kind === "me" ? "/dashboard" : `/player/${e.player.epic_id}`;
  const top = entries.slice(0, 3);

  return (
    <div className="space-y-4">
      {top.length >= 2 && (
        <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
          {PODIUM.map(({ place, ring, bar, label }) => {
            const e = top[place - 1];
            if (!e) return <div key={place} />;
            return (
              <Link key={place} href={hrefFor(e)} className="group flex flex-col items-center text-center">
                {place === 1 && <Crown className="mb-1 size-7 fill-yellow-300 text-yellow-300 drop-shadow-[0_0_10px_rgb(253_224_71/0.7)]" />}
                <Avatar
                  name={e.player.epic_name}
                  hue={e.player.avatar_hue}
                  size={place === 1 ? "lg" : "md"}
                  className={clsx("ring-4 transition group-hover:scale-105", ring)}
                />
                <div className="mt-2 w-full truncate text-sm font-bold text-white">{e.player.epic_name}</div>
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
          <li key={e.player.epic_id}>
            <Link
              href={hrefFor(e)}
              className={clsx(
                "flex items-center gap-3 rounded-2xl border p-3 transition hover:border-violet-400/60",
                e.kind === "me"
                  ? "border-yellow-300/60 bg-yellow-300/10"
                  : e.kind === "pro"
                    ? "border-dashed border-sky-400/40 bg-sky-400/5"
                    : "border-line bg-panel/80",
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
              <Avatar name={e.player.epic_name} hue={e.player.avatar_hue} size="sm" />
              <span className="min-w-0 flex-1 truncate font-bold text-white">
                {e.player.epic_name}
                {e.kind === "me" && <span className="ml-2 text-xs font-bold uppercase text-yellow-300">You</span>}
                {e.kind === "pro" && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-xs font-bold uppercase text-sky-300">
                    <Star className="size-3 fill-sky-300" /> Followed
                  </span>
                )}
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
