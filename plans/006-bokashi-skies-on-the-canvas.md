# Plan 006: Five bokashi skies drift on the canvas, with the rule wording Nick must approve before they ship

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 4f9ae7b..HEAD -- gallery/src/canvas gallery/src/motion/index.tsx gallery/src/components/button.tsx proposals/bokashi.md`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (nothing shipped changes: the pictures live on the canvas, which the page checks never visit)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `4f9ae7b`, 2026-11-11

## Why this matters

Nick, 2026-11-11: "can you add some japanese moving gradients to the visuals
in flat instead of the current ones". Flat's pictures today are stand-ins: a
grey plate that says "Hero, Bakehouse Nord" on Flat's system page, and
sky-and-hills drawings in the Case study and Collection screens.

Nick then chose two things:

1. **The style: bokashi skies.** The gradation of woodblock prints: a deep band
   at the top fading down to pale paper, a second band rising from the
   horizon, some with a red sun disc, with a paper grain.
2. **The motion: an exception for pictures.** A picture is content, like a
   video, so it may drift slowly on its own; it stays still under reduced
   motion and while off screen.

That second choice changes two of Nick's own taste rules (R2: "glow, grain and
gradients never animate"; R4: motion that is not a response to the user
fails), and the repo's rule is that taste changes only with Nick approving the
exact wording. How fast a sky drifts and which pigments it uses are also
things to judge by eye. So this plan does **not** change the shipped screens
or the rules. It builds the skies, moving, on the language canvas (`#canvas`,
the repo's place for trying the language), with a pause control, and writes a
proposal that holds the rule wording and the open choices. A later plan ships
them into Flat once Nick has looked.

## Current state

### Files and their roles

- `gallery/src/canvas/registry.tsx` — what is on the canvas: one `CanvasItem` per piece (`id`, `name`, `x`, `y`, `width`, `height`, `render`). You add entries here.
- `gallery/src/canvas/scale.tsx`, `accents.ts`, `blues.tsx` — existing canvas experiments. Match their style: a file comment that says what the experiment is and that it goes with the canvas.
- `gallery/src/canvas/canvas.tsx` — the camera and gestures. **Do not edit.**
- `gallery/src/motion/index.tsx` — exports `useMotionDial()`, whose result has `reduced: boolean` ("True when the system asks for reduced motion or the preview switch is on").
- `gallery/src/components/button.tsx` — `Button`, with `size="sm"` and `variant="ghost"` among its options (used in `blues.tsx` and `registry.tsx`).
- `gallery/src/gallery/systems/flat.tsx:27-29` — Flat's hero stand-in today:

```tsx
      <Media alt="" ratio={2.4} radius="surface">
        <div className="grid size-full place-items-center bg-surface-3 text-caption text-fg-muted">Hero, Bakehouse Nord</div>
      </Media>
```

- `proposals/` — one Markdown file per design question, written for Nick, with a decisions table.

### The convention for the canvas (from `.claude/CLAUDE.md`)

"`#canvas` is the language canvas … a freeform workspace of live previews for
rethinking litt, not a page. It has no nav entry or wall tile, and the page
checks never see it. Content lives in `registry.tsx` (ids, names, sizes,
positions); experiments stay in the folder and use only tokens, and nothing in
`src/components` changes for them … Candidate values under comparison (such as
accents) carry `litt-allow` and move into `tokens.css` once picked."

How the registry's last entries look (`gallery/src/canvas/registry.tsx`), so
you can place the new ones after them:

```tsx
/* Flat's scale candidates (scale.tsx), under the pairs: the settings panel four times, then the case study four times. */
const SCALE_ROW = { settings: 2720, caseStudy: 3760 };
export const ITEMS: CanvasItem[] = [
  …
  ...SCALES.flatMap((scale, i): CanvasItem[] => [
    { id: `scale-${scale.id}-settings`, … y: SCALE_ROW.settings, width: 560, height: 760, … },
    { id: `scale-${scale.id}-case-study`, … x: i * 1160, y: SCALE_ROW.caseStudy, width: 1080, height: 1200, … },
  ]),
];
```

The case-study row starts at y 3760 and each piece is at least 1200 tall, and
the case study itself runs to about 3000px, so the new pieces go far to the
left of everything else, where nothing is: x from -2600.

