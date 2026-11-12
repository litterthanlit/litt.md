# Plan 010: Sparkline draws its trend three ways: a groove in Press, today's line in Flat, a row of lit dots in Device

> **Executor instructions**: Read this plan fully before starting. It fixes
> the design, the contract and the proof, and points at earlier plans for
> steps you repeat exactly. Honour the "STOP conditions". When done, update
> your row in `plans/README.md`, unless a reviewer dispatched you and told you
> they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat f458808..HEAD -- gallery/src/components/sparkline.tsx gallery/src/components/stat.tsx gallery/src/components/bodies gallery/src/gallery/pages/17-sparkline.tsx gallery/CHANGELOG.md`
> If `sparkline.tsx` changed, compare it with "Current state" before
> proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1 (step 4 of the data wave, with 011)
- **Effort**: M
- **Risk**: MEDIUM (a shipped registry item changes; Flat must not move by a pixel)
- **Depends on**: none (it follows the pattern of 002 to 004, which are merged or in PR #98)
- **Category**: direction
- **Planned at**: commit `f458808`, 2026-11-12

## Why this matters

Nick, 2026-11-10: "What I mostly wanna see is each world display data in
their own way", meaning the dashboards. Stat and the three charts now have a
body per world. Sparkline is on the Growth and Usage screens, inside Stat
tiles and table rows, and still draws the same thin line in Press, Flat and
Device. So a Device Stat today is an LCD figure over a line that belongs to
Flat.

The standing rule from Nick: "current ones are good, we should save them for
flat". **Today's Sparkline is Flat's body and must not change by a pixel.**
The new bodies are Press's and Device's.

## Current state

- `gallery/src/components/sparkline.tsx` (214 lines) is one function. It
  measures its box's width, scales the values, and draws an SVG: an optional
  dashed baseline, a 2px line, and a dot (radius 4) on the latest value over a
  ring (radius 6) in the surface colour. It has a fun-mode path (the line
  draws itself, the dot lands). It has no `useMaterial` and no `byWorld`.
- Its props are `label`, `values`, `hue`, `height` (default 32), `formatValue`,
  `baseline`, `min`, `max`, `summary`, `surface`, `className`. **No prop
  changes in this plan.**
- It is used in `components/stat.tsx` (the `trend` slot),
  `gallery/pages/17-sparkline.tsx`, `18-stat.tsx`, `17-spread.tsx`,
  `blocks/usage.tsx` and `blocks/growth.tsx`.
- The pattern to copy is Stat (plan 002): `stat.tsx` resolves the state once
  into `StatBodyProps`, picks a body with
  `byWorld(useMaterial(), { press, flat, device })` from `@/motion`, keeps the
  Press body in the part's own file, and puts the others in
  `components/bodies/stat.flat.tsx` and `stat.device.tsx`, which import only
  the type from the part. Each body's root carries `data-body`.
- The Device chart (`components/bodies/chart.device.tsx`) shows how a trace is
  drawn as lit dots of a matrix: a `<pattern>` of unlit dots at 10%, one lit
  dot in every column at the line's height, and the dots between where the
  line is steep. Read its `traceDots`.
- The Press chart (`PressBody` in `components/chart.tsx`) is a sunken well:
  `rounded-control bg-tray shadow-(--tray-shade)`.
- The "Three bodies" stage on a part's page is in
  `gallery/pages/18-stat.tsx` (`ThreeBodiesDemo`): the same part three times,
  each inside a `MaterialProvider`, with `lookAttributes`.

Before you write code, read plans `002-stat-three-bodies.md` and
`004-line-and-stacked-chart-bodies.md`. You repeat their steps for the Flat
comparison, the stage, the spec line, the changelog and the lock.

## The design

One contract, three bodies. The box is the caller's height in every world,
so a row of tiles lines up whatever the material.

| World | The trend is | Details |
|---|---|---|
| Flat | today's line, on the page | The existing drawing, moved into `bodies/sparkline.flat.tsx` unchanged: same marks, same classes, same fun path. |
| Press | a line in a groove | A sunken well the size of the box (`rounded-control bg-tray shadow-(--tray-shade)`, with a real border in forced colors). The line runs along its floor, inset 4px from the well's edge all round, in the same tone as Flat. The latest value is a raised bead: an HTML dot with `bg-block shadow-(--block-lift)` 10px across, with the tone's dot colour as a 6px core, so it stands up as Press's blocks do. No ring is needed: the bead's lift parts it from the line. The baseline is the same dashed 1px line on the floor. Fun mode's path stays (the line draws, the bead lands). |
| Device | a row of lit dots on glass | LCD glass the size of the box (`rounded-control bg-field` with `shadow-[inset_0_0_0_1px_var(--field-line),var(--field-shade)]`, a border in forced colors). A matrix of unlit dots at 10% of `--field-ink`; the trend is one lit dot in every column at the line's height, and the dots between where it is steep, as the Device chart's trace. Choose the pitch by eye, 4px or 5px, so a 32px box has at least six rows and a 24px box at least four: at the chart's 6px a sparkline loses its shape. The trace is the ink at 60%; the latest column's dot is full strength, with the dot above and below it lit too, so today is the strongest mark. With a `hue` the dots light in the hue's fill. The baseline is its row lit at 30%, skipping every other column. Nothing draws itself or fades in (R4: Device switches where it stands), so there is no fun path. |

In every body the SVG keeps `role="img"` and the same summary text, the box
keeps `relative w-full min-w-0` and the caller's `className` and height, and
an empty or unmeasured box draws its ground only (well or glass) at the
final height, so nothing jumps.

## What to build

1. In `sparkline.tsx`: keep the measuring, the scale and the summary. Resolve
   them once into an exported `SparklineBodyProps` (the box ref and width, the
   height, the summary text, the finite values with a function that places a
   value between 0 at the bottom and 1 at the top, the baseline, the hue and
   its classes, the surface, the class name). Pick the body with `byWorld`.
   Keep Press's body in this file. Update the header comment: say there are
   three bodies and what each is.
2. `components/bodies/sparkline.flat.tsx`: today's drawing, moved. The result
   in a browser must be the same element tree with the same attributes and
   classes as before, apart from `data-body="flat"` on the box.
3. `components/bodies/sparkline.device.tsx`: the dot matrix.
4. `gallery/pages/17-sparkline.tsx`: add a "Three bodies" stage as the
   **last** stage on the page, after every existing stage, copied in shape
   from `18-stat.tsx`: the same Sparkline (one quiet, one with a hue and a
   baseline) in Press, Flat and Device. Being last matters: the Flat
   comparison crops each page above this stage.
5. `skills/litt-md/system/components.md`: under the Sparkline heading add a
   `- **Bodies:**` bullet in the words of the table above (see how plan 004
   did it for Chart). This file is not taste; `skills/litt-md/taste/` is and
   must not be touched.
6. `gallery/CHANGELOG.md`: a `- **changed** \`sparkline\`:` line in today's
   release (`date +%F`), creating the release above the newest one if today
   has none, as plan 004's Step 5 describes. Say what each body is and that
   the props are unchanged. Then `npm run verify --prefix gallery`, which
   updates `gallery/registry.lock.json`; commit the lock with the change.

