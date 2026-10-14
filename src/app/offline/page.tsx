import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="bg-grid flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <WifiOff className="size-14 text-violet-300" />
      <h1 className="font-display text-stroke text-4xl text-white">You&apos;re offline</h1>
      <p className="max-w-sm text-muted">The storm got your connection. Reconnect and we&apos;ll load your latest stats.</p>
    </div>
  );
}
