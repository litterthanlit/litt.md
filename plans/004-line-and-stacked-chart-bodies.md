# Plan 004: LineChart and StackedBarChart get Press's well and Device's dot matrix, and stay as they are in Flat

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 00d3121..HEAD -- gallery/src/components/chart.tsx gallery/src/components/bodies/chart.device.tsx gallery/src/components/seven-segment.tsx gallery/src/gallery/pages/18-chart.tsx gallery/src/motion/deal.ts gallery/src/motion/index.tsx`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (it changes how a shipped component draws in two worlds, and the looks can only be judged by eye; Flat must not move by a pixel)
- **Depends on**: plans/003-bar-chart-three-bodies.md — DONE. This plan needs its code (`barMarks`, `BarRects`, `FlatBody`, `PressBody`, `bodies/chart.device.tsx`); it is at commit `00d3121` and later.
- **Category**: direction
- **Planned at**: commit `00d3121`, 2026-11-10

## Why this matters

Nick wants each world to show data in its own way, starting with what the
dashboards use. Chart is on all four dashboard screens. Plan 003 gave BarChart
a body per world; LineChart and StackedBarChart, in the same file, still draw
the same in every world, so a dashboard in Press or Device shows one chart in
the world's own body and the next one not.

This plan finishes Chart. The rule from Nick (2026-11-10: "current ones are
good, we should save them for flat") holds: **in Flat, a line chart and a
stacked chart must look exactly as they do today.** Press puts them in the same
sunken well as the bars. Device draws a line as a trace of lit dots and a stack
as a column of lit dots, on the same dot-matrix screen as the bars
(`proposals/worlds.md`: "a line as a trace of dots").

## Current state

### Files and their roles

- `gallery/src/components/chart.tsx` — `BarChart`, `LineChart`, `StackedBarChart` (thin wrappers over a private `Chart()`), and `Meter`.
- `gallery/src/components/bodies/chart.device.tsx` — BarChart's Device body: `ChartDeviceBody`.
- `gallery/src/gallery/pages/18-chart.tsx` — the Chart page. `BuildTimeDemo` is its single-series LineChart, `StackedDemo` its StackedBarChart, and `ThreeBodiesDemo` (line 292) shows a BarChart in each world.
- LineChart or StackedBarChart are also used by the blocks `dashboard.tsx`, `growth.tsx`, `usage.tsx`, `insights.tsx`.

### What plan 003 left in `chart.tsx`

The frame and the body choice, inside `Chart()`:

```tsx
  const world: World = useMaterial();
  const body: World | null = kind === "bar" ? world : null;
  const [boxRef, width] = useWidth();
  const g = useMemo(
    () => layout(width, height, labels, series, fmt, stacked, body ? FRAME[body] : FRAME.press),
    [width, height, labels, series, fmt, stacked, body],
  );
```

```tsx
  const marks = body ? barMarks(g, series, paint, n, emphasis, fmt) : null;
  const Body = byWorld(world, { press: PressBody, flat: FlatBody, device: ChartDeviceBody });
