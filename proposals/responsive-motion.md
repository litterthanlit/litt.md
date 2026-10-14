# Responsive motion: a draft for Nick to decide

Status: draft. Nothing here is built, and nothing in `skills/` has changed. Motion is a Fixed decision (`evolve.md` section 5), so every choice below is yours. Each row says what it costs.

How the audit was done: the gallery from this branch (main at 26bf788), built to `.agent-dist/spec`, driven in headless Chromium at 390 by 844 with `hasTouch` and `isMobile`, and at 1440 by 900 for comparison. Numbers come from sampling `getComputedStyle` on every animation frame, plus screenshots. Anything marked "not measured" needs a real phone: headless Chromium has no on-screen keyboard, no safe-area inset, and did not set `:active` under emulated touch.

## 1. Why

You want motion that adapts to the device. Today it does not. Every overlay moves the same on a 390px phone as on a 1440px desktop, a centered dialog floats in the middle of a phone, and the spec says nothing about phones beyond the toast's position and hiding the header nav. Three different signals are already in use: the 640 breakpoint (`sm:`), `pointer-coarse:` for 44px targets and 16px inputs, and `(hover: none)` in the toast alone. The audit also found things that are simply broken at 390. A phone needs a bottom sheet you can swipe away, menus that fit, and no motion that waits for a hover.

## 2. Today

| Component | Desktop (1440) | Phone today (390, touch) | Problem |
|---|---|---|---|
| Dialog | 480 wide, centered. Rises `--travel` (16px) from scale 0.98 on the expressive spring, about 0.4s. Exit: 8px down, 263ms ease-out. | Same panel, 358 by 408, centered in 390 by 844 with 16px gutters. Same motion. Focus lands on the first field. A 360px swipe does nothing. A scrim tap closes. The close button is 32px. | A desktop modal floating mid-screen. No gesture, a small close target, and the keyboard will open during the entrance (`pickFocus` in `dialog.tsx`). |
| Dialog, `side="right"` | 400 by 900 at the right edge. Fades in with a 16px nudge on x. | 368 wide at x 32 to 400, so 10px is off-screen at 390 (25px at 375, 40px at 360; it fits from 414). Right padding shrinks from 24px to about 14px. | Clipped on the common phone widths. Likely cause: the percentage max-width resolves against a 400px grid track. |
| Menu | 240 wide, rows 44px. Grows from the trigger corner: scale 0.98, 4px nudge, responsive spring. | Identical. It opened above the trigger because only 285px lay below. Shortcut hints (⌘D) show. The "Move to" submenu opens on tap, flips left and lands at x -154 to 86: 154 of its 240px are off-screen. | Submenus cannot be used at 390. Key hints mean nothing on touch. |
| Popover | 384 wide, grows from the trigger corner. | 374 wide (clamped to 8px margins), same motion, at y 578 to 764. | Works, but it is a near-full-width card low on the screen, where the keyboard will cover it once a field takes focus (not measured). |
| Command menu | 560 by 445, 135px from the top. Drops 8px, responsive tier. | 358 by 445 at y 127 (15vh). The field takes focus at once. Hints (↵, esc, ⌘,) show. | The keyboard likely covers the lower rows (not measured). Hints mean nothing on touch. Sized in `vh`, not `dvh`. |
| Toast | 360 by 72, bottom right, 24px in. Arrives 16px from below; leaves 16px to the right. | 358 by 72, 16px from the edges and bottom. Same motion, so it slides right though it is centered. A 200px swipe does nothing. Three toasts stack to 88px, and a tap pins them open at 232px. | No swipe. The close button is 32px. The toast layer (z 60) sits over a sheet's footer (z 50). |
| Tooltip | Opens after 200ms of hover (212ms measured). Grows from the trigger. | Radix never opens on touch, so litt adds tap: it opens within about 80ms and is still open 4.9s later. It shows a ⇧⌘C chip. | Nothing stops the click, so one tap runs the action and leaves a label behind. A key chip on touch. |
| Header | Inline nav, hover fill. | Nav behind a 44px button. It opens the Menu: 240px, anchored under the button. Sticky at the safe-area inset. | None found. |
| Tabs | Panel cross-fades: 8px in, 4px out. | Identical. A four-tab underline list overflows (348px in 294px) and scrolls. Segmented tabs at size sm are 28px tall. | A 28px target on touch. |
| Segmented | 32px track, 24px segments. | The track grows to 44px on coarse pointers, segments to 36px. The selected surface glides on the responsive tier. | Fine. 36px is under 44. |
| List and table rows | A 4% fill on hover. | Nothing. A row held for 250ms keeps its background. Hover utilities sit inside `@media (hover: hover)`, and rows have no `:active`. | Dead taps. |

