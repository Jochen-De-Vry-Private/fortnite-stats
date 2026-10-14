import type { ReactNode } from "react";
import { Logo } from "./app-nav";
import { Card } from "./ui";

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="bg-grid flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="font-display text-stroke text-4xl text-white">{title}</h1>
        <p className="mb-6 mt-2 text-sm text-muted">{sub}</p>
        {children}
      </Card>
    </div>
  );
}