```

The render, where only a bar chart gets a body:

```tsx
    <div data-chart={kind} data-body={body ?? undefined} className={"w-full " + className}>
      {many && legend && <Legend series={series} kind={kind} paint={paint} />}
      <div ref={boxRef} className="relative isolate w-full" style={{ height }}>
        {width > 0 && !empty && (
          <>
            {marks ? (
              <Body
                width={width}
                height={height}
                text={text}
                g={g}
                labels={labels}
                fmt={fmt}
                bars={marks.bars}
                ring={ring !== null ? marks.ringOf(ring) : null}
                band={many && active !== null ? { x: g.left + active * g.slotW, y: g.top, width: g.slotW, height: g.plotH } : null}
                reading={!many && emphasis !== null ? fmt(value(series[0]!, emphasis)) : null}
                entrance={entrance}
                enter={enter}
              />
            ) : (
              <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
                <Grid g={g} labels={labels} fmt={fmt} />
                {many && active !== null && (
                  <rect x={g.left + active * g.slotW} y={g.top} width={g.slotW} height={g.plotH} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />
                )}
                {kind === "stack" ? (
                  <Rails g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
                ) : (
                  <Lines g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
                )}
              </svg>
            )}
```

The body props and the two bodies in this file:

```tsx
export type ChartBodyProps = {
  width: number;
  height: number;
  /** The image's summary, for the svg's aria-label. */
  text: string;
  g: ChartGeometry;
  labels: string[];
  fmt: (v: number) => string;
  bars: ChartBar[];
  /** The focus ring's box, while a category has keyboard focus. */
  ring: Box | null;
  /** The faint band behind the active category, when there are several series. */
  band: Box | null;
  /** The emphasised category's value as text, for a single series; null when nothing is emphasised. */
  reading: string | null;
  entrance: boolean;
  enter: ReturnType<typeof useTransition>;
};
```

```tsx
/** Flat: the chart as it has always been. A hairline grid, the value axis and the bars, on the page with no ground. */
function FlatBody({ width, height, text, g, labels, fmt, bars, ring, band, entrance, enter }: ChartBodyProps) {
  return (
    <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
      <Grid g={g} labels={labels} fmt={fmt} />
      {band && <rect {...band} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />}
      <BarRects bars={bars} ring={ring} entrance={entrance} enter={enter} />
    </svg>
  );
}

/** Press: the plot is a sunken well, the bars stand on its floor, and the category labels sit on a raised rail under it. */
function PressBody({ width, height, text, g, labels, fmt, bars, ring, band, entrance, enter }: ChartBodyProps) {
  return (
    <>
      <div aria-hidden="true" data-well="" className="absolute -z-10 rounded-control bg-tray shadow-(--tray-shade)" style={{ left: g.left, top: g.top, width: g.plotW, height: g.plotH }} />
      <div aria-hidden="true" className="absolute -z-10 rounded-control bg-block shadow-(--block-lift)" style={{ left: g.left, top: g.base + 6, width: g.plotW, height: AXIS - 8 }} />
      <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        <Grid g={g} labels={labels} fmt={fmt} />
        {band && <rect {...band} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />}
        <BarRects bars={bars} ring={ring} entrance={entrance} enter={enter} />
      </svg>
    </>
  );
}
```

The marks that must not change, `Rails` and `Lines` (each draws its own focus
ring and takes `MarksProps`). The geometry they use:

```tsx
function Rails({ g, series, paint, n, emphasis, ring, entrance, enter }: MarksProps) {
  const bw = Math.max(2, Math.min(MAX_RAIL, Math.floor(g.slotW * 0.5)));
  const baseline = g.y(0);
  const scale = g.plotH / Math.max(1, g.ticks[g.ticks.length - 1]!);
  ...
      {ring !== null && (
        <rect x={Math.round(g.left + ring * g.slotW + (g.slotW - bw) / 2) - 4} y={g.y(stackTotal(series, ring)) - 4} width={bw + 8} height={baseline - g.y(stackTotal(series, ring)) + 8} … />
```

```tsx
function Lines({ g, series, paint, n, emphasis, ring, entrance, enter }: MarksProps) {
  ...
          <path key={s.name} d={Array.from({ length: n }, (_, i) => `${i === 0 ? "M" : "L"}${g.cx(i)} ${g.y(s.values[i] ?? 0)}`).join(" ")} … strokeDasharray={paint[j]!.dash?.line} />
```

A series' `Paint` is `{ rest, strong, stroke, marker, edge, dash? }`. A hue
series has `rest: "fill-data-blue"` (always starting `fill-data-`); a third,
fourth or fifth series that must not be told apart by color alone has a `dash`.
`StackedBarChart` always paints in data hues and passes `highlight="none"`, so
its `emphasis` is the hovered, focused or pinned category, or null.

### `bodies/chart.device.tsx` today (the whole component)

It builds a matrix (`PITCH = 6`, `DOT = 2`, `cols`, `rows`, `x0`, `y0`), the LCD
ground, the seven-segment readout, a `<pattern>` of unlit dots, then:

```tsx
          {bars.flatMap((b) => {
            const c0 = Math.max(0, Math.min(cols - 1, Math.round((b.x - x0) / PITCH)));
            const wide = Math.max(1, Math.min(cols - c0, Math.round(b.width / PITCH)));
            const tall = Math.max(1, Math.min(rows, Math.round(b.height / PITCH)));
            const opacity = b.hue ? 1 : single ? (b.strong ? 1 : 0.55) : LEVEL[Math.min(b.series, 2)];
            return Array.from({ length: wide * tall }, (_, k) => (
              <circle key={`${b.key}-${k}`} data-dot="" cx={x0 + (c0 + (k % wide) + 0.5) * PITCH} cy={g.base - (Math.floor(k / wide) + 0.5) * PITCH} r={DOT} opacity={opacity}
                className={"transition-[fill,opacity] duration-(--dur-instant) ease-litt " + (b.hue ? b.fill : "fill-field-ink")} />
            ));
          })}
```

followed by the engraved category labels and the focus ring.

### The design

| | Press | Flat | Device |
|---|---|---|---|
| Line | Today's line and marker, in the sunken well, labels on the raised rail | **Today's, unchanged** | A trace of lit dots, one per matrix column, joined up where the line is steep; the emphasised category is a plus of five dots; a dashed series skips every third column |
| Stack | Today's rails, in the sunken well, labels on the raised rail | **Today's, unchanged** | One column of lit dots per category, each part in its hue with one unlit dot between parts; while a category is active the others dim |
| Reading | The tooltip | The tooltip | Seven segments above the screen: a single line's emphasised value, or the active stack's total. It shows the number a formatted value starts with, without its unit ("41 s" shows 41); plan 003 showed nothing for such a value |

Press and Flat keep drawing with the existing `Lines` and `Rails` components,
untouched. Only Device needs the marks resolved as data.

### Repo rules you must honour

- No hex values in `gallery/src` or Markdown. Only token names and classes.
- Transitions: only what the file already uses (`transition-[fill,opacity] duration-(--dur-instant) ease-litt`).
- Refer to Nick by name or as "you"; never gendered pronouns. Never edit `skills/litt-md/taste/**`. Never push.
- Never edit generated output (`gallery/public/r/`, `gallery/src/generated/`, `gallery/src/styles/`).

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
| Page checks | `npm run test:reflow --prefix gallery -- --pages chart,dashboard,growth,usage,insights` (same flag for `test:text-zoom`, `test:corners`, `test:gaps`, `test:motion`) | exit 0 |
| Whole-gallery checks | `npm run test:wall --prefix gallery`, `npm run test:worlds --prefix gallery`, `npm run test:study --prefix gallery` | exit 0 |
| Install test | `node gallery/scripts/test-registry.mjs --app vite --items chart,seven-segment --scenarios each,seq` | `all steps passed` |

The page checks and the two scripts in this plan need Playwright, which is
deliberately not a dependency. They look in `$A11Y_TOOLS`, the gallery, then
`/opt/node22/lib`. If one reports Playwright missing, install it beside the
repo as CI does:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope** (the only files you should modify or create):
- `gallery/src/components/chart.tsx`
- `gallery/src/components/bodies/chart.device.tsx`
- `gallery/src/gallery/pages/18-chart.tsx`
- `skills/litt-md/system/components.md` (the Bodies bullet under `## Chart`)
- `gallery/CHANGELOG.md` (the `chart` line)
- `gallery/registry.lock.json` (rewritten by `verify`; commit it, never hand-edit)
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch, even though they look related):
- The bodies of `Rails`, `Lines`, `Grid`, `BarRects`, `barMarks`, `Legend`, `Swatch`, `Tip`, `TipContent`, `Meter`, `layout`, `paints`. You call them; you do not change them.
- Every public props type (`BarChartProps`, `LineChartProps`, `StackedBarChartProps`, `ChartSeries`, `MeterProps`).
- How a bar chart's marks draw in any world. Plan 003 was reviewed; the `bars.flatMap` block in the Device body stays character for character. One deliberate change reaches bars too: the readout now shows the leading number of a value formatted with a unit, where it used to show nothing.
- `gallery/src/components/seven-segment.tsx`, every other component, the blocks, `tokens.css`, `gallery/scripts/**`, `skills/litt-md/taste/**`.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/chart-line-stack-bodies`.
- One commit: `gallery: the line and stacked charts' bodies`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline, and Flat's picture before any change

Run `npm ci --prefix gallery`, `npm run verify --prefix gallery`, `npm run build --prefix gallery`.

Save this script as `gallery/.agent-shots/flat-shot.mjs` (`.agent-shots` is gitignored; create the folder). It photographs the pages that hold charts, in the gallery's own look (Flat), in light and dark, with motion reduced so nothing is mid-animation.

```js
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../dist");
const mode = process.argv[2];
if (mode !== "before" && mode !== "after") { console.error("usage: flat-shot.mjs before|after"); process.exit(2); }
const roots = [process.env.A11Y_TOOLS, path.join(here, ".."), "/opt/node22/lib"].filter(Boolean);
let chromium;
for (const root of roots) {
  try { ({ chromium } = createRequire(path.join(root, "noop.js"))("playwright")); break; } catch { /* next root */ }
}
if (!chromium) { console.error("playwright not found: set A11Y_TOOLS (see the plan's Commands section)"); process.exit(2); }

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".webp": "image/webp" };
const server = http.createServer((req, res) => {
  const p = path.join(dist, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(dist + path.sep) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
  fs.createReadStream(p).pipe(res);
}).listen(0);

/* The Chart page grows at its foot (the Three bodies stage), so only its first 9000px are compared. */
const PAGES = [["chart", 9000], ["dashboard", 0], ["growth", 0], ["usage", 0], ["insights", 0]];
const sizes = mode === "after" ? JSON.parse(fs.readFileSync(path.join(here, "flat-sizes.json"), "utf8")) : {};
const browser = await chromium.launch();
let differ = 0;
for (const theme of ["light", "dark"]) {
  for (const [id, cap] of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
    await page.goto(`http://localhost:${server.address().port}/index.html#${id}`, { waitUntil: "networkidle" });
    await page.waitForSelector("main h1", { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      scrollTo(0, 0);
    });
    await page.waitForTimeout(1200);
    const material = await page.evaluate(() => document.documentElement.getAttribute("data-material"));
    if (material !== "flat") { console.error(`${id}: the gallery opened in ${material}, not Flat`); process.exit(2); }
    const key = `${id}-${theme}`;
    if (mode === "before") sizes[key] = cap || (await page.evaluate(() => document.documentElement.scrollHeight));
    const shot = await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: 1440, height: sizes[key] } });
    await page.close();
    const file = path.join(here, `flat-${mode}-${key}.png`);
    fs.writeFileSync(file, shot);
    if (mode === "after") {
      const same = fs.readFileSync(path.join(here, `flat-before-${key}.png`)).equals(shot);
      console.log(`${key}: ${same ? "identical" : "DIFFERENT"}`);
      if (!same) differ++;
    }
  }
}
await browser.close();
server.close();
if (mode === "before") { fs.writeFileSync(path.join(here, "flat-sizes.json"), JSON.stringify(sizes)); console.log("Flat photographed before the change: 10 pictures."); }
else console.log(differ ? `${differ} picture(s) differ.` : "Flat is unchanged: 10 pictures identical.");
process.exit(differ ? 1 : 0);
```

Run `node gallery/.agent-shots/flat-shot.mjs before`.

**Verify**: `verify` and `build` exit 0; the script prints `Flat photographed before the change: 10 pictures.`; `git status --short` prints nothing.

Then prove the comparison is stable before you rely on it: run `node gallery/.agent-shots/flat-shot.mjs after` right away, with nothing changed. It must print `Flat is unchanged: 10 pictures identical.` If it reports a difference with no change made, the comparison is not reliable here: STOP and report which pictures differ.

### Step 2: Resolve lines and stacks for Device, in `chart.tsx`

1. Replace the `ChartBodyProps` type with:

```tsx
/** A series' line as Device traces it: one point per category, and how it is painted. */
export type ChartTrace = {
  key: string;
  series: number;
  points: { x: number; y: number }[];
  /** The series' rest fill class, used when it carries a data hue. */
  fill: string;
  hue: boolean;
  /** The series is told apart by a dash as well as its color (WCAG 1.4.1). */
  dashed: boolean;
};

/** One category of a stacked chart as Device lights it: its centre, and its parts from the baseline up. */
export type ChartColumn = {
  index: number;
  x: number;
  parts: { key: string; series: number; /** The part's height in px at the chart's scale. */ height: number; fill: string }[];
};

/** What a body draws (proposals/worlds.md, Bodies): the contract's resolved state for a chart. */
export type ChartBodyProps = {
  kind: "bar" | "line" | "stack";
  width: number;
  height: number;
  /** The image's summary, for the svg's aria-label. */
  text: string;
  g: ChartGeometry;
  labels: string[];
  fmt: (v: number) => string;
  /** The marks as Press and Flat draw them: the bars, the lines or the stacked rails, with their own focus ring. */
  marks: ReactNode;
  /** The same marks as data, for a body that draws them itself (Device): one of these is filled, by kind. */
  bars: ChartBar[];
  traces: ChartTrace[];
  columns: ChartColumn[];
  /** The focus ring's box, while a category has keyboard focus. */
  ring: Box | null;
  /** The faint band behind the active category, when there are several series. */
  band: Box | null;
  /** What the readout says: a single series' emphasised value, or the active stack's total; null when there is nothing to say. */
  reading: string | null;
  /** The emphasised category (the current, hovered or focused one), and the active one (hovered, focused or pinned). */
  emphasis: number | null;
  active: number | null;
};
```

2. Directly after the `barMarks` function, add:

```tsx
/** Each series' points, for a body that traces the line itself. */
function lineTraces(g: Geometry, series: ChartSeries[], paint: Paint[], n: number): ChartTrace[] {
  return series.map((s, j) => ({
    key: s.name,
    series: j,
    points: Array.from({ length: n }, (_, i) => ({ x: g.cx(i), y: g.y(s.values[i] ?? 0) })),
    fill: paint[j]!.rest,
    hue: paint[j]!.rest.startsWith("fill-data-"),
    dashed: Boolean(paint[j]!.dash),
  }));
}

/** Each category's parts from the baseline up, at the scale the rails use. */
function stackColumns(g: Geometry, series: ChartSeries[], paint: Paint[], n: number): ChartColumn[] {
  const scale = g.plotH / Math.max(1, g.ticks[g.ticks.length - 1]!);
  return Array.from({ length: n }, (_, i) => ({
    index: i,
    x: g.cx(i),
    parts: series
      .map((s, j) => ({ key: `${s.name}-${i}`, series: j, height: Math.max(0, s.values[i] ?? 0) * scale, fill: paint[j]!.rest }))
      .filter((p) => p.height > 0),
  }));
}

/** The focus ring's box for a category of a line or a stacked chart, as Lines and Rails place their own. */
function focusBox(kind: "line" | "stack", g: Geometry, series: ChartSeries[], i: number): Box {
  if (kind === "stack") {
    const bw = Math.max(2, Math.min(MAX_RAIL, Math.floor(g.slotW * 0.5)));
    const top = g.y(stackTotal(series, i));
    return { x: Math.round(g.left + i * g.slotW + (g.slotW - bw) / 2) - 4, y: top - 4, width: bw + 8, height: g.y(0) - top + 8 };
  }
  const ys = series.map((s) => g.y(s.values[i] ?? 0));
  return { x: g.cx(i) - 8, y: Math.min(...ys) - 8, width: 16, height: Math.max(...ys) - Math.min(...ys) + 16 };
}
```

3. Replace `FlatBody` and `PressBody` with these. They no longer know which kind of chart they hold:

```tsx
/** Flat: the chart as it has always been. A hairline grid, the value axis and the marks, on the page with no ground. */
function FlatBody({ width, height, text, g, labels, fmt, marks, band }: ChartBodyProps) {
  return (
    <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
      <Grid g={g} labels={labels} fmt={fmt} />
      {band && <rect {...band} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />}
      {marks}
    </svg>
  );
}

/** Press: the plot is a sunken well, the marks stand on its floor, and the category labels sit on a raised rail under it. */
function PressBody({ width, height, text, g, labels, fmt, marks, band }: ChartBodyProps) {
  return (
    <>
      <div aria-hidden="true" data-well="" className="absolute -z-10 rounded-control bg-tray shadow-(--tray-shade)" style={{ left: g.left, top: g.top, width: g.plotW, height: g.plotH }} />
      <div aria-hidden="true" className="absolute -z-10 rounded-control bg-block shadow-(--block-lift)" style={{ left: g.left, top: g.base + 6, width: g.plotW, height: AXIS - 8 }} />
      <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        <Grid g={g} labels={labels} fmt={fmt} />
        {band && <rect {...band} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />}
        {marks}
      </svg>
    </>
  );
}
```

4. In `Chart()`:
   - Replace the two lines `const world: World = useMaterial();` and `const body: World | null = kind === "bar" ? world : null;` with one: `const body: World = useMaterial();`
   - In the `g` memo, replace `body ? FRAME[body] : FRAME.press` with `FRAME[body]`.
   - Replace the two lines that define `marks` and `Body` with:

```tsx
  const bars = kind === "bar" ? barMarks(g, series, paint, n, emphasis, fmt) : null;
  const Body = byWorld(body, { press: PressBody, flat: FlatBody, device: ChartDeviceBody });
  const marks = bars ? (
    <BarRects bars={bars.bars} ring={ring !== null ? bars.ringOf(ring) : null} entrance={entrance} enter={enter} />
  ) : kind === "stack" ? (
    <Rails g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
  ) : (
    <Lines g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
  );
```

   - Change the root's attribute `data-body={body ?? undefined}` to `data-body={body}`.
   - Replace the whole `{marks ? ( <Body … /> ) : ( <svg> … </svg> )}` expression with:

```tsx
            <Body
              kind={kind}
              width={width}
              height={height}
              text={text}
              g={g}
              labels={labels}
              fmt={fmt}
              marks={marks}
              bars={bars ? bars.bars : []}
              traces={kind === "line" ? lineTraces(g, series, paint, n) : []}
              columns={kind === "stack" ? stackColumns(g, series, paint, n) : []}
              ring={ring === null ? null : bars ? bars.ringOf(ring) : focusBox(kind === "stack" ? "stack" : "line", g, series, ring)}
              band={many && active !== null ? { x: g.left + active * g.slotW, y: g.top, width: g.slotW, height: g.plotH } : null}
              reading={
                kind === "stack"
                  ? active !== null
                    ? fmt(stackTotal(series, active))
                    : null
                  : !many && emphasis !== null
                    ? fmt(value(series[0]!, emphasis))
                    : null
              }
              emphasis={emphasis}
              active={active}
            />
```

5. In the file's header comment, in the `- Bodies` bullet that plan 003 added, replace its last sentence (`LineChart, StackedBarChart and Meter have no bodies yet and draw as before in every world.`) with: `LineChart and StackedBarChart take the same bodies: Press's well and rail around today's lines and rails, Flat as it has always been, and on Device a line is a trace of lit dots and a stack a column of them. Meter has no bodies yet.`

**Verify**: `npm run typecheck --prefix gallery` fails only inside `bodies/chart.device.tsx` (it still destructures `entrance`-era props or lacks the new ones). Continue.

### Step 3: Replace `gallery/src/components/bodies/chart.device.tsx` with this

The bar code inside it is the reviewed code from plan 003, unchanged.

```tsx
/**
 * Chart, the Device body (proposals/worlds.md, Bodies): a dot-matrix screen, the reading in seven segments.
 *
 * - The ground is LCD glass at the plot (--field, its line and shade). A matrix of unlit dots covers it, one dot every
 *   6px, the ink at 10%. Every mark is dots of that matrix lit, so a value is a whole number of dots.
 * - A bar is the dots of its columns lit up to its height. A single series is the glass's ink, the emphasised bar
 *   full and the others at 55%; several series step down (100%, 55%, 30%); a series with a data hue lights in its hue,
 *   where the color carries the data (R7).
 * - A line is a trace: one dot in every column between its first and last point, at the line's height there, and the
 *   dots between two columns where the line is steep, so the trace never breaks. The emphasised category is a plus of
 *   five dots at full strength. A series the chart dashes (never color alone, WCAG 1.4.1) skips every third column.
 * - A stack is one column of dots per category, each part lit in its hue from the baseline up, one unlit dot between
 *   parts. While a category is active the others dim to 55%.
 * - No value axis and no gridlines. The readout above the screen shows, in seven segments (the Seven-segment part), a
 *   single series' emphasised value or the active stack's total: the number the formatted value starts with, without
 *   its unit ("41 s" shows 41). A value that does not start with a number shows no readout. The tooltip and the hidden
 *   table say every value, with its unit.
 * - Category labels are engraved under the screen (litt-legend). Nothing grows or fades in: the dots are lit (R4,
 *   Device switches where it stands).
 */
import { useId, type ReactNode } from "react";
import { SevenSegment } from "@/components/seven-segment";
import type { ChartBodyProps } from "../chart";

const PITCH = 6; // a dot and the gap after it
const DOT = 2; // a dot's radius
const FIGURE = 7.2; // advance of a 12px tabular figure, as the chart measures labels
const LEVEL = [1, 0.55, 0.3];
/** A line's marker: the dot at the point and its four neighbours. */
const PLUS: [number, number][] = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
/** The number a formatted value starts with ("41 s", "2.5 GB", "1204"): what seven segments can show. */
const NUMBER = /^-?[0-9]+(?:\.[0-9]+)?/;

/** Device: a dot-matrix screen. */
export function ChartDeviceBody({ kind, width, height, text, g, labels, bars, traces, columns, ring, reading, emphasis, active }: ChartBodyProps) {
  const id = "dots" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const n = labels.length;
  const cols = Math.max(0, Math.floor(g.plotW / PITCH));
  const rows = Math.max(0, Math.floor(g.plotH / PITCH));
  const x0 = g.left + (g.plotW - cols * PITCH) / 2;
  const y0 = g.base - rows * PITCH;
  const single = !bars.some((b) => b.series > 0);
  const figure = reading === null ? null : (NUMBER.exec(reading.replace(/,/g, ""))?.[0] ?? null);

  /** The matrix column under an x and the row at a y, kept on the screen. */
  const colOf = (x: number) => Math.max(0, Math.min(cols - 1, Math.round((x - x0) / PITCH - 0.5)));
  const rowOf = (y: number) => Math.max(0, Math.min(rows - 1, Math.round((g.base - y) / PITCH - 0.5)));
  const dot = (key: string, c: number, r: number, fill: string, opacity: number) => (
    <circle
      key={key}
      data-dot=""
      cx={x0 + (c + 0.5) * PITCH}
      cy={g.base - (r + 0.5) * PITCH}
      r={DOT}
      opacity={opacity}
      className={"transition-[fill,opacity] duration-(--dur-instant) ease-litt " + fill}
    />
  );

  const traceDots =
    kind !== "line" || cols === 0 || rows === 0
      ? []
      : traces.flatMap((t) => {
          const pts = t.points;
          if (pts.length === 0) return [];
          const fill = t.hue ? t.fill : "fill-field-ink";
          const opacity = t.hue ? 1 : traces.length === 1 ? 0.6 : LEVEL[Math.min(t.series, 2)]!;
          const out: ReactNode[] = [];
          const lit = new Set<string>();
          const light = (c: number, r: number, o: number) => {
            if (c < 0 || c >= cols || r < 0 || r >= rows || lit.has(`${c}-${r}`)) return;
            lit.add(`${c}-${r}`);
            out.push(dot(`${t.key}-${c}-${r}`, c, r, fill, o));
          };
          /* The marker first, so its dots are the full-strength ones. */
          const mark = emphasis === null ? undefined : pts[emphasis];
          if (mark) for (const [dc, dr] of PLUS) light(colOf(mark.x) + dc, rowOf(mark.y) + dr, 1);
          const first = colOf(pts[0]!.x);
          const last = colOf(pts[pts.length - 1]!.x);
          let seg = 0;
          let prev: number | null = null;
          for (let c = first; c <= last; c++) {
            const x = x0 + (c + 0.5) * PITCH;
            while (seg < pts.length - 2 && x > pts[seg + 1]!.x) seg++;
            const a = pts[seg]!;
            const b = pts[Math.min(seg + 1, pts.length - 1)]!;
            const k = b.x === a.x ? 0 : Math.max(0, Math.min(1, (x - a.x) / (b.x - a.x)));
            const r = rowOf(a.y + (b.y - a.y) * k);
            /* Where the line climbs or falls more than a dot between two columns, light the dots between. */
            const from = prev === null ? r : r > prev ? prev + 1 : r < prev ? prev - 1 : r;
            prev = r;
            if (t.dashed && c % 3 === 2) continue;
            for (let q = Math.min(from, r); q <= Math.max(from, r); q++) light(c, q, opacity);
          }
          return out;
        });

  const stackDots =
    kind !== "stack" || cols === 0 || rows === 0
      ? []
      : columns.flatMap((col) => {
          const c = colOf(col.x);
          const opacity = active === null || active === col.index ? 1 : 0.55;
          let r = 0;
          return col.parts.flatMap((p) => {
            const tall = Math.max(1, Math.round(p.height / PITCH));
            const start = r;
            r += tall + 1;
            return Array.from({ length: Math.max(0, Math.min(tall, rows - start)) }, (_, k) => dot(`${p.key}-${k}`, c, start + k, p.fill, opacity));
          });
        });

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute -z-10 rounded-control bg-field shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]"
        style={{ left: g.left, top: g.top - 4, width: g.plotW, height: g.plotH + 8 }}
      />
      {figure !== null && (
        <div aria-hidden="true" className="absolute top-0 right-0">
          <SevenSegment value={figure} className="px-1.5! py-1! [font-size:var(--type-caption-size)]" />
        </div>
      )}
      <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
        <defs>
          <pattern id={id} patternUnits="userSpaceOnUse" x={x0} y={y0} width={PITCH} height={PITCH}>
            <circle cx={PITCH / 2} cy={PITCH / 2} r={DOT} opacity={0.1} className="fill-field-ink" />
          </pattern>
        </defs>
        <g aria-hidden="true">
          <rect x={x0} y={y0} width={cols * PITCH} height={rows * PITCH} fill={`url(#${id})`} />
          {bars.flatMap((b) => {
            const c0 = Math.max(0, Math.min(cols - 1, Math.round((b.x - x0) / PITCH)));
            const wide = Math.max(1, Math.min(cols - c0, Math.round(b.width / PITCH)));
            const tall = Math.max(1, Math.min(rows, Math.round(b.height / PITCH)));
            const opacity = b.hue ? 1 : single ? (b.strong ? 1 : 0.55) : LEVEL[Math.min(b.series, 2)];
            return Array.from({ length: wide * tall }, (_, k) => (
              <circle
                key={`${b.key}-${k}`}
                data-dot=""
                cx={x0 + (c0 + (k % wide) + 0.5) * PITCH}
                cy={g.base - (Math.floor(k / wide) + 0.5) * PITCH}
                r={DOT}
                opacity={opacity}
                className={"transition-[fill,opacity] duration-(--dur-instant) ease-litt " + (b.hue ? b.fill : "fill-field-ink")}
              />
            ));
          })}
          {traceDots}
          {stackDots}
          <g className="litt-legend fill-fg-subtle text-caption font-normal tabular-nums">
            {labels.map((l, i) => {
              if ((n - 1 - i) % g.step !== 0) return null;
              const last = i === n - 1 && g.cx(i) + (l.length * FIGURE) / 2 > g.width;
              return (
                <text key={i} x={last ? g.width : g.cx(i)} y={g.base + 20} textAnchor={last ? "end" : "middle"}>
                  {l}
                </text>
              );
            })}
          </g>
          {ring && <rect {...ring} fill="none" strokeWidth={2} className="stroke-focus" />}
        </g>
      </svg>
    </>
  );
}
```

**Verify**: `npm run typecheck --prefix gallery` → exit 0. `npm run lint:litt --prefix gallery` → exit 0.

If the typecheck or the lint rejects a line of this plan's own code, fix only what the tool names, in the smallest way that keeps the design table true and stays inside `chart.tsx` and `bodies/chart.device.tsx`, and describe the change precisely in your report. If that is not enough, STOP.

### Step 4: Show lines and stacks in the "Three bodies" stage, in `gallery/src/gallery/pages/18-chart.tsx`

1. In `ThreeBodiesDemo`, directly after the `<BarChart … />` element and inside the same `<MaterialProvider>`, add a `<LineChart … />` with the **same props as the LineChart in this page's `BuildTimeDemo`** and a `<StackedBarChart … />` with the **same props as the one in `StackedDemo`**, each without any `key` and with `entrance={false}`. Change nothing else in the function.
2. Replace the "Three bodies" stage's `caption` with:

```
One contract, three bodies. Press is a sunken well, the marks standing on its floor and the labels on a raised rail. Flat is the chart on the page: a hairline grid, the value axis and the marks, with no ground. Device is a dot-matrix screen: bars and stacks are columns of lit dots, a line is a trace of them, and the current value shows in seven segments above it.
```

**Verify**: `npm run verify --prefix gallery` fails **only** with a message that the `chart` item changed without a changelog line, or passes. Any other failure: fix it if it is a typo against this plan, otherwise STOP.

### Step 5: The spec line, the changelog line and the lock

1. In `skills/litt-md/system/components.md`, in the `- **Bodies:**` bullet under `## Chart`: replace its opening sentence (`BarChart has a body per material; LineChart, StackedBarChart and Meter do not yet and draw the same in every world.`) with `BarChart, LineChart and StackedBarChart have a body per material; Meter does not yet.` and add at the end of the bullet: ` A line under Device is a trace of lit dots, one in every column and the dots between where it is steep, the emphasised category a plus of five dots, a dashed series skipping every third column; a stack is one column of dots per category, each part in its hue with one unlit dot between parts, and the readout shows the active category's total. Under Press, lines and stacked rails are today's marks in the same well, with the labels on the same rail.`

