import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ArrowUpRight, Check, CheckCheck, GitBranch, Handshake, LockKeyhole, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Brand } from "@/components/Brand";
import { supabaseConfigured } from "@/lib/supabase";
import { Booths, FarSkyline, HackNightArt, NearBuildings, Sky, Stars, StringLights } from "./scenery";
import { useSmoothScroll } from "./SmoothScroll";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Landing() {
  useSmoothScroll();
  return (
    <div className="bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Expansion />
        <Negotiation />
        <PrivateVsShared />
        <Guarantees />
        <Finale />
      </main>
      <Footer />
    </div>
  );
}

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-6 md:pt-4">
      <nav aria-label="Main" className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-3 py-2 transition-all duration-300 md:px-4 ${scrolled ? "border border-border bg-background/80 text-foreground shadow-[var(--shadow-soft)] backdrop-blur-xl" : "border border-transparent text-white"}`}>
        <Link to="/" aria-label="CoHost home" className="rounded-full"><Brand small tone={scrolled ? "default" : "light"} /></Link>
        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          {[["#how", "How it works"], ["#private", "Privacy"], ["#guarantees", "Guarantees"]].map(([h, l]) => (
            <a key={h} href={h} className={`rounded-full px-3 py-2 transition-colors ${scrolled ? "text-muted-foreground hover:text-foreground" : "text-white/75 hover:text-white"}`}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className={`btn ${scrolled ? "btn-ghost" : "btn-glass"} hidden px-4 sm:inline-flex`}>Sign in</Link>
          <Link to="/demo" className="btn btn-flare px-4">Try the demo <ArrowRight size={16} /></Link>
        </div>
      </nav>
    </header>
  );
}

function Layer({ y, x, children, className = "" }: { y: MotionValue<string>; x?: MotionValue<number>; children: ReactNode; className?: string }) {
  return <motion.div aria-hidden="true" style={x ? { y, x } : { y }} className={`pointer-events-none absolute -inset-x-[3%] inset-y-0 will-change-transform ${className}`}>{children}</motion.div>;
}

// Pointer-driven depth: each layer drifts sideways in proportion to its distance from the viewer.
function usePointerDepth(reduce: boolean | null) {
  const px = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.6 });
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => px.set(e.clientX / window.innerWidth - 0.5);
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [px, reduce]);
  return sx;
}

const HEADLINE = ["One", "club’s", "idea."];
const HEADLINE_2 = ["A", "whole", "campus", "behind", "it."];

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const k = reduce ? 0 : 1;
  const sky = useTransform(scrollYProgress, [0, 1], ["0%", `${42 * k}%`]);
  const far = useTransform(scrollYProgress, [0, 1], ["0%", `${32 * k}%`]);
  const near = useTransform(scrollYProgress, [0, 1], ["0%", `${20 * k}%`]);
  const lights = useTransform(scrollYProgress, [0, 1], ["0%", `${10 * k}%`]);
  const booths = useTransform(scrollYProgress, [0, 1], ["0%", "0%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", `${-30 * k}%`]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, reduce ? 1 : 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.12]);
  const depth = usePointerDepth(reduce);
  const dx = (n: number) => useTransform(depth, (v) => v * n); // eslint-disable-line react-hooks/rules-of-hooks
  const xSky = dx(-6), xFar = dx(-14), xNear = dx(-26), xLights = dx(-38), xBooths = dx(-56);
  let i = 0;
  return (
    <section ref={ref} className="relative h-[100svh] min-h-[640px] overflow-hidden bg-ink text-white" aria-labelledby="hero-title">
      <motion.div aria-hidden="true" style={{ scale: sceneScale }} className="absolute inset-0 origin-bottom">
        <Layer y={sky} x={xSky}><Sky /><Stars /></Layer>
        <Layer y={far} x={xFar}><FarSkyline /></Layer>
        <Layer y={near} x={xNear}><NearBuildings /></Layer>
        <Layer y={lights} x={xLights}><StringLights /></Layer>
        <Layer y={booths} x={xBooths}><Booths /></Layer>
      </motion.div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 52% 46% at 50% 40%, oklch(0.14 0.03 284 / .82), oklch(0.14 0.03 284 / .45) 55%, transparent 80%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-start px-4 pt-[15svh] text-center md:pt-[14svh]">
        <p className="eyebrow anim-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white/80 backdrop-blur" style={{ animationDuration: ".8s" }}>
          <Sparkles size={14} aria-hidden="true" /> Clubs, agents and people, in agreement
        </p>
        <h1 id="hero-title" className="mt-7 font-display text-[clamp(2.75rem,min(7.6vw,10.5svh),6.75rem)] font-extrabold leading-[0.95] tracking-[-0.045em] [text-shadow:0_4px_40px_oklch(0.14_0.03_284/.6)]">
          <span className="block">{HEADLINE.map((w) => <Word key={w} i={i++}>{w}</Word>)}</span>
          <span className="block">{HEADLINE_2.map((w) => <Word key={w} i={i++} glow>{w}</Word>)}</span>
        </h1>
        <p className="anim-rise mt-7 max-w-xl text-base leading-7 text-white/75 md:text-lg" style={{ animationDelay: ".55s", animationDuration: ".9s" }}>
          Each club gives its agent a private brief. The agents negotiate budget, resources and timing in the open. Leaders approve their own commitments, and students confirm the shifts that fit them.
        </p>
        <div className="anim-rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: ".7s", animationDuration: ".9s" }}>
          <Link to="/demo" className="btn btn-flare px-6 py-3 text-base">Watch the agents negotiate <ArrowRight size={18} /></Link>
          <Link to="/app" className="btn btn-glass px-6 py-3 text-base">Open your workspace</Link>
        </div>
      </motion.div>
      <a href="#story" className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full p-2 text-xs font-semibold uppercase tracking-[.2em] text-white/60 transition-colors hover:text-white">
        <span className="anim-float inline-block">Scroll</span>
      </a>
    </section>
  );
}

function Word({ children, i, glow }: { children: string; i: number; glow?: boolean }) {
  // The gradient sits on each word: background-clip text breaks when a parent's children are transformed.
  const tone = glow ? "bg-gradient-to-r from-flare via-[oklch(0.82_0.12_245)] to-[oklch(0.74_0.18_290)] bg-clip-text text-transparent [text-shadow:none]" : "";
  return <span className={`anim-rise mr-[0.22em] inline-block pb-[0.06em] last:mr-0 ${tone}`} style={{ animationDelay: `${0.12 + i * 0.06}s`, animationDuration: ".9s" }}>{children}</span>;
}

function Expansion() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const side = useTransform(p, [0, 0.5], reduce ? [0, 0] : [21, 0]);
  const vert = useTransform(p, [0, 0.5], reduce ? [0, 0] : [24, 0]);
  const round = useTransform(p, [0, 0.5], reduce ? [0, 0] : [32, 0]);
  const clip = useMotionTemplate`inset(${vert}% ${side}% ${vert}% ${side}% round ${round}px)`;
  const zoom = useTransform(p, [0, 1], reduce ? [1, 1] : [1, 1.18]);
  const titleOpacity = useTransform(p, [0, 0.25], [1, reduce ? 1 : 0]);
  const titleY = useTransform(p, [0, 0.25], ["0%", reduce ? "0%" : "-40%"]);
  const overlay = useTransform(p, [0.42, 0.6], [reduce ? 1 : 0, 1]);
  const captions = [
    { club: "Coding Club (organizer)", what: "4 mentors and $100", c: "bg-club-photo", at: [0.55, 0.65] as const },
    { club: "Entrepreneurship Club", what: "$200 for pizza, gets a 5-minute closing talk", c: "bg-club-business", at: [0.65, 0.75] as const },
    { club: "Design Club", what: "45-minute design workshop at 6:30 PM", c: "bg-club-art", at: [0.75, 0.85] as const },
  ];
  return (
    <section id="story" ref={ref} className="relative h-[260vh] bg-ink" aria-labelledby="story-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ opacity: titleOpacity, y: titleY }} className="absolute inset-x-0 top-[11svh] z-10 px-4 text-center text-white">
          <p className="eyebrow text-flare">One night, three clubs</p>
          <h2 id="story-title" className="mt-2 font-display text-2xl font-extrabold md:text-4xl">Hack Night</h2>
        </motion.div>
        <motion.div style={{ clipPath: clip }} className="absolute inset-0 will-change-[clip-path]">
          <motion.div style={{ scale: zoom }} className="absolute inset-0 origin-center will-change-transform"><HackNightArt /></motion.div>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-ink/30" />
          <motion.div style={{ opacity: overlay }} className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-10 text-white md:px-8 md:pb-16">
            <p className="eyebrow text-white/70">Friday, 6–9 PM · Engineering Hall</p>
            <p className="mt-3 max-w-2xl font-display text-2xl font-bold leading-tight md:text-4xl">Hack Night only works if all three clubs show up with what they promised.</p>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {captions.map((c) => <Caption key={c.club} p={p} at={c.at} reduce={!!reduce}><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.c}`} aria-hidden="true" /><span><strong className="block text-sm">{c.club}</strong><span className="text-sm text-white/70">{c.what}</span></span></Caption>)}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Caption({ p, at, reduce, children }: { p: MotionValue<number>; at: readonly [number, number]; reduce: boolean; children: ReactNode }) {
  const opacity = useTransform(p, [at[0], at[1]], [reduce ? 1 : 0, 1]);
  const y = useTransform(p, [at[0], at[1]], [reduce ? 0 : 16, 0]);
  return <motion.li style={{ opacity, y }} className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">{children}</motion.li>;
}