## Proof

1. **Flat does not move.** Before any change, and after the last, photograph
   in the gallery's own look (Flat), light and dark, reduced motion, these
   pages: `#sparkline`, `#stat`, `#spread`, `#growth`, `#usage`. Use plan
   004's `flat-shot.mjs` (its Step 1) with this page list. The Sparkline page
   grows by the new stage, so compare it only above the top of that stage;
   compare the others whole. All pictures must be byte-identical. If one
   differs, find why and fix the body, never the comparison. Up to three
   attempts are allowed for a page that differs by an animation frame, as in
   plan 004.
2. **Each world draws its own.** A browser script, in the manner of plan
   004's Step 7, that opens `#sparkline`, finds the "Three bodies" stage and
   fails unless: there is one `[data-body="press"]`, `[data-body="flat"]` and
   `[data-body="device"]` sparkline per example; Press has a well and a bead
   and a `path`; Flat has a `path` and two `circle`s and no well; Device has
   no `path`, at least as many lit dots as it has columns between its first
   and last value, and its strongest dots in the last column; every one has
   `role="img"` with the same label text across the three; and every box is
   exactly the caller's height.
3. **Look at them.** Screenshot the stage in light and dark at twice the
   size and open the pictures. Device at 32px and at 24px must still read as
   the same shape as Flat's line.
