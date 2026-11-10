# Plan 001: Flat's scale candidates are live on the canvas, with a proposal Nick can decide from

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 3854567..HEAD -- gallery/src/canvas gallery/src/blocks/case-study.tsx gallery/src/motion/deal.ts gallery/src/motion/index.tsx skills/litt-md/assets/tokens.css skills/litt-md/assets/tailwind.css proposals/world-scale.md`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `3854567`, 2026-11-10

## Why this matters

litt has three worlds (Press, Flat, Device). Nick wants each to look unlike the
others and play to its strengths: "flat be like airy, easy to use". Today the
worlds differ in colour, material, typeface and corner radius, and in the bodies
of 19 controls. They do **not** differ in size or space: every world has the
same type sizes, the same control heights and the same 4px spacing unit, so Flat
reads as Press with the borders removed.

Which sizes Flat should take is a taste decision, and taste is Nick's. So this
plan does not change any shipped value. It puts three candidate scales for Flat
on the language canvas (`#canvas`, the repo's place for comparing candidates),
each applied to the same real litt parts, and writes a short proposal with the
measurements and the questions Nick answers. A later plan applies the pick.

## Current state

### Files and their roles

- `skills/litt-md/assets/tokens.css` — the only place values live. **Read only in this plan.**
- `skills/litt-md/assets/tailwind.css` — maps tokens to Tailwind v4 utilities. **Read only.**
- `gallery/src/canvas/registry.tsx` — what is on the canvas: one `CanvasItem` per piece. You add entries here.
- `gallery/src/canvas/accents.ts` and `gallery/src/canvas/blues.tsx` — the existing example of candidate values compared on the canvas. Match their style.
- `gallery/src/canvas/canvas.tsx` — the camera and gestures. **Do not edit.**
- `gallery/src/blocks/case-study.tsx` — Flat's hero screen; exports `CaseStudy()` (no props) at line 100.
- `gallery/src/motion/index.tsx:332` — `export { byWorld, MaterialProvider, useMaterial } from "./deal";`
- `proposals/` — one Markdown file per design question, written for Nick, with a decisions table.

### The size tokens, identical in every world today

`skills/litt-md/assets/tokens.css` (first theme block):

```css
  --type-display-size: 1.125rem;  /* 18 */
  --type-display-leading: 1.75rem;  /* 28 */
  --type-h1-size: 1.125rem;       /* 18 */
  --type-h2-size: 0.875rem;       /* 14 */
  --type-h2-leading: 1.375rem;  /* 22 */
  --type-reading-size: 0.875rem;  /* 14: long-form text */
  --type-reading-leading: 1.375rem;  /* 22 */
  --type-body-size: 0.875rem;     /* 14: UI body */
  --type-body-leading: 1.375rem;  /* 22 */
  --type-small-size: 0.8125rem;   /* 13 */
  --type-small-leading: 1.25rem;  /* 20 */
  --type-caption-size: 0.75rem;   /* 12: labels */
  ...
  --control-sm: 32px;          /* dense UI: table rows, toolbars */
  --control-md: 44px;          /* default */
  --control-lg: 56px;          /* hero and form CTAs */
  --control-text-sm: 0.8125rem; /* 13 */
  --control-text-md: 0.875rem;  /* 14 */
```

(h3 and h4 match h2.) The Flat block (`:root[data-material="flat"], [data-material="flat"]`,
around line 1044) overrides colours, material, the face and the radius, and no size:

```css
  --font-sans: var(--font-choice, "Geist", "Geist Sans", "Helvetica Neue", Helvetica, Arial, sans-serif);

  /* Flat opens at the Pill shape (proposals/flat-pill.md, rule 1); the Customize shapes still override it. */
  --radius-control: 28px;
  --radius-surface: 16px;
```

### How the utilities read those tokens

`tailwind.css` maps them inside `@theme inline`, so a utility reads the variable
on the element that uses it. A wrapper element that sets a custom property
therefore rescales everything inside it:

```css
  --text-body: var(--type-body-size);
  --text-body--line-height: var(--type-body-leading);
  ...
  --spacing-control-md: var(--control-md);
```

