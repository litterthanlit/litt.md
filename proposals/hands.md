# Hands: a range to brush, a run to fold, rules to build

Written 2026-10-26 for Nick, after "let's build some captivating components, that's why I posted the references". Three components from the moodboard, each with one moment for the hand, and the one engine file they share. Designed with the pstack architect skill: three runners (Opus, Fable, Sonnet) each designed all of it, a cross-judge scored them blind, and the synthesis below takes the base and grafts. The candidates and the judge's verdict are in the session's scratchpad; this file is the record.

## Problem

The moodboard's strongest pieces are a dense barcode chart with a two-tone total (#9), an agent run that folds into a compact block (#35) and a condition builder with rows you drag (#34). Each has to be fun to touch and still pass R1 to R9: nothing above 18px, a pill only on avatars, icon-only buttons and the Switch track, no momentum in Calm, every state in words, one accent fill, data hues only for data, raised for what a hand moves, cut for what you type into, slot for what fills, glass only for what floats. The repo had no shared hand layer: the release speed, slop then capture, snap, settle then commit and the click swallow were copied into five files, and "no momentum in Calm" was a convention each copy had to remember. The moodboard's ruler (#10) is already the Time scrubber, so it is not built again.

## Usage

```tsx
<RangeChart label="Visitors" unit="visitors" bars={days} segments={SEGMENTS} axis={MONTHS}
  value={range} onValueChange={setRange} onValueCommit={load} />

<RunCard title="Creating your world" steps={run.steps} progress={0.12} preview={<WorldPreview />}
  actions={<Button variant="ghost" size="sm" onClick={stop}>Stop</Button>} />

<RuleBuilder label="Expense approval" fields={FIELDS} value={rule} onValueChange={setRule} />
```

## Shape

### The engine: `gallery/src/motion/hand.ts` (built, part of the `motion` item)

- `useHand()` recognises a gesture: `begin(event, { axis, slop, onClaim, onMove, onRelease })` and `cancel()`. It owns the slop, the page's scroll given back when the first move is mostly the other axis, pointer capture, the 100ms trail, Escape, pointercancel, unmount, and the click swallowed after a mouse drag. The release says `claimed`, `cancelled` and `speed` (px/s).
- `useSettle(values)` finishes one, for any set of MotionValues: `to(targets, { velocities, commit })`, `release({ at, speeds, land, commit })`, `limit(want, lo, hi)` and `hold()`. It is the only place in litt that reads fun mode's coast, throw and rubber: Calm settles from rest on the responsive spring and pins at the ends; fun mode coasts, settles on the throw spring with the release speed and gives like a rubber band. `commit` runs once, after every value has landed, unless a newer settle or `hold()` took them first. Keys, buttons and a controlled value use `to` with no pointer.
- `snap(value, { step, origin, min, max, anchors, pull })`: the nearest anchor within the pull, else the nearest step, with no decimal drift. Checked in node.
- Not re-exported from `@/motion` (it uses the tier hooks, like drag.ts). In `motionFiles` and `MOTION_ENGINE`, and gen-docs now reads every engine file as a root of its program, so an engine file no component imports yet is still read.
- The shipped copies (Time scrubber, Slide to confirm, Carousel, drag.ts) stay for now. The Time scrubber moves onto it next, as the proof on a shipped hand.

### Range chart (`range-chart`, Data)

The base is the Sonnet candidate's sketch (`useWidth`, `plan`, `cumulative`, `zoneAt`, `rangeOf`, `edgesOf`, `landEdges`, the two MotionValue edges, `report` once per bar crossed, the controlled-value effect). Grafted and changed:
- **The segment tray** (Opus): a tray (`--tray`, `--tray-shade`) the plot's width at sm height; one button per segment as wide as its span, its label (caption, title weight) and share (caption, tabular, `--fg-subtle`); the segment whose span equals the range is the raised block (`--block`, `--block-lift`, `aria-pressed`), gliding between segments by `layoutId` on the responsive tier and gone when no segment matches. A label too narrow drops to its share. Pressing a segment settles the range onto it.
- **Bars are rects** (Fable): one 2px `<rect>` per drawn bar (grouped by mean when the pitch is under 4px), so fun mode can lift each bar the edge sweeps: `scaleY` 1.12 to 1 on `fun.pop`, origin at the base, once per crossing. Rest: fg 55%; in the range: fg. Never the accent, no hue (the `hues` prop is left out of v1).
- **The figure**: two RollingNumbers (the head, and the last group zero-padded to three digits in `--fg-subtle`), the group separator probed from `Intl.NumberFormat(locale).formatToParts(1000000)`, hidden from assistive tech and said once as text. 18px (`text-display`).
- Keys: the three sliders (from, to, move range), Page Up and Page Down to segment starts, Home and End, Escape to the whole range; "Whole range" ghost button in the reading row.
- Fun: the span can be thrown (coast, a segment start pulls within 24px), the rubber band at the ends, the bars rise as the edge sweeps them, and a held cap lifts with `useFunGrab` on its face, its sink on its box. It rests where Calm does.

### Run card (`run-card`, Agents)

The base is Sonnet's (`readRun`, the tick ring as a closed Gauge, `Plan bare`, one live region that speaks open or folded). Grafted (Fable): **one box, two materials.** Open, the flat card (`litt-raised`, surface radius) with a ghost Hide; folded, the same box is a `<button aria-expanded="false">` in the raised block's material (`bg-block`, `--block-lift`, control radius, md height), holding the ring, the title, the words and the figure, which sinks when pressed. The ring travels by `layoutId` (text-free), the title, words and figure glide by `layout="position"` (no text stretches), the body leaves on the exit token and comes back with the quarter-travel drop, and the height snaps as every disclosure's does. Focus moves to the other state's toggle when the toggle had it (ToolApproval's `hadFocus`). An `actions` slot sits in the open header. Fun: the ring glides on `fun.glide`, its ticks sweep to each new figure while the figure counts (the Gauge's pattern); no burst. Words: "Step 1 of 3", "Done", "Step 2 failed", "Waiting".

### Rule builder (`rule-builder`, Controls)

The base is Sonnet's (`reorderPlan` with measured gaps, settle then one `onValueChange`, the layout effect that zeroes every row's `y` before paint, pure tree edits, `errors` by id, `name` posting JSON). Grafted:
- **The schema** (Fable): `RuleBuilderField = { id, label, operators? } & ({ type: "text" | "number" } | { type: "choice"; options })`, each operator `{ id, label, many? }` (a choice operator with `many` takes several values: "is any of"). Defaults per type. Exported `isGroup`, `newCondition`, `newGroup`. `label` names the builder for assistive tech; `lead` ("When") is the word above it.
- **Nodes** are `{ kind: "condition" }` and `{ kind: "group", join: "and" | "or", children }`.
- **And and Or as a Segmented** (Opus), sm, at the head of each group's rail, legend "Join conditions with" (hidden); a 480px container query wraps the value under the field and operator.
- **`cohere`** (Opus): a new field resets the operator to its first and empties the value; moving between one and many converts the value. Focus: a new row focuses its field; a removed row hands focus to the next handle, else the previous, else Add condition.
- **Space lifts** (Fable and Opus): Space or Enter on a handle lifts the row (`aria-pressed`), the arrows move it with the same settle, Space or Enter drops, Escape restores; a polite status says each step. A pointer drag is the same lift, part and settle.
- **The multi value** is `Combobox multiple` with the new `hideLabel` (raised tags in a cut, "Food & drink ×").

