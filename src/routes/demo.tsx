import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, MessagesSquare, CheckCircle2, Users, Lock, Settings2 } from "lucide-react";
import { Brand } from "@/components/Brand";
import { DemoProvider, useDemo } from "@/lib/demo-store";
import { CLUBS, USERS } from "@/lib/domain";

export const Route = createFileRoute("/demo")({ component: DemoLayout });

const NAV = [
  { to: "/demo", label: "Overview", icon: LayoutDashboard },
  { to: "/demo/event", label: "Workspace", icon: MessagesSquare },
  { to: "/demo/approvals", label: "Approvals", icon: CheckCircle2 },
  { to: "/demo/crew", label: "Crew", icon: Users },
  { to: "/demo/brief", label: "Brief", icon: Lock },
  { to: "/demo/setup", label: "Setup", icon: Settings2 },
] as const;

function DemoLayout() {
  return <DemoProvider><Shell /></DemoProvider>;
}

function Shell() {
  const { s, setUser, error, clear, reset } = useDemo();
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col gap-1 border-r border-sidebar-border bg-sidebar p-5 md:flex">
        <Link to="/" className="mb-8 rounded-full"><Brand small tone="light" /></Link>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/65 transition-colors duration-200 hover:bg-white/10 hover:text-white" activeProps={{ className: "!bg-primary !text-primary-foreground shadow-[0_8px_20px_-10px_var(--color-primary)]" }}>
            <n.icon className="h-4 w-4" />{n.label}
          </Link>
        ))}
      </aside>
      <div className="flex-1 pb-24 md:pb-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-pending/60 px-5 py-3 text-sm">
          <span className="badge badge-pending">DEMO MODE</span>
          <span className="text-pending-foreground">Isolated local state. Not signed in. No data is saved or sent anywhere.</span>
          <label className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground">Demo account</span>
            <select className="field w-auto py-1" value={s.currentUserId} onChange={(e) => setUser(e.target.value)}>
              {USERS.map((u) => <option key={u.id} value={u.id}>{u.name} · {CLUBS[u.club].short}</option>)}
            </select>
          </label>
          <button className="btn btn-ghost py-1" onClick={reset}>Reset</button>
        </div>
        {error && (
          <div role="alert" className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}<button onClick={clear} className="font-semibold">Dismiss</button>
          </div>
        )}
        <main key={pathname} className="anim-rise mx-auto max-w-5xl p-5 md:p-10" style={{ animationDuration: ".32s" }}><Outlet /></main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-6 border-t border-border bg-card md:hidden">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors" activeProps={{ className: "!text-primary font-semibold" }}>
            <n.icon className="h-5 w-5" />{n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
