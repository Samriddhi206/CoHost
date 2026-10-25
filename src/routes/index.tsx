import { createFileRoute, Link } from "@tanstack/react-router";
import { Brand, meta } from "@/components/Brand";
import { supabaseConfigured } from "@/lib/supabase";

export const Route = createFileRoute("/")({
  head: () => ({ meta: meta("CoHost — campus club collaboration", "One club's idea. A whole campus behind it. Co-host events across clubs with versioned agreements and volunteer crews.") }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen px-6 py-8 md:px-12">
      <header className="flex items-center justify-between"><Brand /><Link to="/auth" className="btn btn-ghost">Sign in</Link></header>
      <main className="mx-auto mt-20 max-w-4xl">
        <p className="badge badge-ok">Campus club collaboration</p>
        <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] md:text-7xl">One club's idea.<br /><span className="text-primary">A whole campus behind it.</span></h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">Clubs' agents negotiate budgets, resources and timing as explicit proposals. Leaders approve their own contribution. Students confirm the shifts that fit them.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/demo" className="btn btn-primary">Open interactive demo</Link>
          <Link to="/app" className="btn btn-ghost">Real workspace</Link>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[["Versioned agreements", "Any change creates a new version and voids earlier approvals."], ["Leader-owned approvals", "Each club approves only its own contribution."], ["Fair crews", "Capacity, skills and overlapping shifts are checked before anyone is committed."]].map(([h, p]) => (
            <div key={h} className="panel"><h3 className="font-bold">{h}</h3><p className="mt-2 text-sm text-muted-foreground">{p}</p></div>
          ))}
        </div>
        <p className="mt-10 text-xs text-muted-foreground">Backend status: {supabaseConfigured ? "Supabase public config present (not verified from here)." : "No backend configured — sign-in is disabled; the demo runs in isolated local state."}</p>
      </main>
    </div>
  );
}
