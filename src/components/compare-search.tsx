"use client";

import { Search } from "lucide-react";
import { useActionState } from "react";
import { lookupAndCompare } from "@/app/actions/stats";
import { SubmitButton } from "./submit-button";
import { Alert, Input } from "./ui";

export function CompareSearch() {
  const [state, action] = useActionState(lookupAndCompare, undefined);
  return (
    <form action={action} className="space-y-3" role="search">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <Input
            name="name"
            required
            minLength={2}
            maxLength={40}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Any Fortnite username, e.g. a pro"
            className="pl-11"
            aria-label="Fortnite username"
          />
        </div>
        <SubmitButton pendingText="…">Compare</SubmitButton>
      </div>
      <select
        name="accountType"
        defaultValue="epic"
        aria-label="Platform account"
        className="rounded-xl border border-line bg-panel px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
      >
        <option value="epic">Epic name</option>
        <option value="psn">PlayStation name</option>
        <option value="xbl">Xbox name</option>
      </select>
      {state?.error && <Alert>{state.error}</Alert>}
    </form>
  );
}
