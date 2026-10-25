import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";
import { AgentBubble, PlanCard, ShiftChip } from "@/components/landing/product";

// Split layout for sign-in, reset and email-confirmation pages: pieces of the app on the left
// (decorative, hidden on small screens), the form in a graphite workspace on the right.
export function AuthShell({ children, title, lede }: { children: ReactNode; title: string; lede?: string }) {
  return (
    <div className="grid min-h-[100svh] bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(oklch(1 0 0 / .14) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="anim-aurora absolute -left-20 top-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="anim-aurora absolute -right-10 bottom-10 h-80 w-80 rounded-full bg-club-business/20 blur-3xl" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-[8%] left-10 right-10 xl:left-14">
          <AgentBubble club="design" text="Can the workshop start at 6:30? Our members are in class until 6." className="anim-float relative z-10 mb-[-1rem] ml-auto" />
          <PlanCard className="anim-float relative" />
          <ShiftChip name="Ava" role="Check-in desk · 6:00 PM" className="anim-float relative -mt-4 ml-auto w-fit" />
        </div>
        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <Link to="/" className="w-fit rounded-full" tabIndex={-1}><Brand tone="light" /></Link>
          <p className="anim-rise mt-[12svh] max-w-md font-display text-4xl font-extrabold leading-[1.02] xl:text-5xl" style={{ animationDuration: ".8s" }}>
            Every club brings something. <span className="text-flare">You bring the yes.</span>
          </p>
          <p className="anim-rise mt-5 max-w-sm text-white/70" style={{ animationDelay: ".12s", animationDuration: ".8s" }}>
            Your club’s agent helps plan events with other clubs. You approve what your club commits to.
          </p>
        </div>
      </aside>
      <main className="flex min-h-[100svh] flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Link to="/" className="w-fit rounded-full lg:hidden"><Brand /></Link>
        <div className="anim-rise mx-auto my-auto w-full max-w-md py-10" style={{ animationDuration: ".6s" }}>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{title}</h1>
          {lede && <p className="mt-3 text-muted-foreground">{lede}</p>}
          <div className="mt-8">{children}</div>
        </div>
        <p className="mx-auto w-full max-w-md text-xs text-muted-foreground">Your club. Your decisions. Every commitment stays in your control.</p>
      </main>
    </div>
  );
}
