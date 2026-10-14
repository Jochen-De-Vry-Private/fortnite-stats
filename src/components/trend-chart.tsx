"use client";

import clsx from "clsx";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/stats";

const SERIES = {
  kills: { chip: "Elims", label: "Elims per day", color: "#5bdc3c", type: "bar" },
  wins: { chip: "Wins", label: "Wins per day", color: "#ffa53c", type: "bar" },
  matches: { chip: "Matches", label: "Matches per day", color: "#3cc9ff", type: "bar" },
  kd: { chip: "K/D", label: "Lifetime K/D", color: "#c359ff", type: "line" },
} as const;

type SeriesKey = keyof typeof SERIES;

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [key, setKey] = useState<SeriesKey>("kills");
  const series = SERIES[key];
  const points = data.slice(-60);

  const axis = { stroke: "#6f6699", fontSize: 11, tickLine: false, axisLine: false } as const;
  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgb(255 255 255 / 0.05)" }}
      contentStyle={{ background: "#1e1736", border: "1px solid #2c2350", borderRadius: 12, color: "#fff" }}
      labelFormatter={(l) => shortDate(String(l))}
      formatter={(v) => [key === "kd" ? Number(v).toFixed(2) : v, series.label]}
    />
  );

  return (
    <section className="rounded-2xl border border-line bg-panel/80 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted">Progress (all modes)</h2>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(SERIES) as SeriesKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setKey(k)}
              className={clsx(
                "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition",
                k === key ? "bg-white text-zinc-950" : "text-muted hover:text-white",
              )}
            >
              {SERIES[k].chip}
            </button>
          ))}
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {series.type === "bar" ? (
            <BarChart data={points} margin={{ left: -20, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.06)" />
              <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={20} />
              <YAxis allowDecimals={false} {...axis} />
              {tooltip}
              <Bar dataKey={key} fill={series.color} radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          ) : (
            <LineChart data={points} margin={{ left: -20, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} stroke="rgb(255 255 255 / 0.06)" />
              <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={20} />
              <YAxis domain={["auto", "auto"]} {...axis} tickFormatter={(v) => Number(v).toFixed(2)} />
              {tooltip}
              <Line dataKey="kd" stroke={series.color} strokeWidth={3} dot={false} type="monotone" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