2. Open `gallery/CHANGELOG.md` and get today's date with `date +%F`.
   - If the newest release is today's and already has a line starting `- **changed** \`chart\`:`, replace that whole line with the one below.
   - If the newest release is today's and has no `chart` line, add the line below to its list.
   - Otherwise add a new release above the newest one, headed `## <today> · Data, a body per world: the line and stacked charts`, with the line below as its list.

```
- **changed** `chart`: BarChart, LineChart and StackedBarChart have a body per material. Press is a sunken well with the marks standing on its floor and the labels on a raised rail. Flat is the chart as it was. Device is a dot-matrix screen: bars and stacks as columns of lit dots, a line as a trace of dots, and the current value in seven segments, so the item installs `seven-segment` with it. Meter is unchanged, and so are the props.
```

3. Run `npm run verify --prefix gallery`.

**Verify**: `verify` exits 0; `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.` If `verify` names any item other than `chart`, or refuses the `chart` change for its version, STOP and report the message.

### Step 6: Flat must not have moved

Run `npm run build --prefix gallery`, then `node gallery/.agent-shots/flat-shot.mjs after`.

**Verify**: exit 0 and the last line is `Flat is unchanged: 10 pictures identical.` If any picture differs, STOP: do not commit. Report which pictures differ. (The `flat-before-*.png` and `flat-after-*.png` files are left for the reviewer.)