### The lint, and how an experiment is exempted

`skills/litt-md/scripts/lint-litt.mjs` (run by `npm run lint:litt --prefix gallery`) fails these, among others, in `gallery/src`:

- a quoted hex colour, and raw colour functions (`oklch(`, `lab(` …). CSS named colours are not flagged in the gallery.
- `duration: 28` or any motion option followed by a number: "literal motion timing".
- `ease: "easeInOut"` and other named easings.
- `transition={{`: "inline transition object".

Its header: "Put `litt-allow` on a line (in a comment) to exempt it, with a
reason." A line that contains `litt-allow` is skipped whole. Examples in the
repo:

```tsx
  const own: Transition = { type: "tween", duration: duration / 1000, ease: curve }; // litt-allow: the preview runs on the curve being edited
```

### The two rules this touches (quoted from `skills/litt-md/taste/profile.md`, which you must NOT edit)

- R2: "Material is still unless a hand is on it: glow, grain and gradients never animate, pulse or follow the cursor…" and its check: "Any animation or transition on background-image, filter or glow opacity fails".
- R4's check: "Motion that is not a response to the user (scroll-triggered reveals, looping autoplay, parallax, a marquee, a pulsing or shimmering skeleton) fails."

So in this experiment: only `transform` moves (a layer slides; its gradient is
never animated), the grain never moves, the pictures stop under reduced motion,
stop while off screen, and can be paused. A pause control is also what WCAG
2.2.2 (Pause, Stop, Hide) asks of anything that moves on its own for more than
five seconds.

### Repo rules you must honour

- No hex values in `gallery/src` or Markdown. The skies use CSS named colours, as the Case study block's drawn pictures do ("named colors, because these are pictures, not the interface").
- Radii: only `rounded-control`, `rounded-surface`, `rounded-pill`.
- Refer to Nick by name or as "you"; never gendered pronouns.
- Never edit `skills/litt-md/taste/**`. This plan proposes rule wording in a proposal file only.
- Never push.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Typecheck | `npm run typecheck --prefix gallery` | exit 0 |
| Lint | `npm run lint:litt --prefix gallery` | exit 0 |
| Verify | `npm run verify --prefix gallery` | exit 0 |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Lock untouched | `git diff --exit-code -- gallery/registry.lock.json` | exit 0, no output |

Step 4 needs Playwright, which is deliberately not a dependency. The script
looks in `$A11Y_TOOLS`, the gallery, then `/opt/node22/lib`. If it reports
Playwright missing, install it beside the repo as CI does:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope** (the only files you should modify or create):
- `gallery/src/canvas/bokashi.tsx` (create)
- `gallery/src/canvas/registry.tsx` (one import and two entries)
- `proposals/bokashi.md` (create)
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch, even though they look related):
- `gallery/src/gallery/systems/flat.tsx`, `gallery/src/blocks/**`, `gallery/src/components/**` — Flat's screens keep their current pictures until Nick has seen the skies move.
- `skills/litt-md/taste/**`, `skills/litt-md/system/**` — the rule wording is proposed, not applied.
- `skills/litt-md/assets/tokens.css`, `tailwind.css`, `gallery/src/app.css` — no new token and no keyframes.
- `gallery/src/canvas/canvas.tsx`, `layout.ts`, and the other experiments.
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json` — nothing the registry ships changes.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/bokashi-canvas`.
- Two commits: `gallery: bokashi skies, drifting, on the canvas` and `proposals: bokashi skies for Flat's pictures`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `npm ci --prefix gallery`, `npm run verify --prefix gallery`, `npm run build --prefix gallery`.

**Verify**: all exit 0, and `git status --short` prints nothing.

### Step 2: Create `gallery/src/canvas/bokashi.tsx`

Create the file with exactly this content:

```tsx
/**
 * Bokashi skies: candidate pictures for Flat, moving, compared on the canvas (proposals/bokashi.md). Bokashi is the
 * gradation of a woodblock print: a deep band at the top fading down to pale paper, a second band rising from the
 * horizon, sometimes a red sun. These are an experiment, not components: the ones Nick picks become Flat's pictures
 * in a later change, and this file goes with the canvas.
 *
 * - A sky is paper, two bands and an optional sun, each its own layer. Only a layer's transform moves: a band slides a
 *   little up or down and back, over about half a minute each way. No gradient is animated and the grain never moves
 *   (R2). The colors are CSS named colors, because these are pictures, not the interface.
 * - A picture moving on its own is an exception to R4 that Nick chose for pictures; it is not yet in the profile. So a
 *   sky is still under reduced motion (the motion dial), still while it is off screen, and still when paused: the
 *   Pause button stops every sky where it stands (WCAG 2.2.2).
 */
import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, type AnimationPlaybackControls, type MotionValue } from "motion/react";
import { Button } from "@/components/button";
import { useMotionDial } from "@/motion";

export type Sky = {
  id: string;
  name: string;
  note: string;
  /** The paper, the band at the top, the band at the horizon, and the sun if the sky has one. */
  paper: string;
  deep: string;
  glow: string;
  sun?: string;
};

export const SKIES: Sky[] = [
  { id: "dawn", name: "Dawn", note: "Night blue over salmon, a red sun", paper: "linen", deep: "midnightblue", glow: "lightsalmon", sun: "crimson" },
  { id: "indigo", name: "Indigo", note: "One pigment, from full to water", paper: "aliceblue", deep: "darkslateblue", glow: "lightsteelblue" },
  { id: "persimmon", name: "Persimmon", note: "Brick over pale gold", paper: "oldlace", deep: "firebrick", glow: "navajowhite" },
  { id: "evening", name: "Evening", note: "Violet over coral, a low sun", paper: "lavenderblush", deep: "indigo", glow: "lightcoral", sun: "orangered" },
  { id: "pine", name: "Pine", note: "Deep green over mist", paper: "ivory", deep: "darkslategray", glow: "darkseagreen" },
];

/* How far a layer slides, and how long one way takes, in seconds. Slow enough to notice only if you look. */
const DRIFT = { deep: "9%", glow: "-7%", sun: "-10%" };
const SECONDS = { deep: 34, glow: 27, sun: 41 };

/* Paper grain: fractal noise at 10%, as one still layer over the sky. */
const GRAIN =
  "url(\"data:image/svg+xml," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .1 0'/></filter><rect width='240' height='240' filter='url(#g)'/></svg>",
  ) +
  "\")";

/** Slides a layer from rest to `to` and back, for ever, while `running`; pauses where it stands otherwise. */
function useDrift(value: MotionValue<string>, to: string, seconds: number, running: boolean) {
  const controls = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    if (!running) {
      controls.current?.pause();
      return;
    }
    if (controls.current) controls.current.play();
    else controls.current = animate(value, ["0%", to], { duration: seconds, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }); // litt-allow: a picture's own slow drift, not a response to a hand (proposals/bokashi.md)
  }, [value, to, seconds, running]);
  useEffect(() => () => controls.current?.stop(), []);
}

/** One sky. `ratio` is its width over its height. It drifts unless `paused`, reduced motion is on, or it is off screen. */
export function Bokashi({ sky, ratio, paused }: { sky: Sky; ratio: number; paused: boolean }) {
  const { reduced } = useMotionDial();
  const frame = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = frame.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setSeen(Boolean(entry?.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const running = seen && !paused && !reduced;
  const deep = useMotionValue("0%");
  const glow = useMotionValue("0%");
  const sun = useMotionValue("0%");
  useDrift(deep, DRIFT.deep, SECONDS.deep, running);
  useDrift(glow, DRIFT.glow, SECONDS.glow, running);
  useDrift(sun, DRIFT.sun, SECONDS.sun, running && Boolean(sky.sun));
  return (
    <div
      ref={frame}
      role="img"
      aria-label={`${sky.name}: ${sky.note}`}
      data-bokashi={sky.id}
      data-running={running ? "" : undefined}
      className="relative isolate w-full overflow-hidden rounded-surface"
      style={{ aspectRatio: String(ratio), background: sky.paper }}
    >
      <motion.div
        aria-hidden="true"
        data-bokashi-layer="deep"
        className="absolute inset-x-0 top-[-20%] h-[85%]"
        style={{ y: deep, background: `linear-gradient(to bottom, ${sky.deep} 0%, ${sky.deep} 24%, transparent 100%)` }}
      />
      <motion.div
        aria-hidden="true"
        data-bokashi-layer="glow"
        className="absolute inset-x-0 bottom-[-20%] h-[70%]"
        style={{ y: glow, background: `linear-gradient(to top, ${sky.glow} 0%, ${sky.glow} 22%, transparent 100%)` }}
      />
      {sky.sun && (
        <motion.div
          aria-hidden="true"
          data-bokashi-layer="sun"
          className="absolute top-[36%] left-[58%] w-[22%] rounded-pill"
          style={{ y: sun, aspectRatio: "1", background: `radial-gradient(circle, ${sky.sun} 0%, ${sky.sun} 60%, transparent 70%)` }}
        />
      )}
      <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

/** The five skies in a row, as prints (4 to 5), with one button that pauses them all. */
export function BokashiSkies() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-5 gap-5">
        {SKIES.map((sky) => (
          <figure key={sky.id} className="m-0 grid content-start gap-3">
            <Bokashi sky={sky} ratio={0.8} paused={paused} />
            <figcaption className="grid gap-0.5">
              <span className="text-small font-title text-fg">{sky.name}</span>
              <span className="text-caption font-normal text-fg-subtle">{sky.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div>
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the skies" : "Pause the skies"}
        </Button>
      </div>
    </div>
  );
}

/** Flat's hero picture, 2.4 to 1: the grey plate it is today, and the Dawn sky in its place. */
export function BokashiHero() {
  const [paused, setPaused] = useState(false);
  const dawn = SKIES[0]!;
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-6">
        <figure className="m-0 grid content-start gap-3">
          <div className="grid w-full place-items-center rounded-surface bg-surface-3 text-caption text-fg-muted" style={{ aspectRatio: "2.4" }}>
            Hero, Bakehouse Nord
          </div>
          <figcaption className="text-small text-fg-subtle">Today</figcaption>
        </figure>
        <figure className="m-0 grid content-start gap-3">
          <Bokashi sky={dawn} ratio={2.4} paused={paused} />
          <figcaption className="text-small text-fg-subtle">As a sky: {dawn.name}</figcaption>
        </figure>
      </div>
      <div>
        <Button size="sm" variant="ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
          {paused ? "Play the sky" : "Pause the sky"}
        </Button>
      </div>
    </div>
  );
}
```