Numeric utilities (`p-4`, `gap-6`, `size-8`, `h-11`) are not mapped by litt. In
Tailwind v4 they compile to `calc(var(--spacing) * N)`, where Tailwind's default
`--spacing` is `0.25rem` (4px). Setting `--spacing` on a wrapper rescales every
one of them inside it.

### Usage counts (measured at the planned commit, `gallery/src/components` and `gallery/src/blocks`)

| What | Count | Follows a token override? |
|---|---|---|
| Role text utilities (`text-body`, `text-small`, `text-caption`, `text-h1`…) | 539 uses | Yes |
| Control heights by token (`h-control-md`, `min-h-control-sm`…) | 187 uses | Yes |
| Control-like heights by number (`h-8`, `size-11`, `h-14`…) | 55 uses | Only through `--spacing` |
| Numeric spacing (`p-*`, `gap-*`, `mt-*`…) | 1,158 uses in 135 files | Only through `--spacing` |
| `py-section` (the `--section-y` rhythm token) | 0 uses | — |

### The convention for candidates on the canvas

From `.claude/CLAUDE.md` (the repo rules): "`#canvas` is the language canvas …
a freeform workspace of live previews for rethinking litt, not a page. … Content
lives in `registry.tsx` (ids, names, sizes, positions); experiments stay in the
folder and use only tokens, and nothing in `src/components` changes for them …
Candidate values under comparison (such as accents) carry `litt-allow` and move
into `tokens.css` once picked."

The exemplar, `gallery/src/canvas/accents.ts`:

```ts
export const ACCENTS: Accent[] = [
  { n: "Today", name: "Cobalt", hex: "…", white: 6.98, asText: 6.75, oklch: "0.479 0.210 266" }, // litt-allow: today's accent, for comparison
  { n: "1", name: "Blue 1", hex: "…", white: 4.36, asText: 4.22, oklch: "0.580 0.194 255" }, // litt-allow: candidate accent
```

and how `registry.tsx` applies a candidate to a subtree (inline custom properties on a wrapper):

```tsx
    render: () => (
      <div style={accentVars(PICK.hex)}>
        <SettingsPhysical title="Settings, physical, Blue 4" />
      </div>
    ),
```

`registry.tsx` already has a private `SettingsToday()` component (a text field,
a segmented control, a switch, a slider and two buttons). It is the specimen for
this plan.

### How a part picks its body

`gallery/src/motion/deal.ts:93-98`:

```ts
/** The material: the nearest MaterialProvider's, else the one on <html>, kept current when it changes (the gallery's Customize panel). Press on the server. */
export function useMaterial(): Material {
  const framed = useContext(MaterialContext);
  const page = useSyncExternalStore(watchMaterial, readMaterial, (): Material => "press");
  return framed ?? page;
}
```

So a frame that must always show Flat needs both `data-material="flat"` (for the
tokens) and `<MaterialProvider material="flat">` (for the bodies).
`gallery/src/gallery/study.tsx:90` is the exemplar.

### Rules you must honour

- No hex values anywhere in `gallery/src` or in Markdown. This plan needs none.
- Refer to Nick by name or as "you". Never use gendered pronouns.
- `skills/litt-md/taste/` is Nick's. Do not open it for editing.
- Never push. Commit locally only.
- The canvas's saved layout keys positions by item `id`; ids must be stable and unique, and names unique.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Verify (sync, generators, typecheck, lint, self-tests) | `npm run verify --prefix gallery` | exit 0 |
| Build | `npm run build --prefix gallery` | exit 0, `gallery/dist/index.html` exists |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Lock untouched | `git diff --exit-code -- gallery/registry.lock.json` | exit 0, no output |

