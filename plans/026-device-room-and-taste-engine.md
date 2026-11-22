# Plan 026: Step into the room (Device `#canvas` prototype) and the Taste Engine direction

> **Executor instructions**: Read this plan, `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md` (Device),
> and `plans/024-dial-in-each-world.md`. Phase 1 is split into **1a** (a self-contained Device module on `#canvas`,
> proving physicality, `plane.ts` projection, and Step In / Explode with zero churn to `hand.ts` or components) and
> **1b** (putting the real Device `Slider` from `gallery/src/worlds/device/slider.tsx` into the room so we prove a
> shipping part survives tilted drag and `preserve-3d`). STOP after 1a for Nick's hand check before touching `hand.ts`
> in 1b.
>
> **Drift check (run first)**:
> `git diff --stat 539b655..HEAD -- gallery/src/canvas gallery/src/motion/hand.ts gallery/src/motion/sound.ts gallery/src/motion/rules.ts gallery/src/worlds/device skills/litt-md/assets/tokens.css`
> Report any change to `canvas/registry.tsx`, `sound.ts`, `rules.ts`, or Device's tokens before placing the new canvas item.

## Status

- **Priority**: P1 (Nick locked this direction in the 2026-11-21 grill-me after Fable's review)
- **Effort**: S–M for Phase 1a (`#canvas` module + `plane.ts` + 3 room controls); S for Phase 1b (real Device `Slider` in the room); Phase 2 runs under existing Plan 024; Phase 3 (repo structure / Taste Engine packaging) gets its own plan only after Phase 1 and Phase 2 pass
- **Risk**: MEDIUM (CSS `preserve-3d` flattening, tilted-plane pointer projection through the canvas camera, and subpixel text softness under 3D transforms; isolated in 1a, proven on a real shipping part in 1b)
- **Depends on**: `024` (Phase 1b runs against 024's settled Device body if 024 updates Device first; Phase 3 waits on 024 Device and Flat)
- **Category**: direction, motion, spatial
- **Planned at**: commit `539b655`, 2026-11-21 (revised twice after Fable's technical and strategic reviews on PR #165)

## Why & locked direction (2026-11-21 grill-me)

Following Nick's review of primitives (UI SDK vs. Base UI vs. Radix vs. none), the gallery's scope, and Fable's reviews on PR #165, Nick locked in the durable direction:

1. **Core thesis — distinct tactile worlds held honest by mechanical checks.**
   The durable core is not defined against any external tool (DialKit and Graphical were useful touchpoints, not the definition):
   - **Physical, emotional worlds** (materials, top-lit depth, machined hardware, Web Audio clicks, long-exposure shaders), and
   - **Mechanical agent checks** (`skills/litt-md/scripts/litt-check.mjs`, `lint-litt.mjs`, material/corner/motion verifiers) that enforce taste inside an agent's loop rather than relying on prose alone.
   - **Optional spatial & tuning layers on top**—the **"Step Into the Room"** view and any future tuning bench—must stay cleanly removable without touching the core of worlds, tokens, and checks.
2. **Day-1 user — Nick and Nick's agents first.**
   No premature paywalling or docs-driven static UI-kit funnel (a real commercial risk in 2026—e.g. Tailwind Labs publicly reported an ~80% revenue drop in January 2026 as AI bypassed docs traffic, and closed Tailwind Plus to new buyers upon joining Shopify in September 2026). Build the sharpest possible weapon for Nick's own sites and apps; package publicly only once two worlds are undeniable.
3. **Gallery vs. Engine.**
   Stop expanding the current catalog (`gallery/src/components/` holds 112 component files at `539b655`). The target shape is:
   - **Core:** Taste skill + `tokens.css` + mechanical host checks + Craft Engine (`motion/`, `sound/`, `materials/`),
   - **~10–12 core world primitives** (the hard interactive staples: Dialog/Sheet, Popover, Menu, Select, Combobox, Tabs, Switch, Slider, Input, Button, Tooltip, Toast),
   - **Curated interactive Studies** (the `components` bar, ~12 per world), and
   - **Optional layers:** Spatial Room stage and (only if still warranted after Phase 1) a lean tuning bench evolved from `tune.tsx`.
4. **Primitives — stay put in `litt.md`, decide once at Phase 3.**
   Keep Radix untouched in `litt.md` for now; Plan 017 (`no-primitive-library`) remains deferred. Choose **Base UI vs. UI SDK** only at Phase 3, once Device and Flat are solid and UI SDK has matured past `0.1.0-beta.1`.
5. **Repo invariant & sequence — keep skill, tokens, and checks in ONE repo permanently.**
   Agents consume the Claude Code plugin (`skills/litt-md/`, `taste/`), `tokens.css`, and the mechanical checks (`litt-check.mjs`, `lint-litt.mjs`, `check.mjs`) as a single indivisible unit. **Phase 3 must never split the skill from its checks across two repos.** When Phase 3 arrives, Nick picks one clean layout:
   - **Layout A (full handoff):** The new Taste Engine repo becomes the Claude Code plugin root (carrying skill + `taste/` + `tokens.css` + checks + runtime engine + Device/Flat studies + ~10–12 core primitives), and `litt.md` freezes as a legacy component archive.
   - **Layout B (core stays here):** `litt.md` permanently owns the plugin, skill, tokens, and checks, and only the optional runtime engine / room layer publishes out as a clean package.
   
   Until then, the sequence avoids 3-repo drift:
   - **Phase 1a (this plan):** Build a throwaway/re-dressable `#canvas` Device Room prototype (using today's Device tokens) with just the 3 room controls needed to judge it, and STOP for Nick's hand check.
   - **Phase 1b (this plan, after 1a passes):** Mount the **real** Device `Slider` (`gallery/src/components/slider.tsx` + `gallery/src/worlds/device/slider.tsx`) inside the Room with plane-projected `useHand()`, proving real shipping components work in a room. *(Note on overlap with Plan 024: Phase 1a's module is explicitly disposable if 024 revises Device's materials; Phase 1b runs against 024's settled Device body if 024 lands first, or proves the integration pattern now and re-verifies after 024.)*
   - **Phase 2 (existing Plan 024):** Finish dialling in **Device** and **Flat** here.
   - **Phase 3 (separate plan after Phase 2):** Execute Layout A or Layout B cleanly and settle Base UI vs. UI SDK once.

## Decisions settled in PR #165 reviews (Fable)

1. **Two-step proof (1a then 1b):** Keep 1a self-contained in `gallery/src/canvas/` so zero component/hand code churns before Nick likes the feel, then prove a **real** Device `Slider` inside the room in 1b before calling the room validated.
2. **No third tuning UI in Phase 1:** Cut the Feel Bench down to the **three room controls** needed to judge the prototype (tilt angle, Z-extrusion depth, explode spacing). Defer sound tuning (`#device/sound` already exists), light azimuth, physics sliders, and token export until the room passes—and if a bench returns later, evolve it from `gallery/src/components/tune.tsx` rather than building another tuning UI.
3. **Where the Room graduates:** Keep the Room on `#canvas` until 1a and 1b pass Nick's hand check, then decide whether it joins `#device` or stays an optional layer.
4. **Skill + tokens + checks stay together:** Never split the Claude Code plugin (`skills/litt-md/`), `tokens.css`, and the mechanical checks across two repos at Phase 3.

## Phase 1a: Self-contained `#canvas` Device Room prototype

Lives in `gallery/src/canvas/` (no nav entry, no wall tile, invisible to page checks, per `.claude/CLAUDE.md` `#canvas` rules), plus one narrow 2-line additive change in `gallery/src/motion/sound.ts` so Device's voices work inside a nested Device frame, and one pure Node test (`gallery/scripts/test-plane.mjs`).

### Scoping Device's look and sound on `#canvas`

`#canvas` runs outside every world, so `<html>` wears Flat. Without explicit scoping, Device's tokens (`--plate-face`, `--lcd`, `--slot`, `--key-lift`, `--sound-*`) resolve to Flat's defaults or `null`.

- **World & theme wrapper (same pattern as `gallery/src/canvas/press.tsx` and `flat-calls.tsx`):** Wrap each preview frame (Light and Dark) in `<MaterialProvider material="device">` around a container ref (`frameRef`) that spreads `lookAttributes({ accent: "world", material: "device" }, dark)` so all Device visual and sound tokens resolve cleanly on that element.
- **Minimal additive fix in `gallery/src/motion/sound.ts`:** `readVoice(name, root)` already accepts `root?: Element | null` (`sound.ts:284`), but `play(name, options)` currently calls `readVoice(name)` with no `root` (defaulting to `document.documentElement`, which is Flat on `#canvas`, causing `play()` to return silently). Add an optional `root?: Element | null` field to `PlayOptions` and pass `options.root` to `readVoice(name, options.root)`. Existing callers omit `root` and keep identical behavior. Because `sound.ts` ships in `motionFiles` (`gallery/scripts/gen-registry.mjs:1608`), Phase 1a includes the required `motion` changelog entry, updated `gallery/registry.lock.json`, `npm run test:sound --prefix gallery`, and `npm run test:registry --prefix gallery -- --app vite`.

### Subject: one compact Device module (throwaway/re-dressable prototype)

A single machined Device plate built from today's Device tokens combining **Slider + Switch + LCD readout** so one prototype proves both the Device material depth map (`frame` → `plate` → `well`/`slot` → `key`/`cap` → `lcd`) and tilted-plane interaction (continuous drag + discrete toggle + live readout + sound):

- **Plate & Frame (`data-part="frame"`, `data-part="plate"`):** Uses Device's existing tokens (`--frame`, `--frame-edge`, `--plate-face`, `--plate-edge`, `--plate-grain`, `--highlight`) with real extruded plate thickness (stacked Z-skirt faces or bevel walls) and a grounded cast shadow on the studio plinth.
- **Slider (`data-part="slot"`, `data-part="cap"`):** Real interactive control (`role="slider"`, `tabIndex={0}`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-label`) — never a bare `div` (Principle #5, and required so `canvas.tsx`'s `spaceIsTaken()` recognizes it). Recessed fader slot with engraved ticks, lit fill (`--lamp-on`), raised cap standing proud on its skirt, sinking `--press-depth` (2px) while held, and playing `"notch"` ticks via `useSound()` (`{ root: frameRef.current }`) as the cap crosses detents.
- **Switch (`data-part="well"`, `data-part="key"`):** Real `<button type="button" role="switch" aria-checked={...}>` seated in a recessed well, sinking `--press-depth` on press with `"switch"` / `"key-down"` / `"key-up"` via `useSound()` (`{ root: frameRef.current }`), toggling the module's armed state and updating its lamp (`data-part="light"`).
- **LCD readout (`data-part="lcd"`):** Dark glass behind a bezel displaying the live fader value and switch state in mono (`--field`, `--field-ink`, `--lcd`, `--lcd-edge`), reacting instantaneously to every drag, toggle, or keyboard step.

### Three views & transitions

1. **Room (default):** The module sits at an isometric angle on a lit studio plinth (`rotateX` + `rotateZ` / `rotateY` with perspective), with real plate thickness and grounded desk shadow. **100% live and interactive**—clicking the switch or dragging the slider works right here.
2. **Step In (`0°` flat):** Triggered by an explicit `<button>` control (**Step in** / **Room**)—no plinth double-click, avoiding conflicts with canvas pointer gestures. Springs the camera flat onto the working 2D surface on the expressive spring. **Crispness rule:** once the spring settles at `0°`, remove the module's 3D transform completely (`transform: none`, `transform-style: flat`). Because `canvas.tsx` applies `translate3d(x, y, 0) scale(z)` on the canvas world element, text crispness is judged at **100% zoom (the `0` key, whole-pixel pan)** beside a 2D reference Device part rendered in the same canvas item. Pressing `Escape` returns to Room **only while focus is inside the module** (scoped `onKeyDown` on the module container, never a window listener).
3. **Explode toggle:** An explicit `<button aria-pressed={...}>` control that smoothly separates the `data-part` strata along the Z-axis (`frame` → `plate` → `well`/`slot` → `cap`/`key` → `lcd`) with subtle depth guides, while every control stays live and clickable.

### Minimal Room controls (only the 3 controls needed to judge the Room)

Placed quietly beside the stage on `#canvas`—strictly limited to three sliders so Phase 1a does not become a third tuning UI:

- **Tilt angle**
- **Z-extrusion depth**
- **Explode spacing**

No sound editor, light azimuth, physics bench, or token exporter in Phase 1a.

### Engineering constraints

1. **Full-chain inverse-matrix pointer projection on plain arrays (`plane.ts`):**
   Dragging a slider at an isometric angle moves diagonally in viewport `(clientX, clientY)` pixels, and `canvas.tsx` wraps every item in an ancestor `translate3d(x, y, 0) scale(z)` plus the item's own `translate(x, y)`. A single element's `getComputedStyle().transform` misses those ancestors, and Node has no `DOMMatrix`.
   - Write `gallery/src/canvas/plane.ts` with pure **4×4 `number[]` matrix math** (multiply, invert, perspective, translate, rotateX/Y/Z, scale, ray-plane intersection from screen `(x, y)` into local `(u, v)` track coordinates) so the math core has zero DOM dependencies.
   - Add a thin DOM helper in `plane.ts` that walks the element's ancestor chain up to the viewport, accumulating every ancestor `transform`, `perspective`, `transform-origin`, and layout offset (including `canvas.tsx`'s world camera `translate3d`/`scale`) into the full 4×4 matrix before inverting.
   - Add **`gallery/scripts/test-plane.mjs`** (`npm run test:plane --prefix gallery`, wired into `verify` in `gallery/package.json`) that tests `plane.ts`'s pure math in Node and asserts round-trip projection accuracy within `0.5px` across: `0°` flat, `35°` isometric, exploded Z-offsets, and canvas camera zoom levels (`0.5`, `1`, `2`) with fractional pan offsets.
2. **`preserve-3d` flatness and canvas clip discipline:**
   - Never place `overflow: hidden`, `opacity < 1`, `filter`, or `backdrop-filter` on any ancestor between the perspective stage and the extruded `data-part` layers. Clipping (e.g. the slider fill inside its slot) lives only on leaf elements. Press's frosted glass (`backdrop-filter`) is out of scope for Phase 1.
   - **Never animate `opacity` on any stratum that holds `preserve-3d` children** during Explode or Step In, as intermediate `opacity < 1` flattens the 3D context mid-transition.
   - `canvas.tsx` sets `overflow-hidden` on `[data-canvas-preview]`, which sits *above* the perspective stage (so it does not break `preserve-3d`, but it *will* clip anything projected outside the preview box). Size the item generously in `gallery/src/canvas/registry.tsx` with explicit internal padding around the stage so the tilted, extruded, and max-exploded projection stays completely inside the preview frame.
3. **Sound, keyboard, and reduced motion:**
   - Sound uses `useSound()` with `{ root: frameRef.current }` strictly inside trusted pointer/key gestures (respecting `HAND_MS` and mute); nothing sounds on load or camera sweeps.
   - All interactive parts use real control elements/roles (`button`, `role="switch"`, `role="slider"` with `tabIndex={0}`) so `canvas.tsx`'s `spaceIsTaken()` yields `Space` to focused controls and pointer drags never trigger canvas pans.
   - Under `prefers-reduced-motion: reduce`, Room / Step In / Explode snap instantaneously with zero camera sweep.

### Files to add / edit in Phase 1a

- `gallery/src/motion/sound.ts` — add optional `root?: Element | null` to `PlayOptions` and pass it to `readVoice(name, options.root)` inside `play()`
- `gallery/CHANGELOG.md` + `gallery/registry.lock.json` — one `changed` line for `motion` (and regenerated lock) covering the additive `PlayOptions.root` option
- `gallery/src/canvas/plane.ts` — pure 4×4 plain-array matrix math + ancestor-accumulating DOM projection helper
- `gallery/scripts/test-plane.mjs` + `gallery/package.json` — Node self-check (`npm run test:plane --prefix gallery`, wired into `verify`)
- `gallery/src/canvas/device-room.css` — 3D stage, extruded plate/key skirt geometry, plinth shadow, `preserve-3d` hierarchy (tokens only; no hex values)
- `gallery/src/canvas/device-room.tsx` — Device-scoped Light & Dark frames (`MaterialProvider` + `lookAttributes`), self-contained Device module (Slider + Switch + LCD), Room / Step In / Explode controls, 2D crispness reference, and the 3 room controls (tilt, extrusion, explode spacing)
- `gallery/src/canvas/registry.tsx` — register the generously sized Device Room canvas item near the top of `#canvas`

## Phase 1b: Prove a real Device component inside the Room (runs only after 1a passes Nick's STOP)

Phase 1a proves a purpose-built 3D object can feel good; Phase 1b answers the real question—whether shipping components in `gallery/src/worlds/device/` survive a Room without breaking `hand.ts`, leaf clipping, or `preserve-3d`.

- Mount the real `Slider` (`gallery/src/components/slider.tsx`, which renders `SliderDevice` in `gallery/src/worlds/device/slider.tsx` under `MaterialProvider material="device"`) on a companion `#canvas` stage inside the same Room wrapper.
- Add an optional plane-projection hook or context consumed by `useHand()` in `gallery/src/motion/hand.ts` (falling back to today's direct `clientX`/`clientY` path with zero overhead when not inside a tilted room), and verify whether `SliderDevice`'s `overflow-hidden` slot well (`slider.tsx:26`) stays a leaf without flattening the plate's `preserve-3d` context.
- Record any real-component snag (Radix pointer capture, `overflow-hidden`, `data-part` depth separation, or sound `root` scoping) in the Phase 1b STOP report before deciding whether Room graduates beyond `#canvas`.
- *(Note: If Plan 024's Device pass lands before 1b starts, run 1b against 024's settled Device `Slider` body.)*

## Pass / fail bar (STOP after 1a, then again after 1b)

Judge the built `#canvas` item by hand in both Light and Dark Device frames, with mouse and keyboard:

- [ ] **Physicality (1a):** In Room mode, the module reads as a machined aluminium object sitting on a lit desk (visible plate thickness, recessed wells, grounded shadow, 2px key/cap sink), not a tilted flat card, with zero clipping by `[data-canvas-preview]` at max Explode.
- [ ] **Hand feel on the tilted plane (1a & 1b):** Dragging the Slider at isometric angle tracks the pointer 1:1 from end to end at 100%, 50%, and 200% canvas zoom with zero slip, and fires `"notch"` detents cleanly.
- [ ] **Step In crispness (1a & 1b):** Stepping in via the button springs smoothly to `0°` and drops its 3D transform (`transform: none`) on settle; at 100% zoom (`0` key, whole-pixel pan), text and hairlines match the sibling 2D Device reference inside the same canvas item.
- [ ] **Explode clarity (1a):** Toggling Explode cleanly lifts `frame → plate → well/slot → cap/key → lcd` along Z with zero mid-transition flattening while Switch, Slider, and LCD remain live.
- [ ] **Real component proof (1b):** The shipping Device `Slider` drags 1:1 on the tilted plane via `useHand()`, clicks detents, and renders without flattening or clipping inside the Room.
- [ ] **Keyboard & reduced motion (1a & 1b):** Tab, Arrow keys, Space/Enter (without panning the canvas), and scoped Escape (returning from Step In only while focus is inside the module) all work; under `prefers-reduced-motion: reduce`, mode switches snap instantly.
- [ ] **Checks green:** `node skills/litt-md/scripts/check.mjs`, `npm run verify --prefix gallery` (including `test:plane`), `npm run build --prefix gallery`, `npm run test:sound --prefix gallery`, and `npm run test:registry --prefix gallery -- --app vite` all pass.

## Checks before Phase 1a / 1b merge

```bash
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
npm run test:sound --prefix gallery
npm run test:registry --prefix gallery -- --app vite
```

## Done when (Phase 1)

- Phase 1a's Device Room + 3 room controls are live on `#canvas` in Light and Dark Device frames and approved by Nick.
- `test:plane` passes in `verify` across `0°`, `35°`, exploded Z-offsets, and camera zooms (`0.5`, `1`, `2`).
- Phase 1b proves the shipping Device `Slider` inside the Room with plane-projected `useHand()` and is approved by Nick.
- `check.mjs`, `verify`, `build`, `test:sound`, and `test:registry -- --app vite` pass.
