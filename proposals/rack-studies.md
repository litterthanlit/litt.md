# Proposal: Rack Studies

All twenty-three canonical studies from `proposals/flat-studies/`, redesigned in **Rack** (`proposals/rack.md`) as a pro tool for **agents, design, and interfaces** — using Rack's exact `tokens.css` grammar (plus a 6th clip hue, `--clip-pink`, for these studies), `2px` controls inside `6px` panels, crisp `1px` outlines, sunlit yellow (`#ffc933`) lit only inside an on key, and Rack's "on the beat" motion language.

- Live standalone bundle: [`proposals/rack-studies/studies.html`](rack-studies/studies.html)
- Wall previews: [`wall-light.jpg`](rack-studies/wall-light.jpg) · [`wall-dark.jpg`](rack-studies/wall-dark.jpg)

## Visual & motion grammar

- **Rack tokens (`skills/litt-md/assets/tokens.css`) + `--clip-pink`:** flat panels (`#e2e2e2` light / `#262626` dark) on a darker body (`#c8c8c8` / `#161616`), square `2px` controls inside `6px` panels, `1px` outlines (`--edge` / `--edge-press`), yellow `#ffc933` strictly as a lit key fill, and six clip hues (blue, orange, cyan, purple, green, pink) with pastel tints in light and deep jewel tints in dark.
- **On the beat:** panels and views cut in by opacity on the instant tier (`100ms` ease-out) and exit quicker (`75ms`), ticks step every `60ms`, direct manipulation answers on the frame (`0ms`), nothing travels or bounces.

## The 23 studies

1. **Gradient Keys** (`gradient-keys`) — Launch a look: long exposures in Japanese palettes (`Wakatake`, `AI`, `Sakura`), on the next tick.
2. **Agent Indicators** (`agent-indicators`) — An agent's run as a 6-color clip lane (`Think`, `Search`, `Read`, `Reason`, `Tools`, `Write`) with token traces.
3. **Agent Status** (`agent-status`) — Live multi-lane agent run timeline (`Think / Tool / Write`) with `Needs approval` + `Allow`.
4. **Command Menu** (`command-menu`) — One box for every command, agent, component, and run (`Ctrl K`).
5. **Fader** (`fader`) — Agent effort (`Planner`, `Coder`, `Reviewer`) on autopilot until you override a lane.
6. **Switch** (`switch`) — An agent's permissions (`Read files`, `Write files`, `Run commands`, `Network`, `Spend`): toggle keys that light on the frame with limits.
7. **One-Time Code** (`one-time-code`) — Approve an agent: six clip-blue value boxes, one real input, live window countdown.
8. **Ticker** (`ticker`) — An agent console's activity line, every message logged by agent with `Follow`.
9. **Step Sequencer** (`step-sequencer`) — A schedule of agent runs (`08:00–11:00`), stepping on a steady tick.
10. **Knob** (`knob`) — Component props (`Radius`, `Padding`, `Border`) with live `Preview Card` and `A / B` recall.
11. **Tape Reels** (`tape-reels`) — A deploy pipeline (`Build`, `Test`, `Deploy`) you can watch cross its jobs.
12. **VU Meter** (`vu-meter`) — Token-rate meters with peak hold across `Planner`, `Researcher`, `Coder`, `Reviewer`.
13. **Agent Shapes** (`agent-shapes`) — A 2×2 chain of agent devices; the one at work lights, draws its geometry, and leaves a trace.
14. **Agent Run** (`agent-run`) — Think, run tools on a live timeline, fold it away, stream the answer.
15. **Agent Loaders** (`agent-loaders`) — Working-state readouts (`Steps`, `Tool`, `Rate`, `Queue`) for a run's agents in one device.
16. **Dither Card** (`dither-card`) — A project browser (`Wavr`, `Carson`, `litt.works`) with a live dithered preview device.
17. **Spotlight Card** (`spotlight-card`) — Point at a layer (`Header`, `Sidebar`, `Card`) and read its spacing: a redline inspector.
18. **Toast Stack** (`toast-stack`) — An agent console's activity: the newest shows, the rest cut in when you look.
19. **Hold to Confirm** (`hold-to-confirm`) — Multi-agent branch list (`Planner`, `Coder`, `Reviewer`) with a hold-to-delete key.
20. **Number Ticker** (`number-ticker`) — Tokens and cost that cut in digit by digit, in any locale, over an orange daily histogram.
21. **Segmented Control** (`segmented-control`) — A breakpoint picker (`390`, `768`, `1280`, `1440`): one lit yellow box and a live layout wireframe.
22. **Magnetic Button** (`magnetic-button`) — A layout canvas (`Grid 8px`, `Snap`) where frames catch edges and grid lines.
23. **Copy Button** (`copy-button`) — An install device: pick the package manager (`npm`, `pnpm`, `yarn`, `bun`), copy the command or registry URL on the frame.

## Fixes applied on top of the prototype

- **`copy-button.js`:** removed the `100ms` color/background transition on `.cb-seg button` so the chosen package-manager key inverts instantaneously on the frame with full contrast.
- **`number-ticker.js`:** pre-populated digit spans on reshape and cut opacity from `0.35 → 1` so changing figures never drop blank holes mid-tick.
- **`shell.html`:** eagerly mount visible viewport tiles on load alongside `IntersectionObserver`, and support `?theme=light|dark` for deterministic captures.

## Open call for Nick

- **`--clip-pink` in `skills/litt-md/assets/tokens.css`:** these studies add a 6th clip hue (`#c0007e` / `#ffb3dd` light, `#e0379b` / `#5a1a3e` dark) locally in `shell.html`. Want to promote `--clip-pink` into Rack's core block in `tokens.css`?

## Rebuilding locally

```bash
python3 proposals/rack-studies/build.py
rm -f proposals/rack-studies/dev.html
node skills/litt-md/scripts/check.mjs
```
