# Plan 011: Table dresses per world: slats in a tray in Press, today's quiet rows in Flat, a screen of mono columns in Device

> **Executor instructions**: This is a brief for a strong executor. Table is
> a 1,089-line compound part with a virtual body, sticky and resizable
> columns and selection, so the design and the proof are fixed here and the
> wiring is yours. Read the plan fully before starting. Honour the "STOP
> conditions". When done, update your row in `plans/README.md`, unless a
> reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat f458808..HEAD -- gallery/src/components/table.tsx gallery/src/components/bodies gallery/src/gallery/pages/16-table.tsx gallery/CHANGELOG.md`
> If `table.tsx` changed, re-read it against "Current state" before
> proceeding; if its Flat classes are gone or moved, STOP.

## Status

- **Priority**: P1 (step 4 of the data wave, with 010)
- **Effort**: L
- **Risk**: HIGH for a canvas-free change: a shipped item used on the Dashboard and Team screens; Flat must not move by a pixel; the virtual body depends on a fixed 44px row
- **Depends on**: none. Run it after 010, not beside it: both touch `gallery/CHANGELOG.md` and the lock.
- **Category**: direction
- **Planned at**: commit `f458808`, 2026-11-12

## Why this matters

Nick, 2026-11-10: "What I mostly wanna see is each world display data in
their own way", meaning the dashboards. Table is the largest thing on the
Dashboard screen, and it reads almost the same in Press and Device today: a
hairline box with ruled rows. Until it changes, a whole screen cannot read as
one world.

The standing rule from Nick: "current ones are good, we should save them for
flat". Table already has a Flat look of its own (no frame, no rules, a grey
bubble under the hand). **That Flat look must not change by a pixel.** The
new looks are Press's and Device's.

## Current state

Read `gallery/src/components/table.tsx` from top to bottom before anything
else, header comment included. What matters here:

- Parts: `Table`, `TableHeader`, `TableBody`, `TableVirtualBody`, `TableRow`
  (and a `MotionRow`), `TableHead`, `TableCell`, `TableSelectHead`,
  `TableSelectCell`, `TableEmpty`, `TableSkeleton`, the hook
  `useRowSelection`, and a `ColumnHandle` for resizing. A `TableContext`
  carries shared state from `Table` to the parts.
- Today's default look (what Press and Device both show): the region is
  `rounded-surface border border-line bg-surface-1`; every cell has
  `border-b border-line`; the header is sticky, `bg-surface-1`, caption size
  at the label weight; a row fills `--fg` at 4% under the pointer and 6% when
  selected or held on a coarse pointer.
- Flat is not a body file. It is written into the same class strings with the
  variant `in-[[data-material=flat]]:`, about ten times: the frame and every
  rule become transparent, the row's own fill is switched off, and the cells
  take `bg-surface-3` on hover and selection with the first and last cell
  rounded (`rounded-l-control`, `rounded-r-control`), so the row is a bubble.
  The sticky-column strings (`STICKY_1`, `STICKY_2`) carry the same.
- Hard constraints inside the part:
  - `TableVirtualBody` needs every row to be exactly 44px (`ROW_HEIGHT`) and
    draws spacer rows; nothing you add may change a row's height or put a gap
    between rows that the spacers do not know about.
  - Sticky columns need an opaque fill on their cells, following hover and
    selection, and a hairline at their edge once something is under them.
  - Resizing reads and writes one width per column; `TableEmpty` and
    `TableSkeleton` take a column count. Nothing may add a column.
  - The table keeps its semantics: a real `<table>`, `<th scope>` cells,
    `aria-sort`, `aria-rowcount`, the focusable scroll region.
- Used in `blocks/dashboard.tsx`, `blocks/team.tsx`,
  `gallery/systems/press.tsx`, `gallery/systems/device.tsx`,
  `gallery/pages/16-table.tsx` (many stages), and in demos on
  `18-pagination.tsx`, `03-slider.tsx` and `17-sparkline.tsx`.
- How other parts split by world: `byWorld(useMaterial(), { press, flat,
  device })` from `@/motion`; bodies in
  `gallery/src/components/bodies/<part>.<world>.tsx`, importing only types
  from the part; the root carries `data-body`.
- The patterns this plan reuses already exist in Select:
  - Press's list (`components/select.tsx`, "List (Press)"): a tray cut into
    the panel (`--tray`, `--tray-shade`), 44px slats in it, the current slat a
    raised block face behind the row.
  - Device's list (`components/bodies/select.device.tsx`): LCD glass
    (`--field`, `--field-line`, `--field-shade`, `--field-ink`), rows in the
    mono, a lamp at the start of each row (lit for the current row, a dim dot
    otherwise), and a highlight that switches in place.
- `proposals/worlds.md`, the Table row of its parts table, describes the
  three looks in one line each. This plan follows it for Press and Device;
  for Flat, Nick's rule above wins.

Before you write code, read plans `002-stat-three-bodies.md` and
`004-line-and-stacked-chart-bodies.md` for the steps you repeat (the Flat
comparison, the Three bodies stage, the spec line, the changelog, the lock),
and plan `010-sparkline-three-bodies.md` for how those are referred to.

## The design

| World | The table is | Details |
|---|---|---|
| Flat | today's Flat table | No frame, no rules, the header in grey label type, a grey bubble under the hand. Unchanged to the pixel. |
| Press | slats in a tray, under a raised rail | The region is a tray (`--tray`, `--tray-shade`, surface radius). The header is a raised rail along its top (`--block`, `--block-lift`), still sticky and still opaque, so rows scroll under it. Each row is a slat: its cells carry the slat's face (`--block`) with the row's first and last cell rounded, and 2px of the tray showing above and below, drawn inside the 44px row (with a transparent border or an inset on the cells, never a margin), so the row height does not change. The slat under the pointer lifts: it takes `--block-lift` and stands, as Select's current slat does. A selected slat stays lifted. No rules between rows: the tray shows between slats. |
| Device | a screen of mono columns | The region is LCD glass (`--field`, `--field-line`, `--field-shade`, control radius as Select's screen, or surface radius if the corners check asks). Cells are the mono in `--field-ink`; numbers stay tabular and right-aligned. The header is engraved on the bezel: `litt-legend` capitals in grey on a plate strip (`--block`) above the glass, sticky and opaque. Each row starts with a lamp, drawn as a pseudo-element in the first cell's padding (never a new column): a dim dot at rest, lit in the glass's ink for the row under the pointer or keyboard, and for a selected row. The highlight is a tint of the ink behind the row that switches in place on the instant tier. A hairline of `--field-line` may part the rows if the glass needs it; choose by eye. |

Rules for all three:

- A row is 44px in every world, and the header keeps its height.
- Sticky columns keep opaque fills that match their world's row (the slat's
  face in Press, the glass in Device), with hover and selection followed.
- The selection boxes, the sort button, the resize handle, the empty row, the
  skeleton rows and the "Loading more" row are dressed for each world too: a
  skeleton on glass is a dim bar of the ink; in the tray it sits on a slat.
- Forced colors: wells, slats and glass get real borders; a lit lamp is
  `Highlight`, an unlit one an outline; the row under the keyboard still
  differs from its neighbours (`test:forced-colors` checks this for other
  parts; keep to the same answer).
- Motion: the existing `entrance` and `animateChanges` behave as today in
  Press and Flat. In Device rows do not travel or fade (R4: Device switches
  where it stands): they appear. Say so in the header comment.
- No new props. No new tokens. No new dependency.

## How to build it

The recommended shape, which you may improve on if you can keep the proof:

1. **One dress per world.** A `TableDress` type in `table.tsx`: the class
   strings each part needs (region, header cell, row, cell, primary cell,
   numeric cell, select cell, sticky-column strings for one and two columns,
   skeleton, empty) and a flag for whether rows travel. `Table` picks the
   dress with `byWorld(useMaterial(), …)` and puts it in `TableContext`; each
   part reads it. Press's dress stays in `table.tsx`; Flat's and Device's go
   in `components/bodies/table.flat.tsx` and `table.device.tsx`, importing
   only the type.
2. **Flat first, with nothing else changed.** Move the
   `in-[[data-material=flat]]:` classes out of the shared strings into Flat's
   dress, as plain classes. Then prove Flat has not moved (below) before you
   draw anything. Commit that step alone.
3. **Then Press, then Device**, each proved and committed alone.
4. Tailwind only builds classes it can read: every class in a dress is a
   whole literal string in the source, as `STICKY_1` is today.
5. `data-body` goes on the region.

Then, as in 010: a "Three bodies" stage as the **last** stage of
`gallery/pages/16-table.tsx` (one small table of five rows with a numeric
column, a selected row and a sortable header, in Press, Flat and Device); a
`- **Bodies:**` bullet under Table in `skills/litt-md/system/components.md`;
a `- **changed** \`table\`:` line in today's release in
`gallery/CHANGELOG.md`; `verify` to update the lock; the header comment of
`table.tsx` brought up to date.

