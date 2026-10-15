"use client";

import clsx from "clsx";
import { Star } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { INPUT_LABELS, MODE_LABELS, type Input, type Mode } from "@/lib/fortnite/types";
import { METRICS, PERIOD_LABELS, type MetricKey, type Period } from "@/lib/stats";

type Option = { value: string; label: string };

export function LeaderboardFilters({
  scopes,
  scope,
  metric,
  mode,
  input,
  period,
  hideScope,
  showPros,
  hasPros,
}: {
  scopes: Option[];
  scope: string;
  metric: MetricKey;
  mode: Mode;
  input: Input;
  period: Period;
  hideScope?: boolean;
  showPros: boolean;
  hasPros: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
  };

  return (
    <div className={clsx("space-y-3 transition-opacity", pending && "opacity-60")}>
      {!hideScope && scopes.length > 1 && (
        <Chips options={scopes} value={scope} onChange={(v) => set("scope", v)} />
      )}
      {hasPros && (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-panel px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-semibold text-white">
            <Star className="size-4 fill-sky-300 text-sky-300" /> Show players I follow
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={showPros}
            onChange={(e) => set("pros", e.target.checked ? "1" : "0")}
            className="peer sr-only"
          />
          <span className="relative h-6 w-11 rounded-full bg-white/15 transition after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition peer-checked:bg-sky-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-sky-300" />
        </label>
      )}
      <Chips
        options={(Object.keys(METRICS) as MetricKey[]).map((k) => ({ value: k, label: METRICS[k].short }))}
        value={metric}
        onChange={(v) => set("metric", v)}
        accent
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select
          label="Period"
          value={period}
          onChange={(v) => set("period", v)}
          options={(Object.keys(PERIOD_LABELS) as Period[]).map((p) => ({ value: p, label: PERIOD_LABELS[p] }))}
        />
        <Select
          label="Mode"
          value={mode}
          onChange={(v) => set("mode", v)}
          options={(Object.keys(MODE_LABELS) as Mode[]).map((m) => ({ value: m, label: MODE_LABELS[m] }))}
        />
        <Select
          label="Input"
          value={period === "lifetime" ? input : "all"}
          disabled={period !== "lifetime"}
          onChange={(v) => set("input", v)}
          options={(Object.keys(INPUT_LABELS) as Input[]).map((i) => ({ value: i, label: INPUT_LABELS[i] }))}
        />
      </div>
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
  accent,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  accent?: boolean;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide transition",
            o.value === value
              ? accent
                ? "border-yellow-300 bg-gradient-to-b from-yellow-300 to-amber-500 text-zinc-950"
                : "border-violet-400 bg-violet-500/20 text-white"
              : "border-line text-muted hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className={clsx("flex items-center gap-2 rounded-xl border border-line bg-panel px-3", disabled && "opacity-50")}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-2.5 text-sm font-semibold text-white outline-none [&>option]:bg-panel"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
