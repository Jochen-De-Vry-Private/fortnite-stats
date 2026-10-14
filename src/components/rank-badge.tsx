import clsx from "clsx";
import { Shield } from "lucide-react";
import { rankForKd } from "@/lib/stats";

export function RankBadge({ kd, size = "md" }: { kd: number; size?: "sm" | "md" }) {
  const rank = rankForKd(kd);
  return (
    <span
      title={`K/D-based rank: ${rank.name}`}
      className={clsx(
        "relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r font-bold uppercase tracking-wider text-zinc-950 shadow-lg",
        rank.gradient,
        rank.glow,
        size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]",
        "shine",
      )}
    >
      <Shield className={size === "md" ? "size-3.5" : "size-3"} strokeWidth={3} />
      {rank.name}
    </span>
  );
}
