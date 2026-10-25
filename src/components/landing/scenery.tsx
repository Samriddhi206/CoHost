// Decorative, deterministic SVG layers for the landing scenes. Everything here is aria-hidden;
// the seeded random keeps server and client markup identical so hydration never mismatches.

const W = 1600;
const H = 900;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function Stars({ seed = 7, count = 90 }: { seed?: number; count?: number }) {
  const rand = rng(seed);
  const stars = Array.from({ length: count }, () => ({ x: r1(rand() * W), y: r1(rand() * H * 0.62), r: r1(0.6 + rand() * 1.6), d: r1(rand() * 4) }));
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" className="anim-twinkle" style={{ animationDelay: `${s.d}s` }} />)}
    </svg>
  );
}

export function Sky({ tone = "night" }: { tone?: "night" | "dusk" }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: tone === "night"
        ? "linear-gradient(180deg, oklch(0.12 0.018 265) 0%, oklch(0.19 0.045 270) 48%, oklch(0.28 0.09 290) 78%, oklch(0.38 0.08 215) 100%)"
        : "linear-gradient(180deg, oklch(0.2 0.05 284) 0%, oklch(0.32 0.12 300) 45%, oklch(0.34 0.10 285) 80%, oklch(0.48 0.10 215) 100%)" }} />
      <div className="anim-aurora absolute -left-1/4 top-[8%] h-[55%] w-[80%] rounded-full opacity-50 blur-3xl" style={{ background: "radial-gradient(closest-side, oklch(0.6 0.2 285 / .7), transparent)" }} />
      <div className="anim-aurora absolute -right-1/4 top-[22%] h-[50%] w-[70%] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(closest-side, oklch(0.65 0.15 205 / .6), transparent)", animationDelay: "-6s" }} />
      <div className="absolute inset-x-0 bottom-0 h-[45%]" style={{ background: "radial-gradient(60% 80% at 50% 100%, oklch(0.65 0.14 215 / .55), transparent 70%)" }} />
    </div>
  );
}

export function FarSkyline({ fill = "oklch(0.27 0.07 292)" }: { fill?: string }) {
  const rand = rng(21);
  const blocks: { x: number; w: number; h: number }[] = [];
  for (let x = -20; x < W + 20;) {
    const w = 40 + Math.round(rand() * 80);
    blocks.push({ x, w, h: 50 + Math.round(rand() * 120) });
    x += w - 6;
  }
  const base = 760;
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      <g fill={fill}>
        {blocks.map((b, i) => <rect key={i} x={b.x} y={base - b.h} width={b.w} height={b.h + 200} rx={3} />)}
        {/* clock tower */}
        <rect x={1040} y={base - 330} width={70} height={530} />
        <path d={`M1030 ${base - 330} L1075 ${base - 420} L1120 ${base - 330} Z`} />
        <rect x={1068} y={base - 470} width={14} height={60} />
        {/* library dome */}
        <rect x={340} y={base - 210} width={180} height={410} />
        <path d={`M350 ${base - 210} A80 80 0 0 1 510 ${base - 210} Z`} />
        <rect x={424} y={base - 320} width={12} height={40} />
        {/* tree line */}
        {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={i * 64 + 20} cy={base + 10 - (i % 3) * 14} r={34 + (i % 4) * 8} />)}
      </g>
      <circle cx={1075} cy={base - 280} r={18} fill="oklch(0.85 0.12 205 / .9)" />
    </svg>
  );
}

