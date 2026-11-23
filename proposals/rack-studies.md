# Proposal: Rack Studies

Sixteen interactive agentic & interface-first studies in **Rack** (`proposals/rack.md`) — taking Rack's square outlined software grammar, crisp bright neutrals paired with electric high-chroma fills, sunlit yellow lit keys, and Emil Kowalski's direct-manipulation motion language (without leaning on music/DAW clichés or copying reference layouts).

- Live standalone bundle: [`proposals/rack-studies/studies.html`](rack-studies/studies.html)
- Wall previews: [`wall-light.jpg`](rack-studies/wall-light.jpg) · [`wall-dark.jpg`](rack-studies/wall-dark.jpg)

## Visual grammar

- **Bright, crisp neutrals (light & dark):** cool architectural canvas (`#e6e8ee` light / `#0f1115` dark), clean panels (`#f7f8fa` / `#181b22`), pure inner cuts (`#ffffff` / `#111318`), and crisp `1px` outlines — zero shadows, zero glass blur, zero muddy grey.
- **Square geometry:** `2px` controls nested inside `4px` panels — the sharp architectural foil to Flat's borderless pills.
- **Electric Rack yellow (`#ffd014`):** strictly a lit key fill inside a `1px` dark outline (`#111318` ink on yellow).
- **High-chroma 5-hue series:** electric cobalt (`#1a6dff`), vivid coral (`#ff471a`), electric emerald (`#00b377`), electric violet (`#7a3cff`), and electric pink (`#e6268c`) — reserved for status badges, tags, diff rails, eval cells, and telemetry signals.

## Motion language (Emil Kowalski / Rack)

1. **0ms under a hand:** vertical pointer-capture drag (`Shift` fine mode, double-click home), command filtering, tab switching, facet toggles, and switchboard flips answer on the exact frame with zero settle or overshoot.
2. **100ms cut-in, 36ms column stagger:** panels and notifications cut in by opacity (`100ms ease-out`), with multi-column surfaces launching `36ms` apart.
3. **75ms cut-out:** exits finish faster than enters (`75ms ease-out`) with zero travel.
4. **0.98 press feedback:** active buttons compress subtly (`scale(0.98)`) on click. `prefers-reduced-motion: reduce` zeroes all durations.

## The 16 studies

| # | Slug | Study | Category | Component & interaction |
|---|------|-------|----------|-------------------------|
| 01 | `agent-status` | Agent Status | Agentic | Live elapsed timer, square step pills (`Plan / Read / Patch / Verify`), electric yellow `Allow` & `Stop` keys |
| 02 | `agent-trace` | Agent Trace Tree | Agentic | Collapsible tool-call list with vivid square tool badges (`READ / GREP / EDIT / TEST`) and 0ms detail expand |
| 03 | `agent-indicators` | Agent Indicators | Agentic | Four crisp discrete-step loaders (`Matrix`, `Scan`, `Tokens`, `Verify`) with zero blur or glow |
| 04 | `command-menu` | Command Menu | Controls | Zero-animation command palette with vivid category badges, shortcut keycaps, and 0ms row inversion |
| 05 | `value-controls` | Drag Value Controls | Controls | Inline numeric cut boxes (`Temperature`, `Max tokens`, `Timeout`, `Workers`) dragged 1:1 vertically + `Shift` fine mode |
| 06 | `segmented-switch` | Segmented Switchboard | Controls | Square segmented mode chooser (`Fast / Balanced / Strict`) and 0ms mechanical ON/OFF toggle keys |
| 07 | `permission-gate` | Permission Gate | Agentic | Per-tool `Auto / Ask / Block` policy keys paired with a live incoming tool call bar and yellow `Approve` key |
| 08 | `context-budget` | Context Budget Bar | Agentic | Interactive stacked context-window bar — click slices to prune/restore tokens or snap-`Compact` |
| 09 | `diff-review` | Inline Diff Review | Agentic | Crisp square file tabs with verdict pips, vivid emerald/coral diff hunks, and yellow `Accept` / `Reject` |
| 10 | `hold-confirm` | Hold to Commit | Controls | Press-and-hold destructive/deploy button with linear fill bar, high-contrast readout badge, and 0ms cancel reset |
| 11 | `eval-matrix` | Eval Run Matrix | Signals | 48 clickable pass/warn/fail eval cells across 4 vivid suites with instant filter cut and live bottom inspector |
| 12 | `toast-queue` | Toast Queue | Controls | Sharp outlined notification cards with vivid colored status rails (`100ms` cut-in, `75ms` dismiss) |
| 13 | `copy-block` | Streaming Copy Block | Controls | Crisp mono snippet bar with format tabs (`CLI / curl / TS`) and 0ms `Copy` → yellow `Copied ✓` flip |
| 14 | `facet-bar` | Filter & Facet Bar | Signals | Multi-select square facet chips with live counts, vivid fills, and 0ms list filtering |
| 15 | `metric-strip` | Live Metric Strip | Signals | 4-column agent telemetry (`Latency`, `Pass rate`, `Tokens/s`, `Cost`) with vivid sparkbars and `1h / 24h / 7d` toggle |
| 16 | `rack-motion` | Cut & Stagger Motion | Controls | Interactive bench for Rack's `0ms Hand`, `100ms Cut-In`, `36ms Stagger`, and `75ms Cut-Out` timing |

## Open calls for Nick

1. **Token promotion into `skills/litt-md/assets/tokens.css`:** these studies deliberately lift Rack's light canvas from `#c8c8c8` → `#e6e8ee` (panels `#e2e2e2` → `#f7f8fa`) and push the 5 series hues to full electric chroma. Want us to promote this brighter, higher-chroma palette into Rack's core `tokens.css` block in a follow-up PR?

## Rebuilding locally

```bash
python3 proposals/rack-studies/build.py
rm -f proposals/rack-studies/dev.html
node skills/litt-md/scripts/check.mjs
```
