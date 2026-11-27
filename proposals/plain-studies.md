# Plain studies: subtraction and agents

Written 2026-11-26 for Nick, as an evolve proposal (`skills/litt-md/workflows/evolve.md`). Nothing in `taste/profile.md`, `assets/tokens.css` or `gallery/src/` changes until you say yes. This page records what Plain's studies became, how **Subtraction** works as Plain's motion language, which rules and checks would change if you promote it into the system, and what stays open for your call.

## Where this came from

Shown the first Plain studies wall (white paper, 1px rules, square corners, the system face, quiet grey words with the chosen or primary word in `--fg` inside four 6px corner marks, and every duration at zero), you said:

> "I love this, do it's own motion language please, theme is subtraction, also components should be agentic"

The evidence, in `proposals/plain-studies/`:

- `plain-studies/studies.html`, all 12 Data & Diagram components and 24 agentic controls on one self-contained page.
- `plain-studies/data-light.jpg`, `plain-studies/data-dark.jpg`, `plain-studies/wall-light.jpg` and `plain-studies/wall-dark.jpg`, both views in light and dark.
- `plain-studies/data/*.js` and `plain-studies/studies/*.js`, one file per component, plus `plain-studies/shell.html` and `plain-studies/build.py`.
- `skills/litt-md/taste/journal.md`, the three entries dated 2026-11-26.

## Plain, in one paragraph

Plain is a document for steering, reviewing and reading agents. White paper (`--canvas`), black words (`--fg`) in the system's own face, `--font-mono` for paths, commands and diffs, 1px `--line` and `--line-control` rules, square corners, no fills and no shadows. A control is its words: `--fg-muted` until it matters, and the one that matters (the main action, the current choice, the row under the hand) is `--fg` inside four 1px corner marks. Link blue (`--accent-text`) appears only on real links in running text. Where an agent produces too much — reasoning traces, tool queues, diffs, citations, logs, secret spans — Plain makes the work readable in two seconds by **subtracting** everything that no longer needs your eye.

## Plain's motion language: Subtraction

Every other world's motion adds energy to the screen: Flat grows from where you touched it and bounces `0.28`, Press settles down with weight, Device clicks in steps, Rack cuts in on the beat, Heat whips in from the side. Plain is a page, and clarity on a page comes from taking away what is finished.

Six rules define Subtraction, all inside R4's tiers and using `transform` and `opacity` alone (plus instant colour fades):

1. **Exits lead, and nothing ever bounces.** Every spring and curve in Plain has bounce `0`. Overshoot is excess that has to be taken back; subtraction stops dead on the mark. Leaving (`--dur-exit-responsive`, 150ms on `--ease-out`) is quicker than settling (`--spring-responsive`, 200ms at bounce `0`), because leaving is the signature move.
2. **Four corner marks pare onto one thing.** A control group shares one living frame of four 6px by 1px corner hairlines (`currentColor`), positioned by `translate3d` on the 200ms bounce-0 spring so the 1px stroke never stretches. On press, the four corners tighten 2px inward on the instant tier (100ms), clamping onto the word; when a decision is complete and no choice remains, the corners tighten and fade out in 150ms.
3. **Focus by stepping the rest back.** Plain adds no wash, ring or shadow to highlight an item. When a hand inspects a citation, hovers a metric cell or waits on one approval gate, uninvolved siblings step back in opacity (`0.36`, on 150ms `--ease-out`), leaving the active line alone in full ink.
4. **Scaffolding folds into a receipt when done.** Reasoning notes, approval boxes, diff hunks, rolled-back checkpoints, finished runs and dismissed events erase first (`opacity` to `0` and `-6px` in 140ms `--ease-out`), and surviving rows close the gap by FLIP `translateY` on the 200ms bounce-0 curve — never animating `height` or `width`. What stays on the page is one quiet receipt line (`Thought for 4 s · 3 notes`, `Allowed · git push`, `Kept src/auth/verify.ts`).
5. **Words replace by erasing first, and bars move by `translateX`.** When a verb or figure updates in place, the old word erases upward (`-3px`, 85ms) before the new word states itself (`+3px` to `0`, 135ms), with no overlap, no bounce and no scramble. Every meter, safety buffer and context bar fills inside a clipped 1px box by `translateX`, never by `width`.
6. **A hand always wins, and reduced motion zeroes it.** On the studies wall a calm demo sequence runs until the first `pointerdown`, `keydown` or `wheel`, then stops for good; a shipped component never moves on its own. Under `prefers-reduced-motion: reduce`, every duration is `0ms` and every spring jumps straight to rest.

