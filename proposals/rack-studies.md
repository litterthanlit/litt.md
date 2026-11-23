# Rack is the studies

Written 2026-11-23 for Nick, as a working prototype parallel to `proposals/flat-studies.md`. Nothing in `taste/`, `tokens.css` or `gallery/` changes until you confirm the direction.

## Where this came from

On 2026-11-23, looking at five Swiss-editorial interactive data visualization screens (crisp 1px-ruled segmented strips, 0px corners, solid-ink active toggles, flat vivid unit matrices, 100% stacked composition bars with cross-highlighting sortable tables, dumbbell eval deltas, oversized rotated KPI bars, and diverging Likert sentiment bars), you said:

> "it's rack In my opinion, prototype 'rack studies' following flat studies but in rack's style and their own dope components, agentic, and interface first ofcourse and it's own motion language."

The evidence, in this folder:

- `rack-studies/studies.html`, all 16 live studies compiled into one self-contained file.
- `rack-studies/wall-light.jpg` and `rack-studies/wall-dark.jpg`, the wall in both themes.
- `rack-studies/studies/*.js`, one file per study, plus `rack-studies/shell.html` and `build.py`.

## Rack, in one paragraph

Rack is Ableton Live's dense modular instrument fused with a crisp 1px-ruled Swiss editorial data grid. Panels sit flat on a cool neutral grey ground with 1px hairlines, 0px–2px square corners, and zero drop shadows or glass. Chrome stays monochrome ink-and-grey (`Inter` with tabular figures; mono only for code, indices and readouts); Rack yellow (`#ffc933` with `#111113` ink) is the single primary fill inside a 1px outline; vivid flat clip and data hues (violet, vermilion-amber, orchid, blue, teal, green) belong strictly to tracks, agent stages and data marks. Everything moves **on the beat**: direct controls answer on the exact frame (`0ms`) and stop dead on release with zero spring overshoot; panels cut in column-by-column (`100ms` opacity, `36ms` beat stagger); exits cut out all at once in `75ms`.

## Rack's motion language ("On the beat")

The inverse of Flat's bouncy `0.28` spring, and distinct from Device's hardware detents:

1. **Direct manipulation answers on the frame (`0ms`).** Dragging a vertical value box, scrubbing a trace playhead, toggling a bypass or painting sequencer cells updates 1:1 with zero easing and stops dead the moment the pointer releases.
2. **Panels cut in by column on the beat (`100ms` opacity, `36ms` stagger).** Opening a study groups modules by their left edge and launches each column in lockstep left-to-right, opacity only — zero scale, travel or bounce.
3. **Exits cut out all at once, quicker than entrances (`75ms`).**
4. **Data re-sorts and filter changes snap cleanly (`140ms` ease-out, zero overshoot).** Segmented controls invert to solid ink on the frame (`0ms`); bars and matrices snap to their new proportions without wobbling.
5. **Beat-quantized transport (`120 BPM`, `125ms` 16th-note grid).** Session clips cue and launch on the next beat; job sequencers step strictly on the clock.
6. **A hand always wins, and reduced motion stills everything.** Wall tiles run quantized previews until opened and touched; `prefers-reduced-motion: reduce` zeroes every duration and clock tick.

## The 16 studies

| # | Slug | Study | Focus |
|---|---|---|---|
| 01 | `agent-chain` | Agent Signal Chain | 5 clip-colored agent stages, 1:1 vertical-drag parameter boxes, bypass & tool switches, instant presets |
| 02 | `token-matrix` | Unit Token Matrix | 120-square unit matrix (1 square = 1k tokens), 1px-ruled grouping disaggregation, `FIG. 02`, expandable data table |
| 03 | `kpi-columns` | Oversized KPI Bars | Monumental rotated percentages across flat full-bleed agent outcome bars with scope filter |
| 04 | `budget-bar` | 100% Stacked Composition | Proportional compute bar with leader ticks paired with a sortable, cross-highlighting table |
| 05 | `eval-dumbbell` | Eval Delta Dumbbell | Baseline `○` vs candidate `●` agent skill benchmark with `+pp`/`−pp` deltas and live sort strip |
| 06 | `alignment-likert` | Diverging Eval Sentiment | 5-point diverging rubric bars anchored on a black neutral midpoint with pass-rate sort |
| 07 | `session-launcher` | Agent Session Launcher | 4 colored agent tracks × 4 scenes + Master scene launch quantized to the beat |
| 08 | `approval-gate` | Tool Approval Matrix | `Auto / Ask / Block` permission grid above a live tool queue with Rack's yellow `Allow` key |
| 09 | `value-strip` | Vertical-Drag Value Strip | 6 dense Ableton cut value boxes (1:1 vertical drag, `Shift` fine mode, double-click home) |
| 10 | `step-router` | Beat-Locked Sequencer | 4 colored job lanes × 16 steps on the beat clock with click-drag cell painting |
| 11 | `run-timeline` | Scrubbable Trace Timeline | Multi-track horizontal agent execution spans with 1:1 draggable black playhead |
| 12 | `diff-inspector` | Inline Patch Inspector | 1px-ruled file rail + live diff hunks with `Accept / Reject` (`A`/`R`, `J`/`K`) and verdict pips |
| 13 | `context-rack` | Context Window Rack | Source attach/bypass switches, colored category chips, multi-hue capacity bar and `Compact` |
| 14 | `command-palette` | Instant Cut Command Bar | Zero-animation command runner with 0ms frame-snapped row inversion and keycaps |
| 15 | `curve-shaper` | Quantize & Curve Shaper | 1:1 draggable transfer curve editor with Rack's motion presets and live beat preview rail |
| 16 | `metric-strip` | Live Telemetry Strip | 4-column hairline KPI header over segmented throughput meters with `1H / 24H / 7D / 30D` cut |

## Open calls for Nick before propagating into `taste/` and `gallery/`

- **Light ground lightness.** Rack's current `--rack-canvas` is `#c8c8c8` (mid-grey). These studies lift the light ground to a crisper cool editorial grey (`#e6e7ec` canvas / `#f1f2f5` panel / `#ffffff` cut) so 1px ink hairlines and vivid flat data fills pop the way the Folio references do. Keep the lighter cool ground for Rack, or stay at `#c8c8c8`?
- **Editorial data-viz hues.** Adding electric violet and orchid alongside Rack's vermilion-amber, blue, teal and green gives charts (unit matrix, Likert, stacked bars, KPI columns) high-contrast editorial punch while keeping yellow (`#ffc933`) strictly as the primary action/armed fill.
- **Oversized editorial figures.** Should Rack gain its own R8 exception (like Flat's standing figure) for monumentally scaled data-chart figures (`kpi-columns`, `metric-strip`) while keeping UI controls dense at `12px–13px`?
