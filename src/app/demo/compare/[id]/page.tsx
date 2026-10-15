import { ArrowLeft, BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoFollow } from "@/components/demo-actions";
import { HeadToHead } from "@/components/head-to-head";
import { ButtonLink } from "@/components/ui";
import { getDemoData } from "@/lib/demo/data";

export const metadata: Metadata = { title: "Demo · Head-to-head" };

export default async function DemoCompareWithPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demo = getDemoData();
  const them = demo.players.get(id);
  if (!them || them.epic_id === demo.me.epic_id) notFound();
  const followed = demo.pros.some((p) => p.epic_id === id);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/demo/compare" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-white">
          <ArrowLeft className="size-4" /> Compare
        </Link>
        <div className="flex gap-2">
          <ButtonLink href={`/demo/player/${id}`} variant="secondary" className="px-3 py-2 text-xs">
            <BarChart3 className="size-4" /> Full stats
          </ButtonLink>
          <DemoFollow initial={followed} compact />
        </div>
      </div>
      <HeadToHead
        me={{ name: demo.me.epic_name, hue: demo.me.avatar_hue, stats: demo.me.latest_stats, weekly: demo.weeklyGains(demo.me) }}
        them={{ name: them.epic_name, hue: them.avatar_hue, stats: them.latest_stats, weekly: demo.weeklyGains(them) }}
      />
    </div>
  );
}
