"use client";

import clsx from "clsx";
import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { refreshMyStats } from "@/app/actions/stats";

export function RefreshButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="relative">
      <button
        onClick={() =>
          start(async () => {
            const res = await refreshMyStats();
            setMsg(res.error ?? "Stats updated!");
            setTimeout(() => setMsg(null), 4000);
          })
        }
        disabled={pending}
        aria-label="Refresh my stats"
        title="Refresh my stats"
        className="grid size-11 place-items-center rounded-xl border border-white/15 bg-black/30 text-white transition hover:bg-black/50 disabled:opacity-60"
      >
        <RefreshCw className={clsx("size-5", pending && "animate-spin")} />
      </button>
      {msg && (
        <div
          role="status"
          className="absolute right-0 top-full z-10 mt-2 w-56 rounded-xl border border-line bg-panel-2 p-3 text-xs text-white shadow-xl"
        >
          {msg}
        </div>
      )}
    </div>
  );
}
