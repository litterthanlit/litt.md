# Plan 002: Stat shows its figure three ways, one body per world, and the data wave comes next

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat c268523..HEAD -- gallery/src/components/stat.tsx gallery/src/components/bodies gallery/src/components/seven-segment.tsx gallery/src/gallery/pages/18-stat.tsx gallery/src/gallery/pages/17-legend.tsx gallery/src/motion/deal.ts gallery/src/motion/index.tsx gallery/CONTRIBUTING.md gallery/CHANGELOG.md skills/litt-md/system/components.md proposals/worlds.md`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (it changes a shipped registry item, and how good each body looks can only be judged by eye)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c268523`, 2026-11-10

## Why this matters

Nick, 2026-11-10: "What I mostly wanna see is each world display data in their own way."

litt has three worlds (Press, Flat, Device). Nineteen controls already have a
body per world, but no data part does: a chart is the same grey bars in all
three, a table the same rows, a stat tile the same tile. `proposals/worlds.md`
already says how each data part should look in each world (decision 15: every
visible part has a body per world), but schedules them late, in waves 6 to 8.

This plan moves data to the front and builds the first one. Stat is the
smallest data part (119 lines), and every piece it needs already exists: the
plate and the raised face (Press), ink type with no box (Flat), and the
seven-segment readout (Device). Landing it proves the contract for a data body
end to end (code, page, spec, changelog, registry) so the larger ones (Bar
list, Sparkline, Chart, Table) can follow the same steps.

## Current state

### Files and their roles

- `gallery/src/components/stat.tsx` — the Stat tile and `StatGroup`. One tile for every world today.
- `gallery/src/components/bodies/` — Flat and Device bodies of bodied parts, named `<part>.flat.tsx` and `<part>.device.tsx`. No `stat.*` files yet.
- `gallery/src/components/seven-segment.tsx` — exports `SevenSegment`, a figure in seven-segment digits behind LCD glass. Sized by its font size.
- `gallery/src/components/legend.tsx` and `bodies/legend.flat.tsx`, `bodies/legend.device.tsx` — the exemplar of a bodied data-adjacent part. Match its structure.
- `gallery/src/gallery/pages/18-stat.tsx` — Stat's page. `gallery/src/gallery/pages/17-legend.tsx` — the exemplar page with a "Three bodies" stage.
- `gallery/src/motion/index.tsx:332` — `export { byWorld, MaterialProvider, useMaterial } from "./deal";`
- `skills/litt-md/system/components.md` — the spec; `## Stat` is at about line 514.
- `gallery/CHANGELOG.md` and `gallery/registry.lock.json` — every registry item's version. A changed item without a changelog line fails `verify`.
- `gallery/CONTRIBUTING.md` — the builders' brief. Line 217 contradicts decision 15.
- `proposals/worlds.md` — the worlds plan and its decisions.

### What is decided for Stat (quote from `proposals/worlds.md`, the inventory table)

| Part | Press | Flat | Device |
|---|---|---|---|
| Stat (`stat`) | The figure on a raised face set into a plate, the label on its top rail | The figure in ink type on the page, no box; space parts the tiles | The figure in seven segments on an LCD window, the label engraved above |

