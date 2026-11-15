# Plan 017: The parts stand on litt's own hand, with no Radix and no other primitive library, and nothing a reader sees, presses or hears changes

> **Executor instructions**: Read this plan fully. Phase 0 builds the check and changes no part. Phase 1 is a pilot:
> run it and STOP with its report; Nick decides go or stop from it. After a go, work one phase at a time; each ends in
> a green, committed state. Replace what is under a part, never its look, its props, its keys or what a screen reader
> is told. **Today's behaviour, as phase 0 records it, is the spec.** Do not edit `plans/` except your row in
> `README.md`. Do not run plan 016: this plan replaces it.
>
> **Drift check (run first)**:
> `git grep -l "@radix-ui" -- gallery/src | sort` must list the 32 files in "Current state". A new file is fine (add it
> to the phase that owns its primitive). A missing file means someone moved it already: STOP and report. Then
> `git diff --stat 0a795d6..HEAD -- gallery/src/motion gallery/scripts/gen-registry.mjs gallery/scripts/gen-docs.mjs gallery/scripts/test-registry.mjs`
> and, if any changed, compare the excerpts below against the live code before going on.

## Status

- **Priority**: P2 (nothing is broken; Nick chose this on 2026-11-15)
- **Effort**: XL (a check, four engine files, 32 files moved, in six phases)
- **Risk**: HIGH. Focus, keys, dismissal and placement for eleven overlay parts become litt's to keep right, for good.
  The guards are the recorded baseline (phase 0), the pilot (phase 1) and a screen-reader pass by a person (phase 5).
- **Depends on**: none. Replaces 016.
- **Category**: dependencies, accessibility
- **Planned at**: commit `0a795d6`, 2026-11-15

## Why this matters

Nick, 2026-11-15, after comparing Radix, Base UI and UI SDK: "so maybe no library at all is best no? if we cooked so
hard on components. this might be the move no?" and then: "yes drop the library."

- Nick's components repo (`litterthanlit/components`) already works this way. Its `package.json` depends on `next`,
  `react`, `react-dom` and `shiki` only, and its ARIA roles are written by hand.
- 81 of litt's 97 parts already use no primitive library. Sixteen do, through eleven `@radix-ui/react-*` packages.
- After this plan a litt part installs with no behaviour package under it (Motion stays), nothing under it can change
  in a release litt did not make, and its motion needs no `forceMount` workaround.

What it costs: the hard parts of an overlay (keeping focus inside, giving it back, closing in the right order,
staying on screen, typing to find a row) are years of fixes in Radix. litt takes them on. Nick's components repo never
had to: none of its 24 studies opens an overlay.

## Current state

Every Radix import (`git grep -l "@radix-ui" -- gallery/src`, at `0a795d6`): 32 files.

| Primitive | Files |
|---|---|
| dialog | `components/dialog.tsx`, `lightbox.tsx`, `command-menu.tsx`, `app-shell.tsx`, `popover.tsx` (its sheet), `gallery/mosaic.tsx` |
| tooltip | `components/tooltip.tsx` |
| popover | `components/popover.tsx`, `hover-card.tsx`, `combobox.tsx` (which keeps its own list) |
| select | `components/select.tsx`, `bodies/select.{flat,device,plain,rack}.tsx` |
| dropdown-menu, context-menu | `components/menu.tsx`, `context-menu.tsx` |
| switch | `components/switch.tsx`, `bodies/switch.{flat,device,plain,rack}.tsx` |
| tabs | `components/tabs.tsx`, `bodies/tabs.{flat,device,plain,rack}.tsx` |
| slider | `components/slider.tsx`, `bodies/slider.{flat,device,rack}.tsx` |
| accordion, scroll-area | `components/accordion.tsx`, `scroll-area.tsx` |

What those files lean on, counted in `gallery/src`: 69 `data-[state=…]` classes; 38 reads of `--radix-*` variables
(transform origin, available width and height, trigger width); 83 `asChild`; 33 `forceMount`; and these Radix props:
`side`, `align`, `sideOffset`, `alignOffset`, `collisionPadding`, `collisionBoundary`, `avoidCollisions`,
`onOpenAutoFocus` (9), `onCloseAutoFocus` (5), `onEscapeKeyDown` (3), `onPointerDownOutside` (2), `onFocusOutside`
(2), `modal` (3), `dir` (3), `orientation`, `collapsible`, `delayDuration`, `skipDelayDuration`, `onSelect` (7),
`textValue`, `position="popper"` on Select.