4. The repo's checks, in the commands below.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Verify | `npm run verify --prefix gallery` | exit 0 |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Plugin | `claude plugin validate .` | passes (warnings are usual) |
| Motion | `npm run test:motion --prefix gallery` | exit 0 |
| Reflow | `npm run test:reflow --prefix gallery` | exit 0 |
| Forced colors | `npm run test:forced-colors --prefix gallery` | exit 0 |
| Corners | `npm run test:corners --prefix gallery` | exit 0 |
| Install test | `npm run test:registry --prefix gallery -- --app vite --items sparkline,stat --scenarios each,seq` | exit 0 |

The page checks need a build and Playwright; plan 004's "Commands you will
need" says how to install Playwright beside the repo if it is missing. The
install test's Next.js host has not installed in the review environment
before; run Vite only and say so in your report.

## Scope

**In scope**:
- `gallery/src/components/sparkline.tsx`
- `gallery/src/components/bodies/sparkline.flat.tsx`, `sparkline.device.tsx` (create)
- `gallery/src/gallery/pages/17-sparkline.tsx`
- `skills/litt-md/system/components.md` (the one bullet)
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json`
- `plans/README.md` (your status row)

**Out of scope**:
- `stat.tsx` and every other part, the blocks, the pages other than Sparkline's.
- The props of Sparkline.
- `skills/litt-md/taste/**`, the token files, `gallery/src/motion/**`.
- Any change to how Flat looks, anywhere.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/sparkline-bodies`.
- One commit: `gallery: the sparkline's three bodies`, with the lock and the changelog in it.
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] Flat comparison: every picture identical
- [ ] The three-bodies script exits 0
- [ ] Every command in the table passes
- [ ] `git diff --stat <starting commit> HEAD` lists only files in scope
- [ ] `gallery/src/components/bodies/sparkline.flat.tsx` and `sparkline.device.tsx` import only types from `../sparkline`
- [ ] The changelog has the `sparkline` line and the lock is committed
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- `sparkline.tsx` is not the single-function file "Current state" describes.
- Flat differs after three attempts and you cannot find the cause.
- `--tray`, `--tray-shade`, `--block`, `--block-lift`, `--field`, `--field-ink`, `--field-line` or `--field-shade` is not a token in `skills/litt-md/assets/tokens.css`.
- `verify` names any registry item other than `sparkline` as changed, or refuses the version.
- A page check fails on a page you did not touch, before your change as well as after (report it; it is not yours to fix here).
- The design needs a new token, a new prop, or a change to a taste rule.

## Maintenance notes

- **Data hues on glass are unchecked for contrast.** The Device chart has the same open question (a hue lit on `--field`). If a hue fails 3:1 on the glass, report it; the fix belongs in the tokens, for the chart and the sparkline together.
- **A Sparkline inside a Stat** now changes with the Stat: Press's tile holds a groove, Device's holds glass under its LCD figure. Look at `#stat`'s Three bodies stage after the change and say in your report whether the pairs sit well.
- Later data plans (Table is 011; Gauge and Heatmap after) repeat these steps.