And the rules every body keeps (same file): the greyscale test ("if its structure
does not name its world, it is not done"), one accent fill per view, nothing
moves on its own, states in words, weight by role and nothing above 18px, 44px
targets, the motion bounds.

### Stat today (`gallery/src/components/stat.tsx`)

```tsx
import { createContext, useContext, type ReactNode } from "react";
import { useFun, useFunValue } from "@/motion";
```

```tsx
  const tile = (
    <div
      className={
        "litt-raised in-[[data-material=flat]]:bg-transparent in-[[data-material=flat]]:shadow-none flex h-full min-w-0 flex-col gap-2 rounded-surface p-4 @min-[48rem]:p-6 " + className
      }
    >
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        <span className="text-h3 tabular-nums text-fg">
          {figure}
          {unit && <span className="text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption " + TONE[tone]}>
            {delta}
            <span className="sr-only">{TONE_WORD[tone]}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
  return grouped ? tile : <dl className="@container">{tile}</dl>;
```

`figure` is the value, or fun mode's counting number while it moves. `TONE` and
`TONE_WORD` map `tone` to a color class and hidden words.

### How a bodied part is wired (the exemplar, `gallery/src/components/legend.tsx`)

```tsx
import { byWorld, useMaterial } from "@/motion";
import { LegendFlatBody } from "./bodies/legend.flat";
import { LegendDeviceBody } from "./bodies/legend.device";
...
export type LegendBodyProps = {
...
function PressBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div
      data-body="press"
...
  const Body = byWorld(useMaterial(), { press: PressBody, flat: LegendFlatBody, device: LegendDeviceBody });
```

and a body file (`gallery/src/components/bodies/legend.flat.tsx`):

```tsx
import type { LegendBodyProps, LegendHue } from "../legend";
...
/** Flat: words with a hue dot, a hidden one grey with an outline dot. */
export function LegendFlatBody({ label, items, lines, className, noteId, note, press, keyDown }: LegendBodyProps) {
  return (
    <div data-body="flat" role="group" aria-label={label} className={"flex flex-wrap " + className}>
```

Conventions to match: the part's file keeps the contract and the Press body;
bodies import only **types** from the part (`import type`); each body's root
carries `data-body`; a bodied part has no `in-[[data-material=…]]` class left;
each body file opens with a comment saying what the body is made of.

### Material recipes already in use (use these exact classes, invent none)

- A plate (Press and Device): `rounded-surface bg-block shadow-(--plate-lift) forced-colors:border` (`composer.tsx:305`, `tabs.tsx:323`).
- A raised face or block: `rounded-control bg-block shadow-(--block-lift) forced-colors:border` (`number-field.tsx:111`).
- LCD glass, when a value cannot be shown in segments: `rounded-control bg-field px-3 py-2 text-field-ink shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]` (copied from `seven-segment.tsx:167`).
- An engraved label under Device: `litt-legend text-caption` (`.litt-legend` is defined in `tokens.css`; it is plain sentence case in Press and Flat).
- The seven-segment readout, resized: `<SevenSegment value={…} className="[font-size:…]" />` (`bodies/pagination.device.tsx:57-61`).

### The "Three bodies" stage (the exemplar, `gallery/src/gallery/pages/17-legend.tsx`)

```tsx
function ThreeBodiesDemo() {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      {MATERIALS.map((m) => (
        <figure key={m.id} className="m-0 grid min-w-0 content-start gap-3">
          <div
            {...lookAttributes({ accent: look.accent, material: m.id }, dark)}
            className="grid min-h-56 min-w-0 content-center justify-items-start gap-6 rounded-surface bg-canvas p-8 text-fg outline-1 -outline-offset-1 outline-line"
          >
            <MaterialProvider material={m.id}>
              <Legend … />
            </MaterialProvider>
          </div>
          <figcaption className="text-caption text-fg-muted">{m.name}</figcaption>
        </figure>
      ))}
```

```tsx
      <Stage
        title="Three bodies"
        tier="instant"
        caption="One contract, three bodies. …"
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>
```

Open `17-legend.tsx` and read its import lines for `useCustomize`, `useDark`,
`lookAttributes`, `MATERIALS` and `MaterialProvider`; you will copy them.

### Repo rules you must honour

- No hex values in `gallery/src` or Markdown. Only token names.
- Weights come from the type utilities (`text-h1`, `text-h3`, `text-caption`); never `font-medium`, `font-semibold`, `font-bold`.
- Radii: only `rounded-control`, `rounded-surface`, `rounded-pill`.
- Refer to Nick by name or as "you"; never gendered pronouns.
- Never edit `skills/litt-md/taste/**`. Never push.
- Never edit generated output (`gallery/public/r/`, `gallery/src/generated/`, `gallery/src/styles/`).

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Typecheck | `npm run typecheck --prefix gallery` | exit 0 |
| Verify (generators, typecheck, lint, self-tests, versions) | `npm run verify --prefix gallery` | exit 0 |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Page checks on one page | `npm run test:reflow --prefix gallery -- --pages stat` (same for `test:text-zoom`, `test:corners`, `test:gaps`) | exit 0 |
| The wall | `npm run test:wall --prefix gallery` | exit 0 |
| Install test | `npm run test:registry --prefix gallery` | exit 0 (needs the network, about ten minutes) |

The page checks need Playwright, which is deliberately not a dependency. Check
with `node -e "require('playwright')"`. The scripts also look in
`/opt/node22/lib` and in `$A11Y_TOOLS`. If Playwright is not found anywhere,
install it beside the repo as CI does:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope** (the only files you should modify or create):
- `gallery/src/components/stat.tsx`
- `gallery/src/components/bodies/stat.flat.tsx` (create)
- `gallery/src/components/bodies/stat.device.tsx` (create)
- `gallery/src/gallery/pages/18-stat.tsx`
- `skills/litt-md/system/components.md` (one line under `## Stat`)
- `gallery/CHANGELOG.md` (one release line)
- `gallery/registry.lock.json` (rewritten by `verify`; commit it, never hand-edit)
- `gallery/CONTRIBUTING.md` (one sentence)
- `proposals/worlds.md` (one new section)
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch, even though they look related):
- `gallery/src/components/seven-segment.tsx` and every other component and body — Stat's bodies only compose them.
- `skills/litt-md/assets/tokens.css`, `tailwind.css` — no new token; every recipe above already exists.
- `gallery/scripts/**` — including the registry's item copy for Stat in `gen-registry.mjs`.
- `skills/litt-md/taste/**`.
- `StatProps` and `StatGroupProps` — the public contract does not change. A host's code must keep working untouched.
- `gallery/src/canvas/**`.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/stat-three-bodies`.
- Commits, in the repo's style (`gallery: the legend's Press and Flat pushed apart`):
  1. `gallery: the stat's three bodies` — the component, the bodies, the page, the spec line, the changelog line and the lock.
  2. `gallery: data parts have bodies too, and the data wave comes next` — CONTRIBUTING and `proposals/worlds.md`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `npm ci --prefix gallery`, `npm run verify --prefix gallery`, `npm run build --prefix gallery`.

