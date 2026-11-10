# Plan 003: BarChart draws its data three ways: a sunken well in Press, today's chart in Flat, a dot-matrix screen in Device

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 84f3844..HEAD -- gallery/src/components/chart.tsx gallery/src/components/bodies/chart.device.tsx gallery/src/components/seven-segment.tsx gallery/src/gallery/pages/18-chart.tsx gallery/src/motion/deal.ts gallery/src/motion/index.tsx skills/litt-md/system/components.md`
> If any of these changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. (`gallery/CHANGELOG.md` and
> `gallery/registry.lock.json` are expected to have moved; that is not drift.)

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED (a 906-line shipped component is restructured, and the three looks can only be judged by eye; expect one or two review rounds)
- **Depends on**: none. Plan 002 (Stat) is the pattern this follows; it helps if it has merged, but nothing here needs it.
- **Category**: direction
- **Planned at**: commit `84f3844`, 2026-11-10

## Why this matters

Nick, 2026-11-10: "What I mostly wanna see is each world display data in their own way."

A bar chart is the clearest place to see it, and today it is the same grey bars
on the same hairline grid in Press, Flat and Device. `proposals/worlds.md`
already decides what a chart is in each world:

| Part | Press | Flat | Device |
|---|---|---|---|
| Chart (`chart`) | Marks in a sunken well, its grid as grooves lit from the top, the axis on a raised rail | Ink marks on grey, no axes and no gridlines, each value set in type beside its mark | A dot-matrix screen: bars as columns of lit dots, a line as a trace of dots, the reading in segments |

Nick then looked at the data parts as they are today and said: "current ones are
good, we should save them for flat". So **Flat keeps today's bar chart exactly**
(the hairline grid, the value axis, the bars), and the new bodies are Press's
and Device's. The Flat column of the table above is superseded for this part.

This plan builds that for **BarChart only**. LineChart, StackedBarChart and
Meter live in the same file and stay exactly as they are; they get their own
plans. Keeping the scope to one kind of mark is what makes this reviewable.

## Current state

### Files and their roles

- `gallery/src/components/chart.tsx` (906 lines) — `BarChart`, `LineChart`, `StackedBarChart` and `Meter`. The first three are thin wrappers over one private `Chart()` function.
- `gallery/src/components/bodies/` — Flat and Device bodies of bodied parts. No `chart.*` files yet. This plan adds only a Device one; Flat's body is today's chart and stays in `chart.tsx`, beside Press's, because both draw the same grid and bars.
- `gallery/src/components/seven-segment.tsx` — `SevenSegment`, a figure in seven-segment digits behind LCD glass, sized by its font size.
- `gallery/src/gallery/pages/18-chart.tsx` — the Chart page. `DeploysDemo` (line 112) is its single-series BarChart.
- `gallery/src/gallery/pages/17-legend.tsx` — the exemplar of a "Three bodies" stage (`ThreeBodiesDemo`).
- `gallery/src/motion/deal.ts:70` — `export type Material = "press" | "flat" | "device";` and `useMaterial()`, `byWorld()`, re-exported from `@/motion`.
- BarChart is also used by `gallery/src/blocks/dashboard.tsx`, `gallery/src/blocks/growth.tsx`, `gallery/src/components/legend.tsx` (in comments or demos) and the pages `17-dot-plot.tsx`, `17-legend.tsx`.

### How `Chart()` is built today (`gallery/src/components/chart.tsx`)

Imports:

```tsx
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { animate, AnimatePresence, motion, useMotionValueEvent, useTransform } from "motion/react";
import { countText, useExit, useFun, useFunValue, useTransition, useTravel } from "@/motion";
```

Constants and the geometry (lines 104–221):

```tsx
const TOP = 8; // room above the plot
const AXIS = 28; // room under the plot for the category labels
const LABEL_GAP = 6; // between a value label and the plot
const FIGURE = 7.2; // advance of a 12px tabular figure in Geist (letters run narrower)
const MAX_BAR = 32;
...
type Geometry = {
  width: number; height: number; left: number; plotW: number; plotH: number; slotW: number; ticks: number[];
  top: number; // y of the top of the plot
  base: number; // y of the zero baseline
  y: (value: number) => number;
  cx: (index: number) => number; // x of a slot's centre
  step: number; // show every nth category label
};
...
function layout(width: number, height: number, labels: string[], series: ChartSeries[], fmt: (v: number) => string, stacked = false): Geometry {
  ...
  const left = Math.ceil(valueChars * FIGURE) + LABEL_GAP;
  const plotW = Math.max(0, width - left);
  const plotH = Math.max(0, height - TOP - AXIS);
  ...
  const base = TOP + plotH;
  return { width, height, left, plotW, plotH, slotW, ticks, top: TOP, base, y: …, cx: …, step };
}
```

How a series is painted (lines 137–154): `paints()` returns one `Paint` per series,
`{ rest, strong, stroke, marker, edge, dash? }`. A series with a data hue gets
`rest: "fill-data-blue"` and so on (always starting `fill-data-`); a foreground
series gets `fill-fg` or a `fill-[color-mix(…var(--fg)…)]` class.

Inside `Chart()`:

```tsx
  const g = useMemo(() => layout(width, height, labels, series, fmt, stacked), [width, height, labels, series, fmt, stacked]);
  ...
  const current = highlight === "none" || many ? null : highlight === "last" ? n - 1 : highlight;
  const emphasis = active ?? current;
  ...
  return (
    <div className={"w-full " + className}>
      {many && legend && <Legend series={series} kind={kind} paint={paint} />}
      <div ref={boxRef} className="relative w-full" style={{ height }}>
        {width > 0 && !empty && (
          <>
            <svg width={width} height={height} role="img" aria-label={text} className="block overflow-visible">
              <Grid g={g} labels={labels} fmt={fmt} />
              {many && active !== null && (
                <rect x={g.left + active * g.slotW} y={g.top} width={g.slotW} height={g.plotH} className="fill-[color-mix(in_oklab,var(--fg)_4%,transparent)]" />
              )}
              {kind === "stack" ? (
                <Rails … />
              ) : kind === "bar" ? (
                <Bars g={g} series={series} paint={paint} n={n} emphasis={emphasis} ring={ring} entrance={entrance} enter={enter} />
              ) : (
                <Lines … />
              )}
            </svg>
            {/* the pointer layer, the hidden buttons, the tooltip: unchanged by this plan */}
```

`Grid` (line 472) draws the gridlines, the value labels on the left and the
category labels under the plot:

```tsx
        {labels.map((l, i) => {
          if ((n - 1 - i) % g.step !== 0) return null;
          /* The last label would hang past the right edge: right-align it to the edge instead. */
          const half = (l.length * FIGURE) / 2;
          const last = i === n - 1 && g.cx(i) + half > g.width;
          return (
            <text key={i} x={last ? g.width : g.cx(i)} y={g.base + 20} textAnchor={last ? "end" : "middle"}>
              {l}
            </text>
          );
        })}
```

`Bars` (line 523) computes each bar's box and draws it:

```tsx
function Bars({ g, series, paint, n, emphasis, ring, entrance, enter }: MarksProps) {
  const k = series.length;
  const gap = 2;
  const group = k === 1 ? Math.min(MAX_BAR, Math.floor(g.slotW * 0.6)) : Math.min(k * MAX_BAR + gap * (k - 1), Math.floor(g.slotW * 0.7));
  const bw = Math.max(2, Math.floor((group - gap * (k - 1)) / k));
  const span = bw * k + gap * (k - 1);
  const baseline = g.y(0);
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const x0 = g.left + i * g.slotW + (g.slotW - span) / 2;
        return series.map((s, j) => {
          const v = s.values[i] ?? 0;
          const top = g.y(v);
          const h = v > 0 ? Math.max(2, baseline - top) : 0;
          if (h === 0) return null;
          const p = paint[j]!;
          const fill = k === 1 && emphasis === i ? p.strong : p.rest;
          return (
            <motion.rect key={`${s.name}-${i}`} x={x0 + j * (bw + gap)} y={baseline - h} width={bw} height={h}
              initial={entrance ? { scaleY: 0 } : false} animate={{ scaleY: 1, transition: enter }} style={{ originX: 0.5, originY: 1 }} strokeWidth={1}
              className={"transition-[fill] duration-(--dur-instant) ease-litt " + fill + (p.edge ? " " + EDGE : " stroke-transparent")} />
          );
        });
      })}
      {ring !== null && (
        <rect x={g.left + ring * g.slotW + (g.slotW - span) / 2 - 4} y={Math.min(...series.map((s) => g.y(s.values[ring] ?? 0))) - 4}
          width={span + 8} height={baseline - Math.min(...series.map((s) => g.y(s.values[ring] ?? 0))) + 8} fill="none" strokeWidth={2} className="stroke-focus" />
      )}
    </g>
  );
}
```

### The design, in this code's terms

The **contract** stays in `Chart()`: the geometry, which category is active,
the pointer layer, the hidden buttons, the tooltip, the hidden table, the
legend. It resolves every bar's box once. A **body** draws three things from
that: a ground behind the plot, the labels, and the bars.

| | Press | Flat | Device |
|---|---|---|---|
| Ground | A sunken well at the plot (`bg-tray`, `shadow-(--tray-shade)`), and a raised rail under it for the category labels (`bg-block`, `shadow-(--block-lift)`) | None, as today | LCD glass at the plot (`bg-field` with the field line and shade), and the bezel above it |
| Grid and value axis | Today's hairline grid and value labels | Today's hairline grid and value labels | None |
| Bars | Today's bars, standing on the well's floor | Today's bars | Columns of lit dots on a matrix of unlit dots |
| Reading | The tooltip | The tooltip | The emphasised value in seven segments on the bezel, and the tooltip |
| Room | Value axis on the left, 8px above the plot | The same as Press: today's | No left axis, 44px above for the readout |
| Entrance | Bars grow from the baseline (as today) | Bars grow from the baseline (as today) | None: the dots are simply lit |

Under Flat a BarChart must look exactly as it does before this plan: same marks, same positions, same colors.

Press's "grid as grooves lit from the top" needs a lit-edge color that no
token provides yet, so this plan keeps Press's grid as hairlines inside the
well. That is recorded in Maintenance notes; do not invent a token.

### Conventions to match (from the bodied parts already in the repo)

- The part's file keeps the contract and the Press body; other bodies live in `gallery/src/components/bodies/<part>.flat.tsx` and `<part>.device.tsx`. Here Flat's body is today's chart, so it stays in `chart.tsx` too, and only Device gets a file.
- A body file imports only **types** from the part (`import type { … } from "../chart"`). Packages and other components are imported normally.
- The drawn root carries `data-body="press" | "flat" | "device"`.
- Each body file opens with a comment that says what the body is made of.
- Recipes already in the repo, to be used as written: the tray `bg-tray shadow-(--tray-shade)`; a raised block `bg-block shadow-(--block-lift)`; LCD glass `bg-field … shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]` (`seven-segment.tsx:167`); an engraved label `litt-legend`; a small readout `<SevenSegment value={…} className="px-1.5! py-1! [font-size:…]" />` (`bodies/pagination.device.tsx:57`).

### Repo rules you must honour

- No hex values in `gallery/src` or Markdown. Only token names and classes.
- Weights come from the type utilities; never `font-medium`, `font-semibold`, `font-bold`.
- Radii: only `rounded-control`, `rounded-surface`, `rounded-pill`, or none.
- Transitions: only `transition-[fill]`, `transition-[fill,opacity]` and the like with `duration-(--dur-instant) ease-litt`; never `transition-all`, never a literal duration.
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
| Page checks | `npm run test:reflow --prefix gallery -- --pages chart,dot-plot,legend,dashboard,growth` (same flag for `test:text-zoom`, `test:corners`, `test:gaps`, `test:motion`) | exit 0 |
| Whole-gallery checks | `npm run test:wall --prefix gallery`, `npm run test:worlds --prefix gallery`, `npm run test:study --prefix gallery` | exit 0 |
| Install test | `node gallery/scripts/test-registry.mjs --app vite --items chart,seven-segment --scenarios each,seq` (run from the repo root after a `verify`) | `all steps passed` |

The page checks need Playwright, which is deliberately not a dependency. The
scripts look in `$A11Y_TOOLS`, the gallery, then `/opt/node22/lib`. If a script
reports Playwright missing, install it beside the repo as CI does:

```bash
npm install --prefix "${TMPDIR:-/tmp}/a11y" --no-save --no-package-lock playwright@1.56.1
"${TMPDIR:-/tmp}/a11y/node_modules/.bin/playwright" install chromium
export A11Y_TOOLS="${TMPDIR:-/tmp}/a11y"
```

## Scope

**In scope** (the only files you should modify or create):
- `gallery/src/components/chart.tsx`
- `gallery/src/components/bodies/chart.device.tsx` (create)
- `gallery/src/gallery/pages/18-chart.tsx`
- `skills/litt-md/system/components.md` (one bullet under `## Chart`)
- `gallery/CHANGELOG.md` (one release line)
- `gallery/registry.lock.json` (rewritten by `verify`; commit it, never hand-edit)
- `plans/README.md` (your status row)

