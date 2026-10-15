"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { useState } from "react";
import type { AllStats, Input, Mode, ModeStats } from "@/lib/fortnite/types";
import { INPUTS, INPUT_LABELS, MODES } from "@/lib/fortnite/types";
import { fmtInt, type Totals } from "@/lib/stats";
import { Avatar } from "./avatar";
import { ModeTabs } from "./stats-view";

type Side = { name: string; hue: number; stats: AllStats | null; weekly: Totals | null };

type Row = { label: string; get: (s: ModeStats) => number; format: (v: number) => string };

const ROWS: Row[] = [
  { label: "Wins", get: (s) => s.wins, format: fmtInt },
  { label: "K/D", get: (s) => s.kd, format: (v) => v.toFixed(2) },
  { label: "Win rate", get: (s) => s.winRate, format: (v) => `${v.toFixed(1)}%` },
  { label: "Elims", get: (s) => s.kills, format: fmtInt },
  { label: "Elims / match", get: (s) => s.killsPerMatch, format: (v) => v.toFixed(2) },
  { label: "Score / match", get: (s) => s.scorePerMatch, format: fmtInt },
  { label: "Matches", get: (s) => s.matches, format: fmtInt },
  { label: "Hours played", get: (s) => s.minutesPlayed / 60, format: fmtInt },
];

const WEEKLY_ROWS: { label: string; get: (t: Totals) => number }[] = [
  { label: "Wins", get: (t) => t.wins },
  { label: "Elims", get: (t) => t.kills },
  { label: "Matches", get: (t) => t.matches },
];

export function HeadToHead({ me, them }: { me: Side; them: Side }) {
  const inputs = INPUTS.filter((i) => me.stats?.[i]?.overall && them.stats?.[i]?.overall);
  const [input, setInput] = useState<Input>("all");
  const activeInput = inputs.includes(input) ? input : "all";
  const modes = MODES.filter((m) => me.stats?.[activeInput]?.[m] && them.stats?.[activeInput]?.[m]);
  const [modeChoice, setMode] = useState<Mode>("overall");
  const mode = modes.includes(modeChoice) ? modeChoice : "overall";

  const a = me.stats?.[activeInput]?.[mode] ?? null;
  const b = them.stats?.[activeInput]?.[mode] ?? null;
  const results = a && b ? ROWS.map((r) => ({ ...r, mine: r.get(a), theirs: r.get(b) })) : [];
  const myWins = results.filter((r) => r.mine > r.theirs).length;
  const theirWins = results.filter((r) => r.theirs > r.mine).length;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-violet-700/50 via-[#140d29] to-sky-700/40 p-5">
        <div className="bg-grid absolute inset-0 opacity-50" aria-hidden />
        <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Fighter name="You" sub={me.name} hue={me.hue} winner={myWins > theirWins} />
          <div className="text-center">
            <div className="font-display text-stroke text-4xl text-white sm:text-6xl">
              <span className={myWins >= theirWins ? "text-yellow-300" : ""}>{myWins}</span>
              <span className="mx-2 text-white/40">–</span>
              <span className={theirWins >= myWins ? "text-yellow-300" : ""}>{theirWins}</span>
            </div>
            <div className="font-display mt-1 text-lg text-white/60">VS</div>
          </div>
          <Fighter name={them.name} hue={them.hue} winner={theirWins > myWins} />
        </div>
      </section>

      <div className="space-y-3">
        {inputs.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {inputs.map((i) => (
              <button
                key={i}
                onClick={() => setInput(i)}
                className={clsx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition",
                  i === activeInput ? "border-violet-400 bg-violet-500/20 text-white" : "border-line text-muted hover:text-white",
                )}
              >
                {INPUT_LABELS[i]}
              </button>
            ))}
          </div>
        )}
        {modes.length > 0 && <ModeTabs modes={modes} value={mode} onChange={setMode} />}
      </div>

      {results.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel/80 p-4 text-sm text-muted">
          One of you has no matches in this mode yet.
        </p>
      ) : (
        <motion.section
          key={`${activeInput}-${mode}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 rounded-2xl border border-line bg-panel/80 p-4"
        >
          {results.map((r, i) => (
            <CompareRow key={r.label} label={r.label} mine={r.mine} theirs={r.theirs} format={r.format} delay={i * 0.04} />
          ))}
        </motion.section>
      )}

      {me.weekly && them.weekly && (
        <section className="space-y-2 rounded-2xl border border-line bg-panel/80 p-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-muted">Last 7 days</h2>
          {WEEKLY_ROWS.map((r, i) => (
            <CompareRow
              key={r.label}
              label={r.label}
              mine={r.get(me.weekly!)}
              theirs={r.get(them.weekly!)}
              format={(v) => `+${fmtInt(v)}`}
              delay={i * 0.04}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function Fighter({ name, sub, hue, winner }: { name: string; sub?: string; hue: number; winner: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="relative">
        {winner && <Crown className="absolute -top-6 left-1/2 size-6 -translate-x-1/2 fill-yellow-300 text-yellow-300" />}
        <Avatar name={sub ?? name} hue={hue} size="lg" className={winner ? "ring-4 ring-yellow-300" : undefined} />
      </div>
      <div className="font-display mt-2 w-full truncate text-xl text-white">{name}</div>
      {sub && <div className="w-full truncate text-xs text-white/60">{sub}</div>}
    </div>
  );
}

function CompareRow({
  label,
  mine,
  theirs,
  format,
  delay,
}: {
  label: string;
  mine: number;
  theirs: number;
  format: (v: number) => string;
  delay: number;
}) {
  const total = mine + theirs;
  const share = total > 0 ? (mine / total) * 100 : 50;
  const iWin = mine > theirs;
  const theyWin = theirs > mine;
  return (
    <div className="py-1">
      <div className="mb-1.5 grid grid-cols-[1fr_auto_1fr] items-baseline gap-2">
        <span className={clsx("text-lg font-extrabold tabular-nums", iWin ? "text-yellow-300" : "text-white/80")}>
          {format(mine)}
        </span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</span>
        <span className={clsx("text-right text-lg font-extrabold tabular-nums", theyWin ? "text-yellow-300" : "text-white/80")}>
          {format(theirs)}
        </span>
      </div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={clsx("h-full", iWin ? "bg-gradient-to-r from-yellow-300 to-amber-500" : "bg-violet-400/60")}
          initial={{ width: "50%" }}
          animate={{ width: `${share}%` }}
          transition={{ duration: 0.7, delay, ease: "easeOut" }}
        />
        <div className="w-0.5 bg-[#0b0716]" />
        <div className={clsx("h-full flex-1", theyWin ? "bg-gradient-to-r from-amber-500 to-yellow-300" : "bg-sky-400/50")} />
      </div>
    </div>
  );
}