**Verify**: all exit 0, and `git status --short` prints nothing.

### Step 2: Declare the body contract and the Press body in `stat.tsx`

1. Change the motion import to:

```tsx
import { byWorld, useFun, useFunValue, useMaterial } from "@/motion";
import { StatFlatBody } from "./bodies/stat.flat";
import { StatDeviceBody } from "./bodies/stat.device";
```

2. After the `StatProps` type, add:

```tsx
/** What a body draws: the contract's resolved state (proposals/worlds.md, Bodies). */
export type StatBodyProps = {
  label: string;
  /** The value as given, for a body that draws the figure itself (Device's segments). */
  value: ReactNode;
  /** The value as it shows now: the given one, or fun mode's count while it moves. */
  figure: ReactNode;
  unit?: string;
  delta?: string;
  /** The delta's color class: success, danger or the subtle ink. */
  toneClass: string;
  /** Hidden words after the delta: ", good news", ", bad news" or nothing. */
  toneWord: string;
  trend?: ReactNode;
  className: string;
};

/** Press: a plate, the label along its top, the figure on a raised face set into it. */
function PressBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div data-body="press" className={"flex h-full min-w-0 flex-col gap-3 rounded-surface bg-block p-4 shadow-(--plate-lift) forced-colors:border @min-[48rem]:p-6 " + className}>
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-2">
        <span className="w-fit rounded-control bg-block px-3 py-2 text-h3 tabular-nums text-fg shadow-(--block-lift) forced-colors:border">
          {figure}
          {unit && <span className="text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}
```

