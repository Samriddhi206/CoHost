# CoHost — Neon Campus

User-directed visual update: graphite and near-black surfaces, electric cyan actions, violet collaboration accents, luminous campus scenery. All screens use the shared dark semantic tokens in src/styles.css. Maintain readable contrast, reduced-motion support, responsive layouts, and existing auth and database behavior.

# CoHost design system — "Campus after dark"

Source of truth for the CoHost UI. Page files in `pages/` override this file where they differ.
Direction was chosen from the ui-ux-pro-max catalogue: product rows "Social / Community" and
"Educational App" point to **Motion-Driven + Vibrant & Block-based**, with **Aurora UI** for hero
atmosphere. Typography follows the "Bold Statement / Tech Startup" pairings, adapted.

## Vibe

The ten minutes before a club fair opens. The sky turns from violet to ink, string lights come on,
three clubs are still setting up their tables, and everyone can feel it's going to work. Warm,
lively and a little theatrical on the landing page; calm, legible and trustworthy inside the app,
because that is where people commit money and time.

Two moods, one system:

| Surface | Mood | Background | Motion budget |
| --- | --- | --- | --- |
| Landing (`/`) | Cinematic, storytelling | Ink night scenes alternating with warm paper | High: parallax, pinned scenes, scroll-linked zoom |
| Auth (`/auth`, `/reset-password`) | Focused | Ink scene left, paper form right | Low: entrance only |
| App and demo (`/app`, `/demo/*`) | Working tool | Warm paper, white cards, ink sidebar | Subtle: page fade, card lift, press feedback |

## Color tokens

All component code uses semantic tokens (`bg-primary`, `text-muted-foreground`), never raw hex.

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `--ink` | `#11111C` | Night scenes, sidebar, headings | 16.9:1 on paper |
| `--paper` / `--background` | `#F7F3EC` | App and content background | — |
| `--card` | `#FFFFFF` | Cards, inputs | — |
| `--foreground` | `#191927` | Body text | 15.7:1 on paper |
| `--muted-foreground` | `#5C5A6B` | Secondary text | 6.1:1 on paper |
| `--primary` | `#5546D6` (violet) | Buttons, links, focus, agents | 6.5:1 white-on-violet; 5.9:1 as text on paper |
| `--flare` | `#FF6A3D` (tangerine) | Hero CTA (ink text), highlights, Photo Club | 6.6:1 ink-on-flare |
| `--mint` / `--accent` | `#17784F` text on `#E3F5EC` | Approved, confirmed | 4.8:1 |
| `--pending` | `#8A5A00` text on `#FFF1D6` | Waiting, conflicts | 5.3:1 |
| `--destructive` | `#C0352B` | Errors | 5.6:1 on white |
| `--club-photo` / `--club-business` / `--club-art` | tangerine / violet / `#E0457B` | Club identity chips and scene accents | decorative only |

Color is never the only signal: every status badge carries a word ("Approved", "Needs leader approval").

## Typography

- Display: **Bricolage Grotesque** 600/700/800, tracking −0.03em, `text-wrap: balance`.
- Body and UI: **DM Sans** 400/500/600/700, 16px base, line-height 1.6.
- Scale (landing): 14 / 16 / 20 / 28 / 44 / 72 / clamp(3.25rem, 9vw, 8.5rem) for the hero.
- Scale (app): 12 / 14 / 16 / 20 / 28 / 36.
- Eyebrows: 12px, 700, uppercase, tracking 0.18em.

## Spacing and shape

- 4px base; rhythm 8 / 12 / 16 / 24 / 32 / 48 / 96 / 160.
- Landing sections: 160px vertical on desktop, 96px on mobile. App sections: 24px gaps.
- Radius: 12 (inputs) / 20 (cards) / 32 (scene frames) / 999 (buttons, badges).
- Gutter 16px under 640px, 24px to 1024px, 48px above. Max content width 1200px (landing), 1440px (app).
- Shadows are soft and warm: `0 1px 2px rgb(17 17 28 / .06), 0 12px 32px -12px rgb(17 17 28 / .18)`.

## Layout

### Landing (`/`)

1. **Nav**: fixed, transparent over the hero; becomes a frosted paper pill after 40px of scroll.
2. **Hero scene** (100svh, ink): five parallax layers, back to front: aurora sky with stars, far
   campus skyline, near buildings with lit windows, string lights, and the fair booths of the three
   clubs. Headline words rise in on load (staggered 60ms). On scroll, layers separate at
   0.1 / 0.25 / 0.45 / 0.7 / 1.0 speed and the headline drifts up and fades.
3. **Image expansion** (pinned, 260vh scroll): the event poster scene "Campus Through Our Eyes"
   starts as a rounded card at 58% width, expands to full-bleed while its artwork zooms from 1.0 to
   1.18. Captions for the three clubs fade in at 30 / 50 / 70% progress.
4. **The negotiation** (pinned, ~400vh): a scroll-driven replay of the real demo scenario. Left
   column steps through: private briefs → first proposal → conflict (Art Club needs setup done by
   5:00 PM) → counteroffer v2 → leaders approve → organizer publishes → students confirm. Right
   column shows the agent messages and the agreement card updating in step. A progress rail shows
   the step. This section answers the Track 2 judging questions directly.
5. **Private vs shared**: two cards side by side. Private brief (locked, blurred text) vs. what the
   agents actually share (contributions, timing). Cards tilt slightly toward the cursor.
6. **Guarantees bento**: versioned agreements, leader-owned approvals, fair crews, enforced in
   Postgres. Hover lifts cards 4px and reveals an icon micro-animation.
7. **Finale scene** (ink): layered dusk skyline with the booths lit, CTA to the demo and sign-in.

### App and demo

- Ink sidebar (230px) with violet active state; on mobile, a bottom tab bar (demo) or a top chip row.
- Paper canvas, white cards (`panel`), 24px gaps.
- Route and tab changes cross-fade with a 12px rise (220ms).

## Motion

| Purpose | Duration | Easing |
| --- | --- | --- |
| Press feedback (scale 0.97) | 120ms | ease-out |
| Hover lift, color shifts | 200ms | `cubic-bezier(.2,.8,.2,1)` |
| Page and tab transitions | 220ms in / 160ms out | same |
| Entrance reveals | 600–800ms, stagger 60–90ms | `cubic-bezier(.16,1,.3,1)` |
| Scroll-linked scenes | tied to scroll position, smoothed by a spring (stiffness 120, damping 30) | — |
| Ambient (stars, light bulbs) | 3–8s loops | ease-in-out |

- Smooth scrolling uses Lenis on the landing page only (never inside the app, where native scroll
  is expected).
- Only `transform` and `opacity` animate. No width/height animation; the expansion uses
  `clip-path: inset()` plus scale.
- `prefers-reduced-motion: reduce` turns off Lenis, parallax, pinning effects and ambient loops; every
  scene renders in its final, readable state.

## Accessibility checklist

- Text contrast ≥ 4.5:1 (table above); focus ring 2px violet with 2px offset on every control.
- Decorative SVG scenes are `aria-hidden`; each pinned section has a real heading and text that a
  screen reader reads in order.
- Touch targets ≥ 44px; no hover-only information.
- Tested at 375px, 768px, 1280px and 1440px; no horizontal scroll.

## Anti-patterns to avoid

- Emoji as icons (use lucide-react).
- Gray text on gray, or tangerine text on paper (fails contrast; tangerine is fill-only).
- Motion that hides content until JavaScript runs: server-rendered markup is visible by default.
- Animating layout properties or scroll-jacking inside the app.