**Verify**: `npm run typecheck --prefix gallery` → exit 0. `npm run lint:litt --prefix gallery` → exit 0.

If the typecheck or the lint rejects a line of this plan's code, fix only what the tool names, in the smallest way that keeps the file's header comment true (only transform moves; still when paused, reduced or off screen), stays inside this one file, and adds no `litt-allow` beyond the one given unless the lint names a second line of the same kind. Describe every such change in your report. If that is not enough, STOP.

### Step 3: Put the two pieces on the canvas, in `gallery/src/canvas/registry.tsx`

1. Add one import beside the other canvas imports: `import { BokashiHero, BokashiSkies } from "./bokashi";`
2. Just above `export const ITEMS: CanvasItem[] = [`, add:

```tsx
/* Bokashi skies (bokashi.tsx), candidate pictures for Flat: out to the left, clear of everything else. */
const BOKASHI_X = -2600;
```

3. As the **last** elements of the `ITEMS` array (after the `...SCALES.flatMap(…)` entry, before the closing `];`), add:

```tsx
  { id: "bokashi-skies", name: "Bokashi · five skies, drifting", x: BOKASHI_X, y: 0, width: 1240, height: 420, render: () => <BokashiSkies /> },
  { id: "bokashi-hero", name: "Bokashi · Flat's hero, today and as a sky", x: BOKASHI_X, y: 620, width: 1040, height: 320, render: () => <BokashiHero /> },
```

Change no existing entry.

**Verify**: `npm run verify --prefix gallery` → exit 0. `npm run build --prefix gallery` → exit 0. `git diff --exit-code -- gallery/registry.lock.json` → exit 0.

### Step 4: Prove the skies drift, pause, and hold still under reduced motion

Save this as `gallery/.agent-shots/check-bokashi.mjs` (`.agent-shots` is gitignored; create the folder) and run `node gallery/.agent-shots/check-bokashi.mjs`.

