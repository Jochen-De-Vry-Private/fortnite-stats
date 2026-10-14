import type { FortniteStatsData } from "./types";

// Example API response, used by the public /demo page.
const m = (o: Record<string, number>, lastModified = "2026-10-13T18:02:21Z") =>
  ({ lastModified, ...o }) as never;

export const SAMPLE_STATS: FortniteStatsData = {
  account: { id: "2c3ed6cffd78460b9b1bf9d38374e289", name: "Dr.Duder" },
  battlePass: { level: 74, progress: 76 },
  stats: {
    all: {
      overall: m({ score: 349357, scorePerMin: 32.739, scorePerMatch: 190.697, wins: 93, top3: 18, top5: 30, top6: 25, top10: 25, top12: 65, top25: 42, kills: 4162, killsPerMin: 0.39, killsPerMatch: 2.272, deaths: 1739, kd: 2.393, matches: 1832, winRate: 5.076, minutesPlayed: 10671, playersOutlived: 67578 }),
      solo: m({ score: 27150, scorePerMin: 28.222, scorePerMatch: 177.451, wins: 6, top10: 25, top25: 42, kills: 310, killsPerMin: 0.322, killsPerMatch: 2.026, deaths: 147, kd: 2.109, matches: 153, winRate: 3.922, minutesPlayed: 962, playersOutlived: 6368 }),
      duo: m({ score: 38283, scorePerMin: 28.149, scorePerMatch: 306.264, wins: 13, top5: 30, top12: 65, kills: 490, killsPerMin: 0.36, killsPerMatch: 3.92, deaths: 112, kd: 4.375, matches: 125, winRate: 10.4, minutesPlayed: 1360, playersOutlived: 7945 }),
      squad: m({ score: 15753, scorePerMin: 29.335, scorePerMatch: 393.825, wins: 7, top3: 18, top6: 25, kills: 187, killsPerMin: 0.348, killsPerMatch: 4.675, deaths: 33, kd: 5.667, matches: 40, winRate: 17.5, minutesPlayed: 537, playersOutlived: 2827 }),
      ltm: m({ score: 274658, scorePerMin: 34.022, scorePerMatch: 179.281, wins: 67, kills: 3235, killsPerMin: 0.401, killsPerMatch: 2.112, deaths: 1465, kd: 2.208, matches: 1532, winRate: 4.373, minutesPlayed: 8073, playersOutlived: 51830 }),
    },
    keyboardMouse: {
      overall: m({ score: 299008, scorePerMin: 35.173, scorePerMatch: 200.273, wins: 84, top3: 13, top5: 27, top6: 17, top10: 22, top12: 58, top25: 37, kills: 3808, killsPerMin: 0.448, killsPerMatch: 2.551, deaths: 1409, kd: 2.703, matches: 1493, winRate: 5.626, minutesPlayed: 8501, playersOutlived: 52426 }),
      solo: m({ score: 23087, scorePerMin: 29.905, scorePerMatch: 206.134, wins: 5, top10: 22, top25: 37, kills: 283, killsPerMin: 0.367, killsPerMatch: 2.527, deaths: 107, kd: 2.645, matches: 112, winRate: 4.464, minutesPlayed: 772, playersOutlived: 4997 }),
      duo: m({ score: 34455, scorePerMin: 28.881, scorePerMatch: 319.028, wins: 12, top5: 27, top12: 58, kills: 458, killsPerMin: 0.384, killsPerMatch: 4.241, deaths: 96, kd: 4.771, matches: 108, winRate: 11.111, minutesPlayed: 1193, playersOutlived: 6866 }),
      squad: m({ score: 11000, scorePerMin: 30.986, scorePerMatch: 407.407, wins: 6, top3: 13, top6: 17, kills: 135, killsPerMin: 0.38, killsPerMatch: 5, deaths: 21, kd: 6.429, matches: 27, winRate: 22.222, minutesPlayed: 355, playersOutlived: 1836 }),
      ltm: m({ score: 233661, scorePerMin: 37.066, scorePerMatch: 186.333, wins: 61, kills: 2963, killsPerMin: 0.47, killsPerMatch: 2.363, deaths: 1193, kd: 2.484, matches: 1254, winRate: 4.864, minutesPlayed: 6304, playersOutlived: 39396 }),
    },
    gamepad: {
      overall: m({ score: 50349, scorePerMin: 23.202, scorePerMatch: 149.404, wins: 9, top3: 5, top5: 3, top6: 8, top10: 2, top12: 7, top25: 4, kills: 353, killsPerMin: 0.163, killsPerMatch: 1.047, deaths: 328, kd: 1.076, matches: 337, winRate: 2.671, minutesPlayed: 2170, playersOutlived: 15152 }),
      solo: m({ score: 4063, scorePerMin: 21.384, scorePerMatch: 104.179, wins: 1, top10: 2, top25: 4, kills: 26, killsPerMin: 0.137, killsPerMatch: 0.667, deaths: 38, kd: 0.684, matches: 39, winRate: 2.564, minutesPlayed: 190, playersOutlived: 1371 }),
      duo: m({ score: 3828, scorePerMin: 22.922, scorePerMatch: 225.176, wins: 1, top5: 3, top12: 7, kills: 32, killsPerMin: 0.192, killsPerMatch: 1.882, deaths: 16, kd: 2, matches: 17, winRate: 5.882, minutesPlayed: 167, playersOutlived: 1079 }),
      squad: m({ score: 4753, scorePerMin: 26.115, scorePerMatch: 365.615, wins: 1, top3: 5, top6: 8, kills: 52, killsPerMin: 0.286, killsPerMatch: 4, deaths: 12, kd: 4.333, matches: 13, winRate: 7.692, minutesPlayed: 182, playersOutlived: 991 }),
      ltm: m({ score: 40997, scorePerMin: 23.175, scorePerMatch: 147.471, wins: 6, kills: 272, killsPerMin: 0.154, killsPerMatch: 0.978, deaths: 272, kd: 1, matches: 278, winRate: 2.158, minutesPlayed: 1769, playersOutlived: 12434 }),
    },
    touch: {
      overall: m({ score: 0, scorePerMin: 0, scorePerMatch: 0, wins: 0, top3: 0, top5: 0, top6: 0, top10: 1, top12: 0, top25: 1, kills: 1, killsPerMin: 0, killsPerMatch: 0.5, deaths: 2, kd: 0.5, matches: 2, winRate: 0, minutesPlayed: 0, playersOutlived: 0 }),
      solo: m({ score: 0, scorePerMin: 0, scorePerMatch: 0, wins: 0, top10: 1, top25: 1, kills: 1, killsPerMin: 0, killsPerMatch: 0.5, deaths: 2, kd: 0.5, matches: 2, winRate: 0, minutesPlayed: 0, playersOutlived: 0 }),
    },
  },
};
