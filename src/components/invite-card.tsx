"use client";

import { Check, Link2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

export function InviteCard({ code }: { code: string }) {
  const [url, setUrl] = useState(`/invite/${code}`);
  const [copied, setCopied] = useState(false);
  useEffect(() => setUrl(`${location.origin}/invite/${code}`), [code]);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on DropStats", text: "Let's compare our Fortnite stats on DropStats!", url });
        return;
      } catch {
        // Share sheet dismissed or unavailable: copy instead.
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-dashed border-yellow-300/50 bg-yellow-300/5 p-4">
      <div className="flex items-start gap-3">
        <Link2 className="mt-0.5 size-5 shrink-0 text-yellow-300" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Friend not on DropStats yet?</p>
          <p className="mt-0.5 text-sm text-muted">
            Send them your invite link. When they sign up with it, you&apos;re friends automatically.
          </p>
          <p className="mt-2 truncate font-mono text-xs text-yellow-300/90">{url}</p>
        </div>
        <button
          onClick={share}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-yellow-300 text-zinc-950 transition hover:brightness-110"
          aria-label="Share invite link"
        >
          {copied ? <Check className="size-5" /> : <Share2 className="size-5" />}
        </button>
      </div>
    </div>
  );
}