Playwright is deliberately **not** a dependency of this repo. Step 4 needs it.
Check with `node -e "require('playwright')"`. If that fails, install it beside
the repo the way CI does, then export the folder:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope** (the only files you should modify or create):
- `gallery/src/canvas/scale.tsx` (create)
- `gallery/src/canvas/registry.tsx` (two imports and one block of entries)
- `proposals/world-scale.md` (create)
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch, even though they look related):
- `skills/litt-md/assets/tokens.css`, `tailwind.css`, `specimen.html` — no shipped value changes until Nick picks.
- `skills/litt-md/taste/**`, `skills/litt-md/system/**`, `skills/litt-md/workflows/**` — taste and specs change only after the decision, through `workflows/evolve.md`.
- `gallery/src/components/**`, `gallery/src/blocks/**`, `gallery/src/motion/**` — the canvas rule: nothing there changes for an experiment.
- `gallery/src/canvas/canvas.tsx`, `layout.ts`, `accents.ts`, `blues.tsx`, `experiments.tsx`.
- `gallery/src/gallery/look.ts` — Flat's Foundations lines are tested by `test:worlds`; they change with the decision, not now.
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json` — nothing the registry ships changes, so neither moves.
- `gallery/scripts/**`, `.github/**`.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/flat-scale-canvas` (the repo's branches are `claude/<slug>`).
- One commit for the canvas piece, one for the proposal. Message style, from `git log`: `gallery: a language canvas at #canvas, to prototype the press material across litt`. Use `gallery: Flat's scale candidates on the canvas` and `proposals: per-world scale, starting with Flat`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Install and confirm the baseline

Run `npm ci --prefix gallery`, then `npm run verify --prefix gallery`, then `npm run build --prefix gallery`.

**Verify**: all three exit 0. Then `grep -c 'var(--spacing)' gallery/dist/assets/*.css | awk -F: '{s+=$2} END {print s}'` → a number greater than 100. (This proves numeric utilities read `--spacing`. If it prints 0, STOP.)

### Step 2: Create `gallery/src/canvas/scale.tsx`

Create the file with exactly this content:

```tsx
/**
 * Candidate scales for Flat, compared on the canvas (proposals/world-scale.md). Every world has the same type sizes,
 * control heights and spacing unit today; these show what Flat looks like when one of them changes. They are
 * comparison data, not tokens: the one Nick picks moves into the Flat block of tokens.css, and this file goes with
 * the canvas. A frame sets its candidate as custom properties, so every litt part inside reads it; an overlay a part
 * opens (a menu, the lightbox) is drawn outside the frame and keeps today's scale.
 */
import type { CSSProperties, ReactNode } from "react";
import { MaterialProvider } from "@/motion";

export type Scale = { id: "today" | "space" | "type" | "open"; name: string; note: string; vars: CSSProperties };

/* Type stays; the spacing unit goes from 4px to 5px, and 14px text sits on a 24px line. */
const SPACE = {
  "--spacing": "0.3125rem", // litt-allow: candidate scale, a 5px unit
  "--type-body-leading": "1.5rem", // litt-allow: candidate scale
  "--type-reading-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h2-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h3-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h4-leading": "1.5rem", // litt-allow: candidate scale
} as CSSProperties;

/* Space stays; text goes from 14 to 16 on a 24px line and small from 13 to 14. The 18px title is the ceiling, as today. */
const TYPE = {
  "--type-body-size": "1rem", // litt-allow: candidate scale
  "--type-body-leading": "1.5rem", // litt-allow: candidate scale
  "--type-reading-size": "1rem", // litt-allow: candidate scale
  "--type-reading-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h2-size": "1rem", // litt-allow: candidate scale
  "--type-h2-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h3-size": "1rem", // litt-allow: candidate scale
  "--type-h3-leading": "1.5rem", // litt-allow: candidate scale
  "--type-h4-size": "1rem", // litt-allow: candidate scale
  "--type-h4-leading": "1.5rem", // litt-allow: candidate scale
  "--type-small-size": "0.875rem", // litt-allow: candidate scale
  "--type-small-leading": "1.375rem", // litt-allow: candidate scale
  "--control-text-sm": "0.875rem", // litt-allow: candidate scale
  "--control-text-md": "1rem", // litt-allow: candidate scale
} as CSSProperties;

export const SCALES: Scale[] = [
  { id: "today", name: "Today", note: "What Flat ships: the same sizes as Press.", vars: {} },
  { id: "space", name: "Space", note: "Type as today. Every gap, padding and box a quarter larger (a 5px unit), text on a 24px line.", vars: SPACE },
  { id: "type", name: "Type", note: "Space as today. Text at 16 on a 24px line, small text at 14, the title still 18.", vars: TYPE },
  { id: "open", name: "Open", note: "Space and Type together, and md controls at 48.", vars: { ...SPACE, ...TYPE, "--control-md": "48px" } as CSSProperties }, // litt-allow: candidate scale
];

