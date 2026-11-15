# Plan 016: The parts move from Radix to Base UI, one primitive at a time, and nothing a reader sees changes

> **Executor instructions**: Read this plan fully. Work one phase at a time; each phase ends in a green, committed
> state. Change the primitive under a part, never its look, its props or what a screen reader hears. Do not edit
> `plans/` except your row in `README.md`. Do not start before the Rack bodies (PR #110) are merged: they add
> Radix-backed bodies (select, tabs, slider, switch) that this plan must move too.
>
> **Drift check (run first)**:
> `git grep -l "@radix-ui" -- gallery/src | sort` and compare with the list under "Current state". New files are fine
> (add them to the phase that owns their primitive); a missing file means someone moved it already: STOP and report.

## Status

- **Priority**: P2 (nothing is broken; this removes workarounds and follows where shadcn hosts already are)
- **Effort**: L (11 primitives, about 27 files, in 5 phases)
- **Risk**: MEDIUM (focus, keyboard and overlay behaviour live in the primitive; the tests below cover them)
- **Depends on**: PR #110 (Rack) merged
- **Category**: dependencies, motion
- **Planned at**: commit `2331272`, 2026-11-15

## Why this matters

- **shadcn hosts are on Base UI.** `shadcn init` sets up `@base-ui/react` (the registry's install test inits its hosts
  with the `base` preset). litt's registry still pulls eleven `@radix-ui/*` packages into those apps. Moving makes one
  primitive library per host instead of two.
- **Exits and origins are built in.** Base UI keeps a closing popup mounted and marks it `data-ending-style` (and an
  opening one `data-starting-style`), so an exit is a CSS transition that can be interrupted, and it hands every
  popup `--transform-origin` on its trigger. litt does both by hand today (`useGrowFrom`, `originOn` and the
  `AnimatePresence` exits in `motion/deal.ts` and the overlay parts). Emil Kowalski's rules, which litt follows, ask
  for exactly these: transitions over keyframes for UI that can be retriggered, and popovers that scale from their
  trigger.
- **One package.** `@base-ui/react` replaces eleven `@radix-ui/react-*` packages in `gallery/package.json` and in
  every registry item's dependencies.

Not UI SDK (`@ui-sdk/react`): it was first published as `0.1.0-beta.1` on 2026-11-12, its APIs may change before
1.0, and it needs React 19. It shares Base UI's open and exit attributes, so a later move from Base UI to it is small.
Its agent bridge (`createAgent`, WebMCP) is worth a separate experiment on the canvas; see "Later".

## Current state

Every Radix import (`git grep -l "@radix-ui" -- gallery/src`, before PR #110's new bodies):

| Primitive | Files |
|---|---|
| switch | `components/switch.tsx`, `bodies/switch.flat.tsx`, `bodies/switch.device.tsx`, `bodies/switch.rack.tsx` |
| slider | `components/slider.tsx`, `bodies/slider.flat.tsx`, `bodies/slider.device.tsx`, `bodies/slider.rack.tsx` |
| tabs | `components/tabs.tsx`, `bodies/tabs.flat.tsx`, `bodies/tabs.device.tsx` |
| accordion | `components/accordion.tsx` |
| scroll-area | `components/scroll-area.tsx` |
| tooltip | `components/tooltip.tsx` |
| popover | `components/popover.tsx`, `components/hover-card.tsx`, `components/combobox.tsx` |
| select | `components/select.tsx`, `bodies/select.flat.tsx`, `bodies/select.device.tsx` |
| dropdown-menu, context-menu | `components/menu.tsx`, `components/context-menu.tsx` |
| dialog | `components/dialog.tsx`, `components/lightbox.tsx`, `components/command-menu.tsx`, `components/app-shell.tsx`, `components/popover.tsx` (its sheet), `gallery/mosaic.tsx` |

Other places that name Radix:
- `gallery/scripts/gen-registry.mjs:1707` allows `--radix-*` custom properties in shipped CSS
  (`ALLOWED_FOREIGN_VARS`). Base UI's are `--anchor-width`, `--available-height`, `--transform-origin` and the like.
- Every component's docblock that says "Built on @radix-ui/…".
- `skills/litt-md/system/components.md` and `workflows/build.md`, wherever they name Radix.

## The approach

The bodies architecture already isolates the swap: a part's contract file owns the primitive, its props and its
hand, and a world's body only draws. Where a body renders the primitive's root itself (switch, slider, tabs, select),
the root moves with the body. For each primitive:

1. Map the Radix parts to Base UI's (`Switch.Root`/`Switch.Thumb`, `Slider.Root`/`Slider.Thumb`, `Tabs.Root`/
   `Tabs.List`/`Tabs.Tab`/`Tabs.Panel`, `Popover.Root`/`.Trigger`/`.Portal`/`.Positioner`/`.Popup`, `Dialog`,
   `Menu`, `Select`, `Tooltip`, `Accordion`, `ScrollArea`). Keep litt's own props; translate inside the contract.
2. Translate state selectors: `data-[state=checked]` and `data-[state=open]` become Base UI's `data-checked`,
   `data-open`, `data-selected`, `data-highlighted`, `data-disabled` and so on. Grep each moved file for
   `data-[state=`, `data-state`, `[data-state` and `--radix-` before calling it done.
3. Keep litt's motion. Where a part animates with Motion (`motion/react`), keep the popup mounted with Base UI's
   `keepMounted` or render through Motion with the `render` prop, and keep each world's motion language
   (`useOverlayMotion`): Base UI decides when, litt decides how. Where a hand-made origin (`useGrowFrom`, `originOn`)
   only reproduces `--transform-origin`, replace it and delete the helper once no part uses it.
4. Nothing a reader sees changes: screenshots of the part's page in every world, light and dark, match before and
   after to the pixel, except where Base UI places a popup a pixel differently (report those, do not tune them away).

## Phases

Each phase: move its primitives, run the checks below, update the changelog (one `changed` line per item, "built on
Base UI; props unchanged"), regenerate the lock, commit.

| Phase | Primitives | Why this order |
|---|---|---|
| 1, the pilot | switch, slider, tabs | No popups; they settle the selector translation and the body pattern. |
| 2 | accordion, scroll-area, tooltip | Small and contained; tooltip is the first popup, with the skip-delay group. |
| 3 | popover, hover-card, combobox | Positioning and `--transform-origin`; combobox keeps its own list. |
| 4 | select, menu, context-menu | Keyboard-heavy lists: typeahead, the highlighted row, submenus (Move to). |
| 5 | dialog, lightbox, command-menu, app-shell, popover's sheet, mosaic | Focus traps, the compact sheet, drag to dismiss, `OverlayRoot` frames. Last because the most tests cover it. |

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
npm run test:registry --prefix gallery -- --app vite
```

`test:registry` for Next.js does not install in the cloud review environment (plans 002, 003 and 015); run it in
full locally before the last phase merges. Add a check to `gen-registry.mjs` that fails when a shipped file imports
`@radix-ui/` once phase 5 is done.

## STOP conditions

- A part cannot keep a prop, a key or what a screen reader hears without a change to its API: stop and report the
  part and the gap.
- A world's motion language cannot be kept on Base UI's open/close lifecycle for a part: stop and report.
- Screenshots differ beyond a popup placed a pixel differently.

## Done when

- `git grep -l "@radix-ui" -- gallery/src skills` returns nothing, and `gallery/package.json` has no `@radix-ui/*`.
- The registry's items depend on `@base-ui/react` and pass the install test.
- `ALLOWED_FOREIGN_VARS` names Base UI's variables, not Radix's.
- The docs say "Built on Base UI".

## Later (not this plan)

- UI SDK at 1.0: re-read its changelog; if the API settled, a move from Base UI is mostly a rename, since both mark
  open and exits the same way.
- The agent bridge: an experiment on the canvas (`gallery/src/canvas/`) wiring UI SDK's `createAgent` to one agent
  block, to see whether an agent operating litt's parts through it is worth a primitive change.
