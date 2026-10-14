export const INPUTS = ["all", "keyboardMouse", "gamepad", "touch"] as const;
export const MODES = ["overall", "solo", "duo", "squad", "ltm"] as const;

export type Input = (typeof INPUTS)[number];
export type Mode = (typeof MODES)[number];

export type ModeStats = {
  score: number;
  scorePerMin: number;
  scorePerMatch: number;
  wins: number;
  top3?: number;
  top5?: number;
  top6?: number;
  top10?: number;
  top12?: number;
  top25?: number;
  kills: number;
  killsPerMin: number;
  killsPerMatch: number;
  deaths: number;
  kd: number;
  matches: number;
  winRate: number;
  minutesPlayed: number;
  playersOutlived: number;
  lastModified: string;
};

export type InputStats = Partial<Record<Mode, ModeStats | null>>;
export type AllStats = Partial<Record<Input, InputStats | null>>;

export type FortniteStatsData = {
  account: { id: string; name: string };
  battlePass: { level: number; progress: number } | null;
  stats: AllStats;
};

export type AccountType = "epic" | "psn" | "xbl";

export const INPUT_LABELS: Record<Input, string> = {
  all: "All inputs",
  keyboardMouse: "Keyboard & mouse",
  gamepad: "Controller",
  touch: "Touch",
};

export const MODE_LABELS: Record<Mode, string> = {
  overall: "Overall",
  solo: "Solo",
  duo: "Duo",
  squad: "Squad",
  ltm: "LTM",
};