/**
 * One candidate around some litt parts. The name and note sit outside the candidate, in today's sizes, so the four
 * frames label themselves alike. The samples under them sit inside it: text at the body and small sizes, a bar as
 * tall as an md control and a square four units wide.
 */
export function ScaleFrame({ scale, children }: { scale: Scale; children: ReactNode }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <span className="text-small font-title text-fg">{scale.name}</span>
        <span className="text-small text-fg-subtle">{scale.note}</span>
      </div>
      <MaterialProvider material="flat">
        <div data-material="flat" data-scale={scale.id} style={scale.vars} className="grid gap-8 text-fg-muted">
          <div aria-hidden="true" className="flex items-end gap-4">
            <span data-probe="body" className="text-body text-fg">Aa</span>
            <span data-probe="small" className="text-small text-fg">Aa</span>
            <span data-probe="control" className="h-control-md w-2 rounded-pill bg-fg" />
            <span data-probe="unit" className="size-4 bg-fg" />
          </div>
          {children}
        </div>
      </MaterialProvider>
    </div>
  );
}
```

**Verify**: `npm run typecheck --prefix gallery` → exit 0.

### Step 3: Add the eight canvas entries in `gallery/src/canvas/registry.tsx`

1. Add two imports beside the existing canvas imports (after the line `import { PICK, accentVars } from "./accents";`):

```tsx
import { CaseStudy } from "@/blocks/case-study";
import { SCALES, ScaleFrame } from "./scale";
```

2. Just above `export const ITEMS: CanvasItem[] = [`, next to the existing `ROW` constant, add:

```tsx
/* Flat's scale candidates (scale.tsx), under the pairs: the settings panel four times, then the case study four times. */
const SCALE_ROW = { settings: 2720, caseStudy: 3760 };
```

3. As the **last** element of the `ITEMS` array (after the `settings-physical-blue-4` entry, before the closing `];`), add:

```tsx
  ...SCALES.flatMap((scale, i): CanvasItem[] => [
    {
      id: `scale-${scale.id}-settings`,
      name: `Flat scale · ${scale.name} · settings`,
      x: i * 640,
      y: SCALE_ROW.settings,
      width: 560,
      height: 760,
      render: () => (
        <ScaleFrame scale={scale}>
          <SettingsToday />
        </ScaleFrame>
      ),
    },
    {
      id: `scale-${scale.id}-case-study`,
      name: `Flat scale · ${scale.name} · case study`,
      x: i * 1160,
      y: SCALE_ROW.caseStudy,
      width: 1080,
      height: 1200,
      render: () => (
        <ScaleFrame scale={scale}>
          <CaseStudy />
        </ScaleFrame>
      ),
    },
  ]),
```

Do not change any existing entry, `SettingsToday`, or `Panel`.

**Verify**: `npm run verify --prefix gallery` → exit 0. `npm run build --prefix gallery` → exit 0. `git diff --exit-code -- gallery/registry.lock.json` → exit 0.

### Step 4: Prove each frame applies its candidate, and measure overflow

Save this script as `gallery/.agent-shots/check-scale.mjs` (`.agent-shots` is
gitignored; create the folder). It serves `gallery/dist`, opens the canvas,
reads the four samples in every frame and counts elements whose content is wider
than their box.

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

const EXPECT = {
  today: { body: "14px", leading: "22px", small: "13px", control: "44px", unit: "16px" },
  space: { body: "14px", leading: "24px", small: "13px", control: "44px", unit: "20px" },
  type: { body: "16px", leading: "24px", small: "14px", control: "44px", unit: "16px" },
  open: { body: "16px", leading: "24px", small: "14px", control: "48px", unit: "20px" },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2560, height: 1600 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(`http://localhost:${server.address().port}/index.html?look=flat#canvas`, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.querySelectorAll("[data-scale]").length === 8, null, { timeout: 20000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);