export function NearBuildings({ seed = 5 }: { seed?: number }) {
  const rand = rng(seed);
  const buildings = [
    { x: -40, w: 260, h: 300 }, { x: 200, w: 180, h: 220 }, { x: 1240, w: 200, h: 260 }, { x: 1420, w: 240, h: 330 },
    { x: 520, w: 150, h: 150 }, { x: 930, w: 160, h: 170 },
  ];
  const base = 820;
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      {buildings.map((b, i) => {
        const cols = Math.floor((b.w - 30) / 34);
        const rows = Math.floor((b.h - 40) / 42);
        return (
          <g key={i}>
            <rect x={b.x} y={base - b.h} width={b.w} height={b.h + 100} fill="oklch(0.2 0.04 286)" />
            <rect x={b.x - 8} y={base - b.h - 10} width={b.w + 16} height={14} fill="oklch(0.24 0.05 286)" />
            {Array.from({ length: rows * cols }, (_, k) => {
              const lit = rand() > 0.55;
              const cx = b.x + 20 + (k % cols) * 34;
              const cy = base - b.h + 26 + Math.floor(k / cols) * 42;
              return <rect key={k} x={cx} y={cy} width={18} height={24} rx={2} fill={lit ? "oklch(0.80 0.13 205)" : "oklch(0.27 0.05 286)"} opacity={lit ? 0.9 : 1} className={lit && rand() > 0.7 ? "anim-bulb" : undefined} style={lit ? { animationDelay: `${r1(rand() * 3)}s` } : undefined} />;
            })}
          </g>
        );
      })}
    </svg>
  );
}

const BULB_COLORS = ["oklch(0.80 0.14 205)", "oklch(0.72 0.18 290)", "oklch(0.72 0.18 350)", "oklch(0.8 0.12 160)", "oklch(0.75 0.14 285)"];

