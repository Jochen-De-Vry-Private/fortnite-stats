"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FollowToggle } from "./follow-button";
import { buttonClass } from "./ui";

/** A button that only explains it needs an account. */
export function DemoButton({
  children,
  variant = "primary",
  className,
  label,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          setOpen(true);
          setTimeout(() => setOpen(false), 3500);
        }}
        className={buttonClass(variant, className)}
      >
        {children}
      </button>
      {open && <DemoHint />}
    </div>
  );
}

/** Follow/unfollow that toggles locally, so visitors can try it. */
export function DemoFollow({ initial, compact }: { initial: boolean; compact?: boolean }) {
  const [following, setFollowing] = useState(initial);
  return <FollowToggle following={following} compact={compact} onClick={() => setFollowing((f) => !f)} />;
}

function DemoHint() {
  return (
    <div
      role="status"
      className="absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-line bg-panel-2 p-3 text-left text-xs normal-case tracking-normal text-white shadow-xl"
    >
      This is a demo.{" "}
      <Link href="/signup" className="font-bold text-yellow-300 underline">
        Create a free account
      </Link>{" "}
      to do this for real.
    </div>
  );
}