const rows = await page.evaluate(() =>
  [...document.querySelectorAll("[data-scale]")].map((frame) => {
    const probe = (name) => getComputedStyle(frame.querySelector(`[data-probe="${name}"]`));
    const over = [...frame.querySelectorAll("*")].filter((el) => el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1).length;
    return {
      item: frame.closest("[data-canvas-item]").getAttribute("data-canvas-item"),
      scale: frame.getAttribute("data-scale"),
      body: probe("body").fontSize,
      leading: probe("body").lineHeight,
      small: probe("small").fontSize,
      control: probe("control").height,
      unit: probe("unit").width,
      elements: frame.querySelectorAll("*").length,
      overflowing: over,
    };
  }),
);
await page.screenshot({ path: path.join(here, "scale-canvas.png") });
await browser.close();
server.close();

console.table(rows);
let bad = errors.length;
for (const e of errors) console.error("page error:", e);
for (const r of rows) {
  for (const [k, v] of Object.entries(EXPECT[r.scale])) {
    if (r[k] !== v) { bad++; console.error(`${r.item}: ${k} is ${r[k]}, expected ${v}`); }
  }
  if (r.elements < 20) { bad++; console.error(`${r.item}: only ${r.elements} elements, the parts did not render`); }
}
console.log(bad ? `${bad} problem(s).` : "All 8 frames apply their candidate.");
process.exit(bad ? 1 : 0);
```

Run: `node gallery/.agent-shots/check-scale.mjs`

**Verify**: exit 0, last line `All 8 frames apply their candidate.`, and the table has 8 rows. Keep the printed table: Step 5 copies its `overflowing` column. `gallery/.agent-shots/scale-canvas.png` is for the operator to look at; do not commit it.

Commit Steps 2 and 3 now: `git add gallery/src/canvas/scale.tsx gallery/src/canvas/registry.tsx` and commit with `gallery: Flat's scale candidates on the canvas`.

### Step 5: Write `proposals/world-scale.md`

First re-run the five counts, from the repo root, and note the numbers:

```bash
cd gallery/src
grep -ohE '\btext-(display|h1|h2|h3|h4|reading|body|small|caption)\b' -r components blocks | wc -l
grep -ohE '\b(min-)?(h|size)-control-(sm|md|lg)\b' -r components blocks | wc -l
grep -ohE '\b(min-)?(h|size)-(8|11|14)\b' -r components blocks | wc -l
grep -ohE '\b(p|px|py|pt|pb|pl|pr|gap|gap-x|gap-y|space-y|space-x|mt|mb|my|mx)-[0-9.]+\b' -r components blocks | wc -l
grep -ohE '\bpy-section\b' -r components blocks gallery | wc -l
cd ../..
```

At the planned commit these print 539, 187, 55, 1158 and 0.

Then create `proposals/world-scale.md` with the content below. Replace each
`<…>` with your measured value: the five counts, and for each candidate the
`overflowing` number from Step 4's table for its settings row and its case-study
row. Change nothing else. The Decision column is already filled with what Nick
decided on 2026-11-10; copy it exactly as written and leave row 6 empty.

```markdown
# Per-world scale, starting with Flat

Written 2026-11-10 for Nick. Nick, on the three worlds: "I want each system to not look like the other, and play on its strengths", "flat be like airy, easy to use". The worlds differ today in color, material, face, corner radius and the bodies of 19 controls. They do not differ in size: every world has the same type sizes, control heights and spacing unit, which is why Flat reads as Press without its borders.

This is a proposal, not a build. No token, rule or component changes here. Three candidate scales for Flat are live on the canvas (`#canvas`, the Flat scale rows; `gallery/src/canvas/scale.tsx`), each around the same settings panel and the same case study, beside Flat as it ships. Open `?look=flat#canvas` to compare them. Nick saw the same four applied to the live gallery on 2026-11-10 and chose Space; the table at the end records it.

## What was measured

