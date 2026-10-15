import { Sparkles } from "lucide-react";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { SAMPLE_STATS } from "@/lib/fortnite/sample";

// Demo data is generated relative to today's date.
export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav name={SAMPLE_STATS.account.name} hue={265} pendingRequests={1} demo />
      <div className="border-b border-yellow-300/20 bg-yellow-300/10">
        <p className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2 text-xs text-yellow-100">
          <Sparkles className="size-4 shrink-0 text-yellow-300" />
          <span>
            Demo with made-up players. Look around, then{" "}
            <Link href="/signup" className="font-bold text-yellow-300 underline">
              track your own stats
            </Link>
            .
          </span>
        </p>
      </div>
      <main className="mx-auto max-w-5xl px-4 pt-5 pb-28 md:pb-12">{children}</main>
    </>
  );
}
