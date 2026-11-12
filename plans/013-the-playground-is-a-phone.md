# Plan 013: The Playground is a phone: one small app, worn by each world in turn, with its sheets and toasts inside the frame

> **Executor instructions**: Read this plan fully before starting. It fixes
> the design, the contract and the proof. It has two phases with a commit
> each; do not start phase 2 until phase 1's gate passes. Honour the "STOP
> conditions". When done, update your row in `plans/README.md`, unless a
> reviewer dispatched you and told you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 8aafb09..HEAD -- gallery/src/gallery/pages/19-playground.tsx gallery/src/gallery/motion-panel.tsx gallery/src/gallery/kit.tsx gallery/src/motion/deal.ts gallery/src/motion/index.tsx gallery/src/components/dialog.tsx gallery/src/components/toast.tsx gallery/src/components/menu.tsx gallery/CHANGELOG.md`
> If `19-playground.tsx`, `deal.ts` or `dialog.tsx` changed, compare them with
> "Current state" before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P1 (Nick asked for it)
- **Effort**: L
- **Risk**: MEDIUM (eleven shipped registry items gain one line each; their default behaviour must not change)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `8aafb09`, 2026-11-12

## Why this matters

Nick, 2026-11-12: "I think playground should be a phone where it's an app
using each worlds UI elements to get a feel for it".

Today the Playground (`#playground`) is a card of eight rows, one part per
row, beside the Tune panel. It shows parts, not a product, and it shows them
in whichever world the gallery is in. To feel Press against Flat against
Device you change the whole gallery in the Customize panel and come back.

A phone is the smallest whole product: one hand, one screen, a tab bar, a
sheet, a toast. The same app in each world, a tap apart, is the most direct
way to feel what a world is.

## Current state

- `gallery/src/gallery/pages/19-playground.tsx` (283 lines). `meta` has
  `tune: true` (the one page that may override the locked motion tokens).
  `Sampler` draws eight rows inside `litt-raised rounded-surface`: Button,
  Tooltip, Tabs, Menu, Command menu, Dialog, Toast, List. The page wraps it in
  `<DeviceProvider mode={device}>` and `<Toaster>`, and puts
  `<MotionPanel device={device} onDeviceChange={setDevice} />` in an `aside`
  on the right (320px, sticky at `xl`).
- `gallery/src/gallery/motion-panel.tsx`: the Tune panel. Its Device switch
  (`DEVICES`, line 85; the segmented group at line 212) offers Auto, Phone and
  Desktop and only flips `DeviceProvider`, so "Phone" today means the phone
  paths at the full width of the window.
- `gallery/src/gallery/kit.tsx:329` `AppFrame`: a window onto an app, with
  `phone` (max width `max-w-sm`, `DeviceProvider mode="phone"`), a fixed
  height `h-176`, `role="region"`, an `aria-label`, `tabIndex={0}`, and
  `Framed` around its children so the page keeps one `main` and one `h1`.
- `gallery/src/motion/deal.ts:89` `MaterialProvider` and `useMaterial()`:
  a frame that shows parts in another world sets `data-material` on its
  element (through `lookAttributes` from `gallery/src/gallery/look.ts:228`)
  and wraps its children in `MaterialProvider`. See `ThreeBodiesDemo` in
  `gallery/src/gallery/pages/03-switch.tsx:203`.
- **Every overlay leaves the frame.** Measured on the built gallery at
  1440 by 1000, with the sampler made a 390 by 760 box with a transform and
  the Device switch on Phone:

  | Overlay | Where it landed | Parent |
  |---|---|---|
  | Dialog sheet | 640 wide at the bottom of the window; its layer is 1440 by 1000 at 0,0 | outside the sampler |
  | Toast region | 640 wide at the top of the window | `body` |
  | Command menu | 560 wide at the top of the window | outside the sampler |

  The cause: eleven parts portal to `document.body`. Radix portals in
  `dialog.tsx` (lines 171, 380), `command-menu.tsx` (348), `lightbox.tsx`
  (87), `menu.tsx` (432, 920, and the family table at 91 and 112),
  `context-menu.tsx`, `popover.tsx` (177), `hover-card.tsx`, `select.tsx`,
  `combobox.tsx` (625) and `tooltip.tsx` (186); `createPortal(…,
  document.body)` in `toast.tsx` (194) and `menu.tsx` (483). `tune.tsx` also
  portals, for its dock; leave it alone.
