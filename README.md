# DropStats

A progressive web app for tracking Fortnite Battle Royale stats with friends. It installs on Android, iOS and desktop from the browser.

- **Sign up** with email + your Fortnite (Epic) name. The name is checked against fortnite-api.com and can be claimed by only one account.
- **Dashboard**: lifetime stats per input (all, keyboard and mouse, controller, touch) and mode (overall, solo, duo, squad, LTM), a K/D rank badge, Battle Pass level, last-7-days gains and a progress chart.
- **Friends**: find other DropStats users, send, accept or decline requests, or share a personal invite link (sign up through it and you're friends automatically).
- **Compare**: look up any Fortnite player, pros included, and see a head-to-head against your own stats. Follow players to keep their daily history and optionally show them on your leaderboards.
- **Groups**: create a crew, share its invite code, add friends, and use a per-group leaderboard.
- **Leaderboards**: rank friends or a group by wins, K/D, win %, elims, matches and more, for lifetime, this week or this month. Followed players can be toggled on or off.
- **Daily sync**: a cron job refreshes every app user and every followed player once a day, and stores a snapshot whenever their stats changed. The weekly and monthly numbers come from those snapshots.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS 4 · Framer Motion · Recharts · Serwist (PWA) · Supabase (Postgres, Auth, row-level security) · Vercel (hosting + cron).

## Project layout

```
src/app/(app)/…          signed-in pages (dashboard, player, friends, leaderboards, groups)
src/app/(auth)/…         login, signup
src/app/actions/…        server actions (auth, friends/groups, stats refresh)
src/app/api/cron/sync    daily sync endpoint (protected by CRON_SECRET)
src/app/sw.ts            service worker (offline support)
src/lib/fortnite/        fortnite-api.com client + types
src/lib/sync.ts          saving API responses + snapshots
src/lib/data.ts          database queries + leaderboard maths
supabase/migrations/     database schema and security policies
scripts/seed-dev.mjs     fake friends/history for local testing
```

## Run it locally

Requirements: Node 22 (Node 20 works but prints warnings) and Docker Desktop.

```bash
npm install
npm run db:start          # starts a local Supabase in Docker and applies the migration
```

Copy `.env.example` to `.env.local` and fill it in from the output of `npm run db:start` (or `npx supabase status`):

| `.env.local` | Value from the Supabase output |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (`http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Publishable** (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | **Secret** (`sb_secret_…`) |
| `FORTNITE_API_KEY` | your key from fortnite-api.com |
| `CRON_SECRET` | any long random string |

Then:

```bash
npm run dev               # http://localhost:3000
npm run seed:dev          # optional: adds 5 fake friends with 40 days of history to every real account
```

Locally, sign-up needs no email confirmation. To trigger a sync by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync
```

The service worker only runs in production builds (`npm run build && npm start`).

## Deploy (free tiers)

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Create the database tables. Either:
   - **SQL editor**: run each file in `supabase/migrations/` **once, in filename order** (paste the contents, click Run), or
   - **CLI**: run `npx supabase link --project-ref <ref>`, then `npx supabase db push`.
3. **Authentication → URL Configuration**: set **Site URL** to your Vercel URL (e.g. `https://dropstats.vercel.app`) and add `https://dropstats.vercel.app/auth/callback` to **Redirect URLs**.
4. **Email confirmation**: Supabase's built-in email sender only allows a handful of emails per hour. For a small friends app you can either:
   - turn off **Authentication → Sign In / Providers → Email → Confirm email**, or
   - add a free SMTP provider (e.g. Resend) under **Authentication → Emails → SMTP Settings**.
5. Copy the **Project URL** (Project Settings → Data API) and the **Publishable key** and **Secret key** (Project Settings → API Keys).

### 2. GitHub + Vercel

1. Push this folder to a new GitHub repository. `.env.local` is git-ignored and won't be uploaded.
2. In [vercel.com](https://vercel.com), go to **Add New → Project** and import the repo. The framework is detected as Next.js.
3. Add these **Environment Variables**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) |
   | `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_…`, keep secret) |
   | `FORTNITE_API_KEY` | your fortnite-api.com key (keep secret) |
   | `CRON_SECRET` | a long random string |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-app>.vercel.app` |

4. Deploy. `vercel.json` registers the daily cron (`/api/cron/sync` at 06:00 UTC), and Vercel sends `CRON_SECRET` with each call automatically.

### More than ~200 players?

One cron run syncs as many players as fit in about 50 seconds. If there are more, the rest are picked up on the next call. Vercel's free plan runs crons once a day, so you can also call the endpoint hourly from Supabase. In the SQL editor, enable `pg_cron` and `pg_net`, then:

```sql
select cron.schedule('dropstats-sync', '15 * * * *', $$
  select net.http_get(
    url := 'https://<your-app>.vercel.app/api/cron/sync',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$$);
```

Players already synced in the last 20 hours are skipped, so extra calls are cheap.

### Updating an existing deployment

When a new file appears in `supabase/migrations/`, run it on your Supabase project (SQL editor or `npx supabase db push`) **before** pushing the code that needs it. Otherwise the deployed app will query tables that don't exist yet.

## Installing the app

- **Android (Chrome)**: open the site, then use the **Install app** prompt or the **⋮ → Add to Home screen** menu.
- **iPhone/iPad (Safari)**: open the site, then **Share → Add to Home Screen**.
- **Desktop (Chrome/Edge)**: click the install icon in the address bar.

## Notes

- Player stats must be public in Fortnite: **Settings → Account and Privacy → Show on Career Leaderboard**. Private players show a hint on their profile.
- Weekly and monthly leaderboards count from the first snapshot DropStats took, so new players show their gains since joining.
- Snapshots store only the key numbers for "all inputs", which keeps the database well inside Supabase's 500 MB free tier.
- Not affiliated with Epic Games.
