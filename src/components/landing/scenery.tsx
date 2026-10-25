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

// Gallery scene used by the image-expansion section: the exhibition itself.
export function GalleryArt() {
  const GW = 1600, GH = 1000;
  return (
    <svg aria-hidden="true" className="h-full w-full" viewBox={`0 0 ${GW} ${GH}`} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="g-wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.3 0.05 290)" /><stop offset="1" stopColor="oklch(0.22 0.04 286)" /></linearGradient>
        <linearGradient id="g-floor" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.3 0.04 60)" /><stop offset="1" stopColor="oklch(0.16 0.02 284)" /></linearGradient>
        <linearGradient id="g-sun" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.55 0.16 320)" /><stop offset=".6" stopColor="oklch(0.75 0.17 45)" /><stop offset="1" stopColor="oklch(0.88 0.12 80)" /></linearGradient>
        <linearGradient id="g-lake" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.35 0.14 285)" /><stop offset="1" stopColor="oklch(0.7 0.1 220)" /></linearGradient>
        <linearGradient id="g-beam" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="oklch(0.98 0.03 85 / .45)" /><stop offset="1" stopColor="oklch(0.98 0.03 85 / 0)" /></linearGradient>
        <clipPath id="c1"><rect x={150} y={250} width={380} height={300} /></clipPath>
        <clipPath id="c2"><rect x={610} y={200} width={380} height={400} /></clipPath>
        <clipPath id="c3"><rect x={1070} y={250} width={380} height={300} /></clipPath>
      </defs>
      <rect width={GW} height={GH} fill="url(#g-wall)" />
      <path d={`M0 720 L${GW} 720 L${GW} ${GH} L0 ${GH} Z`} fill="url(#g-floor)" />
      {[340, 800, 1260].map((x) => <path key={x} d={`M${x - 20} 0 L${x + 20} 0 L${x + 240} 720 L${x - 240} 720 Z`} fill="url(#g-beam)" />)}
      {[340, 800, 1260].map((x) => <rect key={x} x={x - 30} y={0} width={60} height={26} rx={6} fill="oklch(0.14 0.02 284)" />)}
      {/* Photography Club: campus at sunset */}
      <rect x={136} y={236} width={408} height={328} rx={6} fill="oklch(0.96 0.01 82)" />
      <g clipPath="url(#c1)">
        <rect x={150} y={250} width={380} height={300} fill="url(#g-sun)" />
        <circle cx={340} cy={430} r={60} fill="oklch(0.94 0.1 85)" />
        <path d="M150 470 L190 470 L190 420 L230 420 L230 380 L250 350 L270 380 L270 440 L330 440 L330 410 L380 410 L380 455 L440 455 L440 400 L470 400 L470 460 L530 460 L530 550 L150 550 Z" fill="oklch(0.22 0.05 300)" />
      </g>
      {/* Business Club: night market lake */}
      <rect x={596} y={186} width={408} height={428} rx={6} fill="oklch(0.96 0.01 82)" />
      <g clipPath="url(#c2)">
        <rect x={610} y={200} width={380} height={400} fill="url(#g-lake)" />
        <path d="M610 420 L700 300 L760 360 L840 260 L990 420 Z" fill="oklch(0.3 0.08 285)" />
        <path d="M610 420 L990 420 L990 600 L610 600 Z" fill="oklch(0.45 0.1 240)" />
        {Array.from({ length: 9 }, (_, i) => <rect key={i} x={630 + i * 40} y={440 + (i % 3) * 30} width={22} height={4} rx={2} fill="oklch(0.88 0.12 80)" opacity={0.7} />)}
        <circle cx={900} cy={270} r={26} fill="oklch(0.95 0.03 90)" />
      </g>
      {/* Art Club: abstract piece */}
      <rect x={1056} y={236} width={408} height={328} rx={6} fill="oklch(0.96 0.01 82)" />
      <g clipPath="url(#c3)">
        <rect x={1070} y={250} width={380} height={300} fill="oklch(0.93 0.03 350)" />
        <circle cx={1170} cy={360} r={80} fill="oklch(0.62 0.2 4)" />
        <circle cx={1330} cy={430} r={110} fill="oklch(0.55 0.19 285)" opacity={0.9} />
        <rect x={1200} y={300} width={90} height={190} rx={45} fill="oklch(0.72 0.17 40)" opacity={0.9} />
        <path d="M1070 520 Q1200 440 1300 520 T1450 500 L1450 550 L1070 550 Z" fill="oklch(0.55 0.11 160)" />
      </g>
      {/* Art Club's display stands */}
      {[230, 470, 1130, 1370].map((x) => (
        <g key={x} fill="oklch(0.18 0.03 284)">
          <rect x={x - 40} y={760} width={80} height={110} rx={4} />
          <rect x={x - 50} y={750} width={100} height={14} rx={3} fill="oklch(0.26 0.04 286)" />
          <rect x={x - 22} y={712} width={44} height={38} rx={3} fill={x < 800 ? "oklch(0.72 0.17 40)" : "oklch(0.62 0.19 4)"} />
        </g>
      ))}
      {/* visitors */}
      {[[380, 300], [520, 260], [700, 330], [860, 280], [1000, 310], [1220, 270], [120, 280], [1500, 320]].map(([x, h], i) => {
        const y = GH;
        return (
          <g key={i} fill="oklch(0.1 0.02 284)">
            <circle cx={x} cy={y - h!} r={h! * 0.11} />
            <path d={`M${x! - h! * 0.22} ${y} L${x! - h! * 0.18} ${y - h! * 0.7} Q${x} ${y - h! * 0.9} ${x! + h! * 0.18} ${y - h! * 0.7} L${x! + h! * 0.22} ${y} Z`} />
          </g>
        );
      })}
    </svg>
  );
}
