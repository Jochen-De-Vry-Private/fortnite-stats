import { INPUTS, MODES, type Input, type Mode } from "./fortnite/types";
import { METRICS, PERIOD_LABELS, type MetricKey, type Period } from "./stats";

export type LeaderboardSearchParams = {
  scope?: string;
  metric?: string;
  mode?: string;
  input?: string;
  period?: string;
  pros?: string;
};

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseLeaderboardParams(sp: LeaderboardSearchParams) {
  return {
    metric: pick(sp.metric, Object.keys(METRICS) as MetricKey[], "wins"),
    mode: pick<Mode>(sp.mode, MODES, "overall"),
    input: pick<Input>(sp.input, INPUTS, "all"),
    period: pick(sp.period, Object.keys(PERIOD_LABELS) as Period[], "lifetime"),
    // Followed players are shown unless switched off.
    showPros: sp.pros !== "0",
  };
}
