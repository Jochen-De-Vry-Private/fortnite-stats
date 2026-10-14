"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import {
  Clock,
  Crosshair,
  Crown,
  Gamepad2,
  Keyboard,
  Layers,
  Lock,
  Percent,
  Skull,
  Smartphone,
  Swords,
  Target,
  Timer,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type { AllStats, Input, Mode, ModeStats } from "@/lib/fortnite/types";
import { INPUTS, INPUT_LABELS, MODES, MODE_LABELS } from "@/lib/fortnite/types";
import { fmtInt, timeAgo, type Totals, type TrendPoint } from "@/lib/stats";
import { AnimatedNumber } from "./animated-number";
import { Avatar } from "./avatar";
import { RankBadge } from "./rank-badge";
import { TrendChart } from "./trend-chart";

export type StatsViewPlayer = {
  epic_name: string;
  avatar_hue: number;
  battle_pass_level: number | null;
  battle_pass_progress: number | null;
  last_synced_at: string | null;
  sync_error: string | null;
};

const INPUT_ICONS: Record<Input, ReactNode> = {
  all: <Layers className="size-4" />,
  keyboardMouse: <Keyboard className="size-4" />,
  gamepad: <Gamepad2 className="size-4" />,
  touch: <Smartphone className="size-4" />,
};