```js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const roots = [process.env.A11Y_TOOLS, path.join(here, ".."), "/opt/node22/lib"].filter(Boolean);
let chromium;
for (const root of roots) {
  try { ({ chromium } = createRequire(path.join(root, "noop.js"))("playwright")); break; } catch { /* next root */ }
}
if (!chromium) { console.error("playwright not found: set A11Y_TOOLS (see the plan's Commands section)"); process.exit(2); }
if (!fs.existsSync(path.join(dist, "index.html"))) { console.error("no build: run npm run build --prefix gallery"); process.exit(2); }

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist + path.sep) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);

/* Every layer's transform, in page order. A layer that is drifting gives a different string two seconds later. */
const read = (page) => page.evaluate(() => [...document.querySelectorAll("[data-bokashi-layer]")].map((el) => getComputedStyle(el).transform));
const moved = (a, b) => a.filter((t, i) => t !== b[i]).length;

const browser = await chromium.launch();
const rows = [];
let bad = 0;
const fail = (why) => { bad++; console.error(why); };
for (const reduce of [false, true]) {
  const page = await browser.newPage({ viewport: { width: 2560, height: 1600 }, reducedMotion: reduce ? "reduce" : "no-preference" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`http://localhost:${server.address().port}/index.html?look=flat#canvas`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelectorAll("[data-bokashi]").length === 6, null, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  const skies = await page.evaluate(() => document.querySelectorAll("[data-bokashi]").length);
  const running = await page.evaluate(() => document.querySelectorAll("[data-bokashi][data-running]").length);
  const a = await read(page);
  await page.waitForTimeout(2000);
  const b = await read(page);
  const row = { reducedMotion: reduce, skies, layers: a.length, running, movedIn2s: moved(a, b), errors: errors.length };
  if (!reduce) {
    /* Pause both pieces, then nothing may move; play them, and they move again. */
    for (const name of ["Pause the skies", "Pause the sky"]) await page.getByRole("button", { name }).click();
    await page.waitForTimeout(600);
    const c = await read(page);
    await page.waitForTimeout(2000);
    const d = await read(page);
    row.movedWhilePaused = moved(c, d);
    for (const name of ["Play the skies", "Play the sky"]) await page.getByRole("button", { name }).click();
    await page.waitForTimeout(600);
    const e = await read(page);
    await page.waitForTimeout(2000);
    const f = await read(page);
    row.movedAfterPlay = moved(e, f);
    await page.screenshot({ path: path.join(here, "bokashi-canvas.png") });
    const skiesBox = await page.locator('[data-canvas-item="bokashi-skies"]').boundingBox();
    if (skiesBox) await page.screenshot({ path: path.join(here, "bokashi-skies.png"), clip: skiesBox });
  }
  await page.close();
  rows.push(row);
  if (row.skies !== 6) fail(`${reduce ? "reduced" : "motion"}: ${row.skies} skies, expected 6`);
  if (row.layers !== 15) fail(`${reduce ? "reduced" : "motion"}: ${row.layers} layers, expected 15 (two bands on each of six skies, and a sun on three)`);
  if (row.errors) fail(`${reduce ? "reduced" : "motion"}: page errors: ${errors[0]}`);
  if (reduce) {
    if (row.running !== 0) fail(`reduced: ${row.running} skies say they are running`);
    if (row.movedIn2s !== 0) fail(`reduced: ${row.movedIn2s} layers moved`);
  } else {
    if (row.running !== 6) fail(`motion: only ${row.running} of 6 skies are running`);
    if (row.movedIn2s < 12) fail(`motion: only ${row.movedIn2s} of 15 layers moved in two seconds`);
    if (row.movedWhilePaused !== 0) fail(`motion: ${row.movedWhilePaused} layers moved while paused`);
    if (row.movedAfterPlay < 12) fail(`motion: only ${row.movedAfterPlay} layers moved after Play`);
  }
}
await browser.close();
server.close();
console.table(rows);
console.log(bad ? `${bad} problem(s).` : "The skies drift, pause, and hold still under reduced motion.");
process.exit(bad ? 1 : 0);
```

**Verify**: exit 0, last line `The skies drift, pause, and hold still under reduced motion.`, two rows. Keep the table for your report. `gallery/.agent-shots/bokashi-canvas.png` and `bokashi-skies.png` are for the reviewer; do not commit them.

If the script fails only on `only N of 15 layers moved` with N between 8 and 11, the drift may simply be too slow to show in two seconds near a turning point: run the script once more. If it fails the same way twice, STOP and report both tables.

Commit Steps 2 and 3: `git add gallery/src/canvas/bokashi.tsx gallery/src/canvas/registry.tsx`, message `gallery: bokashi skies, drifting, on the canvas`.

### Step 5: Write `proposals/bokashi.md`

Create the file with exactly this content. Do not fill in the Decision column.

```markdown
# Bokashi skies: moving pictures for Flat