function strand(y0: number, y1: number, sag: number, n: number, seed: number) {
  const rand = rng(seed);
  const p0 = { x: -20, y: y0 }, p2 = { x: W + 20, y: y1 }, p1 = { x: W / 2, y: (y0 + y1) / 2 + sag * 2 };
  const pt = (t: number) => ({ x: (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x, y: (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y });
  const bulbs = Array.from({ length: n }, (_, i) => ({ ...pt((i + 0.5) / n), c: BULB_COLORS[Math.floor(rand() * BULB_COLORS.length)]!, d: r1(rand() * 3) }));
  return { d: `M${p0.x} ${p0.y} Q${p1.x} ${p1.y} ${p2.x} ${p2.y}`, bulbs };
}

export function StringLights() {
  const strands = [strand(330, 290, 70, 26, 3), strand(560, 600, 40, 30, 9)];
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      {strands.map((s, i) => (
        <g key={i}>
          <path d={s.d} stroke="oklch(0.12 0.02 284)" strokeWidth={2.5} fill="none" />
          {s.bulbs.map((b, k) => (
            <g key={k} className="anim-bulb" style={{ animationDelay: `${b.d}s` }}>
              <circle cx={r1(b.x)} cy={r1(b.y + 12)} r={16} fill={b.c} opacity={0.22} />
              <circle cx={r1(b.x)} cy={r1(b.y + 12)} r={6} fill={b.c} />
              <line x1={r1(b.x)} y1={r1(b.y)} x2={r1(b.x)} y2={r1(b.y + 6)} stroke="oklch(0.12 0.02 284)" strokeWidth={2} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

function Person({ x, h, tone }: { x: number; h: number; tone: string }) {
  const y = H - 10;
  return (
    <g fill={tone}>
      <circle cx={x} cy={y - h} r={h * 0.13} />
      <path d={`M${x - h * 0.2} ${y} L${x - h * 0.17} ${y - h * 0.62} Q${x} ${y - h * 0.86} ${x + h * 0.17} ${y - h * 0.62} L${x + h * 0.2} ${y} Z`} />
    </g>
  );
}

function Booth({ x, color, stripe, top = 640 }: { x: number; color: string; stripe: string; top?: number }) {
  const w = 300, deck = top + 120;
  return (
    <g>
      <rect x={x + 10} y={top + 50} width={8} height={H - top} fill="oklch(0.14 0.02 284)" />
      <rect x={x + w - 18} y={top + 50} width={8} height={H - top} fill="oklch(0.14 0.02 284)" />
      <path d={`M${x - 14} ${top + 60} L${x + 20} ${top} L${x + w - 20} ${top} L${x + w + 14} ${top + 60} Z`} fill={color} />
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M${x + 20 + i * 60 + 12} ${top} L${x + 20 + i * 60 + 36} ${top} L${x + i * 66 + 34} ${top + 60} L${x + i * 66 + 4} ${top + 60} Z`} fill={stripe} opacity={0.55} />)}
      {Array.from({ length: 6 }, (_, i) => <circle key={i} cx={x - 14 + (i + 0.5) * ((w + 28) / 6)} cy={top + 60} r={(w + 28) / 12} fill={color} />)}
      <rect x={x - 6} y={deck} width={w + 12} height={18} rx={4} fill="oklch(0.12 0.018 265)" />
      <rect x={x + 4} y={deck + 18} width={w - 8} height={H - deck} fill="oklch(0.13 0.025 284)" />
      <rect x={x + 30} y={deck - 34} width={54} height={34} rx={3} fill={color} opacity={0.85} />
      <rect x={x + 100} y={deck - 22} width={40} height={22} rx={3} fill="oklch(0.80 0.13 205)" opacity={0.9} />
      <rect x={x + 200} y={deck - 46} width={30} height={46} rx={3} fill={stripe} opacity={0.9} />
    </g>
  );
}

export function Booths() {
  const tone = "oklch(0.1 0.02 284)";
  return (
    <svg aria-hidden="true" className="absolute inset-0 h-full w-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
      <rect x={0} y={H - 60} width={W} height={60} fill="oklch(0.12 0.02 284)" />
      <Booth x={110} color="oklch(0.64 0.13 215)" stripe="oklch(0.85 0.07 210)" />
      <Booth x={650} top={700} color="oklch(0.55 0.19 285)" stripe="oklch(0.92 0.04 290)" />
      <Booth x={1190} color="oklch(0.60 0.17 300)" stripe="oklch(0.85 0.07 295)" />
      {[[70, 120], [450, 150], [520, 128], [600, 110], [1000, 140], [1090, 118], [1530, 150], [1470, 110]].map(([x, h], i) => <Person key={i} x={x!} h={h!} tone={tone} />)}
    </svg>
  );
}

// Hack Night scene used by the image-expansion section: a lecture hall mid-event, with the
// projector, laptops, mentors and pizza. Same palette and flat style as the campus layers.
export function HackNightArt() {
  const GW = 1600, GH = 1000;
  const rand = rng(42);
  const desks = [0, 1, 2].flatMap((row) => Array.from({ length: 6 - row }, (_, i) => ({ row, x: 170 + row * 110 + i * (1260 - row * 220) / (6 - row), y: 640 + row * 110 })));
  return (
    <svg aria-hidden="true" className="h-full w-full" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="h-wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.17 0.03 265)" /><stop offset="1" stopColor="oklch(0.22 0.05 280)" /></linearGradient>
        <linearGradient id="h-screen" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.32 0.1 260)" /><stop offset="1" stopColor="oklch(0.28 0.12 295)" /></linearGradient>
        <linearGradient id="h-beam" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.85 0.1 210 / .28)" /><stop offset="1" stopColor="oklch(0.85 0.1 210 / 0)" /></linearGradient>
        <radialGradient id="h-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="oklch(0.8 0.14 205 / .55)" /><stop offset="1" stopColor="oklch(0.8 0.14 205 / 0)" /></radialGradient>
      </defs>
      <rect width={GW} height={GH} fill="url(#h-wall)" />
      <path d={`M0 600 L${GW} 600 L${GW} ${GH} L0 ${GH} Z`} fill="oklch(0.13 0.02 265)" />
      {/* projector screen */}
      <rect x={430} y={90} width={740} height={400} rx={10} fill="oklch(0.1 0.02 265)" />
      <rect x={446} y={106} width={708} height={368} rx={6} fill="url(#h-screen)" />
      <text x={800} y={250} textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontWeight={800} fontSize={88} fill="oklch(0.96 0.01 250)">HACK NIGHT</text>
      <text x={800} y={310} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight={600} fontSize={30} fill="oklch(0.8 0.14 205)">Build your first app tonight</text>
      {[["Coding Club", "oklch(0.8 0.14 205)"], ["Design Club", "oklch(0.76 0.17 335)"], ["Entrepreneurship Club", "oklch(0.72 0.18 290)"]].map(([n, c], i) => (
        <g key={n}><circle cx={560 + i * 190} cy={400} r={9} fill={c} /><text x={576 + i * 190} y={408} fontFamily="DM Sans, sans-serif" fontSize={22} fill="oklch(0.85 0.02 250)">{n}</text></g>
      ))}
      <path d="M760 0 L840 0 L1180 600 L420 600 Z" fill="url(#h-beam)" opacity={0.5} />
      {/* banner of club pennants */}
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${60 + i * 110} 40 L${130 + i * 110} 40 L${95 + i * 110} 90 Z`} fill={BULB_COLORS[i % BULB_COLORS.length]} opacity={0.75} />)}
      <path d="M40 40 L1560 40" stroke="oklch(0.3 0.03 265)" strokeWidth={3} />
      {/* side whiteboard with workshop schedule */}
      <rect x={80} y={170} width={280} height={250} rx={8} fill="oklch(0.9 0.01 250)" />
      {["6:00  Kickoff", "6:30  Design workshop", "7:15  Build time", "8:45  Pitches"].map((t, i) => <text key={t} x={104} y={225 + i * 50} fontFamily="DM Sans, sans-serif" fontSize={24} fill="oklch(0.25 0.03 265)">{t}</text>)}
      {/* pizza table */}
      <rect x={1250} y={470} width={290} height={24} rx={6} fill="oklch(0.3 0.04 60)" />
      {[0, 1, 2].map((i) => <g key={i}><rect x={1270 + i * 88} y={438 - i * 6} width={78} height={32} rx={4} fill="oklch(0.78 0.1 75)" /><rect x={1270 + i * 88} y={438 - i * 6} width={78} height={8} rx={3} fill="oklch(0.65 0.12 40)" /></g>)}
      <rect x={1262} y={494} width={12} height={110} fill="oklch(0.2 0.03 265)" /><rect x={1516} y={494} width={12} height={110} fill="oklch(0.2 0.03 265)" />
      {/* desks with glowing laptops and students */}
      {desks.map((d, i) => {
        const w = 150 - d.row * 5;
        return (
          <g key={i}>
            <ellipse cx={d.x + w / 2} cy={d.y - 18} rx={70} ry={40} fill="url(#h-glow)" opacity={0.7} />
            <circle cx={d.x + w / 2} cy={d.y - 78 + d.row * 4} r={22 - d.row} fill="oklch(0.08 0.01 265)" />
            <path d={`M${d.x + w / 2 - 38} ${d.y - 6} Q${d.x + w / 2} ${d.y - 70} ${d.x + w / 2 + 38} ${d.y - 6} Z`} fill="oklch(0.08 0.01 265)" />
            <path d={`M${d.x + 30} ${d.y - 4} L${d.x + 48} ${d.y - 44} L${d.x + w - 48} ${d.y - 44} L${d.x + w - 30} ${d.y - 4} Z`} fill={rand() > 0.5 ? "oklch(0.8 0.14 205 / .85)" : "oklch(0.72 0.18 290 / .8)"} />
            <rect x={d.x} y={d.y - 6} width={w} height={14} rx={3} fill="oklch(0.25 0.03 265)" />
            <rect x={d.x + 8} y={d.y + 8} width={8} height={70} fill="oklch(0.18 0.02 265)" /><rect x={d.x + w - 16} y={d.y + 8} width={8} height={70} fill="oklch(0.18 0.02 265)" />
          </g>
        );
      })}
      {/* a mentor standing and pointing at a screen */}
      <g fill="oklch(0.06 0.01 265)"><circle cx={1180} cy={560} r={24} /><path d="M1150 700 L1158 590 Q1180 576 1202 590 L1210 700 Z" /><path d="M1200 600 L1250 575 L1254 584 L1205 612 Z" /></g>
    </svg>
  );
}
