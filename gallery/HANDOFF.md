# Gallery handoff

For the next agent working on the gallery. Written 2026-10-15. `main` has PR #12 (the PR check and taste profile v0.7), and production runs it. Start new work from `main`. This replaces the handoff of 2026-10-14, which only ever lived on the `claude/handoff` branch.

- Live gallery: https://littmd.vercel.app
- Live registry: https://littmd.vercel.app/r/registry.json (24 items)
- Install a component anywhere: `npx shadcn@latest add https://littmd.vercel.app/r/button.json`

## Read first

1. `.claude/CLAUDE.md`: the repo rules. Never push without asking Nick.
2. `gallery/README.md`: the pipelines, the checks and the deploy.
3. `gallery/CONTRIBUTING.md`: how a component is built, documented and shipped. It is binding, including interaction rule 4 (phones and touch).
4. `skills/litt-md/system/components.md` and `foundations.md`: the spec. Build what they say, never invent a look. Section 6 of foundations is how motion behaves on phones and touch.
5. `evals/agents/README.md`: the agent test, which is how this repo now measures whether Claude builds with litt.
6. `proposals/open-decisions.md`: the 26 decisions behind v0.7, and why.

## What happened since the last handoff

| PR | What | Result |
|---|---|---|
| #9 | Step 5, agent tests | `npm run test:agents`: Claude gets a fresh Vite or Next.js app and a task, and litt's own checks grade the result. The skill now installs registry components before writing markup. The lint has a `--host` mode for code in an app that installed the registry. |
| #10 | Responsive motion, part 1 | `proposals/responsive-motion.md`: an audit of every overlay at 390px on touch, and 14 decisions. The agent test sees phones (width, touch, frames mid-animation, a drag). Three baseline tasks recorded what Sonnet builds by hand. |
| #11 | Responsive motion, the build | Nick accepted all 14 recommendations (taste profile v0.6). On phones the Dialog and Popover are bottom sheets that drag to close, the menu drills down in place, the command menu sits at the top edge, toasts swipe away, tooltips open on a hold, and pressed rows fill. Desktop is unchanged. |
| `claude/handoff-2` | PR check, and the open decisions (v0.7) | `.github/workflows/gallery.yml` runs `check.mjs`, `verify`, `build` and axe on every page on every PR. Nick accepted all 26 recommendations in `proposals/open-decisions.md`: checkboxes fill with `--fg`, a dialog's fields and actions are md, Button takes an icon child, sheets sit above the keyboard, a toast over a sheet docks at the top, Dialog takes `tier`, `list`'s `Project` shape is generic, the host lint fails a bare transition, and the agent test lets agents take their own screenshots. |

After #12, Nick reacted to the tags ("the dots are horrible and the rounded tags dont feel right") and picked from a four-way trial: taste profile v0.8. Tags are the selected segment's look in Geist Mono (24px, the control radius, surface-1, hairline and top highlight, status as colored text). Every status dot is gone (tags, toasts, the header's current page), and filter chips take the control radius. Pills are left for avatars and icon-only buttons.

The result that matters: in the #10 baseline, Sonnet wrote its own 200-line bottom sheet for `phone-settings`. After #11 it composes litt's `Dialog` in a 99-line page and gets the sheet for free.

## The roadmap

| Step | Status | Where |
|---|---|---|
| 1. LICENSE, small fixes, public URL | Done | #4 |
| 2. Docs pages | Done, small leftovers | #5 |
| 3. Registry | Done | #6 |
| 4. Breadth | Mostly done | #7 |
| 5. Agent tests | Done; runs by hand, not in CI | #9 |
| 6. Accessibility | Done: axe on every page and 19 open overlays in CI, focus on route change, forced colors, toasts over a modal | `claude/handoff-2` |
| 7. Nice to have | Not started | |
| Motion on phones and touch | Done | #10, #11 |
| Open decisions after #9 and #11 | Done (taste profile v0.7) | `claude/handoff-2` |
| Forms | **Next**: `proposals/forms.md` drafted (16 decisions), waiting on Nick | `claude/handoff-2` |
| Dashboards | After forms: chart spec first | |

