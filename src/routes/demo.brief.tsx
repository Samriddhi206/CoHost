import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { meta } from "@/components/Brand";
import { useDemo } from "@/lib/demo-store";
import { BRIEFS, CLUBS, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/brief")({
  head: () => ({ meta: meta("Private agent brief — CoHost demo", "Each club's private brief to its own agent, never shared with partners.") }),
  component: Brief,
});

function Brief() {
  const { s } = useDemo();
  const me = userById(s.currentUserId)!;
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold">Private agent brief</h1><p className="mt-1 text-muted-foreground">Visible only to leaders of the owning club. Kept separate from shared negotiation messages.</p></div>
      {me.leader ? (
        <div className="panel">
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /><h2 className="font-bold">{CLUBS[me.club].name} brief</h2></div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{BRIEFS[me.club]}</p>
          <p className="mt-4 text-xs text-muted-foreground">The agent treats this as private context and can only output proposals, never take privileged actions.</p>
        </div>
      ) : (
        <div className="panel"><p className="text-sm text-muted-foreground">Your demo account ({me.name}) is not a club leader, so no brief is visible.</p></div>
      )}
      <p className="text-xs text-muted-foreground">Other clubs' briefs are not shown to this account.</p>
    </div>
  );
}