type Step = { title: string; body: string; who: string };
const STEPS: Step[] = [
  { who: "Each club’s officers", title: "Private briefs stay private", body: "Every club tells its own agent its real limits. Coding Club can only spare $100, Entrepreneurship Club wants a closing talk, and Design Club’s members are in class until 6 PM. None of that leaves the club." },
  { who: "Coding Club agent", title: "A first plan", body: "Hack Night, Friday 6–9 PM. It needs $300 for pizza and prizes. Coding Club organizes, brings 4 mentors and puts in $100. Design workshop at 6:00 PM." },
  { who: "Entrepreneurship agent", title: "An offer with a condition", body: "They’ll cover the missing $200, but only if they get 5 minutes at the end to announce their pitch competition. The condition goes into the plan itself." },
  { who: "Design Club agent", title: "A problem is caught", body: "The workshop is at 6:00 PM, but Design Club’s members are still in class. Version 1 breaks that rule, so it’s flagged and nobody can approve it." },
  { who: "Design Club agent", title: "The fix: version 2", body: "Move the workshop to 6:30–7:15 PM. Everything else stays the same, and $100 + $200 covers the $300. Approvals on version 1 no longer count." },
  { who: "Club presidents", title: "People approve, not agents", body: "Maya, Leo and Jordan each approve only their own club’s part, and only on the latest version. Agents can suggest, but they can’t commit a club." },
  { who: "Club members", title: "Members pick their shifts", body: "Once all three clubs approve, Coding Club opens sign-ups. Members see where and when, and choose the shifts that fit their time and skills." },
];

