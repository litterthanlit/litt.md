# Plan 014: Inside a frame, a sheet measures the frame, not the window

> **Executor instructions**: Read this plan and plan 013 fully. This plan
> unblocks 013's phase 2, which you then carry out as 013 describes. Honour the
> STOP conditions of both. Do not edit `plans/`; the reviewer maintains the
> index.
>
> **Drift check (run first)**:
> `git diff --stat 9c3b4d0..HEAD -- gallery/src/motion gallery/src/components/dialog.tsx gallery/src/components/command-menu.tsx gallery/src/components/combobox.tsx`
> Expect no output. Otherwise STOP.

## Status

- **Priority**: P1 (blocks plan 013, phase 2)
- **Effort**: S
- **Risk**: MEDIUM (the engine hook that sizes every phone sheet changes; with no frame it must not change at all)
- **Depends on**: 013 phase 1 (commit `9c3b4d0`)
- **Category**: direction
- **Planned at**: commit `9c3b4d0`, 2026-11-13

## Why this matters

Plan 013 stopped at its first STOP condition. With `OverlayRoot` in place a
dialog's bottom sheet opens inside the phone frame in the DOM, but is drawn
192px below the frame's bottom edge (frame y 284 to 1116, sheet y 935 to
1308, window 1440 by 1000), where the frame clips it.

## Current state

- `gallery/src/motion/device.ts:82` `useVisibleScreen(enabled)` returns
  `{ top: visualViewport.offsetTop, height: visualViewport.height }`: the
  window's visible part, so that a sheet rises with the on-screen keyboard.
- Three parts size a layer from it: `dialog.tsx:184` (`SheetLayer`),
  `command-menu.tsx:338` and `combobox.tsx:725`. The gallery's
  `pages/20-composer.tsx:63` uses it too.
- Inside an `OverlayRoot` whose element is a containing block for fixed
  boxes, `fixed inset-0` already resolves to the frame. The px `top` and
  `height` from the window are what push the sheet out.
- `useOverlayRoot()` is in `gallery/src/motion/deal.ts` (plan 013 phase 1).
- The command menu's compact wrapper also carries `h-dvh`
  (`command-menu.tsx`, about line 367), which is the window's height.

## The design

`useVisibleScreen` asks for the nearest overlay root. With one, the visible
screen is the frame: `{ top: 0, height: root.clientHeight }`, kept current
with a `ResizeObserver` on the root. Without one, the code path is exactly
today's.

- The signature does not change. No part changes for the px values.
- Mind the import direction: `device.ts` must not import `deal.ts` if
  `deal.ts` (or anything it imports) imports `device.ts`. If it would make a
  cycle, move the overlay-root context into the file that both can import and
  re-export it from `deal.ts`, so the public names stay where phase 1 put them.
- `h-dvh` in the command menu: inside a root it must not exceed the frame.
  Prefer a fix in the same spirit (the height from `useVisibleScreen` already
  set inline wins where it is set); change a class only if the check below
  shows the wrapper or its panel passing the frame's box. Remember the
  collision rule: no two utilities on one element setting the same property
  under the same variant.
- The menu's right edge sat 4px past the frame in the probe, because Radix
  keeps overlays inside the window, not the frame. `Menu` already takes
  `collisionBoundary`: in 013's phone app, pass the frame's element. No part
  changes for this.

## Steps

1. Change `useVisibleScreen` as above. Update its JSDoc, and the
   `OverlayRoot` JSDoc where it says what a frame gets.
2. Changelog: under today's release (`## 2026-11-13`, a new heading; one
   release per date), a **changed** `motion` line, and a line for each part
   whose file changed, if any. Run `verify`; commit the lock with the change.
3. Prove it with a scratch page or script outside the repo (the probe at
   `/tmp/claude-0/-home-user-litt-md/75a2c136-5212-507a-b33f-e833aa609e66/scratchpad/p013/proto.mjs`
   is a start): in a 384 by 832 frame with `contain: layout` and an
   `OverlayRoot`, phone mode, at 1440 by 1000, the dialog sheet, the command
   menu, a combobox's list and a toast each have their box inside the frame's
   (1px tolerance). The sheet's bottom edge is the frame's bottom edge.
4. Prove nothing moved without a frame: `#dialog`, `#command-menu`,
   `#combobox` and `#composer`, overlay open where there is one, under reduced
   motion, at 1440 by 1000 and at 390 wide in phone emulation: screenshots
   before (`9c3b4d0`) and after are byte-identical.
5. Gate: `verify`, `build`, `test:focus`, `test:motion`,
   `test:forced-colors`. Commit:
   `gallery: inside a frame, a sheet measures the frame`.
6. Carry out plan 013, phase 2 (its steps 6 to 10), with the changelog lines
   under `## 2026-11-13`.

## Done when

- [ ] Steps 3 and 4 hold, with the numbers and the screenshot paths in the report.
- [ ] The gate in step 5 passes.
- [ ] Everything under plan 013's "Done when" holds, except `test:registry`:
      its `vite / all / smoke` step fails on `main` already (plan 015). Run it
      and report that it fails in the same three messages and no others.

## STOP conditions

- The on-screen keyboard path changes without a frame (step 4 differs by a
  byte): STOP.
- An overlay still passes the frame after this change and the fix would
  mean rewriting a part's layout, not its measure: STOP and report the part.
- Plan 013's STOP conditions, all of them.

## Maintenance notes

- A real on-screen keyboard inside a frame is not modelled: the frame's
  height does not shrink when a keyboard opens. That is right for a preview
  frame on a desktop, and wrong for an embedded widget on a real phone. If
  litt is ever embedded that way, intersect the frame's box with the visual
  viewport here.