| What | Where | Count | A world's token reaches it? |
|---|---|---|---|
| Text set by a role (`text-body`, `text-small`, `text-caption`…) | components and blocks | <539> uses | Yes: the `--type-*` tokens |
| Control heights by token (`h-control-md`…) | components and blocks | <187> uses | Yes: the `--control-*` tokens |
| Control-sized boxes by number (`h-8`, `size-11`…) | components and blocks | <55> uses | Only the spacing unit |
| Gaps and padding by number (`p-4`, `gap-6`…) | components and blocks | <1158> uses | Only the spacing unit |
| The page rhythm token (`py-section`) | the whole gallery | <0> uses | Nothing reads it |

Two things follow. Type and control height are cheap to make a world's own: a few lines in the world's block of `tokens.css` reach every part. Space is not: nearly every gap is a number on Tailwind's 4px unit, so the one lever that reaches them all is the unit itself.

litt.design, which Flat was modelled on, has litt's own type scale: 14px text, an 18px statement and 12px labels (its `app/globals.css`, read 2026-11-10). Its air is space: 144px to 176px above a section, and one idea per screen. That argues for trying space before size.

## The candidates

| Candidate | What it sets | On the 8px grid (R9)? | Under the 18px ceiling (R8)? | Elements wider than their box: settings, case study |
|---|---|---|---|---|
| Today | Nothing | Yes | Yes | <n>, <n> |
| Space | The spacing unit 4px to 5px; 14px text on a 24px line | No: 8 becomes 10, 16 becomes 20 | Yes | <n>, <n> |
| Type | Text 14 to 16 on a 24px line, small 13 to 14, control words to match; the title stays 18 | Yes | Yes, but "nearly everything is 14px" no longer holds | <n>, <n> |
| Open | Space and Type together, md controls 44 to 48 | No | Yes | <n>, <n> |

What the canvas cannot show: an overlay a part opens (a menu, the lightbox) is drawn outside its frame and keeps today's scale. Under Space and Open, a box sized by token (a 44px control) does not grow while a box sized by number beside it does, so a part that mixes the two can look uneven; the last column counts where content no longer fits.

No spacing unit between 4px and 8px keeps every step on the 8px grid. So "Flat has more space in every part" and "Flat keeps the 8px grid" cannot both be true: Flat either takes its own grid, or gets its air part by part, in its bodies and blocks.

## Decisions

| # | Question | Suggested | Decision |
|---|---|---|---|
| 1 | Does Flat take its own scale at all, as it took its own shape (v1.9) and its own face and accent (v1.11)? | Yes. Size and space are what a visitor reads first, before material. | **Yes**, by choosing Space. |
| 2 | Which candidate is closest to "airy, easy to use"? | Space. It is how litt.design gets its air, and it keeps R8's sizes. | **Space.** Nick, 2026-11-10: "go with space". |
| 3 | If space: Flat's own unit (5px, so a 10px grid), or the 4px unit with air built into Flat's bodies and blocks one at a time? | The unit, if the overflow counts stay near Today's: it reaches every part at once, and 68 parts have no Flat body yet. | **The unit**, as Space was shown: 5px. |
| 4 | Does Flat's text grow to 16? | No. Keep 14 on a 24px line; rank stays with weight and ink (R8). | **No**, as Space was shown. |
| 5 | Do Flat's md controls grow to 48? | No. 44 is the touch target, and the 28px pill is exact up to 56. | **No**, as Space was shown. |
| 6 | Which world next? | Device, tighter, once Flat's is in and seen. | |

## After the decision

