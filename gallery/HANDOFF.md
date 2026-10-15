# Gallery handoff

For the next agent working on the gallery. Written 2026-10-15. `main` is at `192e5de` (PR #11), and production runs it. This replaces the handoff of 2026-10-14, which only ever lived on the `claude/handoff` branch.

- Live gallery: https://littmd.vercel.app
- Live registry: https://littmd.vercel.app/r/registry.json (24 items)
- Install a component anywhere: `npx shadcn@latest add https://littmd.vercel.app/r/button.json`

## Read first

1. `.claude/CLAUDE.md`: the repo rules. Never push without asking Nick.
2. `gallery/README.md`: the pipelines, the checks and the deploy.
3. `gallery/CONTRIBUTING.md`: how a component is built, documented and shipped. It is binding, including interaction rule 4 (phones and touch).
4. `skills/litt-md/system/components.md` and `foundations.md`: the spec. Build what they say, never invent a look. Section 6 of foundations is how motion behaves on phones and touch.
5. `evals/agents/README.md`: the agent test, which is how this repo now measures whether Claude builds with litt.

## What happened since the last handoff

| PR | What | Result |
|---|---|---|
| #9 | Step 5, agent tests | `npm run test:agents`: Claude gets a fresh Vite or Next.js app and a task, and litt's own checks grade the result. The skill now installs registry components before writing markup. The lint has a `--host` mode for code in an app that installed the registry. |
| #10 | Responsive motion, part 1 | `proposals/responsive-motion.md`: an audit of every overlay at 390px on touch, and 14 decisions. The agent test sees phones (width, touch, frames mid-animation, a drag). Three baseline tasks recorded what Sonnet builds by hand. |
| #11 | Responsive motion, the build | Nick accepted all 14 recommendations (taste profile v0.6). On phones the Dialog and Popover are bottom sheets that drag to close, the menu drills down in place, the command menu sits at the top edge, toasts swipe away, tooltips open on a hold, and pressed rows fill. Desktop is unchanged. |

The result that matters: in the #10 baseline, Sonnet wrote its own 200-line bottom sheet for `phone-settings`. After #11 it composes litt's `Dialog` in a 99-line page and gets the sheet for free.

## The roadmap

| Step | Status | Where |
|---|---|---|
| 1. LICENSE, small fixes, public URL | Done | #4 |
| 2. Docs pages | Done, small leftovers | #5 |
| 3. Registry | Done | #6 |
| 4. Breadth | Mostly done | #7 |
| 5. Agent tests | Done; runs by hand, not in CI | #9 |
| 6. Accessibility | Partly done; CI still missing | |
| 7. Nice to have | Not started | |
| Motion on phones and touch | Done | #10, #11 |
| Forms | **Next**: spec first | |
| Dashboards | After forms: chart spec first | |

### Next, in order

1. **Nick's calls on #11's open questions** (below), and a real-phone pass on the live gallery: the keyboard over a sheet and the command menu, safe-area insets, `:active` timing, long press against the iOS callout, glass frame rate while dragging. Headless Chromium can't show any of these.
2. **A PR check in GitHub Actions** (step 6's leftover, about half a day): `npm ci`, `verify`, `build`, then axe across every route, on every PR. In #11, commit `977e5dd` shipped a registry failure that only Vercel's preview caught, with no red mark on the PR. Do this before forms and dashboards add many components. In CI, `npx playwright install --with-deps chromium` is fine; the "never run playwright install" rule is for Claude's cloud container only.
3. **Forms**, the same loop as motion: a draft spec in `proposals/` for Nick, Nick's decisions, propagated through `evolve.md`, build with agents, and the `settings-form` task as the pass mark. Its baseline (in #10) shows what is missing:
   - **Switch:** Sonnet built its own, and its color fade ran on the wrong tier (the host lint failed it).
   - **Select:** it used a native `<select>`, with rows 28 to 30px tall at 390 and an unstyled list on desktop. Decision 8 of the motion proposal said "native for now, revisit after this baseline".
   - **Slider:** hand-built, with no litt spec behind it.
   - **Field patterns:** groups, inline errors plus a summary, and a settings page and a contact or sign-up layout.
4. **Dashboards**: an app shell with a sidebar (it becomes a sheet on phones), number tiles, charts, and table filters and pages. Charts need a litt spec first: in the `analytics-dashboard` baseline every bar was a solid accent fill, which breaks the one-accent rule, and the sidebar stopped 900px down the page. The `list` component's `Project` shape should become generic before this step.

Also still open from step 6 and 7: move focus to the page heading on a route change; forced colors for the box-shadow edges of Button, Tabs, Menu, Toast, Dialog, Card and Table; gallery-wide ⌘K search (needs `#page/section` routes); a comparison page against stock shadcn; running the agent test weekly in CI (needs an API key secret and a budget).

## Open decisions for Nick

None of these blocks the next step; each needs Nick's taste, not an agent's.

**From #11 (responsive motion)**
- **Pressed fill:** decision 10 says rows fill at fg 6% when held; the spec text says "like a hovered row". As built, menu rows use 7% (their glide hover), tabs and chips 6% (their hover), and list and table rows 6% against a 4% hover. Should pressed always equal hover?
- **Form inputs in a dialog:** the `settings-dialog` agent made its fields `lg` (56px) to match the `lg` buttons, and the rubric expects `md` (44). P10 only says form CTAs are `lg`. The skill or the rubric should say which.
- **Keyboard over a sheet:** `DialogSheet` is `fixed inset-0` and does not follow `visualViewport`, as the command menu does. "A place above the keyboard" for popover fields needs it. Do it after a phone check?
- **Sheet tier:** the sheet always rises on the expressive tier. A popover in a view that already has its expressive moment should use the responsive tier, which needs a `tier` prop on `DialogSheet`.
- **Small gaps:** underline tabs at `sm` stay 32px on touch; `ProjectCard` has no pressed state; with reduced motion a Button press on touch shows nothing; the Toast page's Burst caption says "Hover the stack".
- **Not decided in the proposal:** a toast that fires while a sheet is open (it covers the sheet's buttons); landscape phones (not compact, so they keep the centered dialog); iPad portrait (coarse, not compact).

**From #9 (agent tests)**
- **Button icons:** an icon passed as a Button child stacks over the label, because children are the cap-trimmed label. The skill steers agents to `icon`. Should Button also accept an icon child?
- **Checked checkbox fill:** it uses the accent, but P1 allows one accent fill per view. The agent rubrics allow it for now.
- **Dark surfaces:** dark `surface-1` sits very close to `canvas`; a judge read pricing tiers as "black boxes on a black page". Intended flatness (P4), or should dark `surface-1` step up?
- **`list`'s `Project` shape:** it requires `deploy` and `cover`, shows a date where a year was asked for, and its docs say to rename fields in `list.tsx` while the skill says never edit installed files.
- **Self-critique screenshots:** the agent test does not allow a preview server or Playwright, so agents cannot take the screenshots the build workflow asks for. Allow them?
- **Bare `transition-colors`:** the host lint warns rather than fails. Promote it?

**Still open from steps 2 to 4**
- **Spec gaps:** toasts close after 5s in the spec but 4s in the code; the dialog can't drop to the responsive tier when the view's expressive moment is taken; Kbd asks for 11px, which the type scale lacks; switch, select and slider are unspecified (the forms step answers this).
- **Taste calls:** dark tooltip chip outline (`--line-strong`?); disabled secondary Button on surface-2 (keep a hairline?); static skeletons (a pulse needs a token); header current page (dot or underline?); Segmented md text size and equal widths; keep the Textarea extension?; the "keep one status tag" guidance; the Input focus edge fades `box-shadow`, which CONTRIBUTING forbids.
- **Housekeeping:** delete the duplicate Vercel projects `litt-md` and `litt-md-93z4` if they still exist; list the registry in shadcn's directory or not.

## How phones work now (for anyone touching a component)

- **Two signals** from `useDevice()` in `@/motion`: `compact` (narrower than 640) decides presentation, `coarse` (a finger) decides input. Both are false on the server, so Next.js hydrates the desktop markup and flips after. Never read the user agent.
- **Presentation switches in JS, input tweaks in CSS.** Choose a sheet, a drill-down or the top edge from `useDevice().compact`, so `<DeviceProvider mode="phone">` (the Playground's Device switch, and the phone stages on each page) previews it on a desktop. 44px targets, hidden key hints and pressed fills use `pointer-coarse:` in CSS, which the provider cannot force.
- **Drag to dismiss** is `useDismissDrag` from `@/motion/drag`, not `@/motion`: `drag.ts` uses the tier hooks from the index, so the index does not re-export it (a re-export made a module cycle that Rollup splits badly). Its thresholds come from `--dismiss-distance` and `--dismiss-velocity` through `readDismiss()`. It never starts in a slider, `[data-no-drag]`, a focused text field, a scrolled region or the first 500ms.
- **`DialogSheet`** (exported from `dialog.tsx`) is the one phone sheet. The Popover reuses it. Render it inside a Radix Dialog root; it needs a `Dialog.Title`.

## Infrastructure and gotchas

- **Vercel:** the project is `litt.md` (`prj_aSXaCdGhZ7SgWR1dMm6A9rLUn1BI`, team `nicks-projects-14b58bdc`). `main` is production and every branch gets a preview. Previews sit behind Vercel login, so `shadcn add` can't fetch a preview's registry: test installs against production, or locally with `test:registry`.
- **Two deploy configs:** `vercel.json` (repo root) and `gallery/vercel.json` (Root Directory `gallery`). Change them together.
- **The pipelines run on every `verify` and build:** sync tokens, docs data, registry, typecheck, the lint, the lint's self-test. Generated output is gitignored; fix the source or the generator.
- **The registry verifier** (`gen-registry.mjs`): every custom property a shipped file uses must come from the shipped CSS, unless a shipped file declares it (an arbitrary property `[--x:…]` or a style key) and the reading item depends on the declaring one (the popover reads the dialog's `--sheet-foot`). The motion engine ships as one item (`motionFiles`), and `gen-docs.mjs` counts the whole engine for any component that uses part of it; a new engine file goes in both lists.
- **A new component needs:** a page with `docs`; JSDoc on every prop; a `COPY` entry in `gen-registry.mjs`; a smoke recipe in `test-registry.smoke.mjs`; a `test:registry` run; and, for anything that floats or takes touch, its phone behaviour per foundations section 6 with a phone stage.
- **Registry gotchas** (details in `gen-registry.mjs`'s header): shadcn rewrites a written `asChild` in `base-*` hosts; `registry:font` rewrites a Next.js layout, so fonts ship in `base-styles`; `cssVars.light/dark` write cyclic variables.
- **Radix:** keep `@radix-ui/react-focus-scope` at one version.
- **Motion:** never put `AnimatePresence initial={false}` around content. Tailwind v4's `active:scale-*` sets the CSS `scale` property, so a transition must name `scale`, not `transform` (the Button press snapped until #11).
- **Install test:** `npm run test:registry --prefix gallery`, about 10 to 12 minutes for both apps; templates are cached under the OS temp dir and shared with the agent test.
- **Agent test:** `npm run test:agents --prefix gallery`. One task costs about $0.40 to $0.70 with Sonnet building and the Opus judge (`--judge`), about 1 to 2 minutes of agent time. `--fake-agent ../evals/agents/fake-agent.mjs` is free. It strips the parent session's environment (session ids, `CLAUDE_ADDITIONAL_DIRECTORIES`) so the nested `claude -p` sees only the host app. In Claude's cloud container the agent also has a built-in `dataviz` skill that Nick's machine may lack, and `create-next-app` 16.3.6 ships an `AGENTS.md` that adds turns.

### In Claude's cloud container

- Playwright is global under `/opt/node22` (`PLAYWRIGHT_MODULE=/opt/node22/lib/node_modules/playwright`), Chromium at `/opt/pw-browsers`. Never run `playwright install` there.
- Headless Chromium never sets `:active` from a CDP touch. Probe pressed states with `CSS.forcePseudoState` or a mouse press inside a touch context. CDP touch drags (`Input.dispatchTouchEvent`) work; `test-agents.grade.mjs` has the pattern.
- A push access request may need Nick's approval. The clone is shallow and single-branch, so a pushed branch has no remote-tracking ref until you fetch it into one (`git fetch origin +refs/heads/<branch>:refs/remotes/origin/<branch>`); a stop hook that checks for unpushed commits reads that ref.

## How the work was run

This held up over steps 5, #10 and #11:
1. **Contract first.** The lead wrote the shared pieces before any agent started: the taste and spec change (through `evolve.md`), the engine (`useDevice`, the dismiss thresholds) and a stub of `useDismissDrag` with its API. Then a brief with file ownership, the rules, and how to verify.
2. **Parallel Sonnet agents**, each owning a few files, in phases: anything that depends on another agent's work (the popover sheet, the toast swipe) waits for the next phase. Only the lead runs `verify` and the generators; agents typecheck, lint and build into their own `--outDir`, and prove touch behaviour with their own Playwright scripts.
3. **Review, then verify each unit alone.** The lead read every diff, then copied that agent's files into a `git worktree` of HEAD (with `node_modules` symlinked) and ran `verify` and `build` there, so other agents' half-written files never leaked in. One commit per unit.
4. **Gate every commit on the checks' exit codes.** Once, a check chain didn't stop on a registry failure and `977e5dd` shipped broken. Also, `grep -c` exits 1 when it finds nothing, so don't chain a "no warnings" count with `&&`.
5. **Measure with the agent test** before and after: the baseline shows what agents hand-build, and the same task after the build shows whether they now compose litt.
