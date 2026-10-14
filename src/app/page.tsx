import { BarChart3, Trophy, UsersRound, Zap } from "lucide-react";
import { Logo } from "@/components/app-nav";
import { ButtonLink } from "@/components/ui";
import { APP_TAGLINE } from "@/lib/config";

const FEATURES = [
  { icon: BarChart3, title: "Every stat", text: "Wins, K/D, win rate, elims. Split by mode and by controller, keyboard or touch.", color: "text-rare" },
  { icon: Zap, title: "Auto-updated daily", text: "We pull your stats every day so you can see your progress over time.", color: "text-legendary" },
  { icon: UsersRound, title: "Friends & groups", text: "Add your squad, build crews and see who's really carrying.", color: "text-uncommon" },
  { icon: Trophy, title: "Leaderboards", text: "Lifetime or this week. Climb the ranks in your friend group.", color: "text-epic" },
];

export default function LandingPage() {
  return (
    <div className="bg-grid min-h-dvh">
      <header className="pt-safe mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Logo />
        <ButtonLink href="/login" variant="ghost">
          Log in
        </ButtonLink>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="py-14 text-center sm:py-20">
          <p className="mb-4 inline-block rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-yellow-300">
            Free · No download needed
          </p>
          <h1 className="font-display text-stroke mx-auto max-w-3xl text-5xl leading-[0.95] text-white sm:text-7xl">
            Your stats. <span className="text-yellow-300">Your squad.</span>{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 to-sky-400 bg-clip-text text-transparent">Bragging rights.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">{APP_TAGLINE}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" className="w-full px-8 py-4 text-base sm:w-auto">
              Start tracking
            </ButtonLink>
            <ButtonLink href="/demo" variant="secondary" className="w-full px-8 py-4 text-base sm:w-auto">
              See a demo
            </ButtonLink>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text, color }) => (
            <div key={title} className="rounded-2xl border border-line bg-panel/80 p-5">
              <Icon className={`mb-3 size-7 ${color}`} />
              <h2 className="font-display text-2xl text-white">{title}</h2>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </section>

        <p className="mt-12 text-center text-xs text-muted/70">
          Not affiliated with or endorsed by Epic Games. Stats via fortnite-api.com.
        </p>
      </main>
    </div>
  );
}