export function StatsView({
  player,
  stats,
  trend,
  weekly,
  actions,
}: {
  player: StatsViewPlayer;
  stats: AllStats | null;
  trend: TrendPoint[];
  weekly: Totals | null;
  actions?: ReactNode;
}) {
  const inputs = INPUTS.filter((i) => stats?.[i]?.overall);
  const [input, setInput] = useState<Input>(inputs[0] ?? "all");
  const modes = MODES.filter((m) => stats?.[input]?.[m]);
  const [modeChoice, setMode] = useState<Mode>("overall");
  const mode = modes.includes(modeChoice) ? modeChoice : (modes[0] ?? "overall");
  const s = stats?.[input]?.[mode] ?? null;
  const overallKd = stats?.all?.overall?.kd ?? 0;

  return (
    <div className="space-y-5">
      <Hero player={player} kd={overallKd} actions={actions} />

      {player.sync_error === "private" && (
        <Notice icon={<Lock className="size-5" />}>
          Stats are private. In Fortnite go to <b>Settings → Account and Privacy</b> and turn on{" "}
          <b>Show on Career Leaderboard</b>. We&apos;ll pick them up on the next daily update.
        </Notice>
      )}

      {weekly && <WeeklyStrip weekly={weekly} />}

      {!s ? (
        <Notice icon={<Target className="size-5" />}>No matches recorded yet. Drop in and come back later!</Notice>
      ) : (
        <>
          <div className="space-y-3">
            {inputs.length > 1 && (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                {inputs.map((i) => (
                  <button
                    key={i}
                    onClick={() => setInput(i)}
                    className={clsx(
                      "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition",
                      i === input
                        ? "border-violet-400 bg-violet-500/20 text-white"
                        : "border-line text-muted hover:text-white",
                    )}
                  >
                    {INPUT_ICONS[i]}
                    {INPUT_LABELS[i]}
                  </button>
                ))}
              </div>
            )}
            <ModeTabs modes={modes} value={mode} onChange={setMode} />
          </div>

          <motion.div
            key={`${input}-${mode}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <BigStat rarity="legendary" icon={<Crown />} label="Victory Royales" value={s.wins} format="int" />
              <BigStat rarity="epic" icon={<Swords />} label="K/D" value={s.kd} format="dec2" />
              <BigStat rarity="rare" icon={<Percent />} label="Win rate" value={s.winRate} format="pct" />
              <BigStat rarity="uncommon" icon={<Crosshair />} label="Eliminations" value={s.kills} format="int" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SmallStat icon={<Gamepad2 />} label="Matches" value={fmtInt(s.matches)} />
              <SmallStat icon={<Target />} label="Elims / match" value={s.killsPerMatch.toFixed(2)} />
              <SmallStat icon={<Zap />} label="Score / match" value={fmtInt(s.scorePerMatch)} />
              <SmallStat icon={<Clock />} label="Hours played" value={fmtInt(s.minutesPlayed / 60)} />
              <SmallStat icon={<Users />} label="Players outlived" value={fmtInt(s.playersOutlived)} />
              <SmallStat icon={<Skull />} label="Deaths" value={fmtInt(s.deaths)} />
              <SmallStat icon={<Timer />} label="Elims / min" value={s.killsPerMin.toFixed(2)} />
              <SmallStat icon={<Trophy />} label="Score" value={fmtInt(s.score)} />
            </div>

            <Placements s={s} />
          </motion.div>
        </>
      )}

      {trend.length >= 2 && <TrendChart data={trend} />}
    </div>
  );
}

function Hero({ player, kd, actions }: { player: StatsViewPlayer; kd: number; actions?: ReactNode }) {
  const level = player.battle_pass_level;
  const progress = player.battle_pass_progress ?? 0;
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-7"
      style={{
        background: `linear-gradient(135deg, hsl(${player.avatar_hue} 70% 30% / 0.9), hsl(${(player.avatar_hue + 70) % 360} 70% 18% / 0.9) 60%, #120c24)`,
      }}
    >
      <div className="bg-grid absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar name={player.epic_name} hue={player.avatar_hue} size="xl" />
          <div className="min-w-0">
            <h1 className="font-display text-stroke break-all text-3xl text-white sm:text-5xl">{player.epic_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RankBadge kd={kd} />
              <span className="text-xs text-white/60">Updated {timeAgo(player.last_synced_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:ml-auto">
          {level !== null && <LevelRing level={level} progress={progress} />}
          {actions}
        </div>
      </div>
    </section>
  );
}

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[76px] shrink-0" title={`Battle Pass level ${level}, ${progress}% to next`}>
      <svg viewBox="0 0 76 76" className="size-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="rgb(0 0 0 / 0.35)" stroke="rgb(255 255 255 / 0.12)" strokeWidth="7" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="url(#lvl)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - progress / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="lvl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fde047" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/70">Level</div>
          <div className="font-display text-2xl text-yellow-300">{level}</div>
        </div>
      </div>
    </div>
  );
}

function WeeklyStrip({ weekly }: { weekly: Totals }) {
  const items = [
    { label: "Wins", value: weekly.wins, color: "text-legendary" },
    { label: "Elims", value: weekly.kills, color: "text-uncommon" },
    { label: "Matches", value: weekly.matches, color: "text-rare" },
    { label: "Hours", value: Math.round(weekly.minutesPlayed / 60), color: "text-epic" },
  ];
  return (
    <section className="rounded-2xl border border-line bg-panel/80 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Last 7 days</h2>
      <div className="grid grid-cols-4 gap-2 text-center">
        {items.map((it) => (
          <div key={it.label}>
            <div className={clsx("font-display text-2xl sm:text-3xl", it.color)}>
              +<AnimatedNumber value={it.value} format="int" />
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ModeTabs({ modes, value, onChange }: { modes: Mode[]; value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl border border-line bg-panel p-1">
      {modes.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={clsx(
            "relative flex-1 rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition",
            m === value ? "text-zinc-950" : "text-muted hover:text-white",
          )}
        >
          {m === value && (
            <motion.span
              layoutId="mode-pill"
              className="absolute inset-0 rounded-xl bg-gradient-to-b from-yellow-300 to-amber-500"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative">{MODE_LABELS[m]}</span>
        </button>
      ))}
    </div>
  );
}

const RARITY: Record<string, string> = {
  legendary: "from-orange-400/90 via-amber-600/70 to-orange-900/80 border-orange-300/50 shadow-orange-500/20",
  epic: "from-fuchsia-500/90 via-purple-700/70 to-purple-950/80 border-fuchsia-300/50 shadow-fuchsia-500/20",
  rare: "from-sky-400/90 via-blue-600/70 to-blue-950/80 border-sky-300/50 shadow-sky-500/20",
  uncommon: "from-lime-400/90 via-green-600/70 to-green-950/80 border-lime-300/50 shadow-lime-500/20",
};

function BigStat({
  rarity,
  icon,
  label,
  value,
  format,
}: {
  rarity: keyof typeof RARITY;
  icon: ReactNode;
  label: string;
  value: number;
  format: "int" | "dec2" | "pct";
}) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-xl",
        RARITY[rarity],
      )}
    >
      <div className="absolute -right-3 -top-3 text-white/15 [&>svg]:size-20" aria-hidden>
        {icon}
      </div>
      <div className="relative">
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/80">{label}</div>
        <div className="font-display text-stroke mt-1 text-4xl text-white sm:text-5xl">
          <AnimatedNumber value={value} format={format} />
        </div>
      </div>
    </div>
  );
}

function SmallStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-panel/80 p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-300 [&>svg]:size-4.5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
        <div className="text-lg font-extrabold tabular-nums text-white">{value}</div>
      </div>
    </div>
  );
}

const PLACEMENT_KEYS = ["top3", "top5", "top6", "top10", "top12", "top25"] as const;

function Placements({ s }: { s: ModeStats }) {
  const rows = PLACEMENT_KEYS.filter((k) => typeof s[k] === "number").map((k) => ({
    label: `Top ${k.slice(3)}`,
    value: s[k] as number,
  }));
  if (rows.length === 0) return null;
  const max = Math.max(s.wins, ...rows.map((r) => r.value), 1);
  const all = [{ label: "#1 Victory", value: s.wins }, ...rows];

  return (
    <section className="rounded-2xl border border-line bg-panel/80 p-4">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">Placements</h2>
      <div className="space-y-2.5">
        {all.map((r, i) => (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-xs font-bold uppercase text-white/80">{r.label}</div>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={clsx(
                  "h-full rounded-full",
                  i === 0 ? "bg-gradient-to-r from-yellow-300 to-amber-500" : "bg-gradient-to-r from-violet-400 to-sky-400",
                )}
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.value / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
              />
            </div>
            <div className="w-12 text-right text-sm font-bold tabular-nums">{fmtInt(r.value)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Notice({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
      <div className="mt-0.5 shrink-0 text-amber-300">{icon}</div>
      <div>{children}</div>
    </div>
  );
}