3. In `Stat`, add `const Body = byWorld(useMaterial(), { press: PressBody, flat: StatFlatBody, device: StatDeviceBody });` directly after the `counted` line (hooks must stay unconditional), and replace the whole `const tile = ( … );` block with:

```tsx
  const tile = (
    <Body label={label} value={value} figure={figure} unit={unit} delta={delta} toneClass={TONE[tone]} toneWord={TONE_WORD[tone]} trend={trend} className={className} />
  );
```

Leave the `return grouped ? tile : …` line, `StatGroup`, `StatProps` and the fun-mode `figure` logic exactly as they are.

4. In the file's header comment, replace the two bullets that start `- Flat:` and `- Surface (components.md, Stat):` with:

```
 * - Bodies (proposals/worlds.md): this file resolves the state once into StatBodyProps and renders the body the
 *   material picks (byWorld). Press, here, is a plate (--block, --plate-lift) with the label along its top and the
 *   figure on a raised face set into it (--block, --block-lift). Flat (bodies/stat.flat.tsx) is the figure in ink on
 *   the page with no box. Device (bodies/stat.device.tsx) is a plate with the label engraved above an LCD window that
 *   shows the figure in seven segments. Never glass (R3), never an accent rail. A tile links nowhere, so it has no
 *   hover and no motion.
```

**Verify**: typecheck fails only because the two body files do not exist yet. That is expected; continue.

### Step 3: Create the Flat body, `gallery/src/components/bodies/stat.flat.tsx`

```tsx
/**
 * Stat, the Flat body (proposals/worlds.md, Bodies): the figure in ink on the page, no box.
 *
 * - Nothing stands up and nothing is framed: no fill, no hairline, no padding to the left, so the label and the figure
 *   start where the page's text starts and space parts the tiles.
 * - The label is small and grey. The figure is the page's ink at the h1 step (18px, the ceiling, at the title weight)
 *   with tabular numbers, its unit after it in grey. Rank comes from weight and ink (R8).
 * - The delta and the trend are as in every body: a word and the number at the caption size, the trend at the foot.
 */
import type { StatBodyProps } from "../stat";

/** Flat: ink type on the page. */
export function StatFlatBody({ label, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  return (
    <div data-body="flat" className={"flex h-full min-w-0 flex-col gap-1 py-2 pr-4 " + className}>
      <dt className="text-small text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-1">
        <span className="text-h1 tabular-nums text-fg">
          {figure}
          {unit && <span className="text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}
```

### Step 4: Create the Device body, `gallery/src/components/bodies/stat.device.tsx`