function Negotiation() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useSpring(scrollYProgress, { stiffness: 160, damping: 30 });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));
  const s = STEPS[step]!;
  return (
    <section id="how" ref={ref} className="relative bg-background" style={{ height: `${STEPS.length * 70 + 60}vh` }} aria-labelledby="how-title">
      <ol className="sr-only">{STEPS.map((x) => <li key={x.title}>{x.title}: {x.body}</li>)}</ol>
      <div className="sticky top-0 flex h-[100svh] items-start overflow-hidden lg:items-center">
        <div aria-hidden="true" className="absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-40 bottom-10 h-[24rem] w-[24rem] rounded-full bg-flare/15 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-4 px-4 pt-24 md:gap-10 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:pt-0">
          <div aria-hidden="true">
            <p className="eyebrow text-primary">How the agents negotiate</p>
            <h2 id="how-title" className="mt-3 hidden font-display text-3xl font-extrabold md:text-5xl lg:block">Three agents. One agreement. Every human in charge.</h2>
            <div className="mt-3 flex items-center gap-3 lg:mt-10">
              <span className="font-display text-sm font-bold tabular-nums text-muted-foreground">{String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border"><motion.div style={{ scaleX: bar }} className="h-full origin-left rounded-full bg-gradient-to-r from-primary via-club-art to-flare" /></div>
            </div>
            <div className="relative mt-3 min-h-[9.5rem] md:mt-8 md:min-h-[13rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35, ease: EASE }}>
                  <p className="text-sm font-semibold text-primary">{s.who}</p>
                  <h3 className="mt-1 font-display text-xl font-bold md:text-3xl">{s.title}</h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground md:mt-3 md:text-base md:leading-7">{s.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <NegotiationBoard step={step} />
        </div>
      </div>
    </section>
  );
}