## Proof

1. **Flat does not move.** Photograph before any change and after each of
   the three steps, in the gallery's own look (Flat), light and dark, reduced
   motion: `#table`, `#pagination`, `#slider`, `#sparkline`, `#dashboard`,
   `#team`. Use plan 004's `flat-shot.mjs` with this page list; compare
   `#table` only above the new stage. Also photograph `#table` with the
   pointer over the second row of the first table, and with a row selected in
   the selection stage, since Flat's bubble only shows then. Every picture
   byte-identical.
2. **Each world draws its own.** A browser script that opens `#table`'s
   "Three bodies" stage and fails unless: the three regions carry
   `data-body` press, flat and device; every body row in all three is 44px
   tall and the three tables have the same number of rows and columns; Press's
   region has the tray's fill and its hovered row's cells differ in
   box-shadow from a resting row's; Device's cells compute to a monospace
   family and its first cell has a `::before` whose colour differs between a
   resting and a hovered row; Flat's region has a transparent border; and
   the `<table>`, `<th scope="col">`, `<th scope="row">` and `aria-sort` are
   present in all three.
3. **The hard cases, in Press and in Device**: on `#table`, with the look set
   by the Customize panel or a `?look=` link (Press is `?look=blue4`, Device
   `?look=blue4-device`; check `gallery/src/gallery/look.ts` for the
   spelling), screenshot and look at: the virtual body scrolled to its
   middle (rows must sit on the 44px grid with no drift: compare the last
   row's position with `rowIndex × 44`); two sticky columns scrolled sideways
   (no row shows through them); a resized column; the selection stage with a
   range selected; the loading and failed rows; the empty row; a phone width
   of 320px.
4. **The repo's page checks**, all of them, since Table is on many pages:
   `test:motion`, `test:reflow`, `test:text-zoom`, `test:forced-colors`,
   `test:focus` (it measures `#table`'s layout shift), `test:corners` (slats
   in a tray and cells on glass must be concentric: an inner radius is the
   outer one less the inset), `test:gaps`, `test:wall`, `test:worlds` (the
   Press and Device system pages hold a table).
5. The install test: `npm run test:registry --prefix gallery -- --app vite
   --items table --scenarios each,seq`.

## Commands you will need

Run from the repo root.

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `npm ci --prefix gallery` | exit 0 |
| Verify | `npm run verify --prefix gallery` | exit 0 |
| Build | `npm run build --prefix gallery` | exit 0 |
| Skill checks | `node skills/litt-md/scripts/check.mjs` | ends with `All checks passed.` |
| Plugin | `claude plugin validate .` | passes (warnings are usual) |
| A page check | `npm run test:<name> --prefix gallery` | exit 0 |

The page checks need a build and Playwright; plan 004's "Commands you will
need" says how to install Playwright beside the repo if it is missing. Some
take many minutes; run each once at the end and again only for what you fix.

## Scope

**In scope**:
- `gallery/src/components/table.tsx`
- `gallery/src/components/bodies/table.flat.tsx`, `table.device.tsx` (create)
- `gallery/src/gallery/pages/16-table.tsx` (the new stage only)
- `skills/litt-md/system/components.md` (the one bullet)
- `gallery/CHANGELOG.md`, `gallery/registry.lock.json`
- `plans/README.md` (your status row)

**Out of scope**:
- Every other part, including Table filter, Pagination and Checkbox (the selection box already has its bodies).
- The blocks and the system pages: they change because Table does, not by edits.
- Table's props, its behaviour, its semantics, its keyboard.
- `skills/litt-md/taste/**`, the token files, `gallery/src/motion/**`.
- The `KNOWN` list in the corners check: do not add to it to get green. If a
  corner cannot be made concentric, STOP.

## Git workflow

- Branch: the one the operator gave you; otherwise `claude/table-bodies`.
- Commits, in order: `gallery: the table's looks become a dress per world, Flat unchanged`; `gallery: the table in Press, slats in a tray`; `gallery: the table in Device, a screen of mono columns`; the changelog, lock, stage and spec bullet may ride with the last or stand alone.
- Do NOT push or open a PR unless the operator instructed it.

## Done criteria

- [ ] Flat comparison identical after each of the three steps
- [ ] The three-bodies script exits 0
- [ ] The hard cases screenshotted in Press and Device, looked at, and listed in the report with what you saw
- [ ] Every page check named above exits 0, and `verify`, `build`, the skill checks and plugin validation pass
- [ ] The install test passes for Vite
- [ ] `grep -c 'data-material=flat' gallery/src/components/table.tsx` prints 0
- [ ] `git diff --stat <starting commit> HEAD` lists only files in scope
- [ ] The changelog has the `table` line and the lock is committed
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report (do not improvise) if:

- Flat differs after the first step and the cause is not a class you moved.
- A slat or a lamp cannot be drawn without changing the 44px row, adding a column, or breaking a sticky column.
- A page check fails before your change as well as after, on a page you did not touch (report it; it is not yours to fix here).
- `verify` names any registry item other than `table` as changed, or refuses the version.
- The design needs a new token, a new prop, a change to a taste rule, or an entry in a check's `KNOWN` list.
- Press and Device are done but one hard case is wrong and you cannot fix it: commit what is proved, and report the case with a screenshot.

## Maintenance notes

- **The dress is the seam.** A later world, or a later change to one world's table, edits one dress. If a part of the table ever needs different markup per world, not only different classes, that is the moment to give it a body component; until then classes are enough and keep the virtual body, the sticky columns and the resizing in one place.
- **Flat's table now follows `useMaterial()`, not CSS.** `useMaterial` (`gallery/src/motion/deal.ts`) reads the nearest `MaterialProvider`, else `data-material` on `<html>`, and says Press on the server. Today's Flat table follows the attribute in CSS, on any ancestor and from the first paint. Two things change, as they already have for every part with bodies: a subtree that sets the attribute without a `MaterialProvider` gets the page's table, not Flat's; and a server-rendered Flat page paints Press's table until it hydrates. Say both in the changelog line. Check the gallery for any element that sets `data-material` without the provider around a Table (`grep -rn "data-material" gallery/src`), and report what you find; do not add providers outside the scope.
- **Data hues on glass** are unchecked for contrast (see 010's note). Status colours in a Device table's cells have the same question.
- Cohort grid and Timeline (later in the wave) sit on the same three patterns and should reuse this dress, not copy it.