Written 2026-11-11 for Nick. Nick, on Flat: "can you add some japanese moving gradients to the visuals in flat instead of the current ones". Asked what Japanese should mean, Nick chose bokashi skies: the gradation of a woodblock print, a deep band at the top fading down to pale paper, a second band rising from the horizon, some with a red sun, and a paper grain. Asked how they may move, since R2 and R4 keep gradients and unprompted motion still, Nick chose an exception for pictures: a picture is content, like a video, so it may drift slowly on its own, still under reduced motion and while off screen.

This is a proposal, not a build. Flat's screens keep their pictures and the profile keeps its rules until Nick has seen the skies move. Five skies are live on the canvas (`#canvas`, out to the left: "Bokashi · five skies, drifting" and "Bokashi · Flat's hero, today and as a sky"; `gallery/src/canvas/bokashi.tsx`).

## What a sky is

Paper, two bands and sometimes a sun, each its own layer, with a still grain over them. Only a layer's transform moves: the top band slides down about a tenth of its height and back over 34 seconds each way, the horizon band the other way over 27, the sun over 41, so the three never line up twice the same way. No gradient is animated and the grain never moves.

| Sky | Paper | Top band | Horizon band | Sun |
|---|---|---|---|---|
| Dawn | linen | midnight blue | light salmon | crimson |
| Indigo | alice blue | dark slate blue | light steel blue | none |
| Persimmon | old lace | firebrick | navajo white | none |
| Evening | lavender blush | indigo | light coral | orange red |
| Pine | ivory | dark slate grey | dark sea green | none |

The colors are CSS named colors for now, as the Case study's drawn pictures are, because a picture is not the interface. They are the nearest named colors to the pigments, not the pigments.

## What moving costs

- **Two rules change.** The wording below is proposed, not applied.
  - R2, after "glow, grain and gradients never animate, pulse or follow the cursor": "A picture is content, not material: a picture that is itself a gradient (Flat's bokashi skies) may drift, by transform only, and its grain stays still."
  - R4, after the list of motion that fails: "One exception: a picture may move on its own. It drifts slowly (twenty seconds or more each way), by transform only; it is still under reduced motion and while off screen; it can be paused; and it is never a control, never a state, and never the view's one expressive moment."
- **A pause control is required.** WCAG 2.2.2 asks that anything moving on its own for more than five seconds can be paused, stopped or hidden. On the canvas one button pauses every sky. On a real screen the control needs a place: on each picture, or once for the page.
- **The scenes' contract changes.** `gallery/src/gallery/systems/scene.ts` says a scene "moves nothing on its own (R4)"; a Flat scene with a sky needs the same exception written there.
- **The lightbox takes a still.** Carousel, Lightbox and the cards take an image address, not a live layer, so a sky opened large is a still picture of itself.
- **The checks.** `test:motion` runs under reduced motion, where a sky is still, so it stays green. Nothing in CI fails when something moves with motion allowed; the before-and-after picture comparisons the data plans use already run with motion reduced.

## Decisions

| # | Question | Suggested | Decision |
|---|---|---|---|
| 1 | Do the skies read as bokashi, and as Flat? | Judge on the canvas, in light and dark. | |
| 2 | Which skies go in? | Dawn for the hero; Indigo, Persimmon, Evening and Pine for the series and the covers. Drop any that reads as a web gradient, not a print. | |
| 3 | Is the drift the right speed and distance? | Slow enough that it is noticed only by looking. If it reads as a screensaver, halve the distance before changing the time. | |
| 4 | The R2 and R4 wording above | Approve or edit. It goes into `taste/profile.md` through `workflows/evolve.md`, as a `taste:` commit, only with Nick's yes. | |
| 5 | Where does the pause control live? | One small icon button on each moving picture, shown on hover and on keyboard focus and always reachable by keyboard, saying "Pause the picture" or "Play the picture". | |
| 6 | Are the colors named colors, or new picture tokens? | Named colors while they are stand-ins. If the skies become a part people install, give each pigment a token so both themes and the registry can carry it. | |
| 7 | Is a sky a part of its own, only in Flat? | Yes: Flat has no part of its own yet, and a sky is one that is wrong in Press and Device. It would be Flat's first Only here. | |

