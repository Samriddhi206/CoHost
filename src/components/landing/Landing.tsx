import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, Bot, Check, CheckCheck, LockKeyhole, MessagesSquare, Users } from "lucide-react";
import { Brand } from "@/components/Brand";
import { AgentBubble, AppScreen, BriefCard, CLUB_TONE, ClubCard, PlanCard, ShiftChip } from "./product";
import { useSmoothScroll } from "./SmoothScroll";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Landing() {
  useSmoothScroll();
  return (
    <div className="bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <Expansion />
        <Negotiation />
        <PrivateVsShared />
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
      <nav aria-label="Main" className={`mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border px-3 py-2 transition-all duration-300 md:px-4 ${scrolled ? "border-border bg-background/80 shadow-[var(--shadow-soft)] backdrop-blur-xl" : "border-transparent"}`}>
        <Link to="/" aria-label="CoHost home" className="rounded-full"><Brand small /></Link>
        <div className="hidden items-center gap-1 text-sm font-medium md:flex">
          {[["#how", "How it works"], ["#example", "Example"], ["#private", "Privacy"]].map(([h, l]) => (
            <a key={h} href={h} className="rounded-full px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="btn btn-ghost hidden px-4 sm:inline-flex">Sign in</Link>
          <Link to="/demo" className="btn btn-flare px-4">Try the demo <ArrowRight size={16} /></Link>
        </div>
      </nav>
    </header>
  );
}

// Pointer-driven depth: each layer drifts sideways in proportion to its distance from the viewer.
function usePointerDepth(reduce: boolean | null) {
  const px = useMotionValue(0), py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20, mass: 0.6 }), sy = useSpring(py, { stiffness: 60, damping: 20, mass: 0.6 });
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => { px.set(e.clientX / window.innerWidth - 0.5); py.set(e.clientY / window.innerHeight - 0.5); };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [px, py, reduce]);
  return [sx, sy] as const;
}