What is already litt's and stays: `OverlayRoot`, `useOverlayRoot`, `useVisibleScreen`, `useSheetPresence`
(`motion/device.ts`); `useOverlayMotion`, `originOn`, `useGrowFrom` (`motion/deal.ts`); `useHand`, `useSettle`
(`motion/hand.ts`); the combobox's own listbox; the slider's own drag (it sets `data-no-drag` on Radix's root).

Other places that name Radix:
- `gallery/scripts/gen-registry.mjs`: `ALLOWED_FOREIGN_VARS = [/^--radix-/, /^--tw-/]`; `motionFiles` (line 1450) is
  the hard list of engine files that ship.
- `gallery/scripts/gen-docs.mjs`: `MOTION_ENGINE` (line 68) is the same list, and `radixPart` (line 176) prints
  "Radix Dialog.Trigger props" for a prop type borrowed from Radix.
- `gallery/scripts/test-registry.mjs` (line 30, `--base base|radix`: under a Base UI host the shadcn CLI rewrites a
  written `asChild` into a `render` prop) and `test-registry.smoke.mjs` (seven comments, and one selector,
  `[data-radix-scroll-area-viewport]`, line 1900).
- `gallery/scripts/corners.mjs:257`, `skills/litt-md/scripts/lint-litt.mjs:535` (comments).
- `gallery/CONTRIBUTING.md` (Stack), `skills/litt-md/system/components.md:106`, `skills/litt-md/workflows/build.md:78`,
  and each part's docblock ("Built on @radix-ui/…", "Radix is the accessibility layer").

## Constraints

- No package replaces Radix: not Base UI, UI SDK, Floating UI, React Aria, Ariakit or Headless UI. `motion` stays.
- A part's props, their defaults and their JSDoc do not change, `asChild` included.
- The DOM contract stays: the same roles and ARIA, and the same `data-state`, `data-side`, `data-align`,
  `data-highlighted`, `data-disabled` and `data-orientation` values Radix sets today. So the 69 class strings and the
  page checks that select on them do not move.
- Overlays keep portalling into `useOverlayRoot() ?? document.body`. **Do not use `<dialog>.showModal()` or the
  `popover` attribute**: the browser's top layer ignores its ancestors' boxes, so a sheet would leave the Playground's
  phone, which `test:playground` forbids (plans 013 and 014).
- The engine is the only shared folder that ships (`gen-registry.mjs`: "only src/components, src/blocks and src/motion
  can be shipped"), so the new files live in `gallery/src/motion/` and ship in the `motion` item. Import each from its
  own path (`@/motion/layer`), as `hand.ts` asks, never through `@/motion`.
- New custom properties are set inline by the engine and named without a vendor prefix (below). Follow how
  `--sw-travel` in `switch.tsx` passes the registry's verifier; add no entry to `ALLOWED_FOREIGN_VARS`.
- Write litt's own code. Reading Radix's source to understand an edge case is fine; a function ported from it carries
  Radix's MIT notice above it.
- Repo rules hold: no hex, no off-scale radius, one `changed` changelog line per item touched, the lock committed
  with the change, Nick by name.

## Review focus

The five things most likely to bite a person, each pinned by a scenario in phase 0's check:

1. **Layers inside layers.** A select, a menu or a tooltip inside a dialog; a dialog opened from a menu row. Escape
   closes only the top one, a press in the inner one never closes the outer, and focus goes back down one step at a
   time. Scenarios: `select` and `combobox` pages (each has one inside a dialog), the `team` block, the Playground.
2. **Focus has somewhere to go back to.** The opener was removed, disabled or scrolled away while the layer was open:
   focus lands on a sensible element, never on `<body>`.
3. **Near an edge.** A popup opened at each corner of the window and of the Playground's phone flips and stays inside
   the boundary; `data-side` says where it really is, and the origin follows.
4. **Forms.** Switch, slider and select inside a `<form>`: `FormData` after a change, after `form.reset()`, and with
   `required` unmet, is what it is today.
5. **Touch and direction.** A 500ms hold opens the context menu; a sheet locks the page's scroll and gives it back;
   under `dir="rtl"` the arrow keys of tabs, slider and submenus mirror.

## The approach

### Phase 0. The check, before any part moves

One harness records what each part does today and later proves it still does.

- Create `gallery/scripts/hand.mjs` (`npm run test:hand`, from a build, Playwright found as `a11y.mjs` finds it),
  `gallery/scripts/hand-scenarios.mjs` (the scenarios, as data) and `gallery/scripts/hand-baseline/<page>.json`.
- A scenario is a page, a viewport (1440 by 900, or a 390 by 844 touch phone) and steps (`press`, `click`, `hover`,
  `hold`, `type`, `wait`). After every step it records a **trace**:
  - `focus`: the focused element's role and accessible name, or `"body"`.
  - `layers`: each open layer's role, name, `data-side`, `data-align` and box, rounded to whole px.
  - `opener`: `aria-expanded`, `aria-haspopup`, and whether `aria-controls` and `aria-describedby` resolve.
  - `outsideHidden`: whether the page behind is out of the accessibility tree. `scrollLocked`: whether it can scroll.
  - `aria`: `locator.ariaSnapshot()` of `body`. `form`: the `FormData` entries, where the scenario has a form.
  - Never an element id: Radix's and React's differ.
- Modes: `--record` writes the baselines; the default compares and exits 1 on a difference, printing page, step and
  field (a layer's box may differ by 1px, nothing else may); `--shots <dir>` also saves a picture at each step, under
  every material `look.ts` lists, light and dark; `--compare <a> <b>` lists the pictures that differ; `--only <page>`.
- `--self-test` injects two breaks and fails if the check passes either: Escape swallowed in the capture phase
  (nothing closes), and focus sent to `<body>` 50ms after a layer opens.
- Scenarios, at least:

| Part | Steps to record |
|---|---|
| dialog, lightbox, command-menu, app-shell drawer, mosaic | open by click and by Enter; Tab and Shift+Tab around the ends; Escape; press outside; focus after each close; the same on the phone as a sheet |
| tooltip | hover past the 200ms delay; a second trigger inside the skip window; keyboard focus; Escape; hold 500ms on touch |
| popover, hover-card | open; Tab out; Escape; press outside; at each corner of the window; the phone sheet |
| select | Space, Enter and ArrowDown open; arrows, Home, End; typeahead open and closed; a disabled option; Enter, Escape, Tab; press, drag and release on a row; the form |
| menu, context-menu | open; arrows; typeahead; ArrowRight and ArrowLeft through "Move to"; checkbox and radio rows; Escape from a submenu; right click at each corner; the hold on touch |
| combobox | the scenarios in components.md's Combobox section, alone and inside the dialog |
| switch, tabs, accordion, slider | Space or Enter; arrows, Home, End, Page keys; `dir="rtl"`; a disabled one; the form |
| scroll-area | Tab to the viewport; arrow and Page keys; drag the thumb; press the track; the thumb's box at the start, the middle and the end |
| nested | the five in Review focus |

- Record at `0a795d6` with Radix. Run the compare twice more: three identical runs, or fix the flaky step (a fixed
  `wait`, never a retry). Commit the baselines.
- Add a "Hand" job to the page-check matrix in `.github/workflows/gallery.yml` (`test:hand`, then its `--self-test`).
  The matrix is balanced to about three minutes a job (#113): give `hand.mjs` a `--shard i/n` like `a11y.mjs` and
  split it if it runs longer. Add a bullet for `test:hand` to `.claude/CLAUDE.md` in the style of its neighbours.

**Done when**: `npm run build --prefix gallery && npm run test:hand --prefix gallery` exits 0 three times running, and
`-- --self-test` exits 0.

### The engine: four files in `gallery/src/motion/`

Add each to `motionFiles` (`gen-registry.mjs`) and `MOTION_ENGINE` (`gen-docs.mjs`) when it is created, and a `motion`
line to the changelog. Before writing one, look for what litt already has (`tree.tsx`, `action-bar.tsx`, `command-menu.tsx`
and `combobox.tsx` move through rows with the arrow keys; `table-filter.tsx` has a typeahead) and lift it.

`slot.tsx` (phase 1):
```ts
/** Renders its one child with these props merged on: classes joined, styles merged, handlers run child first, refs joined. */
export function Slot(props: { children: ReactElement } & HTMLAttributes<HTMLElement>): ReactElement;
export function composeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T>;
/** A value that is the caller's when `value` is given, else the part's own. */
export function useControllable<T>(o: { value?: T; defaultValue: T; onChange?: (v: T) => void }): [T, (v: T) => void];
```

`layer.tsx` (phase 1):
```ts
export function Portal(props: { children: ReactNode }): ReactPortal | null; // into useOverlayRoot() ?? document.body
export type DismissReason = "escape" | "outside" | "focus-outside";
export type LayerOptions = {
  open: boolean;
  modal?: boolean;                 // true: the rest is inert, focus is kept inside and the page's scroll is locked
  onDismiss: (reason: DismissReason) => void;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;        // preventDefault() keeps it open, as today
  onPointerDownOutside?: (e: PointerEvent) => void;
  onFocusOutside?: (e: FocusEvent) => void;
  onOpenAutoFocus?: (e: Event) => void;                // preventDefault() and focus something else, as today
  onCloseAutoFocus?: (e: Event) => void;
};
/** Registers the element as a layer. Returns the props to spread on it. */
export function useLayer<T extends HTMLElement>(ref: RefObject<T | null>, o: LayerOptions): HTMLAttributes<T>;
```
Rules it keeps: one stack of open layers; Escape and an outside press go to the top layer only; a layer opened from
inside another is that layer's child (through React context, since a portal breaks DOM containment) and counts as
inside all its parents; a modal layer sets `inert` on everything outside its own path within the overlay root, and
undoes exactly what it set; focus returns to the opener, or to the nearest focusable ancestor of where it was.
**While both kinds of layer exist**, a Radix layer opened later counts as inside too: one function,
`isForeignLayer(node)`, matching Radix's portal markers (read them from the DOM; `[data-radix-popper-content-wrapper]`
is one). It is deleted in phase 5.

`anchor.ts` (phase 1):
```ts
export type Side = "top" | "right" | "bottom" | "left";
export type Align = "start" | "center" | "end";
export type AnchorOptions = { side: Side; align: Align; sideOffset?: number; alignOffset?: number; collisionPadding?: number; flip?: boolean };
export type Placement = { side: Side; align: Align; x: number; y: number; origin: string; roomW: number; roomH: number; anchorW: number; anchorH: number };
/** Pure. `bounds` is the overlay root's box or the window's. Whole px. */
export function place(anchor: Box, panel: { width: number; height: number }, bounds: Box, o: AnchorOptions): Placement;
/** Measures and places, again on scroll (captured), resize and a size change of either. `anchor` is an element or a point's box (the context menu). */
export function useAnchor(anchor: RefObject<Element | null> | Box, panel: RefObject<HTMLElement | null>, open: boolean, o: AnchorOptions): Placement | null;
```
The part writes the placement inline: `translate`, `data-side`, `data-align`, and four variables that replace
Radix's: `--pop-origin` (for every `--radix-*-content-transform-origin`), `--pop-room-w` and `--pop-room-h` (available
width and height), `--pop-anchor-w` (trigger width). `gallery/scripts/test-anchor.mjs` (`npm run test:anchor`, in
`verify`, loaded as `test-rules.mjs` loads `rules.ts`) pins `place`: it fits on the asked side; no room there, it
flips; no room on either, it takes the roomier side and clamps; `start` and `end` stay `collisionPadding` inside the
bounds; the bounds are a 390 by 844 frame at an offset, not the window; a point anchor of zero size.

`keys.ts` (phase 3):
```ts
/** The next item that is not disabled, from `from` in `step`'s direction; -1 when there is none. */
export function nextEnabled(items: HTMLElement[], from: number, step: 1 | -1, loop: boolean): number;
export function useRoving(o: { orientation: "horizontal" | "vertical"; loop: boolean; dir?: "ltr" | "rtl" }): { onKeyDown: KeyboardEventHandler };
/** Typed letters find a row: the buffer clears after 1s, and one letter typed again walks the rows that start with it. */
export function useTypeahead(labels: () => string[], onMatch: (index: number) => void): { onKeyDown: KeyboardEventHandler };
```

### Order: containers first, then what opens inside them

A Radix dialog holds focus inside itself with its own stack, which a litt layer cannot join, so a litt select inside a
Radix dialog would lose focus on every key (expected from how Radix nests its own layers; the pilot's nested scenarios
prove it either way). A litt dialog holding a Radix select is fixable in litt's code (`isForeignLayer`). So every part
on `@radix-ui/react-dialog` moves before any part that takes focus inside one.

| Phase | Moves | Adds | Why here |
|---|---|---|---|
| 0 | nothing | `test:hand`, baselines | The spec, recorded |
| 1, the pilot | `dialog.tsx`, `tooltip.tsx` | `slot.tsx`, `layer.tsx`, `anchor.ts`, `test:anchor` | The two unknowns: a modal layer in a frame with Radix parts inside it, and placement. STOP with a report |
| 2 | `lightbox.tsx`, `command-menu.tsx`, `app-shell.tsx`, `gallery/mosaic.tsx`, `popover.tsx`, `hover-card.tsx`, `combobox.tsx` | | The other containers, then the anchored panels |
| 3 | `select.tsx` and 4 bodies, `menu.tsx`, `context-menu.tsx` | `keys.ts` | Lists: typeahead, submenus, the hidden native field |
| 4 | `switch.tsx` and 4 bodies, `tabs.tsx` and 4 bodies, `accordion.tsx`, `slider.tsx` and 3 bodies, `scroll-area.tsx` | | No popup. Lowest risk; may run before phase 2 if Nick wants an early win |
| 5 | docs, scripts, `package.json` | the guard | Remove, forbid, hand to a person |

For each part:
- [ ] Replace the Radix parts with elements and the engine. Where a body renders the primitive's root (switch,
      slider, tabs, select), the contract resolves the root's props once and the body spreads them on its own
      element; the body's prop type names the element, not Radix.
- [ ] Drop `forceMount`: nothing unmounts on its own now, so `AnimatePresence` decides. Keep each world's motion
      (`useOverlayMotion`, `useExit`, `useGrowFrom`).
- [ ] Replace each `--radix-*` read with the `--pop-*` variable above. Then
      `git grep -nE "radix|forceMount" -- <the files moved>` returns nothing, docblock included.
- [ ] `npm run build --prefix gallery && npm run test:hand --prefix gallery -- --only <page>` exits 0.
- [ ] Pictures: `--shots` at the phase's first commit and again now, then `--compare`. Closed states are identical.
      For open states report how many differ and the largest box offset in the traces (at most 1px).
- [ ] Remove an `@radix-ui/*` package from `gallery/package.json` in the commit that removes its last import.
- [ ] Changelog, one line per item: "**changed** `dialog`: its focus, keys and dismissal are litt's own; it no longer
      needs `@radix-ui/react-dialog`. Props are unchanged; reinstall, then remove the package if nothing else in your
      app uses it." Run verify, commit the lock with it.

Notes per part:
- **Dialog and its kin**: `role="dialog"`, `aria-modal`, `aria-labelledby` and `aria-describedby` from `useId`; the
  compact sheet and drag to dismiss are already litt's.
- **Tooltip**: the 200ms intent, the 300ms skip window and the touch hold are already litt's (`SharedClock`). Add:
  open on focus, close on Escape and on a press of the trigger, `aria-describedby`, and a pointer may travel from
  the trigger onto the tip without closing it (WCAG 1.4.13).
- **Select**: the trigger is `role="combobox"`; the list `role="listbox"` with `role="option"` rows; a hidden native
  `<select>` carries `name`, `required`, autofill and `form.reset()`; typing on the closed trigger changes the value.
- **Menu and context menu**: a submenu stays open while the pointer crosses toward it; `onSelect` and
  `preventDefault()` on it keep the menu open, as today; the context menu's anchor is the pointer's box.
- **Switch, slider**: a hidden `<input>` per value for the form. The slider keeps its own drag; it needs only
  `role="slider"` thumbs, their keys and `aria-value*`.
- **Scroll area**: scrolling stays native. The thumb's size and place come from the viewport's scroll metrics and a
  `ResizeObserver`; dragging it uses `useHand`.

### Phase 5. Remove, forbid, hand to a person

- [ ] `gallery/package.json` has no `@radix-ui/*`; `package-lock.json` regenerated with `npm install --prefix gallery`.
- [ ] Delete `isForeignLayer`. `git grep -n "radix" -- gallery/src` returns nothing.
- [ ] `gen-registry.mjs`: drop `/^--radix-/` from `ALLOWED_FOREIGN_VARS`; the verifier fails when a shipped file
      imports from `@radix-ui/`, `@base-ui/`, `@ui-sdk/`, `@floating-ui/`, `@headlessui/`, `react-aria` or
      `@ariakit/` (one list, `PRIMITIVE_LIBS`), with a self-test fixture beside the lint's.
- [ ] `gen-docs.mjs`: delete `radixPart`; a borrowed prop type now reads "Every `<button>` attribute" and the like.
      Check three docs pages by eye (`#dialog`, `#tabs`, `#select`).
- [ ] `test-registry.smoke.mjs`: replace `[data-radix-scroll-area-viewport]` and correct the seven comments.
      `corners.mjs:257` and `lint-litt.mjs:535`: correct the comments.
- [ ] `gallery/CONTRIBUTING.md` (Stack: "roles, focus and keys come from the engine in `src/motion`: `layer`,
      `anchor`, `keys`, `slot`; install no primitive library"), `components.md:106` ("the roles", not "the Radix
      roles"), `workflows/build.md:78` if it lists the packages an install adds. Not `taste/`.
- [ ] `.claude/CLAUDE.md`: a bullet for the engine's four files and the guard.
- [ ] A person with a screen reader runs the list below. The executor cannot; report it as open until Nick says done.

Screen-reader pass (VoiceOver on a Mac and on an iPhone; NVDA if at hand), on `#dialog`, `#select`, `#menu`,
`#combobox`, `#tooltip` and the Playground: open each with the keyboard and hear its name and role; move through it
and hear each row, its state and its place in the list; close it and hear where focus is; on the phone, swipe through
an open sheet and never reach the page behind it.

## Checks per phase

```
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
for t in hand motion focus forced-colors gaps corners reflow text-zoom playground study wall worlds; do npm run test:$t --prefix gallery || break; done
npm run test:a11y --prefix gallery
npm run test:registry --prefix gallery -- --app vite
npm run test:registry --prefix gallery -- --app vite --base base
```

The Next.js install test does not install in the cloud review environment (plans 002, 003 and 015): run
`test:registry` in full on a laptop before phase 5 merges. `test:agents` costs money: ask Nick before running it, once,
after phase 5 (the build workflow's wording changed).

## STOP conditions

- The pilot is done: report what matched the baseline, every trace that did not and why, the picture counts, and how
  the nested scenarios behaved with Radix parts inside the new dialog. Wait for Nick.
- A trace differs and the cause is not a 1px box: do not edit the baseline to pass. Fix the part, or report it. The
  one exception is a place where today's behaviour is a Radix bug litt would not keep; report it and let Nick decide.
- A part cannot keep a prop, a key or a role without an API change: report the part and the gap.
- `test:registry -- --base base` fails because the shadcn CLI rewrote litt's own `asChild` into `render`: report.
  The fix is a choice about the public prop, which is Nick's.
- `test:playground` fails on containment: something reached for the top layer or the window. Do not relax the check.
- After two full attempts a part still fails its scenarios: stop on that part, leave it on Radix, report, and go on
  with parts that do not depend on it. A plan that ends with one part still on Radix is a result Nick can judge.

## Done when

- `git grep -l "@radix-ui" -- gallery skills` returns only `gallery/CHANGELOG.md`, and no registry item lists a
  primitive package in its `dependencies`.
- `test:hand` passes against the baselines recorded in phase 0, with none edited to pass.
- The guard fails on a fixture that imports `@radix-ui/react-dialog`.
- Nick has confirmed the screen-reader pass.

## Later (not this plan)

- CSS anchor positioning in place of `useAnchor`'s measuring, once every browser litt supports has it. `place` stays
  as the test's oracle.
- The same engine under the studies in `litterthanlit/components`, so both repos share one hand.
