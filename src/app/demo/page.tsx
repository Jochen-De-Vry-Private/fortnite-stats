import type { Metadata } from "next";
import { RefreshCw } from "lucide-react";
import { DemoButton } from "@/components/demo-actions";
import { StatsView } from "@/components/stats-view";
import { getDemoData } from "@/lib/demo/data";
import { demoView } from "@/lib/demo/view";

export const metadata: Metadata = { title: "Demo" };

export default function DemoStatsPage() {
  const demo = getDemoData();
  return (
    <StatsView
      {...demoView(demo, demo.me)}
      actions={
        <DemoButton
          variant="secondary"
          label="Refresh my stats"
          className="size-11 border-white/15 bg-black/30 p-0"
        >
          <RefreshCw className="size-5" />
        </DemoButton>
      }
    />
  );
}