- So an overlay opened from a frame in another world wears the page's world
  (its DOM is under `<html>`, not under the frame's `data-material`), and sits
  on the window, not the frame. A phone needs both fixed.
- Radii on the scale are `--radius-control`, `--radius-surface` and
  `--radius-pill` only. `npm run lint:litt --prefix gallery` fails on anything
  else, and `test:corners` checks that an inner corner is the outer radius
  less the inset.
- Parts that have a body per world today (`gallery/src/components/bodies/`):
  button, card-picker, chart, checkbox, code-input, composer, file-drop,
  input, legend, number-field, option-picker, pagination, segmented, select,
  slide-confirm, slider, sparkline, stat, switch, table, tabs, tag,
  token-input.

## The design

### Phase 1: overlays can open inside a frame

One new pair in the motion engine, beside `MaterialProvider` in
`gallery/src/motion/deal.ts`, exported from `gallery/src/motion/index.tsx`:

```ts
/** Where overlays portal to, for what is inside: a frame that shows an app (a phone, a window) passes the element
 *  its sheets, menus and toasts should open in. Without one they go to document.body, as they always have. The
 *  element must be a containing block for fixed boxes (contain: layout, or a transform), or they still fill the window. */
export function OverlayRoot({ container, children }: { container: HTMLElement | null; children: ReactNode }): ReactElement;
export function useOverlayRoot(): HTMLElement | undefined;
```

- `useOverlayRoot()` returns `undefined` when there is no `OverlayRoot`
  above, or its `container` is still `null`. Radix reads `undefined` as
  `document.body`, so nothing changes for an app that never uses it.
- Every Radix `Portal` in the eleven parts gets `container={useOverlayRoot()}`.
  The two `createPortal` calls use `useOverlayRoot() ?? document.body`.
- No prop is added to any part, and no part's markup changes.
- React context crosses a portal, so a part inside a portalled overlay
  still reads the frame's `MaterialProvider` and `DeviceProvider`. The DOM now
  sits under the frame's `data-material`, so the tokens follow too.

Sizes that read the window (`dvh`, `100vh`, `useVisibleScreen`) are in
`dialog.tsx`, `command-menu.tsx`, `combobox.tsx`, `composer.tsx`,
`motion/device.ts` and `motion/index.tsx`. Do not change them in phase 1.
Phase 2's check tells you whether any overlay outgrows the phone; if one
does, see STOP conditions.

### Phase 2: the phone

**The page.** Left: a world switch, then the phone. Right: the Tune panel, as
today.

```
World  [ Press | Flat | Device ]        Tune
┌──────────────────┐                    ┌───────────┐
│ 9:41             │                    │ presets   │
│ Today        ⌕   │                    │ dials     │
│ ┌──────┐┌──────┐ │                    │ Frame     │
│ │ stat ││ stat │ │                    │ [Phone|   │
│ └──────┘└──────┘ │                    │  Desktop] │
│ ▁▃▅▂▆▇▄  chart   │                    └───────────┘
│ project rows     │
│ [ New project ]  │
│ Today Projects ⚙ │
│       ───        │
└──────────────────┘
```

**The world switch.** A group of three buttons with `aria-pressed`, labelled
"World", built like the Tune panel's segmented groups. It starts on the
gallery's own material (`useCustomize().look.material`) and is page state, so
leaving the page resets it, as every override on the Playground does. It
changes only the frame: the gallery around it stays in its own world.

**The frame.** One component in the page file, `PlayFrame`, used for both
sizes. On its element: `{...lookAttributes({ accent: look.accent, material }, dark)}`,
`role="region"`, an `aria-label` that names the world and the size ("The
studio app in Flat, on a phone"), `tabIndex={0}`, `contain: layout`,
`overflow: hidden`, `bg-canvas`, `text-fg`, `rounded-surface`, the hairline
`outline-1 -outline-offset-1 outline-line`. Inside it, in this order:
`MaterialProvider`, `DeviceProvider`, `OverlayRoot` (the container is a `div`
that is the frame's last child; keep its element in state with a ref
callback), `Toaster`, `Framed`, the app.

- **Phone**: 384px wide (`max-w-sm`, `w-full`, centred), `h-208` (832px) or
  the tallest that fits the window under the gallery's header, whichever is
  smaller; never under 640px. `DeviceProvider mode="phone"`.
- **Desktop**: the column's full width, `h-176`. `DeviceProvider mode="desktop"`.
  It holds today's `Sampler`, unchanged, so the desktop paths (hover tooltips,
  the flyout submenu, the centred dialog) keep a place to be tuned.
- Below `sm` the reader is on a phone already: drop the frame's fixed height,
  hairline and radius and let the app fill the page (`world.tsx`'s
  `usePhone()` shows the query). Hide the Frame switch there.

The frame is drawn in litt's own language, not as a picture of a handset: no
bezel, no notch, no off-scale radius. Two cues make it read as a phone, both
`aria-hidden`: a status row at the top (the time, `9:41`, in the mono caption
size) and a home bar at the bottom (a 4px tall bar, 128px wide,
`rounded-pill`, `bg-fg-subtle`, centred, 8px from the edge).

**The Tune panel.** `MotionPanel`'s Device switch becomes "Frame" with two
choices, Phone (the default) and Desktop. Auto goes: the frame is the device.
Keep the panel's note line, reworded ("The app on a phone" and "The parts on
a desktop").

**The app.** One small studio app, the same in every world, built only from
`@/components/*`, the fixtures in `gallery/src/gallery/fixtures.ts` and
tokens. It lives in a new file, `gallery/src/gallery/play-app.tsx`. It has a
tab bar with three screens. Keep each screen's state in the app, so a world
switch does not reset it.

| Screen | What is on it | Parts |
|---|---|---|
| **Today** | A title row with a search icon button. Two figures side by side, each with a trend. Visits this week. Four projects. One primary button, "New project". | Button, Tooltip (press and hold on the icon), Command menu (at the top edge), Stat, Sparkline, BarChart, ProjectList (its entrance replays when the tab is opened), Dialog (a bottom sheet with an Input and a Switch; confirming it raises a Toast) |
| **Projects** | A filter (All, Live, Drafts). Rows with a tick and a "more" button. | Segmented or Tabs, Checkbox, Tag, Menu (with the "Move to" drill-down) |
| **Settings** | Notifications, volume, theme, a danger row. | Switch, Slider, Select or OptionPicker, NumberField, Slide to confirm |

Rules for the app:

- Every one of today's eight sampler parts appears (Button, Tooltip, Tabs or
  Segmented, Menu, Command menu, Dialog, Toast, List), so each motion dial
  still moves something.
