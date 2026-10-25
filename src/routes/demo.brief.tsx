import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, EyeOff, Lock } from "lucide-react";
import { meta } from "@/components/Brand";
import { ClubDot } from "@/components/demo-ui";
import { useDemo } from "@/lib/demo-store";
import { BRIEFS, CLUBS, def, isOfficer, label, topOfficer, userById } from "@/lib/domain";

export const Route = createFileRoute("/demo/brief")({
  head: () => ({ meta: meta("Private briefs — CoHost demo", "Each club tells its own agent its real limits. Other clubs never see them.") }),
  component: Brief,
});

function Brief() {
  const { s, setUser } = useDemo();
  const me = userById(s.currentUserId)!;
  const d = def(s);
  return (
    <div className="space-y-8">
      <Link to="/demo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={14} aria-hidden="true" />Back to the plan</Link>
      <div className="max-w-3xl">
        <p className="eyebrow text-primary">Behind the scenes</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold">What each club told its agent</h2>
        <p className="mt-3 text-muted-foreground">Before negotiating, a club’s officers give their agent a private brief: the real budget, limits and must-haves. The agent uses it to make offers, but other clubs never see it. Members can’t see it either.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {d.clubs.map((c) => {
          const visible = isOfficer(me, c);
          const top = topOfficer(c);
          return (
            <article key={c} className="panel flex flex-col">
              <p className="flex items-center gap-2 font-display text-lg font-bold"><ClubDot club={c} />{CLUBS[c].name}</p>
              {visible ? (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary"><Lock size={12} aria-hidden="true" />Your club’s brief</p>
                  <p className="mt-3 text-sm leading-6">{BRIEFS[d.id][c]}</p>
                </>
              ) : (
                <>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><EyeOff size={12} aria-hidden="true" />Hidden from you</p>
                  <p aria-hidden="true" className="mt-3 select-none text-sm leading-6 text-muted-foreground blur-[5px]">This brief belongs to another club and stays between its officers and their agent.</p>
                  <button className="btn btn-ghost mt-auto w-full text-sm" onClick={() => setUser(top.id)}>Switch to {label(top, c)}</button>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
