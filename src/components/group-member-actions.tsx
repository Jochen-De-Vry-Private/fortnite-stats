"use client";

import { LogOut, Plus, Trash2, X } from "lucide-react";
import { useTransition } from "react";
import { addToGroup, deleteGroup, removeFromGroup } from "@/app/actions/social";
import { Button } from "./ui";

export function AddToGroupButton({ groupId, profileId }: { groupId: string; profileId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button className="px-3 py-2 text-xs" disabled={pending} onClick={() => start(() => addToGroup(groupId, profileId))}>
      <Plus className="size-4" /> Add
    </Button>
  );
}

export function RemoveMemberButton({ groupId, profileId }: { groupId: string; profileId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      className="px-2 py-2"
      disabled={pending}
      aria-label="Remove from group"
      onClick={() => {
        if (confirm("Remove this player from the group?")) start(() => removeFromGroup(groupId, profileId));
      }}
    >
      <X className="size-4" />
    </Button>
  );
}

export function LeaveGroupButton({ groupId, meId, isOwner }: { groupId: string; meId: string; isOwner: boolean }) {
  const [pending, start] = useTransition();
  return isOwner ? (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this group for everyone?")) start(() => deleteGroup(groupId));
      }}
    >
      <Trash2 className="size-4" /> Delete group
    </Button>
  ) : (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (confirm("Leave this group?")) start(() => removeFromGroup(groupId, meId));
      }}
    >
      <LogOut className="size-4" /> Leave group
    </Button>
  );
}