## Synthesis decision

The cross-judge scored the blind candidates 25 (Fable), 21 (Opus) and 26 (Sonnet) and picked Sonnet's as the base for its engine boundary (recognise, settle, snap, with one reader of fun mode), its settle-then-commit reorder, its pure geometry and the fewest changes to shipped items. All three converged on the same shape (one engine file, three new items, a 2026-10-27 release), which the arena reads as agreement. Grafted: from Fable, the folded run card as a raised block button, the rule schema and helpers, Space-lift reorder and the per-bar ripple; from Opus, the segment tray with the raised selected segment, the Segmented join and `cohere` with focus after add and remove, and Combobox's `hideLabel`. Rejected: Opus's size morph of the card's backplate (it animates radius and shadow, and heights snap in litt), Fable's live commit on every slot change during a drag, Sonnet's connector Select rendered twice, the `hues` prop for v1, a fun burst when a run ends, and a hard-coded "," in the figure.

## Tradeoffs accepted

- A change to the shared `motion` item in exchange for one place where "no momentum in Calm" is structural.
- The shipped hand copies stay for one release; the Time scrubber migrates next.
- Two additive props on shipped items (`plan` `bare`, `combobox` `hideLabel`).
- The figure tops out at 18px; the two tones and the roll carry the moment instead of the size.
- #35's pill becomes a block at the control radius; its ring is the Gauge's ticks, a mark like the Meter and the Plan rail, not a slot.
- Rows move only within their own group.

## Built

Three builders, one per item, each in its own worktree on this contract; the lead reviewed and merged them. Where the build moved off the contract, and why:

- **Engine.** `useSettle.to` passed a caller's velocities through in Calm. The rule builder's builder caught it; Calm now always settles from rest, and only `release` hands fun mode the speed it measured.
- **Run card.** The ring travels on fun mode's swap spring, not its glide: the glide overshot about 22px inside the folded block. The box glides by its corner, so the card and the block share one origin.
- **Rule builder.** Under 352px a row stacks its field, operator and value. A group of one row still shows its join, so the word is always said. `maxDepth` is 1 by default (a group inside the rule, no deeper). A number value is a NumberField.
- **Range chart.** The hand's grid is whole bars: an edge snaps to a bar, never between two. In review, the lead found fun mode popping the lit bars on load and on every resize: seating one edge before the other read as a new range, which also told `onValueChange` a half-seated one. A new width now seats both edges before the picture reads them.

At rest, the Range chart and Rule builder pages match Calm in fun mode to the pixel, section by section, desktop and phone. The Run card's runs tick, so its page was compared under a frozen clock: everything matches but one glyph, below.

Left for later: in a rule row, Combobox's query wraps under two tags; and a RollingNumber that has rolled can rest a glyph on a sub-pixel offset (the run card's "100%" in Calm, against the count fun mode ends on).

## Questions for Nick

1. The figure's grey tail is "the part that churns". Is that the two-tone you meant, or the selected total in ink with "of 2,406,880" in the grey?
2. Is the tick ring right for the run card, or should progress be a slot there too?
3. Should a row drag between groups?
4. Move the Time scrubber onto the hand in the next release?
