import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, EyeOff, Lock } from "lucide-react";
import { meta } from "@/components/Brand";
import { ClubDot } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { BRIEFS, CLUBS, REQUIRED, USERS, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/brief")({
  head: () => ({ meta: meta("Private briefs — CoHost demo", "Each club tells its own agent its real limits. Other clubs never see them.") }),
  component: Brief,
});

function Brief() {
  const { s, setUser } = useDemo();
  const me = userById(s.currentUserId)!;
  return (
    <div className="space-y-8">
      <Link to="/demo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} aria-hidden="true" />Back to the plan</Link>
      <div className="max-w-3xl">
        <p className="eyebrow text-primary">Behind the scenes</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold md:text-4xl">What each club told its agent</h1>
        <p className="mt-3 text-muted-foreground">Before negotiating, each club leader gives their agent a private brief: their real budget, limits and must-haves. The agent uses it to make offers, but the brief itself is never shown to other clubs. You can only read your own club’s brief.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {REQUIRED.map((c) => {
          const visible = me.leader && me.club === c;
          const lead = USERS.find((u) => u.leader && u.club === c)!;
          return (
            <article key={c} className="panel flex flex-col">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><ClubDot club={c} />{CLUBS[c].name}</p>
              {visible ? (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><Lock size={12} aria-hidden="true" />Your club’s brief</p>
                  <p className="mt-3 text-sm leading-6">{BRIEFS[c]}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><EyeOff size={12} aria-hidden="true" />Hidden from you</p>
                  <p aria-hidden="true" className="mt-3 select-none text-sm leading-6 text-muted-foreground blur-[5px]">This brief belongs to another club and stays between its leaders and their agent only.</p>
                  <button className="btn btn-ghost mt-auto w-full text-sm" onClick={() => setUser(lead.id)}>Switch to {lead.name} to read it</button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