```tsx
/**
 * Stat, the Device body (proposals/worlds.md, Bodies): the figure in seven segments on an LCD window, the label
 * engraved above it.
 *
 * - The tile is a plate fixed to the body (--block, --plate-lift). The label is engraved capitals (litt-legend) at the
 *   caption size. The figure is a seven-segment readout behind glass (the Seven-segment part), at the h1 size, which
 *   says its value in words to a screen reader; the unit is engraved beside the glass.
 * - Segments show the digits, a minus, a dot and a space. Any other value (a word, an element) sits on the same glass
 *   in the mono, so the tile never shows a wrong number.
 * - A changed figure lights its new segments at once and the old ones fade like phosphor (Seven-segment's own motion);
 *   nothing moves on its own (R4).
 */
import { SevenSegment } from "@/components/seven-segment";
import type { StatBodyProps } from "../stat";

/** What seven segments can show. */
const SEGMENTS = /^[0-9. -]+$/;

/** Device: an LCD window on a plate. */
export function StatDeviceBody({ label, value, figure, unit, delta, toneClass, toneWord, trend, className }: StatBodyProps) {
  const text = typeof value === "number" ? String(value) : typeof value === "string" ? value : null;
  return (
    <div data-body="device" className={"flex h-full min-w-0 flex-col gap-2 rounded-surface bg-block p-4 shadow-(--plate-lift) forced-colors:border @min-[48rem]:p-6 " + className}>
      <dt className="litt-legend text-caption text-fg-subtle">{label}</dt>
      <dd className="m-0 flex flex-1 flex-col gap-2">
        <span className="flex items-end gap-2">
          {text !== null && SEGMENTS.test(text) ? (
            <SevenSegment value={text} className="[font-size:var(--type-h1-size)]" />
          ) : (
            <span className="rounded-control bg-field px-3 py-2 font-mono text-h3 text-field-ink shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]">{figure}</span>
          )}
          {unit && <span className="litt-legend text-caption text-fg-subtle">{unit}</span>}
        </span>
        {delta && (
          <span className={"text-caption " + toneClass}>
            {delta}
            <span className="sr-only">{toneWord}</span>
          </span>
        )}
        {trend ? <div className="mt-auto pt-3">{trend}</div> : null}
      </dd>
    </div>
  );
}
```

**Verify**: `npm run typecheck --prefix gallery` → exit 0. `npm run lint:litt --prefix gallery` → exit 0. `grep -c 'in-\[\[data-material' gallery/src/components/stat.tsx` → `0`.

### Step 5: Add the "Three bodies" stage to `gallery/src/gallery/pages/18-stat.tsx`

1. Add the imports the Legend page uses for its `ThreeBodiesDemo` (`useCustomize`, `useDark`, `lookAttributes`, `MATERIALS`, `MaterialProvider`). Copy each import line from `17-legend.tsx` exactly; do not guess paths.
2. Add this function above the page component, next to the page's other demo functions:

```tsx
function ThreeBodiesDemo() {
  const { look } = useCustomize();
  const dark = useDark();
  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      {MATERIALS.map((m) => (
        <figure key={m.id} className="m-0 grid min-w-0 content-start gap-3">
          <div
            {...lookAttributes({ accent: look.accent, material: m.id }, dark)}
            className="grid min-h-56 min-w-0 content-center gap-6 rounded-surface bg-canvas p-8 text-fg outline-1 -outline-offset-1 outline-line"
          >
            <MaterialProvider material={m.id}>
              <Stat label="Deploys this week" value={38} delta="Up 12% on last week" tone="good" />
              <Stat label="Uptime" value="99.98" unit="%" delta="Same as last week" />
            </MaterialProvider>
          </div>
          <figcaption className="text-caption text-fg-muted">{m.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
```

3. Add this as the **last** `Stage` inside the page's `<Page>`:

```tsx
      <Stage
        title="Three bodies"
        caption="One contract, three bodies. Press is a plate with the figure on a raised face set into it. Flat is the figure in ink on the page, with no box. Device is a plate with the label engraved above an LCD window that shows the figure in seven segments."
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>
```