Also found:
- Button press scales through the `scale` property, but its `transition-property` lists `transform` (computed: `background-color, color, transform`). The press snaps to 0.98 at the first sample instead of tweening.
- The gallery's `index.html` sets `viewport-fit=cover`. The Vite starter's does not (checked in `create-vite`), so `env(safe-area-inset-bottom)` reads 0 in a stock host app.
- There is no `useDevice()`. The motion engine reads tokens once per mount (`readLocked` is memoized on reduced motion only), so a media override of `--travel` would not follow a rotation.

## 3. Decisions for Nick

| # | Decision | Options | Recommendation | Why, and what it costs | Accessibility |
|---|---|---|---|---|---|
| 1 | Where the line sits | A: width only (compact is under 640). B: coarse pointer only. C: both, as two flags. | **C.** `compact` for presentation, `coarse` for input. | The code already splits this way: 640 drives layout, `pointer-coarse` drives targets. One flag misreads a landscape phone (844 wide, coarse) or a narrow desktop window. Cost: two flags; the toast's `(hover: none)` folds into `coarse`. | Coarse also drives 44px targets. |
| 2 | The phone sheet: tier and movement | A: expressive, rises by its own height. B: expressive, 16px rise and fade (the dialog today). C: responsive, rises by its own height. | **A.** | On a phone the sheet is the dialog, so it stays the view's one expressive moment. It must come from the edge it is dragged back to; B would fade in, then fly off when swiped. C covers about 450px in 200ms, which is abrupt. Cost: the first thing in litt to travel further than `--travel`. You grant the exception. It is transform only. | Reduced motion: it appears in place. WCAG 2.3.3 counts moving into place as motion. |
| 3 | May a sheet bounce on entry | A: no. B: the expressive spring as it is (0.12), never on release or dismiss. C: bounce scaled to flick speed. | **B.** | The token's own curve peaks at 1.0012, about half a pixel on a 450px sheet, so it reads as a soft settle. C breaks the 0.12 ceiling. Cost: 24px (`--space-6`) of sheet hidden below the edge, so an overshoot or a pull never shows a gap. | None to add. |
| 4 | Drag to dismiss | A: off. B: from the grabber and title only. C: from anywhere, with guards. | **C**, with two new tokens: `--dismiss-distance` 0.25 (of height) and `--dismiss-velocity` 0.4 (px per ms). | These are Vaul's tested constants (25%, 0.4px/ms; it ignores drags in the first 500ms and in scrolled content), not invented ones. Thumbs swipe anywhere, and the phone-settings task asks for it. Cost: the biggest item (L): scroll conflicts, sliders, and real-device tuning. B is cheaper but misses where thumbs go. | WCAG 2.5.7 and 2.5.1: a 44px close button, a scrim tap and Esc always work. Apple advises an explicit close even when swipe is on. The grabber is decoration. |
| 5 | Detents, and the right-hand sheet | A: one height; `side="right"` becomes the same sheet. B: medium and large detents. C: keep a right-edge panel on phones. | **A.** | Detents add a second drag target and a grabber that must act as a button. A right panel at 390 leaves a 32px strip and overshoots today. Cost: no half-height sheets, and `side` only places the panel on desktop. Detents can come later as translateY of a full-height panel, never as height. | A grabber that toggles states (Material does this) is deferred with detents. |
| 6 | Menus, popovers and the header nav | A: all anchored (fix the submenu). B: menus anchored, popovers become sheets, submenus replace the list in place. C: all sheets. | **B.** | Menu rows are already 44px and sit beside the finger. Popovers hold fields and pickers: wide, tall and under the keyboard. The submenu is unusable at 390 today. The header nav stays the anchored menu: four to six short links. Vercel, Stripe and Linear use a full-screen nav on their sites, but it opens into grouped sections; litt's header has four to six links. Cost: Popover needs a second render path (M), Menu a drill-down (M). | A sheet is a modal dialog: trap, return focus. The submenu's Back row is a real menu item. Arrow keys are unchanged. |
| 7 | Command menu | A: unchanged. B: top edge, same responsive motion, list follows the visible screen, a Cancel button, no hints. C: full screen. | **B.** | Today it spans y 127 to 572 and the keyboard opens at once. Full screen loses the page behind a short list. Cost: tracking the visual viewport (M). | The combobox pattern is unchanged. Cancel gives touch what Esc gives a keyboard. |
| 8 | Select on touch (forms step) | A: native `<select>` on coarse, litt listbox on fine. B: a litt sheet with 44px rows. C: litt listbox everywhere. | **A for now.** Revisit after the settings-form baseline. | The OS picker is accessible and free. B is on-brand but is a full listbox plus the sheet. Cost: the iOS wheel breaks the look. | Native is the best baseline. |
| 9 | Hover-only motion on touch | A: as today (tap opens the tooltip). B: a tooltip opens on a 500ms press and hold; chips and key hints hide on coarse. C: no tooltips on touch; icon buttons need visible labels. | **B.** | Today one tap runs the action and leaves a label behind. B keeps the touch-parity rule (CONTRIBUTING, rule 2). Cost: the hold must beat the OS callout, and discovery is lower. | `aria-label` still names the button. |
| 10 | Press feedback on touch | A: Button only (today). B: rows fill when pressed (fg 6%, instant, color only); Button keeps its scale. C: scale rows too. | **B.** | Rows show nothing when held. A fill stays inside the instant tier. C moves boxes, and a state change never moves the box. Cost: S, plus `-webkit-tap-highlight-color` so the OS flash does not double. Fix the Button snap in the same pass. Needs a real-device check. | Reduced motion keeps the fill, and the scale is already 1. |
| 11 | Travel on compact screens | A: `--travel` unchanged. B: smaller on compact. C: larger. | **A.** | One number and one Playground dial. Menus and tooltips use 4px anyway. B needs the engine to re-read tokens on rotation. Cost: none. | None. |
| 12 | Glass on phone sheets | A: glass as on desktop. B: solid on compact. C: glass at rest, solid while dragging. | **A, behind a frame-time check.** | A sheet floats, so glass is earned (P3). C animates material (P5). Risk: the blur sits on `::before` of a moving element, so a tall sheet re-blurs every drag frame (not measured). If a mid-range Android drops below 60fps, switch to B. Cost: one class. | Reduced transparency already makes glass solid. |
| 13 | Initial focus on touch | A: the first field (today). B: the panel; `data-autofocus` opts a field in. | **B.** | Today the keyboard opens during the 0.4s entrance and covers the footer. The command menu keeps its field focused: typing is the point. Cost: one more tap in forms. | APG allows focus on a static element. Trap and return focus are unchanged. |
| 14 | Toast on phones | A: unchanged. B: swipe sideways to dismiss, leave downward on timeout, 44px close. C: top placement. | **B.** | It already leaves sideways, so a swipe matches. At 390 it is centered, so sliding right makes no sense. It reuses the two tokens from row 4. Cost: S to M. | The close button stays. Live regions are unchanged. |