- Prefer parts from the bodies list above, so a world switch changes as much
  as possible.
- One accent fill per screen (R6): "New project" on Today, none on Projects
  and Settings. Nothing above 18px (R8). Nothing moves until touched (R4).
- No landmark and no heading above `h3` inside the frame; the page gives the
  frame its name.
- The tab bar is a `nav`-free group of three buttons with `aria-pressed`
  (or litt's Tabs, if its list can sit at the bottom without a layout shift).
  Each target is at least 44px.
- The copy is the studio's, as the fixtures are (Atelier Nord, litt.design).
  No lorem.

**The page's words.** `meta.lede`: "One small app, in each world. Turn the
dials and it follows." Update `meta.summary` to match. The `id`, `order` and
`tune: true` stay.

## Steps

### Phase 1

1. Add `OverlayRoot` and `useOverlayRoot` to `gallery/src/motion/deal.ts`
   and export both from `gallery/src/motion/index.tsx`.
2. Thread `useOverlayRoot()` into every portal in the eleven parts listed
   under "Current state". Read each file's portals before editing: a part may
   have more than one, and `menu.tsx` shares a family table with
   `context-menu.tsx`.
3. Add one line per changed item to `gallery/CHANGELOG.md`, under today's
   release (one release per date: if a heading for today exists, add to it and
   extend its title). Twelve lines: `motion` (**added** `OverlayRoot` and
   `useOverlayRoot`) and the eleven parts (**changed**: "its overlay opens in
   the nearest `OverlayRoot`, when there is one; otherwise in the page's body,
   as before").
4. Add a short entry for `OverlayRoot` where the engine's exports are
   documented (search `skills/litt-md/system/` for `MaterialProvider` and put
   it beside that).
5. **Gate.** Run:
   ```
   npm run verify --prefix gallery
   npm run build --prefix gallery
   npm run test:focus --prefix gallery
   npm run test:motion --prefix gallery
   npm run test:forced-colors --prefix gallery
   npm run test:registry --prefix gallery -- --app vite
   ```
   All pass. Commit `gallery/registry.lock.json` with the change:
   `gallery: overlays open in the nearest OverlayRoot, when there is one`.

### Phase 2

6. Write `gallery/src/gallery/play-app.tsx` (the app) and rebuild
   `19-playground.tsx` around `PlayFrame`, the world switch and the reworked
   `MotionPanel`. Keep `Sampler` in the page file for the Desktop frame.
7. Add `gallery/scripts/playground.mjs` and
   `"test:playground": "node scripts/playground.mjs"` to
   `gallery/package.json`. Model it on `gallery/scripts/worlds.mjs` (it serves
   the build and drives Chromium). For each of the three worlds, on the phone
   frame at 1440 by 1000:
   - the frame's `data-material` is the world picked, and the `<html>`
     material did not change;
   - open the sheet, raise a toast, open the menu and its drill-down, open
     the command menu, and press and hold the tooltip: each overlay's box is
     inside the frame's box (1px tolerance), and its nearest `[data-material]`
     ancestor is the frame;
   - the three screens each show at most one element filled with the accent;
   - switching the world keeps the screen and its state (a switch turned on
     stays on).
   And once, on the Desktop frame: the dialog and the command menu are inside
   the frame.
   `--self-test` moves the overlay container out of the frame with a script
   before opening the sheet, and fails if the check still passes.
8. Add the check to `.github/workflows/gallery.yml` beside `test:worlds`
   (line 130), with its self-test, in the same job.
9. Update the Playground paragraph in `.claude/CLAUDE.md` (the bullet that
   starts "Every page runs the locked motion") and add a bullet for
   `test:playground` in the same style as its neighbours.
10. Run everything in "Done when". Commit:
    `gallery: the Playground is a phone, one app in each world`.

## Done when

- [ ] `npm run verify --prefix gallery` and `npm run build --prefix gallery` pass.
- [ ] `npm run test:playground --prefix gallery` and its `--self-test` pass.
- [ ] On `#playground` these pass: `test:motion`, `test:reflow`,
      `test:text-zoom`, `test:forced-colors`, `test:focus`, `test:corners`,
      `test:gaps`, `test:wall`, and the axe pass (`gallery/scripts/a11y.mjs`).
- [ ] `test:registry -- --app vite` passes.
- [ ] Screenshots in your report, at device scale 2: the phone on the Today
      screen in each world, light and dark (six); the sheet open in each world
      (three); the Desktop frame (one); the page at 390px wide (one).
- [ ] With no `OverlayRoot` above them, a dialog and a toast on `#dialog` and
      `#toast` land where they did at `8aafb09`: compare a screenshot of each,
      open, under reduced motion, before and after. They are identical.
- [ ] `plans/README.md` row updated.

## STOP conditions

- **An overlay outgrows the phone** (its box passes the frame's, because it
  sizes itself from the window): STOP after phase 1's commit and report which
  part and which unit. Do not rewrite a part's sizing inside this plan.
- **Radix's scroll lock or `aria-hidden` on siblings breaks the page around
  the frame** in a way a reader would notice (the gallery's header jumps, the
  Tune panel cannot be reached after the sheet closes): STOP and report.
- **`test:corners` or `lint:litt` asks for a radius off the scale**: the
  frame keeps `rounded-surface`. Do not add a radius token.
- **`test:wall` fails on the Playground's tile**: report what the wall draws
  for this page today and what it draws now; do not change `test:wall`.
- A part needs a new prop to sit in the app: STOP. The app is built from
  the parts as they ship.
- Anything under `taste/` or `skills/litt-md/assets/tokens.css` would need
  to change: STOP.

## Maintenance notes

- `OverlayRoot` ships in the `motion` registry item, so an app can use it
  too (a preview pane, an embedded widget). It is documented as that, not as a
  gallery trick.
- A new part that portals must read `useOverlayRoot()`. `test:playground`
  only catches the parts the app uses; a lint for the rest ("no `Portal`
  without `container`") would be the durable fix and is not in this plan.
- The world switch is page state on purpose. If Nick later wants the
  Playground to open in the world of a `?look=` link, it already does: the
  switch starts from `useCustomize().look.material`.
- Not in this plan, and worth a look once it is live: three phones side by
  side on a wide screen; a second app per world (the world pages' scenes
  already show each world's own product); recording the phone as a clip for
  litt.design.