If the other stages on this page pass a `tier` prop, do not add one here: a Stat has no motion (`tiers: []` in the page's meta).

**Verify**: `npm run verify --prefix gallery` fails **only** with a message that the `stat` item changed without a changelog line (Step 7 fixes that). Any other failure: fix it if it is a typo against this plan's code, otherwise STOP.

### Step 6: Add the spec's Bodies line

In `skills/litt-md/system/components.md`, under `## Stat`, add one bullet after the `- **Surface:**` bullet:

```
- **Bodies:** Press is a plate (`--block`, `--plate-lift`) with the label along its top and the figure on a raised face set into it (`--block`, `--block-lift`). Flat, bodies/stat.flat.tsx: the figure in ink on the page at the h1 step (18px), the label small and grey above it, no box, no fill and no hairline; space parts the tiles. Device, bodies/stat.device.tsx: a plate with the label engraved in capitals (`litt-legend`) above an LCD window that shows the figure in seven segments (the Seven-segment part), the unit engraved beside the glass; a value segments cannot show sits on the same glass in the mono.
```

Then change the existing `- **Surface:**` bullet's first words from `` `.litt-raised` at `--radius-surface`, no shadow (R3), `` to `` Under Press a plate at `--radius-surface` (see Bodies), ``. Leave the rest of that bullet.

**Verify**: `node skills/litt-md/scripts/check.mjs` → ends with `All checks passed.`

### Step 7: Changelog line and the lock

Open `gallery/CHANGELOG.md` and read the two newest releases to see the exact format. Get today's date with `date +%F`.

- If the newest heading is already today's date (`## <today> · …`), add the line below to that release's list.
- Otherwise add a new release directly above the newest one:

```
## <today> · Data, a body per world: Stat

Each world shows data in its own way (`proposals/worlds.md`, decision 15). Stat is the first data part with a body per material; the others follow.

- **changed** `stat`: a body per material. Press is a plate with the figure on a raised face set into it. Flat is the figure in ink on the page at 18px, with no box. Device is a plate with the label engraved above an LCD window that shows the figure in seven segments, so the item now installs `seven-segment` with it. Props are unchanged.
```

Run `npm run verify --prefix gallery`. It rewrites `gallery/registry.lock.json`.

**Verify**: `verify` exits 0. `git status --short` lists `gallery/registry.lock.json` as modified. `git diff --stat -- gallery/registry.lock.json` shows a small change. If `verify` names any item other than `stat` as changed without a changelog line, STOP.

### Step 8: Prove the three bodies draw, in every world and on a phone

Run `npm run build --prefix gallery`. Save this as `gallery/.agent-shots/check-stat.mjs` (`.agent-shots` is gitignored; create the folder) and run `node gallery/.agent-shots/check-stat.mjs`.

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

const WORLDS = ["press", "flat", "device"];
const browser = await chromium.launch();
const rows = [];
let bad = 0;
for (const [width, height] of [[1440, 900], [320, 700]]) {
  for (const world of WORLDS) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`http://localhost:${server.address().port}/index.html?look=${world}#stat`, { waitUntil: "networkidle" });
    await page.waitForSelector("main h1", { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      /* A Stat's body sits in a description list; other parts on the page have bodies too, so count only those. */
      const count = (w) => document.querySelectorAll(`main dl [data-body="${w}"]`).length;
      return {
        material: document.documentElement.getAttribute("data-material") ?? "press",
        press: count("press"), flat: count("flat"), device: count("device"),
        segments: document.querySelectorAll('main dl [data-body="device"] [data-seg]').length,
        terms: document.querySelectorAll("main dl [data-body] > dt").length,
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    if (width === 1440) await page.screenshot({ path: path.join(here, `stat-${world}.png`), fullPage: true });
    await page.close();
    rows.push({ width, world, ...r, errors: errors.length });
    const others = WORLDS.filter((w) => w !== world);
    const fail = (why) => { bad++; console.error(`${width}px ${world}: ${why}`); };
    if (r.material !== world) fail(`the page is in ${r.material}`);
    if (r[world] < 6) fail(`only ${r[world]} ${world} bodies, expected at least 6`);
    for (const o of others) if (r[o] !== 2) fail(`${r[o]} ${o} bodies, expected the 2 in the Three bodies stage`);
    if (r.segments < 14) fail(`only ${r.segments} segments under Device bodies`);
    if (r.terms !== r.press + r.flat + r.device) fail("a body without its label term");
    if (r.sideways > 1) fail(`scrolls ${r.sideways}px sideways`);
    if (errors.length) fail(`page errors: ${errors[0]}`);
  }
}
await browser.close();
server.close();
console.table(rows);
console.log(bad ? `${bad} problem(s).` : "Stat draws its own body in every world.");
process.exit(bad ? 1 : 0);
```

**Verify**: exit 0, last line `Stat draws its own body in every world.`, six rows. Keep the table for your report. The three screenshots `gallery/.agent-shots/stat-press.png`, `stat-flat.png`, `stat-device.png` are for the reviewer; do not commit them.

Then run the repo's own page checks on this page, each must exit 0:

```bash
npm run test:reflow --prefix gallery -- --pages stat
npm run test:text-zoom --prefix gallery -- --pages stat
npm run test:corners --prefix gallery -- --pages stat
npm run test:gaps --prefix gallery -- --pages stat
npm run test:wall --prefix gallery
```

If one fails and names `stat`, try once to fix it inside the three Stat files using only the recipes in "Current state"; if it still fails, STOP and report the output. If `test:wall` fails on something that is not Stat, report it in your notes as not caused by this plan and continue.

Commit: `git add gallery/src/components/stat.tsx gallery/src/components/bodies/stat.flat.tsx gallery/src/components/bodies/stat.device.tsx gallery/src/gallery/pages/18-stat.tsx skills/litt-md/system/components.md gallery/CHANGELOG.md gallery/registry.lock.json`, message `gallery: the stat's three bodies`.

### Step 9: The install test

Run `npm run test:registry --prefix gallery` (needs npm and ui.shadcn.com; about ten minutes).

**Verify**: exit 0. If it cannot reach the network, do not treat that as a STOP: say in your report that it was not run and why. If it fails on `stat` or `seven-segment`, STOP and report the output.

### Step 10: Fix the builders' brief and move the data wave forward

1. In `gallery/CONTRIBUTING.md`, replace the sentence
   `Data and layout parts (a table, a card, a chart) have no bodies: tokens and recipes are enough.`
   with
   `Every part that draws something gets a body per world, data and layout parts included (decision 15); Stat is the first data part built this way.`

2. In `proposals/worlds.md`, directly above the heading `### Counts`, insert:

```markdown
### The data wave comes next

Written 2026-11-10. Nick: "What I mostly wanna see is each world display data in their own way." So the data parts move ahead of waves 3 to 5. The inventory above already says what each one is in each world; only the order changes.

1. **Figures:** Stat (built first, as the pattern), then Progress, Rolling number and Gauge. They reuse pieces that exist: the plate, the raised face, the cap in a slot, the segments and the Chase.
2. **Rows of marks:** Bar list, Breakdown, Funnel, Spread and Sparkline. They build Flat's ink mark on grey and Press's fill in a slot cut into a slat.
3. **Charts:** Chart, Dot plot, Heatmap and Range chart. They build Press's lit well and Device's dot matrix, which wave 3 was to build.
4. **Tables:** Table, Cohort grid and Timeline, on the tray of slats, the ink row and the lamp row from wave 1.

Each part lands with all three bodies, a Three bodies stage on its page, a Bodies line in `components.md` and a changelog line, as Stat did. Waves 3 to 5 (what a hand drags, opens over the page and opens in place) follow the data wave, less the pieces it has already built.
```

**Verify**: `grep -c 'have no bodies' gallery/CONTRIBUTING.md` → `0`. `grep -c '^### The data wave comes next' proposals/worlds.md` → `1`. `node skills/litt-md/scripts/check.mjs` → `All checks passed.`

Commit: `git add gallery/CONTRIBUTING.md proposals/worlds.md`, message `gallery: data parts have bodies too, and the data wave comes next`.

### Step 11: Final checks

Run `npm run verify --prefix gallery`, `npm run build --prefix gallery`, `node gallery/.agent-shots/check-stat.mjs`, `git status --short`.

**Verify**: all exit 0 and `git status --short` prints nothing except, at most, `plans/README.md`.

## Test plan

- The repo has no unit-test framework; its tests are the generators, the lint and the Playwright page checks.
- New behavioural proof: Step 8's script. In each of the three worlds, at 1440px and 320px, every Stat on the page draws that world's body, the Three bodies stage shows the other two, Device bodies hold lit segments, every body keeps its `<dt>` label, the page does not scroll sideways, and there are no page errors.
- Existing checks that must stay green on the Stat page: reflow, text zoom, corners, gaps, the wall, and the registry install test.
- `verify` proves the version gate: `stat` changed, its changelog line exists, the lock moved, and no other item moved.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run verify --prefix gallery` exits 0
- [ ] `npm run build --prefix gallery` exits 0
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] `node gallery/.agent-shots/check-stat.mjs` exits 0 and prints `Stat draws its own body in every world.`
- [ ] `npm run test:reflow`, `test:text-zoom`, `test:corners` and `test:gaps` with `-- --pages stat` exit 0, and `npm run test:wall` exits 0
- [ ] `grep -c 'in-\[\[data-material' gallery/src/components/stat.tsx` prints 0, and `grep -c 'litt-raised' gallery/src/components/stat.tsx` prints 0
- [ ] `grep -c 'data-body=' gallery/src/components/stat.tsx gallery/src/components/bodies/stat.flat.tsx gallery/src/components/bodies/stat.device.tsx` prints 1 for each file
- [ ] `grep -n "from \"../stat\"" gallery/src/components/bodies/stat.*.tsx` shows only `import type` lines
- [ ] `git diff c268523 -- gallery/src/components/stat.tsx | grep -c 'StatProps = {'` prints 0 (the public props type is untouched)
- [ ] `git diff --stat c268523` lists only the in-scope files
- [ ] `npm run test:registry --prefix gallery` exits 0, or the report says plainly that it could not run and why
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows changes and the excerpts in "Current state" no longer match, or `gallery/src/components/bodies/stat.flat.tsx` or `stat.device.tsx` already exists.
- `verify` fails with a lint or typecheck error that is not a typo against this plan's code. Do not weaken the lint, add `litt-allow`, or change another component to make it pass.
- `verify` says an item other than `stat` changed without a changelog line.
- Step 8's script fails after you have checked your files against Steps 2 to 5 character for character. Report its table. Do not change the script's expected numbers.
- A page check (reflow, text zoom, corners, gaps, the wall) fails on `stat` after one fix attempt.
- `test:registry` fails on `stat` or `seven-segment`.
- A fix seems to need a new token, a change to `seven-segment.tsx`, or a change to `StatProps`.

## Maintenance notes

- **These bodies are a first pass for Nick's eye.** The recipes come from `proposals/worlds.md` and from classes already in the repo, and the checks prove structure, not taste. A reviewer must look at `gallery/.agent-shots/stat-press.png`, `stat-flat.png` and `stat-device.png`, in colour and in greyscale: if the three tiles cannot be told apart by structure alone, the body is not done.
- **Two judgment calls to confirm with Nick**: Flat sets the figure at 18px (the h1 step), which uses the ceiling for something other than the page title; and Device's label and unit are engraved capitals at the caption size.
- **The registry's item copy** for Stat (`gallery/scripts/gen-registry.mjs`, `COPY.stat`) still says "the value large in the sans". It is out of scope here; it is not part of the item's hash.
- **CI covers the Stat page only in the gallery's default look (Flat).** Press's and Device's bodies are covered by `test:wall` (per material) and by Step 8's one-off script, which is not committed. When more data parts have bodies, a committed check that every bodied part draws a different `data-body` under each material (today only `test:study` asserts it, and only for pages with a study) is worth its own plan.
- **Next in the data wave**, each its own plan: Progress, Rolling number and Gauge; then Bar list, Breakdown, Funnel, Spread and Sparkline; then Chart, Dot plot, Heatmap and Range chart; then Table, Cohort grid and Timeline. Chart is the large one (906 lines, three kinds of mark) and needs Device's dot matrix built first.
