import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { Check, Lock, RotateCcw } from "lucide-react";
import { Brand } from "@/components/Brand";
import { DemoProvider, useDemo } from "@/lib/demo-store";
import { EVENT, ROLE_LABEL, USERS, userById } from "@/lib/domain";
import { Avatar, stage, STEPS } from "@/components/demo-ui";

export const Route = createFileRoute("/demo")({ component: DemoLayout });

function DemoLayout() {
  return <DemoProvider><Shell /></DemoProvider>;
}

function Shell() {
  const { s, setUser, error, clear, reset } = useDemo();
  const { pathname } = useLocation();
  const me = userById(s.currentUserId)!;
  const done = stage(s);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-8">
          <Link to="/" className="rounded-full"><Brand small /></Link>
          <span className="badge badge-pending">Demo</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">Nothing here is saved. Try anything.</span>
          <button className="btn btn-ghost ml-auto px-3 text-sm" onClick={reset}><RotateCcw size={14} aria-hidden="true" />Start over</button>
        </div>
        <nav aria-label="Demo steps" className="mx-auto grid max-w-6xl grid-cols-3 gap-2 px-4 pb-3 md:px-8">
          {STEPS.map((st) => {
            const active = pathname === st.to || (st.to === "/demo" && pathname === "/demo/");
            const complete = done > st.n || (st.n === 3 && s.published && s.signups.some((x) => x.status === "confirmed"));
            return (
              <Link key={st.to} to={st.to} aria-current={active ? "step" : undefined}
                className={`group flex min-h-12 min-w-0 items-center gap-2 rounded-2xl border px-2 py-2 sm:gap-3 sm:px-3 transition-all duration-200 ${active ? "border-primary/60 bg-primary/10" : "border-border hover:border-input hover:bg-muted"}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm transition-colors ${complete ? "bg-accent text-accent-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {complete ? <Check size={16} aria-label="Done" /> : st.n}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold sm:text-sm">{st.label}</span>
                  <span className="hidden truncate text-xs text-muted-foreground md:block">{st.hint}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6 md:px-8">
        <div className="panel flex flex-col gap-4 p-4 md:flex-row md:items-center">
          <div className="shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">You are</p>
            <p className="font-display text-lg font-bold">{me.name} <span className="text-sm font-medium text-muted-foreground">· {ROLE_LABEL(me)}</span></p>
          </div>
          <div role="group" aria-label="Switch person" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:ml-auto md:flex-wrap md:justify-end md:overflow-visible md:pb-0">
            {USERS.map((u) => (
              <button key={u.id} onClick={() => setUser(u.id)} aria-pressed={u.id === me.id}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-sm transition-all duration-200 ${u.id === me.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-input hover:bg-muted"}`}>
                <Avatar id={u.id} />{u.name}
                {u.leader && <span className={`text-[10px] font-bold uppercase tracking-wider ${u.id === me.id ? "opacity-80" : "text-muted-foreground"}`}>Lead</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <p className="flex-1 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          <button onClick={clear} className="btn btn-ghost px-3 text-sm">Dismiss</button>
        </div>
      )}

      <main key={pathname} className="anim-rise mx-auto max-w-6xl px-4 py-8 md:px-8" style={{ animationDuration: ".32s" }}>
        <p className="mb-1 text-sm text-muted-foreground">{EVENT.when} · {EVENT.where}</p>
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 md:px-8">
        <Link to="/demo/brief" className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <Lock size={14} aria-hidden="true" />See what each club told its agent privately
        </Link>
      </footer>
    </div>
  );
}

