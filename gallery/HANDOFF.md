# Gallery handoff

For the next agent working on the gallery. Written 2026-10-15, updated 2026-10-16 for the dashboards step and 2026-10-17 on `claude/cool-lamport-cqbu87` for the data-color step (taste profile v0.11). `main` has the dashboards step (#15). Start new work from `main` once the data-color branch is merged.

- Live gallery: https://littmd.vercel.app
- Live registry: https://littmd.vercel.app/r/registry.json (32 items on `main`, 44 with the data-color step and its rails round)
- Install a component anywhere: `npx shadcn@latest add https://littmd.vercel.app/r/button.json`

## Read first

1. `.claude/CLAUDE.md`: the repo rules. Never push without asking Nick.
2. `gallery/README.md`: the pipelines, the checks and the deploy.
3. `gallery/CONTRIBUTING.md`: how a component is built, documented and shipped. It is binding, including interaction rule 4 (phones and touch).
4. `skills/litt-md/system/components.md` and `foundations.md`: the spec. Build what they say, never invent a look. Section 6 of foundations is how motion behaves on phones and touch.
5. `evals/agents/README.md`: the agent test, which is how this repo now measures whether Claude builds with litt.
6. `proposals/open-decisions.md`: the 26 decisions behind v0.7, and why. `proposals/forms.md`: the 17 behind the forms step. `proposals/data-color.md`: the 12 color decisions behind v0.11, the nine items, and the questions for Nick's tests.

## What happened since the last handoff

| PR | What | Result |
|---|---|---|
| #9 | Step 5, agent tests | `npm run test:agents`: Claude gets a fresh Vite or Next.js app and a task, and litt's own checks grade the result. The skill now installs registry components before writing markup. The lint has a `--host` mode for code in an app that installed the registry. |
| #10 | Responsive motion, part 1 | `proposals/responsive-motion.md`: an audit of every overlay at 390px on touch, and 14 decisions. The agent test sees phones (width, touch, frames mid-animation, a drag). Three baseline tasks recorded what Sonnet builds by hand. |
| #11 | Responsive motion, the build | Nick accepted all 14 recommendations (taste profile v0.6). On phones the Dialog and Popover are bottom sheets that drag to close, the menu drills down in place, the command menu sits at the top edge, toasts swipe away, tooltips open on a hold, and pressed rows fill. Desktop is unchanged. |
| `claude/handoff-2` | PR check, and the open decisions (v0.7) | `.github/workflows/gallery.yml` runs `check.mjs`, `verify`, `build` and axe on every page on every PR. Nick accepted all 26 recommendations in `proposals/open-decisions.md`: checkboxes fill with `--fg`, a dialog's fields and actions are md, Button takes an icon child, sheets sit above the keyboard, a toast over a sheet docks at the top, Dialog takes `tier`, `list`'s `Project` shape is generic, the host lint fails a bare transition, and the agent test lets agents take their own screenshots. |

After #12, Nick reacted to the tags ("the dots are horrible and the rounded tags dont feel right") and picked from a four-way trial: taste profile v0.8. Tags are the selected segment's look in Geist Mono (24px, the control radius, surface-1, hairline and top highlight, status as colored text). Every status dot is gone (tags, toasts, the header's current page), and filter chips take the control radius. Pills are left for avatars and icon-only buttons.

Then the forms step, on `claude/forms` (taste profile v0.9). Nick sent a reference shot (a dashboard on a deep cobalt frame) with "use this kind of blue" and "the large buttons are too square", and asked to build first and test after:
- **Cobalt** is Litt's own accent (Q2 closed). After Nick's "the text gets lost a bit in the dark version of the button" (v0.10), `--accent` is a fill only: a deep cobalt with white text in both themes. Links and other accent text take the new `--accent-text`, which is lighter in dark. The lint fails `text-accent` and `text-litt-accent`.
- **lg buttons run wider:** side padding 32 (`--button-pad-lg`, a new token) instead of 24, corners unchanged. Nick chose that over rounder corners and the pill. lg fields keep 24. P10's ratio check gives lg its own range.
- **Four new items, built by four Sonnet agents:** Select (Radix Select; the Input's trigger and the Menu's list, anchored on phones), Switch (a pill track, Nick's call, filled with `--fg`), Slider (Radix Slider; `--fg` range, round thumb, no easing on position) and Form (`FormSection`, `Fieldset`, `ErrorSummary`, `FormActions`, `Optional`, `focusFirstInvalid`). Nick made three calls; the other 14 in `proposals/forms.md` are built as recommended and wait on his tests.
- **Also:** a checked checkbox now shows its hover (the wash is `--canvas` over an `--fg` chip), the Button page points on-or-off settings at Switch, `settings-form` is the forms step's pass mark (it expects select, switch and slider, and its rubric no longer allows an accent switch or slider), and the install test has recipes and checks for all four items.

Then the dashboards step, on `claude/dashboards` (no taste change; Nick again asked to build first and test after):
- **Four new items, built by one agent, alone:** Stat (`Stat`, `StatGroup`), Chart (`BarChart`, `LineChart`, `Meter`, plain SVG with no library), App shell (`AppShell`, `SidebarNav`, `SidebarLink`) and Pagination, each with a page, a spec section in `components.md` and a row in `proposals/dashboards.md` (17 decisions, all built as recommended). A Dashboard pattern page composes them into the `analytics-dashboard` task, in a desktop frame and a phone frame.
- **The two baseline failures are fixed by construction.** Chart marks are the foreground and never the accent (one series at 55% with the current mark full; up to three step down the foreground). The sidebar column is as tall as the page, with its content sticky and as tall as the window, so it reaches the bottom of a full-page screenshot.
- **On phones** the sidebar goes, a glass top bar holds a 44px menu button, and the nav opens in `DialogSheet` (the Dialog and Popover sheet). The chart has one pointer layer over the plot and a finger scrubs, because 14 columns on a phone are about 24px wide each.
- **`analytics-dashboard` is the step's pass mark** (it expects `stat`, `chart` and `app-shell`, and its rubric fails an accent bar and a short sidebar), and the install test has recipes and checks for all four items. `workflows/build.md`'s install table lists them.

Then the data-color step, on `claude/cool-lamport-cqbu87` (taste profile v0.11). Nick sent five reference shots of dark data panels and said "lets expand the components ... we stick to our design language, we can add some color too", and asked for Sonnet subagents:
- **P11, color carries data.** Five data hues (blue, amber, teal, violet, rose, in that order), each with a mark tone (3:1 on every surface), a `-text` tone (4.5:1, also on its own tint) and a `-tint`, fitted to litt's surfaces in both themes and validated for color-blind separation between neighbors. `check.mjs` checks every pair, including text on tint (it mixes the tint in OKLab itself). The lint fails a mark tone or a tint used as text, in both modes. Chrome never takes a hue; the accent still owns the primary action.
- **Existing parts take hues:** Tag (`hue` for a category), Chart (`hue` per series, or `hues`; color follows the series; a single hue series emphasises with the text tone, so no mark drops under 3:1) and Meter (`hue`). The foreground stays the default.
- **Nine new items, built by seven Sonnet agents in worktrees:** Token input, Pad, Avatar, Callout, Bar list, Gauge, Dot plot, Heatmap and Timeline, each with a page, a spec section, a registry entry and an install-test recipe. `test:registry` passes for all 41 items in Vite and Next.js (it caught a wrong expectation in the Pad's own check), and axe passes on all 39 pages. The Insights pattern page composes them into the references' panels. The sidebar's "Layout and data" split into Layout and Data.

Then the rails round, on the same branch. Nick saw "Meters by kind" and asked for "more of whatever this is": a hue drawn thin on a neutral track (logged as an open journal entry). Three Sonnet agents built Breakdown, Sparkline (with Stat's `trend` slot) and Spread; the lead gave Meter a `target` and `steps` and Bar list a hue per row, and built the Usage pattern page from rails alone. The registry has 44 items.

The result that matters: in the #10 baseline, Sonnet wrote its own 200-line bottom sheet for `phone-settings`. After #11 it composes litt's `Dialog` in a 99-line page and gets the sheet for free.

## The roadmap

| Step | Status | Where |
|---|---|---|
| 1. LICENSE, small fixes, public URL | Done | #4 |
| 2. Docs pages | Done, small leftovers | #5 |
| 3. Registry | Done | #6 |
| 4. Breadth | Mostly done | #7 |
| 5. Agent tests | Done; runs by hand, not in CI | #9 |
| 6. Accessibility | CI done (axe on every page); leftovers below | `claude/handoff-2` |
| 7. Nice to have | Not started | |
| Motion on phones and touch | Done | #10, #11 |
| Open decisions after #9 and #11 | Done (taste profile v0.7) | `claude/handoff-2` |
| Forms | Merged; waits on Nick's tests | #14 |
| Dashboards | Merged; waits on Nick's tests | #15 |
| Data color (v0.11) | Built; waits on Nick's tests | `claude/cool-lamport-cqbu87` |

### Next, in order

1. **Nick's tests of the data-color step**: the Insights page and the nine new pages in both themes and on a phone, the color itself (does P11 hold, is the data blue far enough from the cobalt button, is amber too close to warning), and the eight questions at the end of `proposals/data-color.md`. Whatever changes goes through `evolve.md`. There is no agent-test task for this step yet: an `inbox-insights` task (expects `dot-plot`, `bar-list`, `token-input` and `timeline`, and fails a hue on chrome or more than one accent fill) would be its pass mark.
2. **Nick's tests of the forms and dashboards steps**: the agent tests (`npm run test:agents -- --tasks settings-form --judge` and `--tasks analytics-dashboard --judge`, the two pass marks), the new pages on a phone, and the decisions in `proposals/forms.md` (14) and `proposals/dashboards.md` (17). Whatever changes goes through `evolve.md`. `test:registry` now passes for every item, the dashboards items included (run on 2026-10-17 with the data-color step).
3. **A real-phone pass** on the live gallery, once these branches are deployed. Headless Chromium can't show any of these: the keyboard over a sheet (now built, with a stubbed `visualViewport` as the only test) and over the command menu, safe-area insets, `:active` timing on rows and buttons, long press against the iOS callout, glass frame rate while dragging, scrubbing the chart with a finger (`touch-action: pan-y` on the plot, so a vertical drag still scrolls), and landscape phones (decision 8, the one call still open: does a screen under 480 tall count as compact?).
4. **What dashboards left out**: the Slider's range (two thumbs) for table filters, sparklines in the Stat, stacked bars and areas, a collapsible or nested sidebar, and a filter bar that holds the date range.

Also still open from steps 6 and 7: move focus to the page heading on a route change; forced colors for the box-shadow edges of Button, Tabs, Menu, Toast, Dialog, Card and Table; gallery-wide ⌘K search (needs `#page/section` routes); a comparison page against stock shadcn; running the agent test weekly in CI (needs an API key secret and a budget). The axe check renders each page as loaded, so it does not cover open overlays yet: adding a few open states (a dialog, a menu, the command menu) is the natural next step for it.

## Still open

**For Nick**
- **Landscape phones** (decision 8): wait for the real-phone pass. The likely answer is that a screen under 480 tall counts as compact, with the sheet capped at 640 wide.
- **Listing the registry in shadcn's directory**: decided "not yet". Revisit after forms ship.
- **From the dashboards build, for Nick's tests:** Are sidebar rows at 36px right, when menu and list rows are 44px (Q4, density in app UI, is still open)? Should the chart tooltip be glass, as the first brief said, or solid like the Tooltip (built: solid)? The third series is 30% of the foreground with a 1px edge on its bars and a dashed line, because 30% alone is under 3:1: acceptable, or cap charts at two series? Should a delta ever carry an arrow glyph beside its words (built: never)? Four tiles across needs a 40rem group, so the gallery's own frame shows two by two: is that the right break?
- **From the forms build, for his tests:** should a pointer-opened Select light its current option (now nothing is lit, as in the Menu)? Is 48px of air on both sides of a settings-section hairline right, and do the two close lines under the Notifications switch list read well? Should the ErrorSummary stay live while fields are fixed (now it does, without re-announcing) or freeze at submit? On phones the Slider's 44px hit area adds about 24px of air around the rail; keep it?

**Found while building v0.7, not decided**
- **Toasts during a modal are hidden from screen readers and can't be clicked.** Radix Dialog marks everything outside the dialog `aria-hidden` and sets `pointer-events: none` on the body, and the Toaster renders into the body. The Dialog docs already say to fire a toast after the dialog closes. If a toast must fire during a modal (a background build failing), the toast region needs to be portalled into the dialog's layer or excluded from Radix's hiding. A real fix, worth its own small PR.
- **A grid of cards where only some have covers** stretches the coverless ones to the row height (the grid's `h-full`). Fine for real data, which is usually all one or the other.

## How phones work now (for anyone touching a component)

- **Two signals** from `useDevice()` in `@/motion`: `compact` (narrower than 640) decides presentation, `coarse` (a finger) decides input. Both are false on the server, so Next.js hydrates the desktop markup and flips after. Never read the user agent.
- **Presentation switches in JS, input tweaks in CSS.** Choose a sheet, a drill-down or the top edge from `useDevice().compact`, so `<DeviceProvider mode="phone">` (the Playground's Device switch, and the phone stages on each page) previews it on a desktop. 44px targets, hidden key hints and pressed fills use `pointer-coarse:` in CSS, which the provider cannot force.
- **Pressed fills** (v0.7): a pressed row, card or button fills at its own hover fill on a coarse pointer, never below fg 6%.
- **Drag to dismiss** is `useDismissDrag` from `@/motion/drag`, not `@/motion`: `drag.ts` uses the tier hooks from the index, so the index does not re-export it (a re-export made a module cycle that Rollup splits badly). Its thresholds come from `--dismiss-distance` and `--dismiss-velocity` through `readDismiss()`. It never starts in a slider, `[data-no-drag]`, a focused text field, a scrolled region or the first 500ms.
- **`DialogSheet`** (exported from `dialog.tsx`) is the one phone sheet. The Popover reuses it. Render it inside a Radix Dialog root; it needs a `Dialog.Title`. It always rises on the expressive spring, whatever `tier` the Dialog has.
- **The visible screen** is `useVisibleScreen(enabled)` in `@/motion` (from `window.visualViewport`). The sheet's layer and the compact command menu both size to it, so the on-screen keyboard never covers a footer or a row.
- **A sheet counts itself** with `useSheetPresence(open)`, and `useSheetOpen()` reads it. The Toaster uses it to dock at the top edge on compact screens while a sheet is open; the stack keeps its edge until it empties.

## Infrastructure and gotchas

- **CI:** `.github/workflows/gallery.yml` on every PR and push to `main`: `check.mjs`, `npm ci`, `verify`, `build`, then `npm run test:a11y` (axe-core, WCAG 2.0 to 2.2 A and AA, every page, light and dark, 1440 and 390). Playwright 1.56.1 and axe-core 4.10.3 are installed beside the gallery (`A11Y_TOOLS`), never in its `package.json`, so Vercel never installs them. Locally: `npm install --prefix <dir> axe-core@4.10.3`, then `A11Y_TOOLS=<dir> npm run test:a11y --prefix gallery` after a build. In CI, `npx playwright install --with-deps chromium` is fine; the "never run playwright install" rule is for Claude's cloud container only.
- **Vercel:** the project is `litt.md` (`prj_aSXaCdGhZ7SgWR1dMm6A9rLUn1BI`, team `nicks-projects-14b58bdc`). `main` is production and every branch gets a preview. Previews sit behind Vercel login, so `shadcn add` can't fetch a preview's registry: test installs against production, or locally with `test:registry`. The duplicate projects `litt-md` and `litt-md-93z4` were deleted on 2026-10-15.
- **Two deploy configs:** `vercel.json` (repo root) and `gallery/vercel.json` (Root Directory `gallery`). Change them together.
- **The pipelines run on every `verify` and build:** sync tokens, docs data, registry, typecheck, the lint, the lint's self-test. Generated output is gitignored; fix the source or the generator.
- **The registry verifier** (`gen-registry.mjs`): every custom property a shipped file uses must come from the shipped CSS, unless a shipped file declares it (an arbitrary property `[--x:…]` or a style key) and the reading item depends on the declaring one (the popover reads the dialog's `--sheet-foot`). The motion engine ships as one item (`motionFiles`), and `gen-docs.mjs` counts the whole engine for any component that uses part of it; a new engine file goes in both lists. Its CSS cross-check chokes on quoted attribute selectors in arbitrary variants (`[&>svg:not([class*='size-'])]` gave "missing }"), so keep those simple.
- **A new component needs:** a page with `docs`; JSDoc on every prop; a `COPY` entry in `gen-registry.mjs`; a smoke recipe in `test-registry.smoke.mjs`; a `test:registry` run; and, for anything that floats or takes touch, its phone behaviour per foundations section 6 with a phone stage.
- **Registry gotchas** (details in `gen-registry.mjs`'s header): shadcn rewrites a written `asChild` in `base-*` hosts; `registry:font` rewrites a Next.js layout, so fonts ship in `base-styles`; `cssVars.light/dark` write cyclic variables.
- **Merging parallel smoke checks:** when two agents add check blocks at the same anchor, git interleaves them line by line and no marker-level resolution is safe. Take HEAD's file and splice each agent's recipe and `if (has(...))` block in whole, from `git show <commit>:<file>`, then check the diff against HEAD is insertions only and matches the agent's own count.
- **Data-color gotchas:** a component that picks a token by name must write every name out (`"var(--data-blue)"`, `"fill-data-blue"`); a template like `` `var(--data-${hue})` `` passes the gallery build but the registry cannot rename it to `--litt-data-blue`, and gen-registry fails it. An `sr-only` table will not shrink to 1px and widens a phone's page; wrap it in an `sr-only` div (chart.tsx does). Parallel agents that each add a smoke recipe at the same anchor conflict on merge: keep both sides, and check the diff against HEAD is insertions only.
- **Dashboards gotchas:** `AppShell`'s main area is a flex item, but a bare `grid` inside it sizes its track to the widest min-content, and a wide table or the chart's SVG then stretches the page past the screen: use `grid grid-cols-1`. The chart measures its container with a ResizeObserver and draws a fixed-width SVG, so a track that grows with the SVG never shrinks again. While a sheet is open Radix hides the rest of the page from the accessibility tree, so a Playwright `getByRole` for the menu button finds nothing: use `button[aria-label='Open navigation']`. The chart's per-category buttons are visually hidden (`sr-only`), so `.hover()` on them hits the SVG: hover the plot with `page.mouse.move`. Playwright's fullPage screenshot keeps `100svh` at the original window height, which is why the sidebar column (not its sticky content) is what fills the page.
- **Radix:** keep `@radix-ui/react-focus-scope` at one version. The forms step added `react-select` 2.3.8, `react-slider` 1.5.0 and `react-switch` 1.3.8, the releases on the same line as the installed dialog and popover; check `npm ls --all | grep -o "react-focus-scope@[0-9.]*" | sort -u` after adding any Radix package.
- **Radix Select:** it closes on a window resize, so a full-page screenshot taken after opening it shows it closed; take a viewport screenshot (the grader already does after a click). It moves focus on an arrow key in a `setTimeout`, so a test that sends Enter right after ArrowDown picks the old option about one time in thirteen: wait for focus to move first. It hides the rest of the page from the accessibility tree while open, so `getByRole("combobox")` finds nothing until it closes. The Select holds its exit with `forceMount` while it is "leaving" (see the file header).
- **Motion:** never put `AnimatePresence initial={false}` around content. Tailwind v4's `active:scale-*` sets the CSS `scale` property, so a transition must name `scale`, not `transform` (the Button press snapped until #11).
- **Install test:** `npm run test:registry --prefix gallery`, about 10 to 12 minutes for both apps; templates are cached under the OS temp dir and shared with the agent test.
- **Agent test:** `npm run test:agents --prefix gallery`. One task costs about $0.40 to $0.70 with Sonnet building and the Opus judge (`--judge`), about 1 to 2 minutes of agent time; letting the agent take its own screenshots (the default since v0.7) adds turns, so expect more. `--no-self-shots` turns that off, to compare with the older baselines. `--fake-agent ../evals/agents/fake-agent.mjs` is free. It strips the parent session's environment (session ids, `CLAUDE_ADDITIONAL_DIRECTORIES`) so the nested `claude -p` sees only the host app. In Claude's cloud container the agent also has a built-in `dataviz` skill that Nick's machine may lack, and `create-next-app` 16.3.6 ships an `AGENTS.md` that adds turns.
- **Agent screenshots:** `gallery/scripts/agent-shot.mjs`, run in a host app after `npm run build`, serves the build with the grader's server and writes full-page PNGs to `.litt-shots/` (light and dark, 1440 and 390). The grader's file diff skips `.litt-shots/`.

### In Claude's cloud container

- Playwright is global under `/opt/node22` (`PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright`), Chromium at `/opt/pw-browsers`. Never run `playwright install` there.
- Headless Chromium never sets `:active` from a CDP touch. Probe pressed states with `CSS.forcePseudoState` or a mouse press inside a touch context. CDP touch drags (`Input.dispatchTouchEvent`) work; `test-agents.grade.mjs` has the pattern.
- Headless Chromium here does not render `backdrop-filter`: text under a glass panel shows through faded but sharp in screenshots (a plain test page with `blur(20px)` does the same). Judge glass on a real browser.
- There is no on-screen keyboard. To test anything that follows the keyboard, replace `window.visualViewport` in an init script with an `EventTarget` whose `height` you set, then dispatch `resize` (that is how the v0.7 sheet was checked).
- Agent worktrees (`isolation: "worktree"`) are cut from `main`, not from the branch you are on. Tell each agent to `git merge --ff-only <your branch>` first, and commit the contract before it starts. They live in `.claude/worktrees/`; add that to `.git/info/exclude` so the tree stays clean.
- A push access request may need Nick's approval. The clone is shallow and single-branch, so a pushed branch has no remote-tracking ref until you fetch it into one (`git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>`); a stop hook that checks for unpushed commits reads that ref.

## How the work was run

This held up over steps 5, #10, #11, v0.7 and the forms step:
1. **Contract first.** The lead wrote the shared pieces before any agent started: the taste and spec change (through `evolve.md`), the engine (`useDevice`, the dismiss thresholds) and a stub of `useDismissDrag` with its API. Then a brief with file ownership, the rules, and how to verify.
2. **Parallel Sonnet agents**, each owning a few files, in phases: anything that depends on another agent's work (the popover sheet, the toast swipe) waits for the next phase. Only the lead runs `verify` and the generators; agents typecheck, lint and build into their own `--outDir`, and prove touch behaviour with their own Playwright scripts. v0.7 was small enough for the lead alone. In the forms step each agent had its own git worktree (`isolation: "worktree"`, `node_modules` symlinked from the main checkout), so every agent could run the full `verify` safely, and the lead copied each agent's files into the main checkout to review, build, screenshot and commit them one unit at a time. In the data-color step each of seven agents committed once in its own worktree (the brief: `scratchpad/brief.md` in that session, summarised in `proposals/data-color.md`), and the lead cherry-picked each commit with `--no-commit`, resolved the smoke-file conflicts, fixed what review found (a rail tone, a prop name, names copied from the references), ran verify, the build, screenshots and axe, and committed one unit at a time. The registry COPY entries were stubbed in the contract, so they never conflicted.
3. **Review, then verify each unit alone.** The lead read every diff, then copied that agent's files into a `git worktree` of HEAD (with `node_modules` symlinked) and ran `verify` and `build` there, so other agents' half-written files never leaked in. One commit per unit.
4. **Gate every commit on the checks' exit codes.** Once, a check chain didn't stop on a registry failure and `977e5dd` shipped broken. The PR check now catches that on the PR. Also, `grep -c` exits 1 when it finds nothing, so don't chain a "no warnings" count with `&&`.
5. **Measure with the agent test** before and after: the baseline shows what agents hand-build, and the same task after the build shows whether they now compose litt.
6. **A temporary page for behaviour checks.** To test something no gallery page shows (a toast fired over an open sheet, a card with no cover), add `src/gallery/pages/99-zztest.tsx`, build into your own `--outDir`, drive it with Playwright, then delete the page before you commit.
