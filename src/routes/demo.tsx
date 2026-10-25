import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Check, ChevronDown, Lock, RotateCcw } from "lucide-react";
import { Brand } from "@/components/Brand";
import { EventBanner, PersonPicker, stage, STEPS } from "@/components/demo-ui";
import { DemoProvider, useDemo } from "@/lib/demo-store";
import { CLUBS, canSeePlan, eventsFor, ev, PERMISSIONS, userById, type EventId } from "@/lib/domain";

export const Route = createFileRoute("/demo")({ component: DemoLayout });

function DemoLayout() {
  return <DemoProvider><Shell /></DemoProvider>;
}

function Shell() {
  const { s, setUser, setEvent, error, clear, reset } = useDemo();
  const { pathname } = useLocation();
  const me = userById(s.currentUserId)!;
  const officer = canSeePlan(s, me);
  const done = stage(s);
  const mine = eventsFor(me);
  const nav = (
    <nav aria-label="Demo steps" className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-1">
      {STEPS.map((st) => {
        const active = pathname === st.to || (st.to === "/demo" && pathname === "/demo/");
        const complete = done > st.n || (st.n === 3 && ev(s).signups.some((x) => x.status === "confirmed"));
        return (
          <Link key={st.to} to={st.to} aria-current={active ? "step" : undefined}
            className={`flex min-h-11 min-w-0 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors duration-200 ${active ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_var(--color-primary)]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? "bg-primary-foreground/20" : complete ? "bg-accent text-accent-foreground" : "bg-white/10"}`}>
              {complete && !active ? <Check size={13} aria-label="Done" /> : st.n}
            </span>
            <span className="truncate">{st.label}</span>
          </Link>
        );
      })}
      {officer && (
        <Link to="/demo/brief" className={`hidden min-h-11 items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors lg:flex ${pathname.startsWith("/demo/brief") ? "bg-primary text-primary-foreground" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
          <Lock size={15} aria-hidden="true" className="ml-1 mr-0.5" />Private briefs
        </Link>
      )}
    </nav>
  );
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[290px_1fr]">
      <aside className="border-b border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-full"><Brand small tone="light" /></Link>
          <span className="badge badge-pending">Demo</span>
          <button className="btn btn-glass ml-auto px-3" onClick={reset} aria-label="Start the demo over" title="Start over"><RotateCcw size={15} aria-hidden="true" /></button>
        </div>
        <label className="mt-5 block text-xs font-semibold uppercase tracking-[.14em] text-white/50 lg:mt-7">
          Event you’re working on
          <select className="field mt-2 border-white/15 bg-white/5 text-sm normal-case tracking-normal text-white" value={s.currentEventId} onChange={(e) => setEvent(e.target.value as EventId)}>
            {mine.map((e) => <option key={e.id} value={e.id}>{e.title} · organized by {CLUBS[e.organizer].short}</option>)}
          </select>
        </label>
        <div className="mt-4 lg:mt-6">{nav}</div>
        <div className="mt-6 hidden lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[.14em] text-white/50">View the demo as</p>
          <PersonPicker s={s} onPick={setUser} />
        </div>
        <details className="group mt-4 rounded-xl border border-white/10 lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm">
            <span>Viewing as <strong>{me.name}</strong></span><ChevronDown size={16} className="transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="px-2 pb-3"><PersonPicker s={s} onPick={setUser} /></div>
        </details>
      </aside>

      <div className="min-w-0">
        <div className="mx-auto max-w-5xl px-4 pt-6 md:px-8 md:pt-8">
          <EventBanner s={s} />
          <div className="mt-4 flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm md:flex-row md:items-center md:gap-4">
            <p><span className="text-muted-foreground">You are </span><strong>{me.name}</strong>
              <span className="text-muted-foreground"> · {me.clubs.map((m) => `${m.title}, ${CLUBS[m.club].name}`).join(" · ")}</span></p>
            <p className="text-muted-foreground md:ml-auto">{officer ? "As an officer you can: " : "As a member you can: "}{PERMISSIONS[officer ? "officer" : "member"].join(", ").toLowerCase()}.</p>
          </div>
        </div>
        {error && (
          <div role="alert" className="mx-auto mt-4 flex max-w-5xl items-center gap-4 px-4 md:px-8">
            <p className="flex-1 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
            <button onClick={clear} className="btn btn-ghost px-3 text-sm">Dismiss</button>
          </div>
        )}
        <main key={pathname + s.currentEventId} className="anim-rise mx-auto max-w-5xl px-4 py-8 md:px-8" style={{ animationDuration: ".32s" }}><Outlet /></main>
      </div>
    </div>
  );
}