### Next, in order

1. **A real-phone pass** on the live gallery, once this branch is deployed. Headless Chromium can't show any of these: the keyboard over a sheet (now built, with a stubbed `visualViewport` as the only test) and over the command menu, safe-area insets, `:active` timing on rows and buttons, long press against the iOS callout, glass frame rate while dragging, and landscape phones (decision 8, the one call still open: does a screen under 480 tall count as compact?).
2. **Forms**, the same loop as motion. The draft is `proposals/forms.md` (16 decisions with a recommendation each: switch versus checkbox, the switch's shape, colors, motion and build, the select on fine and coarse pointers, the slider, optional fields, validation timing, the error summary, groups, settings and contact layouts, one segmented look, and the radio in the shape rule). Next: Nick's decisions, propagated through `evolve.md` (v0.9), then build with agents, with the `settings-form` task as the pass mark. The Select needs `@radix-ui/react-select`, which Nick adds (agents may not). The baseline (in #10) shows what is missing:
   - **Switch:** Sonnet built its own, and its color fade ran on the wrong tier (the host lint failed it).
   - **Select:** it used a native `<select>`, with rows 28 to 30px tall at 390 and an unstyled list on desktop. Decision 8 of the motion proposal said "native for now, revisit after this baseline".
   - **Slider:** hand-built, with no litt spec behind it.
   - **Field patterns:** groups, inline errors plus a summary, and a settings page and a contact or sign-up layout. Textarea is now in the spec under Input.
3. **Dashboards**: an app shell with a sidebar (it becomes a sheet on phones), number tiles, charts, and table filters and pages. Charts need a litt spec first: in the `analytics-dashboard` baseline every bar was a solid accent fill, which breaks the one-accent rule, and the sidebar stopped 900px down the page. `list`'s `Project` shape is already generic (v0.7).

Also still open from step 7: gallery-wide ⌘K search (needs `#page/section` routes); a comparison page against stock shadcn; running the agent test weekly in CI (needs an API key secret and a budget). Forced colors has two small gaps: hover steps on cards and rows are fills, so they have no cue there, and the gallery shell's own theme switch has no track or selected cue.

## Still open

**For Nick**
- **Landscape phones** (decision 8): wait for the real-phone pass. The likely answer is that a screen under 480 tall counts as compact, with the sheet capped at 640 wide.
- **Listing the registry in shadcn's directory**: decided "not yet". Revisit after forms ship.

**Found while building v0.7, not decided**
- **Toasts over a modal** are fixed: announced, dismissable, and a press on one leaves the modal open. Esc and F8 on a toast still wait for the modal to close, because the modal keeps the keyboard. A toast already on screen when a phone sheet opens stays at the bottom over the sheet's footer (the v0.7 "keeps its edge" rule) and now catches taps there.
- **A grid of cards where only some have covers** stretches the coverless ones to the row height (the grid's `h-full`). Fine for real data, which is usually all one or the other.

## How phones work now (for anyone touching a component)

- **Two signals** from `useDevice()` in `@/motion`: `compact` (narrower than 640) decides presentation, `coarse` (a finger) decides input. Both are false on the server, so Next.js hydrates the desktop markup and flips after. Never read the user agent.
- **Presentation switches in JS, input tweaks in CSS.** Choose a sheet, a drill-down or the top edge from `useDevice().compact`, so `<DeviceProvider mode="phone">` (the Playground's Device switch, and the phone stages on each page) previews it on a desktop. 44px targets, hidden key hints and pressed fills use `pointer-coarse:` in CSS, which the provider cannot force.
- **Pressed fills** (v0.7): a pressed row, card or button fills at its own hover fill on a coarse pointer, never below fg 6%.
- **Drag to dismiss** is `useDismissDrag` from `@/motion/drag`, not `@/motion`: `drag.ts` uses the tier hooks from the index, so the index does not re-export it (a re-export made a module cycle that Rollup splits badly). Its thresholds come from `--dismiss-distance` and `--dismiss-velocity` through `readDismiss()`. It never starts in a slider, `[data-no-drag]`, a focused text field, a scrolled region or the first 500ms.
- **`DialogSheet`** (exported from `dialog.tsx`) is the one phone sheet. The Popover reuses it. Render it inside a Radix Dialog root; it needs a `Dialog.Title`. It always rises on the expressive spring, whatever `tier` the Dialog has.
- **The visible screen** is `useVisibleScreen(enabled)` in `@/motion` (from `window.visualViewport`). The sheet's layer and the compact command menu both size to it, so the on-screen keyboard never covers a footer or a row.
- **A sheet counts itself** with `useSheetPresence(open)`, and `useSheetOpen()` reads it. The Toaster uses it to dock at the top edge on compact screens while a sheet is open; the stack keeps its edge until it empties.
- **Overlays and the Toaster** share only a DOM attribute: the Toaster's region is `data-litt-toaster`, and every Radix overlay passes `ignoreToaster` (in `@/motion`) to `onInteractOutside`, so a press on a toast is not an outside press. A modal Menu also makes what Radix hid `inert` while it is open (`useInertBehind` in `menu.tsx`), so the page behind it is out of reach for every input.

## Infrastructure and gotchas

- **CI:** `.github/workflows/gallery.yml` on every PR and push to `main`: `check.mjs`, `npm ci`, `verify`, `build`, then `npm run test:a11y` (axe-core, WCAG 2.0 to 2.2 A and AA, every page, light and dark, 1440 and 390). Playwright 1.56.1 and axe-core 4.10.3 are installed beside the gallery (`A11Y_TOOLS`), never in its `package.json`, so Vercel never installs them. Locally: `npm install --prefix <dir> axe-core@4.10.3`, then `A11Y_TOOLS=<dir> npm run test:a11y --prefix gallery` after a build. In CI, `npx playwright install --with-deps chromium` is fine; the "never run playwright install" rule is for Claude's cloud container only.
- **Vercel:** the project is `litt.md` (`prj_aSXaCdGhZ7SgWR1dMm6A9rLUn1BI`, team `nicks-projects-14b58bdc`). `main` is production and every branch gets a preview. Previews sit behind Vercel login, so `shadcn add` can't fetch a preview's registry: test installs against production, or locally with `test:registry`. The duplicate projects `litt-md` and `litt-md-93z4` were deleted on 2026-10-15.
- **Two deploy configs:** `vercel.json` (repo root) and `gallery/vercel.json` (Root Directory `gallery`). Change them together.
- **The pipelines run on every `verify` and build:** sync tokens, docs data, registry, typecheck, the lint, the lint's self-test. Generated output is gitignored; fix the source or the generator.
- **The registry verifier** (`gen-registry.mjs`): every custom property a shipped file uses must come from the shipped CSS, unless a shipped file declares it (an arbitrary property `[--x:…]` or a style key) and the reading item depends on the declaring one (the popover reads the dialog's `--sheet-foot`). The motion engine ships as one item (`motionFiles`), and `gen-docs.mjs` counts the whole engine for any component that uses part of it; a new engine file goes in both lists. Its CSS cross-check chokes on quoted attribute selectors in arbitrary variants (`[&>svg:not([class*='size-'])]` gave "missing }"), so keep those simple.
- **A new component needs:** a page with `docs`; JSDoc on every prop; a `COPY` entry in `gen-registry.mjs`; a smoke recipe in `test-registry.smoke.mjs`; a `test:registry` run; and, for anything that floats or takes touch, its phone behaviour per foundations section 6 with a phone stage.
- **Registry gotchas** (details in `gen-registry.mjs`'s header): shadcn rewrites a written `asChild` in `base-*` hosts; `registry:font` rewrites a Next.js layout, so fonts ship in `base-styles`; `cssVars.light/dark` write cyclic variables.
- **Radix:** keep `@radix-ui/react-focus-scope` at one version.
- **Motion:** never put `AnimatePresence initial={false}` around content. Tailwind v4's `active:scale-*` sets the CSS `scale` property, so a transition must name `scale`, not `transform` (the Button press snapped until #11).
- **Install test:** `npm run test:registry --prefix gallery`, about 10 to 12 minutes for both apps; templates are cached under the OS temp dir and shared with the agent test.
- **Agent test:** `npm run test:agents --prefix gallery`. One task costs about $0.40 to $0.70 with Sonnet building and the Opus judge (`--judge`), about 1 to 2 minutes of agent time; letting the agent take its own screenshots (the default since v0.7) adds turns, so expect more. `--no-self-shots` turns that off, to compare with the older baselines. `--fake-agent ../evals/agents/fake-agent.mjs` is free. It strips the parent session's environment (session ids, `CLAUDE_ADDITIONAL_DIRECTORIES`) so the nested `claude -p` sees only the host app. In Claude's cloud container the agent also has a built-in `dataviz` skill that Nick's machine may lack, and `create-next-app` 16.3.6 ships an `AGENTS.md` that adds turns.
- **Agent screenshots:** `gallery/scripts/agent-shot.mjs`, run in a host app after `npm run build`, serves the build with the grader's server and writes full-page PNGs to `.litt-shots/` (light and dark, 1440 and 390). The grader's file diff skips `.litt-shots/`.

### In Claude's cloud container

- Playwright is global under `/opt/node22` (`PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright`), Chromium at `/opt/pw-browsers`. Never run `playwright install` there.
- Headless Chromium never sets `:active` from a CDP touch. Probe pressed states with `CSS.forcePseudoState` or a mouse press inside a touch context. CDP touch drags (`Input.dispatchTouchEvent`) work; `test-agents.grade.mjs` has the pattern.
- There is no on-screen keyboard. To test anything that follows the keyboard, replace `window.visualViewport` in an init script with an `EventTarget` whose `height` you set, then dispatch `resize` (that is how the v0.7 sheet was checked).
- A push access request may need Nick's approval. The clone is shallow and single-branch, so a pushed branch has no remote-tracking ref until you fetch it into one (`git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>`); a stop hook that checks for unpushed commits reads that ref.

## How the work was run

This held up over steps 5, #10, #11 and v0.7:
1. **Contract first.** The lead wrote the shared pieces before any agent started: the taste and spec change (through `evolve.md`), the engine (`useDevice`, the dismiss thresholds) and a stub of `useDismissDrag` with its API. Then a brief with file ownership, the rules, and how to verify.
2. **Parallel Sonnet agents**, each owning a few files, in phases: anything that depends on another agent's work (the popover sheet, the toast swipe) waits for the next phase. Only the lead runs `verify` and the generators; agents typecheck, lint and build into their own `--outDir`, and prove touch behaviour with their own Playwright scripts. v0.7 was small enough for the lead alone.
3. **Review, then verify each unit alone.** The lead read every diff, then copied that agent's files into a `git worktree` of HEAD (with `node_modules` symlinked) and ran `verify` and `build` there, so other agents' half-written files never leaked in. One commit per unit.
4. **Gate every commit on the checks' exit codes.** Once, a check chain didn't stop on a registry failure and `977e5dd` shipped broken. The PR check now catches that on the PR. Also, `grep -c` exits 1 when it finds nothing, so don't chain a "no warnings" count with `&&`.
5. **Measure with the agent test** before and after: the baseline shows what agents hand-build, and the same task after the build shows whether they now compose litt.
6. **A temporary page for behaviour checks.** To test something no gallery page shows (a toast fired over an open sheet, a card with no cover), add `src/gallery/pages/99-zztest.tsx`, build into your own `--outDir`, drive it with Playwright, then delete the page before you commit.