## All 24 studies are agentic

Hardware, music and newsletter subjects are gone. Each study is a shippable agentic pattern shaped for a document workspace:

| Group | Studies |
|---|---|
| Turn & reasoning | `thinking` (Thinking Trace), `tool-approval` (Tool Approval), `file-changes` (File Changes), `agent-run` (Agent Run), `sources` (Sources & Citations), `composer` (Prompt Composer) |
| Context, ledger & redaction | `context-budget` (Context Window), `agent-transcript` (Checkpoint Ledger), `prompt-redact` (Secret Redaction), `command-menu` (Slash Palette), `run-list` (Parallel Runs), `agent-plan` (Task Plan) |
| Steering & guards | `autonomy-switch` (Workspace Permissions), `effort-mode` (Effort & Depth), `agent-tuning` (Agent Tuning), `destructive-guard` (Destructive Guard), `approval-code` (Deploy Passkey), `handoff-command` (Session Handoff) |
| Telemetry & verification | `eval-matrix` (Eval Matrix, the one study using R7's four series hues), `rate-meter` (Token Throughput), `agent-loaders` (Determinate Work), `agent-indicators` (Live Status Line), `event-inbox` (Agent Inbox), `run-telemetry` (Run Telemetry) |

## Data, diagrams and charts in Plain

How Plain displays quantitative data and technical structure (`plain-studies/data/*.js`, the default view of `plain-studies/studies.html`):

1. **Bare on white paper — zero outer boxes, zero tooltip bubbles.** Charts, diagrams and tables sit directly on `--canvas` parted only by single `1px` `--line` hairlines. Scrubbing a time series, pointing at a bar or selecting a graph node never spawns a floating tooltip card: uninvolved marks step down to `0.18`–`0.25` opacity while the component's own standing figure (`26px` tabular) updates in place.
2. **Direct inline labels and white-paper scale cuts.** Multi-series line charts (`--data-blue`, `--data-amber`, `--data-teal`) print each series name and latest figure directly at the right end of its line, eliminating separate legend boxes. Single-quantity bar charts, waterfalls, funnels and heatmaps stay strictly monochrome (`--fg` and steps of `--fg` mixed into `--canvas`), using `1.5px` `--canvas` cuts through solid bars instead of full-width background gridlines.
3. **Frameless architectural diagrams.** Directed graphs (`agent-dag`), sequence diagrams (`sequence-diagram`), trace waterfalls (`trace-waterfall`) and state machines (`state-diagram`) draw nodes as frameless Helvetica words in white-paper breaks along `90°` orthogonal `1px` SVG hairlines with open stroke arrowheads. Only the active node wears four `6px` corner marks, and selecting any node dims every non-causal branch.
4. **Borderless tabular ledgers and monochrome heatmaps.** Tables (`data-table`) drop outer borders, right-align all numeric columns in `tabular-nums`, sort rows via FLIP `translateY`, and dim sibling rows on hover instead of painting grey row fills. Reliability matrices (`heatmap`) step `--fg` density across four monochrome levels so an anomaly filter (`< 95 %`) can subtract healthy cells to `0.12` opacity.

| Chapter | Live components (`plain-studies/data/`) |
|---|---|
| Charts & distributions | `01-stat-strip` (Standing Figures & Sparklines), `02-line-chart` (Multi-Series Line Chart), `03-bar-chart` (Tufte Cut Bar Chart), `04-stacked-breakdown` (Stacked Composition), `05-quantile-plot` (Latency Quantile Plot) |
| Diagrams, flows & traces | `06-agent-dag` (Directed Agent Graph), `07-sequence-diagram` (Protocol Sequence Diagram), `08-trace-waterfall` (Execution Trace Waterfall), `09-state-diagram` (Lifecycle State Machine), `10-funnel` (Verification Funnel) |
| Tables & density matrices | `11-data-table` (Sortable Ledger Table), `12-heatmap` (Monochrome Anomaly Heatmap) |

## Typeface, hierarchy, boxes and opacity

1. **Helvetica Neue (recommended over `system-ui`).** `system-ui` resolves to SF Pro on macOS and Segoe UI on Windows, which makes a bordered white sheet read like an OS utility panel. Setting `--font-sans` under Plain to `"Helvetica Neue", Helvetica, Arial, sans-serif` (still zero network load, installed on Apple's systems with Helvetica/Arial elsewhere) turns 1px rules and 6px corner marks into a Swiss specification page. Press already uses Helvetica Neue, and the greyscale test still separates the two worlds immediately: Press is warm stone surfaces with 4px/8px raised blocks and Blue 4 fills; Plain is white paper with 0px square corners, 1px rules and corner brackets. The header includes a live **Helvetica / System** switch.
2. **No unneeded boxes.** Four-sided boxes are kept only for surfaces that genuinely float over content; commands, redaction excerpts, logs, progress rails (`4px` borderless track), notification rows, `2×2` crosshair stats and the wall tiles themselves sit open on the page with `1px` rules.
3. **Unselected opacity steps back.** Unselected controls rest at `0.40` opacity (`1.0` in `--fg` when chosen), unfocused marks and rows step down to `0.25`, and sibling components on the page step down to `0.32` when pointing at one — making selection legible before reading a word.
4. **One resting frame per study, with dynamic refit.** Each component wears at most one set of corner marks at rest, observing both container and target mutations (`ResizeObserver` + `MutationObserver` on layout offsets) so words that grow in place (`Copy` → `Copied`) smoothly widen their corner marks without cramping glyphs.

## What would change in `litt.md` once you say yes

1. **Type (`tokens.css`, `SKILL.md`, `check.mjs` check 16).** Under `[data-material="plain"]`, switch `--font-sans` from `system-ui` to `"Helvetica Neue", Helvetica, Arial, sans-serif`, and allow one standing figure at `24px` (`500`) alongside R8's scale (as Flat gained `--type-figure-size` in v1.22).
2. **R4 (`taste/profile.md`, `SKILL.md`, `system/foundations.md`).** Replace `"Plain does not move"` with `"Plain subtracts"` — zero bounce (`0`), `--dur-instant` (100ms), `--dur-exit-responsive` (150ms) and `--spring-responsive` (200ms, bounce `0`), with `--dur-expressive` mapped to the responsive bounce-0 curve under `[data-material="plain"]` so Plain never bounces even when a shared component asks for the expressive tier.
3. **`taste/litt-principles.md`, "Plain, the document".** Replace `"Still. Nothing moves"` with Plain's six Subtraction rules above, encode the one-resting-frame rule, and add Plain's agentic focus alongside docs, forms and internal tools.
4. **`assets/tokens.css` and `scripts/check.mjs` (check 14).** Under `[data-material="plain"]`, keep `--press-depth: 0px`, `--press-scale: 1` and zero shadows/glass, restore `--dur-instant`, `--dur-responsive` and `--dur-exit-responsive`, and map `--spring-expressive` / `--ease-expressive` / `--dur-expressive` to the bounce-0 responsive tier. Update check 14 to hold Plain to zero bounce rather than zero duration; `prefers-reduced-motion: reduce` continues to zero every tier.
5. **Plain's gallery set (`SET.plain` in `gallery/src/gallery/play-object/takes.ts`).** Lead Plain's twelve-part player set with its agentic parts (`agent-transcript`, `thinking`, `tool-call`, `file-changes`, `sources`, `composer`, `context-budget`, `run-list`, `command-menu`, `switch`, `segmented`, `slider`) once their Plain bodies carry Subtraction.

## Open, for you

1. **Helvetica Neue for Plain?** Default on the studies wall now (flip `Helvetica / System` in the header to test). Recommend **yes**.
2. **Standing figure at `24px` (`500`) under Plain?** Gives telemetry, token budgets, passkeys and live verbs a clear focal point above `15px` headings and `14px` rows.
3. **Promote Subtraction into `tokens.css` and R4?** Say yes and the next PR updates R4, `tokens.css`, check 14 and `motion/deal.ts` so every Plain component in the gallery inherits Subtraction.
4. **Self-running tiles on `#plain/components`?** Keep calm Subtraction demos on the gallery wall until touched (as Flat does in v1.22), or keep `#plain/components` still at rest outside this studies page?

