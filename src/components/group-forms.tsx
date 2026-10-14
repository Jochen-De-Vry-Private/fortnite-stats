"use client";

import clsx from "clsx";
import { Check, Share2 } from "lucide-react";
import { useActionState, useState } from "react";
import { createGroup, joinGroup } from "@/app/actions/social";
import { SubmitButton } from "./submit-button";
import { Alert, Input, Label } from "./ui";

const EMOJIS = ["🎮", "🔥", "👑", "⚡", "💀", "🦙", "🎯", "🚀", "🐐", "🍕"];

export function CreateGroupForm() {
  const [state, action] = useActionState(createGroup, undefined);
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="emoji" value={emoji} />
      <div>
        <Label htmlFor="name">Group name</Label>
        <Input id="name" name="name" required maxLength={40} placeholder="e.g. Tilted Towers Crew" />
      </div>
      <div>
        <Label>Icon</Label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              aria-pressed={e === emoji}
              className={clsx(
                "grid size-11 place-items-center rounded-xl border text-2xl transition",
                e === emoji ? "border-yellow-300 bg-yellow-300/15 scale-110" : "border-line bg-panel hover:border-violet-400",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <SubmitButton className="w-full" pendingText="Creating…">
        Create group
      </SubmitButton>
    </form>
  );
}

export function JoinGroupForm() {
  const [state, action] = useActionState(joinGroup, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="code">Invite code</Label>
        <Input
          id="code"
          name="code"
          required
          maxLength={8}
          placeholder="ABCD1234"
          autoCapitalize="characters"
          autoComplete="off"
          className="font-mono uppercase tracking-[0.3em]"
        />
      </div>
      {state?.error && <Alert>{state.error}</Alert>}
      <SubmitButton variant="secondary" className="w-full" pendingText="Joining…">
        Join group
      </SubmitButton>
    </form>
  );
}

export function InviteCode({ code, groupName }: { code: string; groupName: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Join my Fortnite group "${groupName}" on DropStats! Invite code: ${code}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: groupName, text, url: `${location.origin}/groups` });
        return;
      } catch {
        // Fall back to copying if the share sheet was dismissed or failed.
      }
    }
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-yellow-300/50 bg-yellow-300/5 p-3">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Invite code</div>
        <div className="font-mono text-2xl font-bold tracking-[0.25em] text-yellow-300">{code}</div>
      </div>
      <button
        onClick={share}
        className="grid size-11 place-items-center rounded-xl bg-yellow-300 text-zinc-950 transition hover:brightness-110"
        aria-label="Share invite code"
      >
        {copied ? <Check className="size-5" /> : <Share2 className="size-5" />}
      </button>
    </div>
  );
}