The pick moves into the Flat block of `tokens.css` through `workflows/evolve.md` (Propagate): the profile's Fixed decisions and R8 or R9 say what Flat may do, `foundations.md` and Flat's Foundations lines in `gallery/src/gallery/look.ts` follow, the registry changelog gets a `litt` line, and `gallery/src/canvas/scale.tsx` and its entries go. The 55 control-sized boxes set by number are moved to the control tokens first if the unit changes, so a control and the box beside it grow together.
```

**Verify**:
- `grep -c '<' proposals/world-scale.md` → `0` (every placeholder replaced; the file has no other `<`).
- `grep -nE '#[0-9a-fA-F]{6}\b' proposals/world-scale.md` → no output.
- `node skills/litt-md/scripts/check.mjs` → ends with `All checks passed.`

Commit: `git add proposals/world-scale.md` and commit with `proposals: per-world scale, starting with Flat`.

### Step 6: Final checks

Run `npm run verify --prefix gallery`, `npm run build --prefix gallery`, `node gallery/.agent-shots/check-scale.mjs`, and `git status --short`.

**Verify**: the first three exit 0; `git status --short` prints nothing except, at most, your edit to `plans/README.md`.

## Test plan

- No unit tests are added: the canvas is an experiment surface that the page checks deliberately never visit (repo rule), and nothing shipped changes.
- The behavioural proof is Step 4's script: 8 frames, each sample at its candidate's expected computed size, at least 20 elements per frame, and no page errors.
- Regression proof that nothing shipped moved: `verify` and `build` pass, and `gallery/registry.lock.json` is unchanged.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run verify --prefix gallery` exits 0
- [ ] `npm run build --prefix gallery` exits 0
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] `node gallery/.agent-shots/check-scale.mjs` exits 0 and prints `All 8 frames apply their candidate.`
- [ ] `git diff --exit-code 3854567 -- gallery/registry.lock.json gallery/CHANGELOG.md skills/ gallery/src/components gallery/src/blocks gallery/src/motion` exits 0 (nothing shipped changed)
- [ ] `git diff --stat 3854567 -- gallery/src/canvas` lists exactly `registry.tsx` and `scale.tsx`
- [ ] `proposals/world-scale.md` exists, `grep -c '<' proposals/world-scale.md` prints 0, and `grep -c 'go with space' proposals/world-scale.md` prints 1 (rows 1 to 5 of the Decision column are as the plan gives them; row 6 is empty)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows changes and the excerpts in "Current state" no longer match (for example the Flat block now sets a `--type-*`, `--control-*` or `--spacing` value: someone has already started this).
- Step 1's `var(--spacing)` count is 0: numeric utilities do not read the unit in this Tailwind version, and the Space candidate cannot work as written.
- `verify` fails on your new files with a lint message that a `litt-allow` comment does not clear. Do not rewrite the lint or its fixtures.
- Step 4 fails after you have re-checked that `scale.tsx` matches Step 2 exactly. Report the table it printed. Do not change the `EXPECT` values to make it pass.
- Step 4 reports a page error from `CaseStudy` rendered four times. Report it; do not edit the block.
- Any step seems to need a change to a file outside the in-scope list.
- You are tempted to change the Decision column from the text this plan gives, to fill in row 6, or to add the candidate values to `tokens.css`. The decisions are Nick's, and applying them is the follow-on plan.

## Maintenance notes

- **This plan records a decision and stops.** Nick chose Space on 2026-11-10. The follow-on plan ("apply Flat's scale", `plans/002-*.md`) puts it into the tokens. It will touch `tokens.css` (the Flat block), `taste/profile.md` (Fixed decisions; R8 or R9, with Nick approving the diff and a `taste:` commit), `system/foundations.md`, Flat's `foundations` lines in `gallery/src/gallery/look.ts` (asserted by `test:worlds`), `gallery/CHANGELOG.md` (a `litt` line) and `gallery/registry.lock.json`, and it removes `scale.tsx` and its registry entries.
- **If the unit changes**, three things need care in that follow-on plan: the 55 control-sized boxes set by number (`h-8`, `size-11`) should move to control tokens first; `gallery/src/motion/rules.ts` (`SPACE_SCALE`) and the lint's `INSETS` mirror the spacing scale and are checked by `test:rules`; and `test:reflow` (320px), `test:text-zoom` and `test:corners` must be re-run under Flat, since a larger unit changes what fits.
- **Flat's pill assumes controls up to 56px** (`--radius-control: 28px`). Any candidate that raises `--control-lg` above 56 would stop being a pill.
- **Reviewer**: confirm no file under `skills/`, `gallery/src/components`, `gallery/src/blocks` or `gallery/src/motion` changed, and that the proposal's numbers match Step 4's table and the five counts.
- **Known stale line, deliberately left alone**: `gallery/src/gallery/look.ts` says Flat's shape is "As Press: 4px, 8px and the pill", but the Flat block has set the Pill shape (28px and 16px) since `proposals/flat-pill.md`. The follow-on plan rewrites those lines anyway.