**Out of scope** (do NOT touch, even though they look related):
- `LineChart`, `StackedBarChart`, `Meter`, and the functions only they use (`Lines`, `Rails`, `Legend`, `Swatch`, `Tip`, `TipContent`, everything under the `Meter` heading). They must render exactly as before, in every world.
- `BarChartProps`, `ChartSeries`, `ChartBaseProps` — the public contract does not change.
- `gallery/src/components/seven-segment.tsx`, `range-chart.tsx`, `dot-plot.tsx`, `sparkline.tsx`, every other component, and the blocks.
- `skills/litt-md/assets/tokens.css`, `tailwind.css` — no new token.
- `gallery/scripts/**`, `skills/litt-md/taste/**`, `gallery/src/canvas/**`.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/bar-chart-three-bodies`.
- One commit: `gallery: the bar chart's three bodies`. Repo style, for reference: `gallery: the legend's Press and Flat pushed apart`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Baseline

Run `npm ci --prefix gallery`, `npm run verify --prefix gallery`, `npm run build --prefix gallery`.

**Verify**: all exit 0, and `git status --short` prints nothing.

### Step 2: Give the layout a frame, in `chart.tsx`

1. Add to the `@/motion` import: `byWorld` and `useMaterial`. Add below it:

```tsx
import { ChartDeviceBody } from "./bodies/chart.device";
```

2. Directly after the `MAX_BAR` constants, add:

```tsx
type World = "press" | "flat" | "device";
/** The room a body keeps around the plot: a value axis on the left or none, and the space above the plot. */
type Frame = { axis: boolean; top: number };
const FRAME: Record<World, Frame> = {
  press: { axis: true, top: TOP },
  flat: { axis: true, top: TOP }, // today's chart
  device: { axis: false, top: 44 }, // the readout sits on the bezel above the screen
};
```

3. Directly after the `Geometry` type, add `export type ChartGeometry = Geometry;`.

4. Change `layout` to take the frame as a last parameter, `frame: Frame = FRAME.press`, and use it in exactly three places:
   - `const left = frame.axis ? Math.ceil(valueChars * FIGURE) + LABEL_GAP : 0;`
   - `const plotH = Math.max(0, height - frame.top - AXIS);`
   - `const base = frame.top + plotH;` and, in the returned object, `top: frame.top` in place of `top: TOP`.

**Verify**: `npm run typecheck --prefix gallery` → exit 0 (nothing uses the new parameter yet, so nothing else changes).

### Step 3: Resolve the bars once, and add the Press and Flat bodies, in `chart.tsx`

1. Replace the whole `Bars` function (from `function Bars(` to its closing brace) with the code below. Keep the `MarksProps` type above it: `Rails` and `Lines` still use it.

```tsx
/** One bar as every body draws it: where it stands, how it is painted and what it says. */
export type ChartBar = {
  key: string;
  /** Its category and its series, by index. */
  index: number;
  series: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** The fill class for its state: the series' rest paint, or its strong one on the emphasised category. */
  fill: string;
  /** A 1px edge, for a third series too faint to stand alone. */
  edge: boolean;
  /** The emphasised category of a single series: the current, hovered or focused one. */
  strong: boolean;
  /** The series carries a data hue. */
  hue: boolean;
  /** The value as text, and whether its category shows its label (every nth does on a narrow chart). */
  text: string;
  labelled: boolean;
};
type Box = { x: number; y: number; width: number; height: number };

/** What a body draws (proposals/worlds.md, Bodies): the contract's resolved state for a bar chart. */
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

/** Every bar's box and paint, and the focus ring's box for a category. */
function barMarks(g: Geometry, series: ChartSeries[], paint: Paint[], n: number, emphasis: number | null, fmt: (v: number) => string) {
  const k = series.length;
  const gap = 2;
  const group = k === 1 ? Math.min(MAX_BAR, Math.floor(g.slotW * 0.6)) : Math.min(k * MAX_BAR + gap * (k - 1), Math.floor(g.slotW * 0.7));
  const bw = Math.max(2, Math.floor((group - gap * (k - 1)) / k));
  const span = bw * k + gap * (k - 1);
  const baseline = g.y(0);
  const bars: ChartBar[] = [];
  for (let i = 0; i < n; i++) {
    const x0 = g.left + i * g.slotW + (g.slotW - span) / 2;
    series.forEach((s, j) => {
      const v = s.values[i] ?? 0;
      const h = v > 0 ? Math.max(2, baseline - g.y(v)) : 0;
      if (h === 0) return;
      /* One series rests (fg 55% or the hue's mark tone) and the emphasised bar is strong. Several series keep their own paint. */
      const p = paint[j]!;
      const strong = k === 1 && emphasis === i;
      bars.push({
        key: `${s.name}-${i}`,
        index: i,
        series: j,
        x: x0 + j * (bw + gap),
        y: baseline - h,
        width: bw,
        height: h,
        fill: strong ? p.strong : p.rest,
        edge: p.edge,
        strong,
        hue: p.rest.startsWith("fill-data-"),
        text: fmt(v),
        labelled: (n - 1 - i) % g.step === 0,
      });
    });
  }
  const ringOf = (i: number): Box => {
    const top = Math.min(...series.map((s) => g.y(s.values[i] ?? 0)));
    return { x: g.left + i * g.slotW + (g.slotW - span) / 2 - 4, y: top - 4, width: span + 8, height: baseline - top + 8 };
  };
  return { bars, ringOf };
}

/** The bars as Press and Flat draw them: the series' paint, growing from the baseline on the responsive tier, and the focus ring. */
function BarRects({ bars, ring, entrance, enter }: Pick<ChartBodyProps, "bars" | "ring" | "entrance" | "enter">) {
  return (
    <g aria-hidden="true">
      {bars.map((b) => (
        <motion.rect
          key={b.key}
          x={b.x}
          y={b.y}
          width={b.width}
          height={b.height}
          initial={entrance ? { scaleY: 0 } : false}
          animate={{ scaleY: 1, transition: enter }}
          style={{ originX: 0.5, originY: 1 }}
          strokeWidth={1}
          className={"transition-[fill] duration-(--dur-instant) ease-litt " + b.fill + (b.edge ? " " + EDGE : " stroke-transparent")}
        />
      ))}
      {ring && <rect {...ring} fill="none" strokeWidth={2} className="stroke-focus" />}
    </g>
  );
}

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

2. In `Chart()`:
   - After the `paint` line, add: `const world: World = useMaterial();` and `const body: World | null = kind === "bar" ? world : null;`
   - Change the `g` memo to pass the frame: `layout(width, height, labels, series, fmt, stacked, body ? FRAME[body] : FRAME.press)` and add `body` to its dependency array.
   - After the `enter` and `empty` lines, add:

```tsx
  const marks = body ? barMarks(g, series, paint, n, emphasis, fmt) : null;
  const Body = byWorld(world, { press: PressBody, flat: FlatBody, device: ChartDeviceBody });
```

   - Change the root element to `<div data-chart={kind} data-body={body ?? undefined} className={"w-full " + className}>`.
   - Change the box's class from `"relative w-full"` to `"relative isolate w-full"`.
   - Replace the `<svg …> … </svg>` element (and only it) with:

```tsx
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

   Leave the pointer layer, the hidden buttons, the tooltip and the hidden table exactly as they are.

3. In the file's header comment, add one bullet after the `- Color` bullet:

```
 * - Bodies (proposals/worlds.md): for BarChart this file resolves every bar once (barMarks) and renders the body the
 *   material picks (byWorld). Press, here, is a sunken well (--tray, --tray-shade) with the bars standing on its floor
 *   and the category labels on a raised rail (--block, --block-lift). Flat, also here, is the chart as it has always
 *   been: the hairline grid, the value axis and the bars, with no ground (Nick, 2026-11-10: the current data parts
 *   are Flat's). Device (bodies/chart.device.tsx) is a dot-matrix screen: bars as columns of lit dots, the emphasised
 *   value in seven segments above it. LineChart, StackedBarChart and Meter have no bodies yet and draw as before in
 *   every world.
```

**Verify**: typecheck fails only because the Device body file does not exist yet. Continue.

### Step 4: Create the Device body, `gallery/src/components/bodies/chart.device.tsx`

```tsx
/**
 * BarChart, the Device body (proposals/worlds.md, Bodies): a dot-matrix screen, the reading in seven segments.
 *
 * - The ground is LCD glass at the plot (--field, its line and shade). A matrix of unlit dots covers it, one dot every
 *   6px, the ink at 10%; a bar is the dots of its columns lit up to its height, snapped to the matrix, so a value is
 *   always a whole number of dots and never a partial one.
 * - A single series is the glass's ink, the emphasised bar full and the others at 55%. Several series step down
 *   (100%, 55%, 30%), and a series with a data hue lights in its hue, where the color carries the data (R7).
 * - No value axis and no gridlines. The emphasised category's value shows in seven segments on the bezel above the
 *   screen (the Seven-segment part), when segments can show it; the tooltip and the hidden table say every value.
 * - Category labels are engraved under the screen (litt-legend). Nothing grows or fades in: the dots are lit (R4,
 *   Device switches where it stands).
 */
import { useId } from "react";
import { SevenSegment } from "@/components/seven-segment";
import type { ChartBodyProps } from "../chart";

const PITCH = 6; // a dot and the gap after it
const DOT = 2; // a dot's radius
const FIGURE = 7.2; // advance of a 12px tabular figure, as the chart measures labels
const LEVEL = [1, 0.55, 0.3];
/** What seven segments can show. */
const SEGMENTS = /^[0-9. -]+$/;

/** Device: a dot-matrix screen. */
export function ChartDeviceBody({ width, height, text, g, labels, bars, ring, reading }: ChartBodyProps) {
  const id = "dots" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const n = labels.length;
  const cols = Math.max(0, Math.floor(g.plotW / PITCH));
  const rows = Math.max(0, Math.floor(g.plotH / PITCH));
  const x0 = g.left + (g.plotW - cols * PITCH) / 2;
  const y0 = g.base - rows * PITCH;
  const single = !bars.some((b) => b.series > 0);
  const plain = reading === null ? null : reading.replace(/,/g, "");
  const figure = plain !== null && SEGMENTS.test(plain) ? plain : null;
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

**Verify**: `npm run typecheck --prefix gallery` → exit 0. `npm run lint:litt --prefix gallery` → exit 0. `grep -c 'function Bars(' gallery/src/components/chart.tsx` → `0`.

If the typecheck or the lint rejects a line of this plan's own code, fix only what the tool names, in the smallest way that keeps the design table above true and stays inside `chart.tsx` and the Device body file, and describe the change precisely in your report. If that is not enough, STOP.

### Step 5: Add the "Three bodies" stage to `gallery/src/gallery/pages/18-chart.tsx`

1. Open `gallery/src/gallery/pages/17-legend.tsx`, read its `ThreeBodiesDemo` and its import lines for `useCustomize`, `useDark`, `lookAttributes`, `MATERIALS` and `MaterialProvider`. Copy those import lines exactly into `18-chart.tsx`.
2. Add a `ThreeBodiesDemo` function next to the page's other demo functions. Copy the Legend page's function, and make two changes only: in the frame's `className`, replace `justify-items-start` with nothing (the chart must take the frame's width); and replace the two `<Legend … />` elements with one `<BarChart … />` that has the **same props as the BarChart in this page's `DeploysDemo`**, without any `key` and with `entrance={false}`.
3. Add as the last `Stage` on the page (before a `<TryIt>` element, if the page ends with one):

```tsx
      <Stage
        title="Three bodies"
        caption="One contract, three bodies. Press is a sunken well, the bars standing on its floor and the labels on a raised rail. Flat is the chart on the page: a hairline grid, the value axis and the bars, with no ground. Device is a dot-matrix screen: bars are columns of lit dots, and the current value shows in seven segments above it. Lines and stacked rails follow in a later release."
        code="ThreeBodiesDemo"
      >
        <ThreeBodiesDemo />
      </Stage>
```

**Verify**: `npm run verify --prefix gallery` fails **only** with a message that the `chart` item changed without a changelog line. Any other failure: fix it if it is a typo against this plan, otherwise STOP.

### Step 6: The spec line, the changelog line and the lock

1. In `skills/litt-md/system/components.md`, under `## Chart`, add one bullet at the end of that section's list:

```
- **Bodies:** BarChart has a body per material; LineChart, StackedBarChart and Meter do not yet and draw the same in every world. Press is a sunken well at the plot (`--tray`, `--tray-shade`), today's hairline grid inside it, the bars standing on its floor and the category labels on a raised rail under it (`--block`, `--block-lift`). Flat is the chart as specified above, on the page with no ground: the current chart is Flat's. Device, bodies/chart.device.tsx: LCD glass (`--field`) covered by a matrix of unlit dots, one every 6px; a bar is its columns' dots lit up to its height in `--field-ink` (the emphasised bar full, the others 55%; a hue series in its hue), the category labels engraved under the screen (`litt-legend`), and the emphasised value in seven segments above it (the Seven-segment part). Nothing in Device's body grows or fades in.
```

2. Open `gallery/CHANGELOG.md`, read the two newest releases for the exact format, and get today's date with `date +%F`. If the newest heading is already today's date, add the line below to that release's list. Otherwise add a new release directly above the newest one:

```
## <today> · Data, a body per world: the bar chart

- **changed** `chart`: BarChart has a body per material. Press is a sunken well with the bars standing on its floor and the labels on a raised rail. Flat is the chart as it was. Device is a dot-matrix screen, bars as columns of lit dots and the current value in seven segments, so the item now installs `seven-segment` with it. LineChart, StackedBarChart and Meter are unchanged, and so are the props.
```

3. Run `npm run verify --prefix gallery`.

**Verify**: `verify` exits 0; `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`; `git status --short` lists `gallery/registry.lock.json` as modified. If `verify` names any item other than `chart` as changed without a changelog line, STOP.

### Step 7: Prove each world draws its own bar chart

Run `npm run build --prefix gallery`. Save the script below as `gallery/.agent-shots/check-chart.mjs` (`.agent-shots` is gitignored; create the folder) and run `node gallery/.agent-shots/check-chart.mjs`.

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
    await page.goto(`http://localhost:${server.address().port}/index.html?look=${world}#chart`, { waitUntil: "networkidle" });
    await page.waitForSelector("main h1", { timeout: 20000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const r = await page.evaluate((world) => {
      const bars = [...document.querySelectorAll('main [data-chart="bar"]')];
      const own = bars.filter((c) => c.getAttribute("data-body") === world);
      const count = (c, sel) => c.querySelectorAll(sel).length;
      return {
        material: document.documentElement.getAttribute("data-material") ?? "press",
        own: own.length,
        others: bars.filter((c) => c.getAttribute("data-body") !== world).map((c) => c.getAttribute("data-body")).sort().join(","),
        unbodied: document.querySelectorAll('main [data-chart="line"][data-body], main [data-chart="stack"][data-body]').length,
        lineCharts: document.querySelectorAll('main [data-chart="line"]').length,
        wells: own.filter((c) => count(c, "[data-well]") === 1).length,
        gridlines: Math.min(...own.map((c) => count(c, "svg line"))),
        dots: Math.min(...own.map((c) => count(c, "svg circle[data-dot]"))),
        patterns: own.filter((c) => count(c, "svg pattern") === 1).length,
        segments: Math.max(0, ...own.map((c) => count(c, "[data-seg]"))),
        rects: Math.min(...own.map((c) => count(c, "svg rect"))),
        sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    }, world);
    if (width === 1440) await page.screenshot({ path: path.join(here, `chart-${world}.png`), fullPage: true });
    await page.close();
    rows.push({ width, world, ...r, errors: errors.length });
    const fail = (why) => { bad++; console.error(`${width}px ${world}: ${why}`); };
    if (r.material !== world) fail(`the page is in ${r.material}`);
    if (r.own < 3) fail(`only ${r.own} bar charts in the ${world} body`);
    if (r.others !== WORLDS.filter((w) => w !== world).join(",")) fail(`other bodies on the page are "${r.others}", expected one of each other world, in the Three bodies stage`);
    if (r.unbodied !== 0) fail("a line or stacked chart carries a body");
    if (r.lineCharts < 1) fail("no line chart found: data-chart is missing");
    if (world === "press" && (r.wells !== r.own || r.gridlines < 3)) fail(`Press: ${r.wells} of ${r.own} have a well, fewest gridlines ${r.gridlines}`);
    if (world === "flat" && (r.gridlines < 3 || r.wells !== 0 || r.patterns !== 0)) fail(`Flat: fewest gridlines ${r.gridlines} (expected today's grid), ${r.wells} wells and ${r.patterns} matrices (expected none)`);
    if (world === "device" && (r.dots < 10 || r.patterns !== r.own || r.gridlines !== 0 || r.segments < 7)) fail(`Device: fewest dots ${r.dots}, ${r.patterns} of ${r.own} have the matrix, ${r.gridlines} gridlines, ${r.segments} segments`);
    if (r.sideways > 1) fail(`scrolls ${r.sideways}px sideways`);
    if (errors.length) fail(`page errors: ${errors[0]}`);
  }
}
await browser.close();
server.close();
console.table(rows);
console.log(bad ? `${bad} problem(s).` : "BarChart draws its own body in every world.");
process.exit(bad ? 1 : 0);
```

**Verify**: exit 0, last line `BarChart draws its own body in every world.`, six rows. Keep the table for your report. The screenshots `gallery/.agent-shots/chart-press.png`, `chart-flat.png`, `chart-device.png` are for the reviewer; do not commit them.

If the script fails only on `only N bar charts` because the Chart page has fewer than three bar charts outside the Three bodies stage, do not change the page: report the number and continue.

### Step 8: The repo's own checks

Each must exit 0:

```bash
npm run test:reflow --prefix gallery -- --pages chart,dot-plot,legend,dashboard,growth
npm run test:text-zoom --prefix gallery -- --pages chart,dot-plot,legend,dashboard,growth
npm run test:corners --prefix gallery -- --pages chart,dot-plot,legend,dashboard,growth
npm run test:gaps --prefix gallery -- --pages chart,dot-plot,legend,dashboard,growth
npm run test:motion --prefix gallery -- --pages chart,dashboard,growth
npm run test:wall --prefix gallery
npm run test:worlds --prefix gallery
npm run test:study --prefix gallery
```

If `test:corners` names the well, the rail or the glass of a bar chart, remove the `rounded-control` or `rounded-surface` class from that one ground element (a square corner is always allowed), rebuild, and re-run; report that you did. For any other failure that names a bar chart, try one fix inside `chart.tsx` or the Device body file; if it still fails, STOP and report the output. If a check fails on something that is not a bar chart, report it as not caused by this plan and continue.

Then the install test, from the repo root: `node gallery/scripts/test-registry.mjs --app vite --items chart,seven-segment --scenarios each,seq`.

**Verify**: last lines include `all steps passed`. If it cannot reach the network, say so in your report; that is not a STOP. If it fails on `chart`, STOP and report.

### Step 9: Commit and final checks

`git add gallery/src/components/chart.tsx gallery/src/components/bodies/chart.device.tsx gallery/src/gallery/pages/18-chart.tsx skills/litt-md/system/components.md gallery/CHANGELOG.md gallery/registry.lock.json`, then commit with the message `gallery: the bar chart's three bodies`.

Run `npm run verify --prefix gallery`, `npm run build --prefix gallery`, `node gallery/.agent-shots/check-chart.mjs`, `git status --short`.

**Verify**: all exit 0 and `git status --short` prints nothing except, at most, `plans/README.md`.

## Test plan

- The repo has no unit-test framework; its tests are the generators, the lint and the Playwright page checks.
- New behavioural proof: Step 8's script. In each world, at 1440px and 320px: every BarChart on the Chart page draws that world's body; the Three bodies stage shows the other two; line and stacked charts carry no body; Press has a well and gridlines; Flat has today's gridlines and neither a well nor a matrix; Device has the matrix, lit dots, no gridlines and a seven-segment reading; the page does not scroll sideways; no page errors.
- Regression: reflow, text zoom, corners, gaps and reduced motion on the Chart page and on every page or block that uses BarChart (`dot-plot`, `legend`, `dashboard`, `growth`); the wall, the worlds and the study checks across the gallery; the install test for `chart` in a fresh Vite app.
- `verify` proves the version gate: only `chart` moved.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run verify --prefix gallery` and `npm run build --prefix gallery` exit 0
- [ ] `node skills/litt-md/scripts/check.mjs` ends with `All checks passed.`
- [ ] `node gallery/.agent-shots/check-chart.mjs` exits 0 and prints `BarChart draws its own body in every world.`
- [ ] Every command in Step 8 exits 0, or the report names the one that did not and why it is not this plan's
- [ ] `grep -c 'function Bars(' gallery/src/components/chart.tsx` prints 0, and `grep -c 'function barMarks(' gallery/src/components/chart.tsx` prints 1
- [ ] `grep -n 'from "../chart"' gallery/src/components/bodies/chart.device.tsx` shows only an `import type` line
- [ ] `git diff <starting commit> -- gallery/src/components/chart.tsx | grep -E '^[-+].*(function Lines|function Rails|function Meter|export type (BarChartProps|LineChartProps|StackedBarChartProps|ChartSeries|MeterProps))'` prints nothing (those declarations are untouched)
- [ ] `git diff --stat <starting commit>` lists only the in-scope files
- [ ] The install test printed `all steps passed`, or the report says plainly that it could not run and why
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The drift check shows changes and the excerpts in "Current state" no longer match, or `bodies/chart.device.tsx` already exists.
- Making BarChart work seems to need a change to `Lines`, `Rails`, `Legend`, `Tip`, `Meter` or any public props type.
- `verify` fails with an error that is not a typo against this plan and that the one-fix allowance in Step 4 does not cover. Do not weaken the lint, add `litt-allow`, or change another component.
- `verify` says an item other than `chart` changed without a changelog line.
- Step 7's script still fails after you have checked your files against Steps 2 to 5. Report its table. Do not change the script's expectations, except as Step 7 itself allows.
- A Step 8 check fails on a bar chart after the fix that step allows.
- A fix seems to need a new token or a change to `seven-segment.tsx`.

## Maintenance notes

- **These bodies are a first pass for Nick's eye.** The checks prove structure, not taste. The reviewer must look at `gallery/.agent-shots/chart-press.png`, `chart-flat.png` and `chart-device.png`, and at the dashboard and growth blocks in each world, in light and dark. Expect a revision round on: the room above Device's screen (44px); the dot pitch (6px) and unlit strength (10%); how Press's well and rail read; and whether the seven-segment readout sits clear of the screen.
- **Flat is today's chart, by Nick's decision of 2026-11-10** ("current ones are good, we should save them for flat"). `proposals/worlds.md` still describes a different Flat chart (ink on grey, no axes); that row is superseded for the data parts and should be corrected when the data wave's section is next edited. Under Flat nothing about a BarChart may change; the reviewer should compare the Chart page in Flat before and after.
- **Press's grid is still hairlines, not "grooves lit from the top".** A groove needs a lit-edge color for both themes that no token provides. Adding one is a token change (through `skills/litt-md/workflows/evolve.md`), so it is left for Nick to decide.
- **Device's data hues on LCD glass** have not been checked for contrast by `check.mjs`, which checks them on the body and the screens' surfaces. A hue bar chart under Device is worth a look, and possibly a new pair in check 5.
- **LineChart and StackedBarChart are next**, on the same split: the contract already resolves geometry, so each needs its marks resolved once (as `barMarks` does) and a body per world. Device's line is "a trace of dots" on the same matrix.
- **`chart.tsx` still has one `in-[[data-material=flat]]` class**, in Meter's track. Meter has no bodies yet, so it stays.
- **The registry's item copy** for Chart (`gallery/scripts/gen-registry.mjs`, `COPY.chart`) does not mention bodies. It is not part of the item's hash and is out of scope here.