### Step 7: Prove each world draws its own line and stack

Save this as `gallery/.agent-shots/check-charts.mjs` and run `node gallery/.agent-shots/check-charts.mjs`.

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
const KINDS = ["bar", "line", "stack"];
const browser = await chromium.launch();
const rows = [];
let bad = 0;
for (const [width, height] of [[1440, 900], [320, 700]]) {
  for (const world of WORLDS) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`http://localhost:${server.address().port}/index.html?look=${world}#chart`, { waitUntil: "networkidle" });
    await page.waitForSelector("main h1", { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const found = await page.evaluate(({ world, KINDS }) => {
      const count = (c, sel) => c.querySelectorAll(sel).length;
      const out = { material: document.documentElement.getAttribute("data-material") ?? "press", sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth, kinds: {} };
      for (const kind of KINDS) {
        const all = [...document.querySelectorAll(`main [data-chart="${kind}"]`)];
        const own = all.filter((c) => c.getAttribute("data-body") === world);
        out.kinds[kind] = {
          own: own.length,
          others: all.filter((c) => c.getAttribute("data-body") !== world).map((c) => String(c.getAttribute("data-body"))).sort().join(","),
          wells: own.filter((c) => count(c, "[data-well]") === 1).length,
          matrices: own.filter((c) => count(c, "svg pattern") === 1).length,
          gridlines: own.length ? Math.min(...own.map((c) => count(c, "svg line"))) : -1,
          dots: own.length ? Math.min(...own.map((c) => count(c, "svg circle[data-dot]"))) : -1,
          paths: own.length ? Math.min(...own.map((c) => count(c, "svg path"))) : -1,
          segments: own.length ? Math.max(...own.map((c) => count(c, "[data-seg]"))) : -1,
        };
      }
      return out;
    }, { world, KINDS });
    if (width === 1440) await page.screenshot({ path: path.join(here, `charts-${world}.png`), fullPage: true });
    await page.close();
    const fail = (why) => { bad++; console.error(`${width}px ${world}: ${why}`); };
    if (found.material !== world) fail(`the page is in ${found.material}`);
    if (found.sideways > 1) fail(`scrolls ${found.sideways}px sideways`);
    if (errors.length) fail(`page errors: ${errors[0]}`);
    const expectedOthers = WORLDS.filter((w) => w !== world).sort().join(",");
    for (const kind of KINDS) {
      const k = found.kinds[kind];
      rows.push({ width, world, kind, ...k });
      if (k.own < 2) fail(`${kind}: only ${k.own} in the ${world} body`);
      if (k.others !== expectedOthers) fail(`${kind}: other bodies are "${k.others}", expected one of each other world, in the Three bodies stage`);
      if (world === "press" && (k.wells !== k.own || k.matrices !== 0 || k.gridlines < 3)) fail(`${kind}: Press: ${k.wells} of ${k.own} wells, ${k.matrices} matrices, fewest gridlines ${k.gridlines}`);
      if (world === "flat" && (k.wells !== 0 || k.matrices !== 0 || k.gridlines < 3)) fail(`${kind}: Flat: ${k.wells} wells, ${k.matrices} matrices, fewest gridlines ${k.gridlines}`);
      if (world === "device" && (k.matrices !== k.own || k.wells !== 0 || k.gridlines !== 0 || k.dots < 10)) fail(`${kind}: Device: ${k.matrices} of ${k.own} matrices, ${k.wells} wells, ${k.gridlines} gridlines, fewest dots ${k.dots}`);
      if (kind === "line" && world !== "device" && k.paths < 1) fail(`line: no path drawn in ${world}`);
      if (kind === "line" && world === "device" && k.paths !== 0) fail(`line: Device still draws ${k.paths} path(s)`);
      if (kind !== "stack" && world === "device" && k.segments < 7) fail(`${kind}: Device shows no seven-segment reading`);
    }
  }
}
await browser.close();
server.close();
console.table(rows);
console.log(bad ? `${bad} problem(s).` : "Every chart draws its own body in every world.");
process.exit(bad ? 1 : 0);
```

**Verify**: exit 0, last line `Every chart draws its own body in every world.`, 18 rows. Keep the table for your report. The screenshots `gallery/.agent-shots/charts-press.png`, `charts-flat.png`, `charts-device.png` are for the reviewer; do not commit them.

If the script fails only because a kind has fewer than 2 charts in the world's body (`only N in the … body`), do not change the page: report the number and continue.

### Step 8: The repo's own checks

Each must exit 0:

```bash
npm run test:reflow --prefix gallery -- --pages chart,dashboard,growth,usage,insights
npm run test:text-zoom --prefix gallery -- --pages chart,dashboard,growth,usage,insights
npm run test:corners --prefix gallery -- --pages chart,dashboard,growth,usage,insights
npm run test:gaps --prefix gallery -- --pages chart,dashboard,growth,usage,insights
npm run test:motion --prefix gallery -- --pages chart,dashboard,growth,usage,insights
npm run test:wall --prefix gallery
npm run test:worlds --prefix gallery
npm run test:study --prefix gallery
```

If a check fails and names a chart, try one fix inside `chart.tsx` or the Device body file that keeps the design table true; if it still fails, STOP and report the output. If a check fails on something that is not a chart, report it as not caused by this plan and continue.

Then the install test, from the repo root: `node gallery/scripts/test-registry.mjs --app vite --items chart,seven-segment --scenarios each,seq`.

**Verify**: its last lines include `all steps passed`. If it cannot reach the network, say so in your report; that is not a STOP. If it fails on `chart`, STOP and report.

### Step 9: Commit and final checks

`git add gallery/src/components/chart.tsx gallery/src/components/bodies/chart.device.tsx gallery/src/gallery/pages/18-chart.tsx skills/litt-md/system/components.md gallery/CHANGELOG.md gallery/registry.lock.json`, then commit with the message `gallery: the line and stacked charts' bodies`.

