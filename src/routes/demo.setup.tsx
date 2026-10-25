import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { meta } from "@/components/Brand";
import { CLUBS, type ClubId } from "@/lib/domain";

export const Route = createFileRoute("/demo/setup")({
  head: () => ({ meta: meta("Club setup — CoHost demo", "Set up a club and draft a new co-hosted event.") }),
  component: Setup,
});

const schema = z.object({ club: z.string().trim().min(2).max(80), title: z.string().trim().min(3).max(120), budget: z.coerce.number().int().min(0).max(100000) });

function Setup() {
  const [msg, setMsg] = useState<string | null>(null);
  const [partners, setPartners] = useState<ClubId[]>(["business", "art"]);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form className="panel space-y-4" onSubmit={(e) => {
        e.preventDefault();
        const r = schema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
        setMsg(r.success ? `Draft “${r.data.title}” prepared locally for ${r.data.club} with ${partners.length} partner clubs. (Demo: not saved.)` : r.error.issues[0]?.message ?? "Invalid form");
      }}>
        <h1 className="text-2xl font-extrabold">Club & event setup</h1>
        <label className="block text-sm font-medium">Your club<input name="club" className="field mt-1" defaultValue="Photography Club" maxLength={80} /></label>
        <label className="block text-sm font-medium">Event title<input name="title" className="field mt-1" defaultValue="Campus Through Our Eyes" maxLength={120} /></label>
        <label className="block text-sm font-medium">Total budget ($)<input name="budget" type="number" className="field mt-1" defaultValue={180} /></label>
        <fieldset><legend className="text-sm font-medium">Invite partner clubs</legend>
          {(["business", "art"] as ClubId[]).map((c) => (
            <label key={c} className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={partners.includes(c)} onChange={(e) => setPartners(e.target.checked ? [...partners, c] : partners.filter((x) => x !== c))} />{CLUBS[c].name}</label>
          ))}
        </fieldset>
        <button className="btn btn-primary">Create draft</button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
      </form>
      <div className="panel h-fit text-sm text-muted-foreground">In real mode, club creation and event creation call database functions that make the signed-in user a leader and record the organizer from their verified session — not from this form.</div>
    </div>
  );
}