const MESSAGES = [
  { at: 1, club: "Coding", c: "bg-club-photo", kind: "proposal", v: 1, body: "Hack Night, Friday 6–9 PM. Needs $300. Coding Club brings 4 mentors and $100. Design workshop at 6:00 PM." },
  { at: 2, club: "Startup", c: "bg-club-business", kind: "offer", v: 1, body: "$200 for pizza, if we get 5 minutes at the end for our pitch competition." },
  { at: 3, club: "Design", c: "bg-club-art", kind: "problem", v: 1, body: "Our members are in class until 6. A 6:00 PM workshop won’t work." },
  { at: 4, club: "Design", c: "bg-club-art", kind: "fix", v: 2, body: "Move the workshop to 6:30–7:15 PM. All else unchanged. $100 + $200 = $300." },
];

function NegotiationBoard({ step }: { step: number }) {
  const shown = MESSAGES.filter((m) => m.at <= step).slice(-3);
  const older = shown.length - 1; // on phones only the newest messages fit beside the step text
  const v = step >= 4 ? 2 : 1;
  const conflict = step === 3;
  const approved = step >= 5 ? 3 : 0;
  return (
    <div aria-hidden="true" className="relative">
      <div className="panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold"><Handshake size={16} className="text-primary" /> Event workspace</div>
          <motion.span key={v} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="badge badge-ok">v{v} current</motion.span>
        </div>
        <div className="space-y-3 px-5 py-4" style={{ minHeight: "12.5rem" }}>
          {step === 0 ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {[["Coding", "bg-club-photo", "Max $100. Don’t reveal it."], ["Startup", "bg-club-business", "Up to $200 if we get a talk."], ["Design", "bg-club-art", "Class until 6 PM."]].map(([n, c, t], i) => (
                <motion.div key={n} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }} className="rounded-2xl border border-dashed border-input bg-muted/60 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${c}`} />{n} brief <LockKeyhole size={12} className="ml-auto text-muted-foreground" /></div>
                  <p className="mt-2 select-none text-sm text-muted-foreground blur-[3px]">{t}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {shown.map((m, idx) => (
                <motion.div key={m.body} layout data-old={idx < older - 1 || undefined} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: EASE }} className="flex gap-3 data-[old]:hidden sm:data-[old]:flex">
                  <span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[11px] font-bold text-white ${m.c}`}>{m.club.slice(0, 2).toUpperCase()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs"><strong>{m.club} agent</strong><span className={`badge ${m.kind === "problem" || m.kind === "fix" ? "badge-pending" : "badge-muted"}`}>{m.kind} · v{m.v}</span></div>
                    <p className="mt-1 rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2 text-sm leading-6">{m.body}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <div className="border-t border-border bg-muted/40 px-5 py-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Workshop</p><motion.p key={`s${v}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`font-semibold ${conflict ? "text-destructive" : ""}`}>{v === 2 ? "6:30–7:15 PM" : "6:00–6:45 PM"}</motion.p></div>
            <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-semibold">{step >= 2 ? "$300 covered" : step >= 1 ? "$100 of $300" : "Not proposed"}</p></div>
            <div><p className="text-xs text-muted-foreground">Approvals</p><p className="font-semibold tabular-nums">{approved}/3</p></div>
          </div>
          <AnimatePresence>
            {conflict && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden rounded-xl bg-pending px-3 py-2 text-sm text-pending-foreground">Problem: the workshop starts at 6:00 PM, but Design Club’s members are in class until 6.</motion.p>}
          </AnimatePresence>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Coding", "Startup", "Design"].map((c, i) => (
              <motion.span key={c + (approved ? "y" : "n")} initial={approved ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.12, type: "spring", stiffness: 420, damping: 18 }} className={`badge ${approved ? "badge-ok" : "badge-muted"}`}>
                {approved ? <Check size={12} /> : null}{c} {approved ? "approved" : step >= 4 ? "needs to re-approve" : "not approved"}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {step >= 6 && (
          <motion.div initial={{ opacity: 0, y: 24, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -2 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.5, ease: EASE }} className="panel absolute -bottom-10 right-2 w-64 p-4 md:-right-6 md:w-72">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary"><Users size={14} /> Volunteer shifts</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              <li className="flex items-center justify-between"><span>Ava (Member) · Check-in</span><span className="badge badge-ok"><Check size={12} />confirmed</span></li>
              <li className="flex items-center justify-between"><span>Dev (Member) · Mentor</span><span className="badge badge-ok"><Check size={12} />confirmed</span></li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.8, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0), ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 }), sry = useSpring(ry, { stiffness: 200, damping: 20 });
  return (
    <motion.div
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      onPointerMove={(e) => { if (reduce || e.pointerType !== "mouse") return; const r = e.currentTarget.getBoundingClientRect(); ry.set(((e.clientX - r.left) / r.width - 0.5) * 8); rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8); }}
      onPointerLeave={() => { rx.set(0); ry.set(0); }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function PrivateVsShared() {
  return (
    <section id="private" className="relative overflow-hidden bg-background py-24 md:py-40" aria-labelledby="private-title">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary">What gets shared</p>
          <h2 id="private-title" className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Agents share offers. Never the brief behind them.</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">Only a club’s officers can read its brief. What crosses the table is exactly what goes into the agreement.</p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <Reveal>
            <TiltCard className="panel relative h-full overflow-hidden bg-ink p-7 text-white md:p-9">
              <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/40 blur-3xl" />
              <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10"><LockKeyhole size={20} /></span><div><p className="text-sm font-semibold">Private brief</p><p className="text-xs text-white/60">Only Entrepreneurship Club officers</p></div></div>
              <p className="relative mt-7 select-none text-lg leading-8 text-white/80 blur-[5px]" aria-hidden="true">We can pay up to $200 for pizza, only if we get a closing talk. If they say no, offer $80.</p>
              <p className="sr-only">The brief text is hidden from other clubs.</p>
              <ul className="relative mt-7 space-y-2 text-sm text-white/75">
                {["Ceilings and walk-away points", "Internal priorities and notes", "Deadlines the club hasn’t announced"].map((t) => <li key={t} className="flex items-center gap-2"><LockKeyhole size={14} className="text-flare" aria-hidden="true" />{t}</li>)}
              </ul>
            </TiltCard>
          </Reveal>
          <Reveal delay={0.1}>
            <TiltCard className="panel relative h-full overflow-hidden p-7 md:p-9">
              <div aria-hidden="true" className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-flare/20 blur-3xl" />
              <div className="relative flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-secondary text-primary"><Handshake size={20} /></span><div><p className="text-sm font-semibold">Shared with partners</p><p className="text-xs text-muted-foreground">Every club in the event</p></div></div>
              <p className="relative mt-7 font-display text-2xl font-bold leading-snug">“$200 for pizza, if we get a 5-minute talk at the end.”</p>
              <ul className="relative mt-7 space-y-2 text-sm text-muted-foreground">
                {["The proposed contribution", "Conditions that become terms", "Timing, and which version is current"].map((t) => <li key={t} className="flex items-center gap-2"><Check size={14} className="text-accent-foreground" aria-hidden="true" />{t}</li>)}
              </ul>
            </TiltCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const GUARANTEES = [
  { Icon: GitBranch, title: "Versioned agreements", body: "Any change makes a new version and voids earlier approvals. No one approves terms they didn’t see.", span: "md:col-span-2" },
  { Icon: CheckCheck, title: "Officer-owned approvals", body: "Each club’s officers approve only their own club’s part, on the current version.", span: "" },
  { Icon: Users, title: "Fair crews", body: "Capacity, skills and overlapping shifts are checked before anyone is committed.", span: "" },
  { Icon: ShieldCheck, title: "Enforced in Postgres", body: "Row-level security and checked functions use the signed-in identity. The browser can’t grant itself a role.", span: "md:col-span-2" },
];

function Guarantees() {
  return (
    <section id="guarantees" className="bg-background pb-24 md:pb-40" aria-labelledby="g-title">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="max-w-2xl"><p className="eyebrow text-primary">Guarantees</p><h2 id="g-title" className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Built so a promise means something.</h2></Reveal>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {GUARANTEES.map((g, i) => (
            <Reveal key={g.title} delay={i * 0.08} className={g.span}>
              <article className="panel panel-lift group h-full p-7">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><g.Icon size={22} aria-hidden="true" /></span>
                <h3 className="mt-6 font-display text-xl font-bold">{g.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{g.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Finale() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const k = reduce ? 0 : 1;
  const sky = useTransform(scrollYProgress, [0, 1], [`${-24 * k}%`, "0%"]);
  const far = useTransform(scrollYProgress, [0, 1], [`${-14 * k}%`, "0%"]);
  const near = useTransform(scrollYProgress, [0, 1], [`${-6 * k}%`, "0%"]);
  const booths = useTransform(scrollYProgress, [0, 1], [`${10 * k}%`, "0%"]);
  return (
    <section ref={ref} className="relative h-[100svh] min-h-[620px] overflow-hidden bg-ink text-white" aria-labelledby="finale-title">
      <Layer y={sky}><Sky tone="dusk" /><Stars seed={31} count={60} /></Layer>
      <Layer y={far}><FarSkyline fill="oklch(0.3 0.08 300)" /></Layer>
      <Layer y={near}><NearBuildings seed={11} /></Layer>
      <Layer y={booths}><StringLights /><Booths /></Layer>
      <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col items-center px-4 pt-[24svh] text-center">
        <Reveal><h2 id="finale-title" className="font-display text-[clamp(2.4rem,7vw,5.5rem)] font-extrabold leading-[0.98]">Your club has the idea.<br />Bring the campus.</h2></Reveal>
        <Reveal delay={0.1}><div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/demo" className="btn btn-flare px-6 py-3 text-base">Try the demo <ArrowRight size={18} /></Link>
          <Link to="/auth" className="btn btn-glass px-6 py-3 text-base">Create an account <ArrowUpRight size={18} /></Link>
        </div></Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink px-4 pb-10 pt-6 text-sm text-ink-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <Brand small tone="light" />
        <p>{supabaseConfigured ? "Live workspace runs on Supabase Auth and Postgres row-level security." : "Backend not configured here. The demo runs in isolated local state."}</p>
        <nav aria-label="Footer" className="flex gap-4"><Link to="/demo" className="hover:text-white">Demo</Link><Link to="/app" className="hover:text-white">Workspace</Link><Link to="/auth" className="hover:text-white">Sign in</Link></nav>
      </div>
    </footer>
  );
}