Run `npm run verify --prefix gallery`, `npm run build --prefix gallery`, `node gallery/.agent-shots/flat-shot.mjs after`, `node gallery/.agent-shots/check-charts.mjs`, `git status --short`.

**Verify**: all exit 0 and `git status --short` prints nothing except, at most, `plans/README.md`.

## Test plan

- The repo has no unit-test framework; its tests are the generators, the lint and the Playwright page checks.
- **Flat unchanged** (Step 6): ten pictures (the Chart page's first 9000px and the four dashboard screens, light and dark) byte-identical before and after. Step 1 proves the comparison is stable before it is relied on.
- **Each world its own** (Step 7): for bar, line and stack, at 1440px and 320px in each world: the world's body is drawn; the Three bodies stage shows the other two; Press has wells and gridlines; Flat has gridlines and neither well nor matrix; Device has the matrix, lit dots, no gridlines, no line path, and a seven-segment reading for bars and lines; no sideways scroll; no page errors.
- Regression: reflow, text zoom, corners, gaps and reduced motion on the Chart page and the four dashboard screens; the wall, the worlds and the study checks; the install test for `chart` in a fresh Vite app.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run verify --prefix gallery` and `npm run build --prefix gallery` exit 0
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] `node gallery/.agent-shots/flat-shot.mjs after` exits 0 and prints `Flat is unchanged: 10 pictures identical.`
- [ ] `node gallery/.agent-shots/check-charts.mjs` exits 0 and prints `Every chart draws its own body in every world.`
- [ ] Every command in Step 8 exits 0, or the report names the one that did not and why it is not this plan's
- [ ] `git diff <starting commit> -- gallery/src/components/chart.tsx | grep -E '^[-+].*(function Lines|function Rails|function Grid|function BarRects|function barMarks|function Meter|function layout|export type (BarChartProps|LineChartProps|StackedBarChartProps|ChartSeries|MeterProps))'` prints nothing
- [ ] `grep -n 'from "../chart"' gallery/src/components/bodies/chart.device.tsx` shows only an `import type` line
- [ ] `git diff --stat <starting commit>` lists only the in-scope files
- [ ] The install test printed `all steps passed`, or the report says plainly that it could not run and why
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows changes and the excerpts in "Current state" no longer match.
- Step 1's second run reports a difference with nothing changed (the comparison is not stable here).
- Step 6 reports any picture different. Flat moving is the one thing this plan must not do.
- The work seems to need a change inside `Rails`, `Lines`, `Grid`, `BarRects`, `barMarks`, `layout` or any public props type.
- `verify` fails with an error that is not a typo against this plan and that Step 3's one-fix allowance does not cover, or names an item other than `chart`, or refuses the `chart` change for its version.
- Step 7's script still fails after you have checked your files against Steps 2 to 4. Report its table. Do not change its expectations, except as Step 7 itself allows.
- A Step 8 check fails on a chart after the one fix that step allows.

## Maintenance notes

- **These bodies are a first pass for Nick's eye.** The reviewer must look at `gallery/.agent-shots/charts-press.png` and `charts-device.png`, and at the Dashboard, Growth, Usage and Insights screens in Press and Device, in light and dark. Expect a revision round on: how a dot trace reads for a nearly flat line and for a steep one; the plus marker's size; the stack's one-dot gap; and how three or more lines read on one small screen.
- **Device's dashes are coarser than the chart's.** The chart tells five hue lines apart with three different dash patterns; the dot trace has one (every third column unlit). A dotted or dash-dotted trace needs its own rhythm, which is a design call.
- **Device's data hues on LCD glass are still unchecked for contrast** by `check.mjs` (see plan 003's notes). A stacked chart is always in hues, so this now matters on every Device stack.
- **Press's grid is still hairlines**, as plan 003 left it.
- **Meter is the last part of `chart.tsx` without bodies.** It also holds the file's one remaining `in-[[data-material=flat]]` class.
- **`focusBox` repeats the geometry `Rails` and `Lines` use for their own rings.** It exists so those two functions could stay untouched; if either changes its ring, change `focusBox` with it.
