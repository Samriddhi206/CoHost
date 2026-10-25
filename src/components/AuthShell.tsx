import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Brand } from "@/components/Brand";
import { Booths, FarSkyline, NearBuildings, Sky, Stars, StringLights } from "@/components/landing/scenery";

// Split layout for sign-in, reset and email-confirmation pages: the night-campus scene on the left
// (decorative, hidden on small screens), the form on warm paper on the right.
export function AuthShell({ children, title, lede }: { children: ReactNode; title: string; lede?: string }) {
  return (
    <div className="grid min-h-[100svh] bg-background lg:grid-cols-[1.05fr_1fr]">
      <aside aria-hidden="true" className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <div className="absolute inset-0"><Sky /><Stars count={70} /></div>
        <div className="absolute inset-0 translate-y-[6%]"><FarSkyline /></div>
        <div className="absolute inset-0 translate-y-[3%]"><NearBuildings /></div>
        <div className="absolute inset-0"><StringLights /><Booths /></div>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/40 to-transparent" />
        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <Link to="/" className="w-fit rounded-full" tabIndex={-1}><Brand tone="light" /></Link>
          <p className="anim-rise mt-[12svh] max-w-md font-display text-4xl font-extrabold leading-[1.02] xl:text-5xl" style={{ animationDuration: ".8s" }}>
            Every club brings something. <span className="text-flare">You bring the yes.</span>
          </p>
          <p className="anim-rise mt-5 max-w-sm text-white/70" style={{ animationDelay: ".12s", animationDuration: ".8s" }}>
            Agents negotiate the plan. Leaders approve their own club’s part. Nobody commits for you.
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
        <p className="mx-auto w-full max-w-md text-xs text-muted-foreground">Your identity comes from Supabase Auth. Permissions are checked in the database, not the browser.</p>
      </main>
    </div>
  );
}
