import type { Metadata } from "next";
import { Logo } from "@/components/app-nav";
import { StatsView } from "@/components/stats-view";
import { ButtonLink } from "@/components/ui";
import { SAMPLE_STATS } from "@/lib/fortnite/sample";
import { isoDate, type Totals, type TrendPoint } from "@/lib/stats";

export const metadata: Metadata = { title: "Demo profile" };
export const dynamic = "force-dynamic";

// Made-up daily history so the demo can show the progress chart.
function demoTrend(): TrendPoint[] {
  const points: TrendPoint[] = [];
  let kills = 3600;
  let deaths = 1550;
  for (let i = 45; i >= 1; i--) {
    if (i % 3 === 0) continue;
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const matches = 3 + ((i * 7) % 9);
    const dayKills = Math.round(matches * (1.8 + ((i * 13) % 10) / 6));
    kills += dayKills;
    deaths += matches - (i % 4 === 0 ? 1 : 0);
    points.push({ date: isoDate(d), wins: i % 4 === 0 ? 1 : 0, kills: dayKills, matches, kd: kills / deaths });
  }
  return points;
}

const WEEKLY: Totals = { score: 6400, wins: 3, kills: 71, deaths: 30, matches: 33, minutesPlayed: 260, playersOutlived: 1200 };

export default function DemoPage() {
  return (
    <>
      <header className="pt-safe sticky top-0 z-30 border-b border-white/5 bg-bg/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo />
          <ButtonLink href="/signup" className="px-3 py-2 text-xs">
            Track yours
          </ButtonLink>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-5 pb-12">
        <StatsView
          player={{
            epic_name: SAMPLE_STATS.account.name,
            avatar_hue: 265,
            battle_pass_level: SAMPLE_STATS.battlePass?.level ?? null,
            battle_pass_progress: SAMPLE_STATS.battlePass?.progress ?? null,
            last_synced_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
            sync_error: null,
          }}
          stats={SAMPLE_STATS.stats}
          trend={demoTrend()}
          weekly={WEEKLY}
        />
      </main>
    </>
  );
}
