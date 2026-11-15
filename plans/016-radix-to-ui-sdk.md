# Plan 016: The parts move from Radix to UI SDK, one primitive at a time, after a pilot proves it, and nothing a reader sees changes

> **Executor instructions**: Read this plan fully. Run the pilot (phase 0) and STOP with its report: Nick decides go,
> or the Base UI fallback, from it. After a go, work one phase at a time; each ends in a green, committed state. Change
> the primitive under a part, never its look, its props or what a screen reader hears. Do not edit `plans/` except your
> row in `README.md`. Do not start before the Rack bodies (PR #110) are merged.
>
> **Drift check (run first)**:
> `git grep -l "@radix-ui" -- gallery/src | sort` and compare with "Current state". New files are fine (add them to
> the phase that owns their primitive); a missing file means someone moved it already: STOP and report. Then
> `npm view @ui-sdk/react versions --json`: if there is a newer beta or a 1.0, read its changelog and pin that instead.

## Status

- **Priority**: P2 (nothing is broken; Nick chose UI SDK on 2026-11-15, to do after Rack)
- **Effort**: L (11 primitives, about 40 files with Rack's bodies: a pilot, then 4 phases)
- **Risk**: MEDIUM to HIGH (UI SDK is a beta, `0.1.0-beta.1`, first published 2026-11-12; focus, keyboard and overlay
  behaviour live in the primitive; the pilot and the checks below are the guard)
- **Depends on**: PR #110 (Rack) merged
- **Category**: dependencies, motion
- **Planned at**: commit `3e9c537`, 2026-11-15

## Why this matters

Nick, 2026-11-15: "ok we're switching to UI sdk then. after we build it all out first." UI SDK (`@ui-sdk/react`,
Vercel Labs, Apache-2.0) gives litt:

- **Exits and origins built in.** It keeps a closing popup mounted and marks it `data-ending-style` (an opening one
  `data-starting-style`), so an exit is a CSS transition that can be interrupted, and popups open in the top layer.
  litt does this by hand today (`useGrowFrom`, `originOn`, the `AnimatePresence` exits beside `motion/deal.ts`).
- **More parts.** About 55 components to Radix's 30, among them a calendar, a date picker, a colour picker and a tree,
  which litt builds itself today.
- **Every framework.** React, Vue, Svelte, Solid and Web Components from one core, so litt's parts could ship beyond
  React later.
- **An agent bridge.** `createAgent()` with `snapshot()`, `act()` and WebMCP tools, so an agent can read and operate a
  litt app's parts. litt's agent blocks are the first place to use it.
- **One package**, `@ui-sdk/react`, instead of eleven `@radix-ui/react-*`.

The risk is that it is a beta: its README says APIs and behaviour may change before 1.0, some APIs are marked
experimental, and it needs React 19 (the registry's test hosts already run 19.3). Three guards:

1. **Pin the exact version** in `gallery/package.json` and in every registry item's dependencies (`0.1.0-beta.1`,
   never a range), so an update never reaches an installed app unannounced. Each bump is its own changelog release.
2. **A pilot first** (phase 0). If it cannot keep a prop, a key, a screen-reader word or a world's motion, stop.
3. **Base UI is the fallback.** It marks open and exits the same way (`data-open`, `data-starting-style`,
   `data-ending-style`), so the pilot's translations carry over and a fallback costs little.

## Current state

Every Radix import (`git grep -l "@radix-ui" -- gallery/src`, at `3e9c537`, with Rack's bodies):

| Primitive | Files |
|---|---|
| switch | `components/switch.tsx`, `bodies/switch.{flat,device,rack}.tsx` |
| slider | `components/slider.tsx`, `bodies/slider.{flat,device,rack}.tsx` |
| tabs | `components/tabs.tsx`, `bodies/tabs.{flat,device,rack}.tsx` |
| accordion | `components/accordion.tsx` |
| scroll-area | `components/scroll-area.tsx` |
| tooltip | `components/tooltip.tsx` |
| popover | `components/popover.tsx`, `components/hover-card.tsx`, `components/combobox.tsx` |
| select | `components/select.tsx`, `bodies/select.{flat,device,rack}.tsx` |
| dropdown-menu, context-menu | `components/menu.tsx`, `components/context-menu.tsx` |
| dialog | `components/dialog.tsx`, `components/lightbox.tsx`, `components/command-menu.tsx`, `components/app-shell.tsx`, `components/popover.tsx` (its sheet), `gallery/mosaic.tsx` |

Re-run the grep at the start: Rack's bodies may import a primitive this table misses.

Other places that name Radix:
- `gallery/scripts/gen-registry.mjs` allows `--radix-*` custom properties in shipped CSS (`ALLOWED_FOREIGN_VARS`).
- Every component's docblock that says "Built on @radix-ui/…".
- `skills/litt-md/system/components.md` and `workflows/build.md`, wherever they name Radix.

## The approach

The bodies architecture isolates the swap: a part's contract file owns the primitive, its props and its hand, and a
world's body only draws. Where a body renders the primitive's root itself (switch, slider, tabs, select), the root
moves with the body. For each primitive:

1. Map the Radix parts to UI SDK's (its docs for each part: the part names, `data-slot` on every part, the props).
   Keep litt's own props; translate inside the contract.
2. Translate state selectors: `data-[state=checked]` and `data-[state=open]` become `data-checked`, `data-open`,
   `data-selected`, `data-highlighted`, `data-disabled` and so on. Grep each moved file for `data-[state=`,
   `data-state`, `[data-state` and `--radix-` before calling it done.
3. Keep litt's motion. Where a part animates with Motion (`motion/react`), drive it from UI SDK's open lifecycle
   (`data-starting-style`/`data-ending-style`, `onOpenChangeComplete`) and keep each world's motion language
   (`useOverlayMotion`): UI SDK decides when, litt decides how. UI SDK has no Motion guide yet; the pilot settles
   the pattern. Popups open in the top layer, not a body portal: an `OverlayRoot` frame (the Playground's phone) must
   still hold them, which `test:playground` proves. Where a hand-made origin (`useGrowFrom`, `originOn`) only
   reproduces what UI SDK gives, replace it and delete the helper once no part uses it.
4. Nothing a reader sees changes: screenshots of the part's page in every world (Press, Flat, Device, Rack), light and
   dark, match before and after to the pixel, except where a popup lands a pixel differently (report those).

## Phases

Each phase after the pilot: move its primitives, run the checks below, update the changelog (one `changed` line per
item: "built on UI SDK 0.1.0-beta.1; props unchanged"), regenerate the lock, commit.

| Phase | Primitives | Why this order |
|---|---|---|
| 0, the pilot | switch, slider, tabs, tooltip | Three parts with no popup settle the selector translation and the body pattern in all four worlds; the tooltip settles the top layer, `OverlayRoot` and the motion pattern. Also confirm UI SDK has every primitive litt needs (scroll area, context menu, hover card) and list any gap. STOP with a report: what moved cleanly, what did not, any gap. Nick decides go or the Base UI fallback. |
| 1 | accordion, scroll-area | Small and contained. |
| 2 | popover, hover-card, combobox | Positioning and the origin; combobox keeps its own list. |
| 3 | select, menu, context-menu | Keyboard-heavy lists: typeahead, the highlighted row, submenus (Move to). |
| 4 | dialog, lightbox, command-menu, app-shell, popover's sheet, mosaic | Focus traps, the compact sheet, drag to dismiss, `OverlayRoot` frames. Last because the most tests cover it. |

## Checks per phase

```
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
npm run test:motion --prefix gallery
npm run test:focus --prefix gallery
npm run test:forced-colors --prefix gallery
npm run test:playground --prefix gallery
npm run test:gaps --prefix gallery
npm run test:corners --prefix gallery
npm run test:study --prefix gallery
npm run test:wall --prefix gallery
npm run test:registry --prefix gallery -- --app vite
```

`test:registry` for Next.js does not install in the cloud review environment (plans 002, 003 and 015); run it in full
locally before the last phase merges. Once phase 4 is done, add a check to `gen-registry.mjs` that fails when a
shipped file imports `@radix-ui/`, and one that fails when `@ui-sdk/react` is not pinned to an exact version.

## STOP conditions

- The pilot is done: report and wait for Nick.
- A part cannot keep a prop, a key or what a screen reader hears without a change to its API: report the part and the
  gap.
- A world's motion language cannot be kept on UI SDK's open/close lifecycle for a part: report.
- UI SDK lacks a primitive litt uses: report, with Base UI's equivalent.
- Screenshots differ beyond a popup placed a pixel differently.

## Done when

- `git grep -l "@radix-ui" -- gallery/src skills` returns nothing, and `gallery/package.json` has no `@radix-ui/*`.
- The registry's items depend on `@ui-sdk/react` at one pinned version and pass the install test.
- `ALLOWED_FOREIGN_VARS` names UI SDK's variables, not Radix's.
- The docs say "Built on UI SDK", with the pinned version and what a bump means for an installed app.

## Later (not this plan)

- UI SDK at 1.0: re-pin, read the changelog, and drop "beta" from the docs.
- The agent bridge: wire `createAgent` into the Agent block (`gallery/src/blocks/agent.tsx`) and the agent test
  (`evals/agents/`), and measure whether an agent operating litt's parts through it uses fewer calls.
- Other frameworks: once the React parts are on UI SDK, a Vue or Svelte registry becomes a question of bodies, not
  behaviour.
