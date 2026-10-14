import "server-only";
import type { AccountType, FortniteStatsData } from "./types";

const BASE_URL = "https://fortnite-api.com/v2/stats/br/v2";

export type FetchStatsResult =
  | { ok: true; data: FortniteStatsData }
  | { ok: false; error: "not_found" | "private" | "rate_limited" | "unavailable"; message: string };

async function request(url: string): Promise<FetchStatsResult> {
  const apiKey = process.env.FORTNITE_API_KEY;
  if (!apiKey) throw new Error("FORTNITE_API_KEY is not set");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, error: "unavailable", message: "Couldn't reach the stats service. Try again soon." };
  }

  if (res.ok) {
    const body = (await res.json()) as { data: FortniteStatsData };
    return { ok: true, data: body.data };
  }
  switch (res.status) {
    case 400:
    case 404:
      return { ok: false, error: "not_found", message: "No player found with that name." };
    case 403:
      return {
        ok: false,
        error: "private",
        message: "This player's stats are private. In Fortnite: Settings → Account and Privacy → Show on Career Leaderboard = On.",
      };
    case 429:
      return { ok: false, error: "rate_limited", message: "Too many requests to the stats service. Try again in a minute." };
    default:
      return { ok: false, error: "unavailable", message: `Stats service error (${res.status}).` };
  }
}

export function fetchStatsByName(name: string, accountType: AccountType = "epic") {
  const params = new URLSearchParams({ name: name.trim(), accountType });
  return request(`${BASE_URL}?${params}`);
}

// Looking up by account ID keeps working after a player changes their display name.
export function fetchStatsByAccountId(accountId: string) {
  return request(`${BASE_URL}/${encodeURIComponent(accountId)}`);
}