// One floating layer of the hero: moves with scroll at `speed` and with the pointer at `depth`.
function Float({ progress, pointer, speed, depth, className, children }: { progress: MotionValue<number>; pointer: readonly [MotionValue<number>, MotionValue<number>]; speed: number; depth: number; className: string; children: ReactNode }) {
  const scrollY = useTransform(progress, [0, 1], [0, speed]);
  const px = useTransform(pointer[0], (v) => v * depth);
  const py = useTransform(pointer[1], (v) => v * depth * 0.6);
  const y = useTransform(() => scrollY.get() + py.get());
  return <motion.div aria-hidden="true" style={{ x: px, y }} className={`pointer-events-none absolute will-change-transform ${className}`}>{children}</motion.div>;
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const pointer = usePointerDepth(reduce);
  const k = reduce ? 0 : 1;
  const gridY = useTransform(scrollYProgress, [0, 1], ["0%", `${20 * k}%`]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", `${-25 * k}%`]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, reduce ? 1 : 0]);
  return (
    <section ref={ref} className="relative min-h-[100svh] overflow-hidden" aria-labelledby="hero-title">
      {/* Background layer: dot grid and soft glows, slowest */}
      <motion.div aria-hidden="true" style={{ y: gridY }} className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[.35]" style={{ backgroundImage: "radial-gradient(oklch(1 0 0 / .14) 1px, transparent 1px)", backgroundSize: "28px 28px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%)" }} />
        <div className="anim-aurora absolute left-[8%] top-[14%] h-[26rem] w-[26rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="anim-aurora absolute right-[6%] top-[30%] h-[24rem] w-[24rem] rounded-full bg-club-business/20 blur-3xl" style={{ animationDelay: "-7s" }} />
      </motion.div>

      {/* Mid and foreground layers: real pieces of the app, faster and closer */}
      <div className="absolute inset-0 hidden lg:block">
        <Float progress={scrollYProgress} pointer={pointer} speed={-80 * k} depth={-14} className="left-[3%] top-[18%] opacity-60 blur-[1px]">
          <ClubCard club="coding" offer="4 mentors + $100" />
        </Float>
        <Float progress={scrollYProgress} pointer={pointer} speed={-120 * k} depth={-20} className="right-[3%] top-[16%] opacity-60 blur-[1px]">
          <ClubCard club="startup" offer="$200 for pizza" />
        </Float>
        <Float progress={scrollYProgress} pointer={pointer} speed={-220 * k} depth={-34} className="left-[5%] top-[56%]">
          <AgentBubble club="design" flag text="Our members are in class until 6. Can the workshop start at 6:30?" />
        </Float>
        <Float progress={scrollYProgress} pointer={pointer} speed={-300 * k} depth={-46} className="right-[4%] top-[52%]">
          <PlanCard />
        </Float>
        <Float progress={scrollYProgress} pointer={pointer} speed={-380 * k} depth={-60} className="bottom-[6%] left-[30%]">
          <ShiftChip name="Ava" role="Check-in desk · 6:00 PM" />
        </Float>
      </div>

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 mx-auto flex min-h-[100svh] max-w-3xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center">
        <p className="anim-rise inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground backdrop-blur" style={{ animationDuration: ".8s" }}>
          <Users size={15} className="text-primary" aria-hidden="true" />For campus clubs that host together
        </p>
        <h1 id="hero-title" className="mt-7 font-display text-[clamp(2.6rem,6.4vw,5.25rem)] font-extrabold leading-[1] tracking-[-0.04em]">
          <span className="anim-rise block" style={{ animationDelay: ".1s", animationDuration: ".9s" }}>Plan one event</span>
          <span className="anim-rise block bg-gradient-to-r from-flare via-[oklch(0.82_0.12_245)] to-[oklch(0.74_0.18_290)] bg-clip-text pb-[0.06em] text-transparent" style={{ animationDelay: ".2s", animationDuration: ".9s" }}>with three clubs.</span>
        </h1>
        <p className="anim-rise mt-7 max-w-xl text-lg leading-8 text-muted-foreground" style={{ animationDelay: ".35s", animationDuration: ".9s" }}>
          Each club gets an AI agent that knows what the club can offer. The agents work out who brings what. Club leaders approve. Students sign up for shifts.
        </p>
        <div className="anim-rise mt-9 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: ".5s", animationDuration: ".9s" }}>
          <Link to="/demo" className="btn btn-flare px-6 py-3 text-base">Try the demo <ArrowRight size={18} /></Link>
          <a href="#how" className="btn btn-ghost px-6 py-3 text-base">See how it works</a>
        </div>
        <p className="anim-rise mt-5 text-sm text-muted-foreground" style={{ animationDelay: ".6s", animationDuration: ".9s" }}>No account needed for the demo.</p>
        <div className="mt-12 flex justify-center lg:hidden"><PlanCard className="max-w-full" /></div>
      </motion.div>
    </section>
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

const HOW = [
  { Icon: LockKeyhole, title: "Each club briefs its agent", body: "Tell your agent what your club can bring and what it can’t do. This stays private to your club." },
  { Icon: MessagesSquare, title: "The agents agree on a plan", body: "They trade offers and fix clashes, like a workshop that starts before your members are out of class." },
  { Icon: CheckCheck, title: "Leaders approve, students sign up", body: "A leader from each club approves their club’s part. Then students pick volunteer shifts that fit their schedule." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-24 md:py-32" aria-labelledby="how-title">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary">How it works</p>
          <h2 id="how-title" className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Three steps from idea to event.</h2>
        </Reveal>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {HOW.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.1}>
              <li className="panel panel-lift group h-full p-7">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"><h.Icon size={22} aria-hidden="true" /></span>
                  <span className="font-display text-4xl font-extrabold text-muted-foreground/40">{i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-bold">{h.title}</h3>
                <p className="mt-2 leading-7 text-muted-foreground">{h.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Pinned section: a screenshot of the app starts as a card, expands to fill the screen and zooms in.
function Expansion() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  const frame = useTransform(p, [0, 0.45], reduce ? [1, 1] : [0.68, 1]);
  const round = useTransform(p, [0, 0.45], reduce ? [0, 0] : [28, 0]);
  const zoom = useTransform(p, [0.45, 1], reduce ? [1, 1] : [1, 1.1]);
  const titleOpacity = useTransform(p, [0, 0.2], [1, reduce ? 1 : 0]);
  const captions = [
    { club: "coding" as const, what: "Organizes. Brings 4 mentors and $100.", at: [0.5, 0.6] as const },
    { club: "design" as const, what: "Runs a 45-minute design workshop.", at: [0.6, 0.7] as const },
    { club: "startup" as const, what: "Pays $200 for pizza, gets a closing talk.", at: [0.7, 0.8] as const },
  ];
  const overlay = useTransform(p, [0.42, 0.55], [reduce ? 1 : 0, 1]);
  return (
    <section ref={ref} className="relative h-[260vh]" aria-labelledby="story-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <motion.div style={{ opacity: titleOpacity }} className="absolute inset-x-0 top-[6svh] z-10 px-4 text-center">
          <p className="eyebrow text-primary">The example in this demo</p>
          <h2 id="story-title" className="mt-2 font-display text-2xl font-extrabold md:text-4xl">Hack Night, hosted by three clubs</h2>
        </motion.div>
        <motion.div style={{ scale: frame, borderRadius: round }} className="absolute inset-0 origin-[50%_85%] overflow-hidden border border-border shadow-[var(--shadow-lift)] will-change-transform">
          <motion.div style={{ scale: zoom }} className="absolute inset-0 origin-[30%_30%]"><AppScreen /></motion.div>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <motion.div style={{ opacity: overlay }} className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-10 md:px-8 md:pb-14">
            <p className="max-w-2xl font-display text-2xl font-bold leading-tight md:text-4xl">One evening, three clubs, one plan everyone agreed to.</p>
            <ul className="mt-6 grid gap-3 md:grid-cols-3">
              {captions.map((c) => <Caption key={c.club} p={p} at={c.at} reduce={!!reduce}><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${CLUB_TONE[c.club].dot}`} aria-hidden="true" /><span><strong className="block text-sm">{CLUB_TONE[c.club].name}</strong><span className="text-sm text-muted-foreground">{c.what}</span></span></Caption>)}
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
  return <motion.li style={{ opacity, y }} className="flex items-start gap-3 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-md">{children}</motion.li>;
}

type Step = { title: string; body: string; who: string };
const STEPS: Step[] = [
  { who: "Before it starts", title: "Each club briefs its own agent", body: "Coding Club can only spare $100. Entrepreneurship Club will pay for pizza if it gets a short talk. Design Club’s members are in class until 6 PM. Each club tells only its own agent." },
  { who: "Coding Club agent", title: "A first plan", body: "Hack Night on Friday, 6–9 PM. It needs $300 for pizza and prizes. Coding Club runs it, brings 4 mentors and puts in $100." },
  { who: "Entrepreneurship agent", title: "An offer with a condition", body: "They’ll cover the missing $200, but only if they get 5 minutes at the end to announce their pitch competition. The condition goes into the plan." },
  { who: "Design Club agent", title: "A problem is caught", body: "The first plan has the design workshop at 6:00 PM, but Design Club’s members are still in class. The plan is flagged, and nobody can approve it yet." },
  { who: "Design Club agent", title: "The fix: version 2", body: "Move the workshop to 6:30 PM. Everything else stays the same. Since the plan changed, any earlier approvals are cleared." },
  { who: "Three club leaders", title: "People approve, not agents", body: "Maya, Leo and Jordan each approve their own club’s part of version 2. Agents can suggest, but they can’t commit a club to anything." },
  { who: "Students", title: "Volunteers pick their shifts", body: "Coding Club opens sign-ups. Students see the shifts that fit their free time and skills, and sign up themselves." },
];

function Negotiation() {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useSpring(scrollYProgress, { stiffness: 160, damping: 30 });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));
  const s = STEPS[step]!;
  return (
    <section id="example" ref={ref} className="relative" style={{ height: `${STEPS.length * 70 + 60}vh` }} aria-labelledby="ex-title">
      <ol className="sr-only">{STEPS.map((x) => <li key={x.title}>{x.title}: {x.body}</li>)}</ol>
      <div className="sticky top-0 flex h-[100svh] items-start overflow-hidden lg:items-center">
        <div aria-hidden="true" className="absolute -left-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-40 bottom-10 h-[24rem] w-[24rem] rounded-full bg-club-business/10 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-4 px-4 pt-24 md:gap-10 md:px-8 lg:grid-cols-[1fr_1.05fr] lg:pt-0">
          <div aria-hidden="true">
            <p className="eyebrow text-primary">Watch it happen</p>
            <h2 id="ex-title" className="mt-3 hidden font-display text-3xl font-extrabold md:text-5xl lg:block">How the agents planned Hack Night.</h2>
            <div className="mt-3 flex items-center gap-3 lg:mt-10">
              <span className="font-display text-sm font-bold tabular-nums text-muted-foreground">{String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border"><motion.div style={{ scaleX: bar }} className="h-full origin-left rounded-full bg-gradient-to-r from-primary via-club-business to-club-art" /></div>
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
  { at: 1, club: "coding" as const, kind: "Proposed", v: 1, body: "Hack Night, Friday 6–9 PM. Needs $300. Coding Club brings 4 mentors and $100. Design workshop at 6:00 PM." },
  { at: 2, club: "startup" as const, kind: "Offered", v: 1, body: "$200 for pizza, if we get 5 minutes at the end for our pitch competition." },
  { at: 3, club: "design" as const, kind: "Problem", v: 1, body: "Our members are in class until 6. A 6:00 PM workshop won’t work." },
  { at: 4, club: "design" as const, kind: "Fix", v: 2, body: "Move the workshop to 6:30–7:15 PM. $100 + $200 covers the $300." },
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
          <div className="flex items-center gap-2 text-sm font-semibold"><Bot size={16} className="text-primary" /> Hack Night</div>
          <motion.span key={v} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} className="badge badge-muted">Version {v}</motion.span>
        </div>
        <div className="space-y-3 px-5 py-4" style={{ minHeight: "12.5rem" }}>
          {step === 0 ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {(["coding", "startup", "design"] as const).map((c, i) => (
                <motion.div key={c} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }} className="rounded-2xl border border-dashed border-input bg-muted/60 p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${CLUB_TONE[c].dot}`} />{CLUB_TONE[c].name.split(" ")[0]} <LockKeyhole size={12} className="ml-auto text-muted-foreground" /></div>
                  <p className="mt-2 select-none text-sm text-muted-foreground blur-[3px]">Private brief</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {shown.map((m, idx) => (
                <motion.div key={m.body} layout data-old={idx < older - 1 || undefined} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: EASE }} className="flex gap-3 data-[old]:hidden sm:data-[old]:flex">
                  <span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-bold text-ink ${CLUB_TONE[m.club].dot}`}>{CLUB_TONE[m.club].name[0]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs"><strong>{CLUB_TONE[m.club].name} agent</strong><span className={`badge ${m.kind === "Problem" ? "badge-pending" : "badge-muted"}`}>{m.kind}</span></div>
                    <p className="mt-1 rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2 text-sm leading-6">{m.body}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        <div className="border-t border-border bg-muted/40 px-5 py-4">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Workshop</p><motion.p key={`s${v}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`font-semibold ${conflict ? "text-destructive" : ""}`}>{v === 2 ? "6:30 PM" : "6:00 PM"}</motion.p></div>
            <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-semibold">{step >= 2 ? "$300 covered" : step >= 1 ? "$100 of $300" : "Not planned"}</p></div>
            <div><p className="text-xs text-muted-foreground">Approved</p><p className="font-semibold tabular-nums">{approved} of 3</p></div>
          </div>
          <AnimatePresence>
            {conflict && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden rounded-xl bg-pending px-3 py-2 text-sm text-pending-foreground">Problem: the workshop starts before Design Club’s members are out of class.</motion.p>}
          </AnimatePresence>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Maya", "Leo", "Jordan"].map((c, i) => (
              <motion.span key={c + (approved ? "y" : "n")} initial={approved ? { scale: 0.6, opacity: 0 } : false} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.12, type: "spring", stiffness: 420, damping: 18 }} className={`badge ${approved ? "badge-ok" : "badge-muted"}`}>
                {approved ? <Check size={12} /> : null}{c} {approved ? "approved" : "hasn’t approved"}
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
              <li className="flex items-center justify-between"><span>Check-in · Ava</span><span className="badge badge-ok"><Check size={12} />signed up</span></li>
              <li className="flex items-center justify-between"><span>Mentor · Dev</span><span className="badge badge-ok"><Check size={12} />signed up</span></li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrivateVsShared() {
  return (
    <section id="private" className="relative overflow-hidden py-24 md:py-36" aria-labelledby="private-title">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <Reveal className="max-w-2xl">
          <p className="eyebrow text-primary">Privacy</p>
          <h2 id="private-title" className="mt-3 font-display text-3xl font-extrabold md:text-5xl">Agents share offers, not your club’s secrets.</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">Only your club’s leaders can read your brief. Other clubs only see the offer that goes into the plan.</p>
        </Reveal>
        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <article className="panel h-full p-7 md:p-9">
              <p className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole size={16} className="text-primary" aria-hidden="true" />What Entrepreneurship Club told its agent</p>
              <p className="mt-5 text-lg leading-8">“We can pay up to $200 for pizza, but only if we get 5 minutes at the end. If they say no, offer $80.”</p>
              <p className="mt-6 text-sm text-muted-foreground">Seen by: Entrepreneurship Club leaders only</p>
            </article>
          </Reveal>
          <div aria-hidden="true" className="hidden items-center md:flex"><ArrowRight size={28} className="text-muted-foreground" /></div>
          <Reveal delay={0.1}>
            <article className="panel h-full p-7 md:p-9">
              <p className="flex items-center gap-2 text-sm font-semibold"><MessagesSquare size={16} className="text-primary" aria-hidden="true" />What the other clubs see</p>
              <p className="mt-5 font-display text-2xl font-bold leading-snug">“$200 for pizza, if we get a 5-minute talk at the end.”</p>
              <p className="mt-6 text-sm text-muted-foreground">Seen by: every club in the event. The $80 fallback stays private.</p>
            </article>
          </Reveal>
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
  const left = useTransform(scrollYProgress, [0, 1], [80 * k, 0]);
  const right = useTransform(scrollYProgress, [0, 1], [140 * k, 0]);
  return (
    <section ref={ref} className="relative overflow-hidden py-28 md:py-40" aria-labelledby="finale-title">
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 mx-auto h-[30rem] max-w-4xl -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      <motion.div style={{ y: left }} className="absolute left-[4%] top-[18%] hidden lg:block"><BriefCard /></motion.div>
      <motion.div style={{ y: right }} className="absolute bottom-[14%] right-[5%] hidden lg:block"><ShiftChip name="Dev" role="Coding mentor · 6:30 PM" /></motion.div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <Reveal><h2 id="finale-title" className="font-display text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold leading-[1.02]">Your club has the idea.<br />Bring two more.</h2></Reveal>
        <Reveal delay={0.1}><p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Walk through Hack Night as each club leader and student. It takes about two minutes.</p></Reveal>
        <Reveal delay={0.15}><div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/demo" className="btn btn-flare px-6 py-3 text-base">Try the demo <ArrowRight size={18} /></Link>
          <Link to="/auth" className="btn btn-ghost px-6 py-3 text-base">Create an account</Link>
        </div></Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-8 text-sm text-muted-foreground md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <Brand small />
        <p>Built for campus clubs. Your club’s commitments are always your call.</p>
        <nav aria-label="Footer" className="flex gap-4"><Link to="/demo" className="hover:text-foreground">Demo</Link><Link to="/app" className="hover:text-foreground">Workspace</Link><Link to="/auth" className="hover:text-foreground">Sign in</Link></nav>
      </div>
    </footer>
  );
}