## After the decision

A second plan ships the skies: the picked skies as Flat's pictures (the hero on Flat's system page, the Case study and Collection screens), the pause control, the rule wording in the profile and in `foundations.md`, the scenes' contract, a changelog line, and this canvas experiment removed.
```

**Verify**:
- `grep -c '^| [1-7] |' proposals/bokashi.md` → `7`
- `grep -nE '#[0-9a-fA-F]{6}\b' proposals/bokashi.md` → no output
- `node skills/litt-md/scripts/check.mjs` → ends with `All checks passed.`

Commit: `git add proposals/bokashi.md`, message `proposals: bokashi skies for Flat's pictures`.

### Step 6: Final checks

Run `npm run verify --prefix gallery`, `npm run build --prefix gallery`, `node gallery/.agent-shots/check-bokashi.mjs`, `git status --short`.

**Verify**: the first three exit 0; `git status --short` prints nothing except, at most, `plans/README.md`.

## Test plan

- No unit tests: the canvas is an experiment surface the page checks deliberately never visit, and nothing shipped changes.
- The behavioural proof is Step 4's script: six skies and fifteen layers; with motion allowed, all six say they are running and at least twelve layers change position in two seconds; after Pause nothing moves and after Play they move again; under reduced motion none is running and nothing moves; no page errors.
- Regression proof that nothing shipped moved: `verify` and `build` pass, and `gallery/registry.lock.json` is unchanged.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run verify --prefix gallery` and `npm run build --prefix gallery` exit 0
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] `node gallery/.agent-shots/check-bokashi.mjs` exits 0 and prints `The skies drift, pause, and hold still under reduced motion.`
- [ ] `git diff --exit-code <starting commit> -- gallery/registry.lock.json gallery/CHANGELOG.md skills/ gallery/src/components gallery/src/blocks gallery/src/gallery gallery/src/motion` exits 0 (nothing shipped changed)
- [ ] `git diff --stat <starting commit> -- gallery/src/canvas` lists exactly `bokashi.tsx` and `registry.tsx`
- [ ] `grep -c 'litt-allow' gallery/src/canvas/bokashi.tsx` prints 1, unless the report explains a second one
- [ ] `proposals/bokashi.md` exists and its Decision column is empty
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows changes and the excerpts in "Current state" no longer match.
- The lint or the typecheck rejects the plan's code in a way Step 2's allowance does not cover. Do not weaken the lint or edit its fixtures.
- Step 4's script fails after you have checked `bokashi.tsx` against Step 2 character for character, other than the retry Step 4 allows. Report its table. Do not change its expectations.
- Under reduced motion anything moves, or after Pause anything moves. That is the experiment failing its own promise; do not commit it.
- Any step seems to need a change outside the in-scope files.
- You are tempted to edit `taste/profile.md`, `flat.tsx` or a block, or to fill in the Decision column. Those are Nick's to decide, and shipping is the next plan.

## Maintenance notes

- **This plan ends at a decision.** The plan that ships the skies can be written once Nick has filled in the Decision column of `proposals/bokashi.md`. It touches the profile (through `skills/litt-md/workflows/evolve.md`, with a `taste:` commit), `system/foundations.md`, `gallery/src/gallery/systems/scene.ts` and `flat.tsx`, the Case study and Collection blocks, the changelog and the lock.
- **Shipped code cannot use named colors the way the canvas does.** The host lint (`lint-litt.mjs --host`, run over the built registry) fails a named color in a CSS value. A shipped sky needs picture tokens, or its colors inside an image address as the Case study's drawn pictures have them.
- **Performance to watch when it ships**: each sky is three composited layers and one still noise layer. A page with a hero, a carousel and a grid of skies could hold twenty or more moving layers; the off-screen pause is what keeps that cheap, so it must survive the move from the canvas.
- **Reviewer**: look at `bokashi-skies.png` and at the canvas on the preview, in light and dark, and confirm the pause and reduced-motion rows of Step 4's table.
