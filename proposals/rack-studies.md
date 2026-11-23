# Proposal: Rack Studies

Sixteen interactive studies in **Rack** (`proposals/rack.md`) — built from Rack's exact `tokens.css` grammar, Ableton Live's dense modular panel architecture, agentic + interface-first instruments, and Rack's **"on the beat"** motion language.

- Live standalone bundle: [`proposals/rack-studies/studies.html`](rack-studies/studies.html)
- Wall previews: [`wall-light.jpg`](rack-studies/wall-light.jpg) · [`wall-dark.jpg`](rack-studies/wall-dark.jpg)

## Visual grammar (strictly Rack)

Every value comes straight from Rack's block in [`skills/litt-md/assets/tokens.css`](../skills/litt-md/assets/tokens.css):

- **Ground & panels:** darker grey canvas (`#c8c8c8` light / `#161616` dark) parting flat modular panels (`#e2e2e2` / `#262626`), cut value boxes (`#f3f3f3` / `#1b1b1b`), and raised control blocks (`#ededed` / `#3b3b3b`).
- **Shape & depth:** `2px` controls nested inside `4px` panels, crisp `1px` outlines, zero drop shadows, zero blur/glass.
- **Rack yellow (`#ffc933`):** strictly a lit key fill inside a `1px` outline (`#111111` ink on yellow) — never a floating border, glow, or decorative highlight.
- **Five clip colors:** blue, amber-orange, teal-cyan, violet, and green — used strictly to identify tracks, clips, device modules, lanes, and meter/eval series, never as chrome decoration.

## Motion language ("on the beat")

Rack moves like a hardware studio console clocked to a grid — never like a spring physics toy:

1. **0ms under a hand:** vertical pointer-capture drag (`Shift` fine mode, double-click home), playhead scrubbing, XY pad tracking, matrix patching, and key toggles track 1:1 on the frame and stop dead on release.
2. **100ms cut-in on the beat:** panels cut in via opacity (`100ms ease-out`), with columns grouped by left edge and launched `36ms` apart.
3. **75ms stop:** sheet dismissals and stops cut out in `75ms` with zero overshoot.
4. **Quantized 120 BPM (`125ms` 1/16th) clock:** clip launches, job sequencer steps, automation readouts, and worker meters step on the shared beat. `prefers-reduced-motion: reduce` stills all clocks and cuts.

## The 16 studies

| # | Slug | Study | Category | Instrument & interaction |
|---|------|-------|----------|--------------------------|
| 01 | `agent-chain` | Agent Signal Chain | Agentic | 5 clip-colored device modules parted by ground, yellow power keys, 1:1 vertical-drag value boxes, armed tool toggles |
| 02 | `session-launcher` | Session Clip Launcher | Agentic | 4 agent tracks × 4 scenes, clip-colored left borders, beat-quantized cueing, yellow Master scene launch |
| 03 | `macro-rack` | 8-Macro Agent Rack | Instrument | 4×2 rotary arc macros dragged 1:1 vertically + instant yellow Snapshot recall |
| 04 | `trace-arrangement` | Trace Arrangement View | Agentic | Multi-track colored clips with mirrored token-density waveforms + 1:1 scrubbable black playhead with yellow cap |
| 05 | `context-mixer` | Context Channel Mixer | Agentic | 5 vertical mixer channels with 1:1 vertical-drag token faders, yellow channel activators `1`–`5`, Master Budget meter + `Trim` |
| 06 | `xy-router` | XY Policy Pad | Instrument | Crisp grid pad with 1:1 draggable yellow crosshair, corner snaps, live Depth/Verify readouts & routed tier |
| 07 | `automation-lane` | Automation Envelope Lane | Instrument | Draggable breakpoint nodes on a teal envelope lane, `Linear | Stepped` toggle, live beat playhead readout |
| 08 | `routing-matrix` | Agent Routing Matrix | Agentic | Ableton I/O patchbay of 4 agents × 6 tools with 0ms patch toggles and hover crosshair highlight |
| 09 | `approval-matrix` | Permission & Tool Rack | Agentic | Compact `Auto | Ask | Block` key matrix + live incoming tool call bar with yellow `Allow` / `Deny` keys |
| 10 | `eval-grid` | Eval Pass Grid | Meter / Eval | 64 clickable eval cells across 4 colored tracks (`Routing`, `Editing`, `Testing`, `Safety`), status filters, live inspector strip |
| 11 | `step-scheduler` | Beat-Locked Job Sequencer | Instrument | 4 colored job lanes × 16 steps on the 120 BPM clock, click-drag paint, `M`/`S` switches, yellow Play/Stop |
| 12 | `value-inspector` | Parameter Inspector Strip | Instrument | 6 cut value boxes (`Temp`, `Top-P`, `Max tok`, `Retries`, `Timeout`, `Workers`) with 1:1 drag, `Shift` fine mode, fill bars |
| 13 | `patch-inspector` | Diff Device Panel | Agentic | Browser file rail with single-line paths, verdict pips, and yellow `Accept [A]` / `Reject [R]` + `J`/`K` navigation |
| 14 | `command-strip` | Instant Command Strip | Instrument | Zero-animation cut command input, clip-colored category tags, keycaps, 0ms frame-snapped row inversion |
| 15 | `meter-bridge` | Worker Meter Bridge | Meter / Eval | 8 vertical segmented throughput meters (`W1`–`W8`) with held peak bars on the beat and per-worker power keys |
| 16 | `motion-shaper` | Rack Motion Shaper | Instrument | Interactive bench for Rack's `0ms Frame | 100ms Cut | 75ms Stop | Beat 1/16` curves + `36ms` column stagger test blocks |

## Rebuilding locally

```bash
python3 proposals/rack-studies/build.py
rm -f proposals/rack-studies/dev.html
node skills/litt-md/scripts/check.mjs
```
