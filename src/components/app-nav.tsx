"use client";

import clsx from "clsx";
import { Home, LogOut, Swords, Trophy, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/config";
import { Avatar } from "./avatar";

const ITEMS = [
  { href: "/dashboard", label: "Stats", icon: Home },
  { href: "/friends", label: "Friends", icon: UserPlus },
  { href: "/compare", label: "Compare", icon: Swords },
  { href: "/leaderboards", label: "Ranks", icon: Trophy },
  { href: "/groups", label: "Groups", icon: UsersRound },
];

export function AppNav({ name, hue, pendingRequests }: { name: string; hue: number; pendingRequests: number }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="pt-safe sticky top-0 z-30 border-b border-white/5 bg-bg/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Logo />
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold uppercase tracking-wide transition",
                  isActive(href) ? "bg-white/10 text-white" : "text-muted hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {label}
                {href === "/friends" && pendingRequests > 0 && <Dot count={pendingRequests} />}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link href="/dashboard" className="flex items-center gap-2" aria-label="My stats">
              <Avatar name={name} hue={hue} size="sm" />
            </Link>
            <form action={signOut}>
              <button
                className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-white/5 hover:text-white"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0e0a1d]/95 backdrop-blur-lg md:hidden">
        <div className="grid grid-cols-5">
          {ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative flex flex-col items-center gap-1 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide",
                  active ? "text-yellow-300" : "text-muted",
                )}
              >
                <span className="relative">
                  <Icon className={clsx("size-6 transition", active && "scale-110 drop-shadow-[0_0_8px_rgb(253_224_71/0.6)]")} />
                  {href === "/friends" && pendingRequests > 0 && (
                    <span className="absolute -right-2 -top-1">
                      <Dot count={pendingRequests} />
                    </span>
                  )}
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export function Logo() {
  return (
    <Link href="/" className="font-display text-stroke flex items-center gap-1.5 text-2xl">
      <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-yellow-300 to-amber-500 text-lg text-zinc-950 shadow-[0_3px_0_0_#b45309]">
        D
      </span>
      <span className="text-white">{APP_NAME.slice(0, 4)}</span>
      <span className="-ml-1 text-yellow-300">{APP_NAME.slice(4)}</span>
    </Link>
  );
}

function Dot({ count }: { count: number }) {
  return (
    <span className="grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold leading-none text-white">
      {count}
    </span>
  );
}