Not decided here: a toast that fires while a sheet is open (today it covers the sheet's buttons), landscape phones (compact is false, so they keep the centered dialog), and iPad portrait (also not compact, but coarse).

## 4. Proposed spec text

Written for the recommended options. Paste after you decide. New tokens live in `tokens.css`, and nothing here is a hex value.

### foundations.md

In section 5, under Stagger and travel, add:

```markdown
- **Dismissal.** `--dismiss-distance` (0.25, a fraction of the surface's height or width) and `--dismiss-velocity` (0.4, pixels per millisecond) decide whether a released drag leaves or springs back. They are thresholds, not durations, so reduced motion does not change them.
```

Add a new section after Motion, and renumber Accessibility floor to 7 (and the Contents list):

```markdown
## 6. Motion on touch and small screens

A phone changes how things are reached, not how litt moves. The tiers, tokens and rules in section 5 hold on every screen. This section adds two device signals and a short list of what changes with them.

**Two signals.** `compact` is a viewport narrower than 640 (`40rem`, the break the layout already uses). `coarse` is a primary pointer that is coarse: a finger. They are separate. A landscape phone is coarse and not compact. A narrow desktop window is compact and not coarse. In CSS use `max-sm:` and `pointer-coarse:`. In React use `useDevice()`, which returns both and is false on the server. Never read the user agent.

**Compact screens.**
- A modal becomes a bottom sheet. It rises from the bottom edge by its own height on the expressive tier, so it stays the view's one expressive moment. It moves by transform only. Its height never animates. It has one height: its content, up to the visible screen less `--space-6`.
- Nothing else travels further than `--travel`. The sheet is the one exception, because it must come from the edge it is dragged back to.
- A menu stays beside its button. A popover becomes a sheet. The command menu moves to the top edge and follows the visible screen, so the keyboard never covers a row.

**Dragging.** While a finger is down, the surface follows it one to one, with no easing. On release:
- It leaves if it has travelled `--dismiss-distance` of its size, or moves faster than `--dismiss-velocity`. It carries on from where it is, on the exit token for its tier.
- Otherwise it springs back on the responsive tier with the speed it was released at. It never bounces.
- Pulled past rest it resists and stops at `--space-6`. A sheet hides that much below the screen edge, so no gap shows.
- A drag cannot start in a slider, in a region marked `data-no-drag`, or in a scrolling region that is not at its top. Drags are ignored for 500ms after the sheet opens.

**A gesture is never the only way.** Every swipe has a visible button (a close button, 44px on coarse screens). Esc and a tap on the scrim also close. The grabber is decoration and is hidden from assistive tech.

**Touch has no hover.** Nothing depends on it.
- A pressed row fills like a hovered row (`:active` on coarse screens, instant tier, color only). Buttons keep the press scale.
- A tooltip opens on a 500ms press and hold, not on a tap, so a tap only does its action. Shortcut chips and key hints are hidden on coarse screens.

**Focus.** On coarse screens focus lands on the panel, so the keyboard does not open under a sheet that is still moving. Mark a field `data-autofocus` when typing is the point.

**Reduced motion and transparency.** A sheet appears in place with no slide. A drag still follows the finger, and the release is instant. Glass turns solid, as everywhere.
```

### components.md

Append to **Modal**:

```markdown
- **On compact screens** it is a bottom sheet. `side="right"` becomes the same sheet, so no strip of page is left at the edge. It is glass, flush with the bottom, with `--radius-surface` on the top corners only, and it pads its footer by the safe-area inset. A 32px by 4px grabber in `--line-strong` sits at the top centre. The body scrolls inside, with `overscroll-behavior: contain`.
- **Motion on compact:** it is still the view's expressive moment. It rises by its own height, by transform only, and may bounce as the token allows (`--ease-expressive` peaks at 1.0012, about half a pixel on a 450px sheet). It leaves the same way on `--dur-exit-expressive` with `--ease-out`.
- **Drag and buttons:** it can be dragged down from anywhere that follows the rules in Foundations section 6. The close button is 44px on coarse screens. Cancel, Esc and a scrim tap also close it.
```

Append to **Popover and dropdown**:

```markdown
- **On compact screens** a popover becomes a bottom sheet (see Modal), because it holds fields and pickers that need the width and a place above the keyboard. A dropdown menu stays anchored: its rows are already 44px and the finger is beside it.
- **Submenus on compact screens** do not fly out sideways. The submenu replaces the list in the same panel, with a Back row first. The two lists cross-fade and slide as Tabs panels do: half of `--travel` in, a quarter out, on the responsive tier. The panel's height snaps to the new list and is never animated.
- **Touch rows** fill when pressed (instant tier, color only). Shortcut hints are hidden on coarse screens.
```

Append to **Command menu**:

```markdown
- **On compact screens** the panel sits at the top edge: `--space-2` below the safe-area inset and `--space-2` from each side, not 15vh down. Its list height is the visible screen less the keyboard, read from the visual viewport, so no row hides behind the keyboard.
- **Motion on compact** stays on the responsive tier: it drops from the top by half of `--travel`, scales from `--press-scale`, and leaves on `--dur-exit-responsive`. It is not draggable, because its list scrolls.
- **Touch:** the hints (↑↓, ↵, esc and row shortcuts) are hidden. A Cancel button, `--control-md` tall, sits beside the field. The field takes focus, because typing is the point.
```

Append to **Toast**:

```markdown
- **On compact screens** the toast spans the page gutters, sits `--space-4` above the bottom edge or the safe-area inset, and leaves downward by `--travel` on a timeout, not sideways.
- **Swipe:** a sideways drag moves the toast one to one. It leaves past `--dismiss-distance` of its width or faster than `--dismiss-velocity`, in the direction it was going. The close button stays, 44px on coarse screens. A tap on the stack pins it open, as before.
```

Append to **Tooltip**:

```markdown
- **On touch** a tooltip opens on a press and hold of 500ms, not on a tap, so a tap only does what the button does. (500ms is an interaction delay, like the 200ms hover delay, not a motion token.) It closes on the next touch anywhere. Shortcut chips are hidden on coarse screens. The label that matters must also be the button's `aria-label`, or visible text.
```

Append to **Glass header**:

```markdown
- **On compact screens** the nav stays behind the menu button and opens as the anchored dropdown (see Popover and dropdown). The bar stays sticky at the safe-area inset and never hides on scroll. Links and the menu button are `--control-md` on coarse screens.
```

## 5. Build plan

| Part | What | Size |
|---|---|---|
| Engine | `src/motion/device.ts`: `useDevice()` returns `{ compact, coarse }`. It uses `useSyncExternalStore` over `(min-width: 40rem)` and `(pointer: coarse)`, with a server snapshot of false and false, so Next.js renders and hydrates without a mismatch. Add it to `motionFiles` in `gen-registry.mjs` (a hard-coded list of three files). The Playground provider can override it. | S |
| Tokens | Two lines in `tokens.css`. `tokens.ts` parses them as plain numbers, and the server fallback fills itself from the quoted names. Optional: add them to `check.mjs` 9a and `rules.ts`. Mention them in the SKILL.md token view. | S |
| Sheet drag | A hook on Motion's `drag="y"` with `useDragControls`: one-to-one follow, release velocity and elastic edges come built in. Motion reports velocity in px per second, so 0.4 px/ms is 400 in code. Guards for sliders, `data-no-drag` and scrolled regions. | L |
| Dialog | Branch on `compact`: the sheet shell, grabber, 24px hidden foot, focus rule, `side="right"` mapped to the sheet. Radix stays the accessibility layer. | L |
| Popover | On compact, render the sheet shell on Radix Dialog primitives. Keep the anchored path. | M |
| Menu | Submenu drill-down on compact, with a Back row and the Tabs-style panel swap. Also fixes the 154px off-screen submenu. | M |
| Command menu | Top layout, visual viewport height, Cancel, hide hints. | M |
| Toast | Swipe through the same drag hook, 44px close, `coarse` replaces `(hover: none)`. | S to M |
| Tooltip | Long press (500ms) on coarse, hide `Kbd`. | S |
| Press feedback | `active:` fills on rows in list, table, tabs, segmented, header links and menu rows, on coarse. Fix the Button transition (`scale`). Grow segmented tabs at size sm on coarse. | S |
| Gallery and Playground | A Replay and a phone stage on the Dialog, Popover, Menu, Command menu and Toast pages. A Device switch on the Playground (Auto, Phone, Desktop) that overrides `useDevice()`, beside the reduced-motion preview. | M |
| Registry | `motionFiles`, the `COPY.motion` docs line, and a note that safe-area padding needs `viewport-fit=cover` in the host. Run `npm run test:registry` (fresh Vite and Next.js hosts). | S to M |
| Docs | Foundations and components text from section 4, the CONTRIBUTING "Distance" rule (the sheet exception), the SKILL.md tokens. | S |

Order: engine and tokens, then the Dialog sheet (it carries the drag), measure it, then Popover, Menu, Command menu, then Toast, Tooltip and press feedback.

Risks: a dialog that is open on load could enter once as a centered modal, then switch after hydration. Drag against vertical scroll needs real-device tuning. The 24px foot must not scroll the page.

## 6. Test plan

- **Gallery screenshots.** For each overlay, `shots` at 390 with touch and frames `[60, 140, 260]` (the harness's new shot fields: width, touch, frames, drag), light and dark. The sheet should look different at 60ms and at 700ms. Overflow must be 0px.
- **Agent tasks.** Re-run `phone-settings`, `settings-form` and `analytics-dashboard` after each step. Their baseline runs are the before. The `phone-settings` swipe drags 360px down from the dialog's title, so a drag from the title must close the sheet. A text field should not block a drag either (touch-dragging a field scrolls and does not select).
- **A motion probe.** Promote the `requestAnimationFrame` sampler used for this audit into `gallery/scripts/probe-motion.mjs`. It would assert: only transform and opacity change (width, height, top, margins stay constant); the panel's y tracks the finger within 1px on every frame of a drag; a release at 24% stays open and at 26% closes; a 60px flick at 0.5px/ms closes; peak overshoot is under 1px; under `reducedMotion: reduce` there are no in-between frames.
- **Static checks.** `npm run verify` (typecheck, `lint:litt`, `test:lint`), `node skills/litt-md/scripts/check.mjs`, and `npm run test:registry`.
- **A real-device pass.** iOS Safari and Android Chrome. This covers what headless cannot: the keyboard over a sheet and the command menu, safe-area insets, `:active` on rows, long-press against the OS callout, and glass frame rate while dragging.

## Sources

- Vaul (behind shadcn's Drawer): `src/constants.ts` (close threshold 0.25, velocity threshold 0.4) and `src/index.tsx` (velocity is distance over milliseconds; drags are ignored in the first 500ms and in scrolled content). github.com/emilkowalski/vaul. shadcn's Drawer docs: a Dialog on desktop, a Drawer on mobile.
- Apple: WWDC21 "Customize and resize sheets in UIKit" (detents, grabber). WWDC25 sheet guidance, as summarised from the session: show the grabber only with several detents, and add an explicit close button even when swipe works. WWDC18 session 803 "Designing Fluid Interfaces" covers following the finger, momentum and rubber banding (I cite its topics, not its wording). WWDC20 notes (mackuba.eu): menus appear beside their control, action sheets from the bottom.
- Android Material `BottomSheetDragHandleView`: with an accessibility service on, the handle becomes clickable and toggles the sheet's states.
- Vercel Geist Drawer: a bottom sheet on small viewports only; tap-outside and swipe-down dismiss by default; trap focus and lock body scroll.
- W3C: WCAG 2.2 SC 2.5.7 Dragging Movements (AA), 2.5.1 Pointer Gestures (A), 2.3.3 Animation from Interactions (AAA); WAI-ARIA Authoring Practices, Modal Dialog. MDN: `overscroll-behavior`, viewport meta `interactive-widget`.
- Observed on 14 October 2026 at 390 with touch: the linear.app, vercel.com and stripe.com phone menus are full-screen. Stripe and Linear cross-fade in; Vercel was already drawn at my first frame. These are marketing sites. The Linear, Vercel and Stripe products sit behind logins and were not checked.
