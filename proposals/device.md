# Device: a third material

Written 2026-11-05 for Nick. Nick put seven studies from the `components` repo (command menu, one-time code, agent run, agent loaders, number ticker, copy button, agent shapes) next to litt rebuilds that kept litt's quiet look and put the fun only in motion. Nick's verdict on the comparison: "before goes way harder". Nick picked out the Geist Mono on the command menu's glass, then: "we should build this into a design system on littmd", and chose **a whole look** over a family of loud readouts in a quiet app.

So Device is a third material beside Press and Flat: `data-material="device"` on `<html>`, answered by `tokens.css`, chosen in Customize and carried by `?look=`. Every component answers it, the way every component answers Flat.

Not to be confused with "the components theme" in `flat.md`, which carries litt.design's recipes (grey card frames, round icon buttons, `SoftSwap`) into the components. That plan is unchanged and separate.

## Why the before went harder

From the side-by-side spike (artifact "Litt Fun Components"), four reasons, which are the goals of this material:

1. **It is an object.** A body, a well, keys with travel, glass with glare. You know what a thing is before you touch it.
2. **Scale and contrast.** Readouts are light ink on near-black glass; litt's stone page is grey on grey.
3. **One world.** Mono figures, seven-segment ghosts, engraved uppercase legends. Every detail comes from the same hardware.
4. **It is alive.** This one is *not* a goal: see Non-goals.

R1 already says "the controls are objects you can hold", and R3 already names trays, cuts, slots, blocks, caps and glass. Device is R1 and R3 taken literally, with the hardware vocabulary the `components` repo already worked out in its `--device-*` tokens.

## Goals

- Pick Device in Customize and every page of the gallery reads as hardware: a brushed body, wells cut into it, keys standing on it, readouts behind glass.
- Every component keeps working: same props, same semantics, same states (R1: default, hover, pressed, focus, disabled, empty, loading, error).
- Light, dark and forced colors each designed (Fixed decisions, Themes).
- Every accent works under Device (Blue 4, Monochrome, Pink), so twelve looks become eighteen. Monochrome's accent is the ink, so nothing that fills with the accent may sit on dark glass.
- Contrast holds: every pair check 5 runs under Press and Flat also runs under Device.

## Non-goals

- **No ambient motion.** R4 holds: nothing moves on its own. No shimmer, scanlines, flicker or blinking caret. What the before had of "alive" comes in only through fun mode's moments (Arrival, Change, Touch) and, later, the token-driven agent indicator, which moves only when tokens arrive.
- No skeuomorphic texture images, grain, screws or fake brand plates. Light from the top (R2) and gradients that never animate.
- Not a fork of any component. A component may branch on the material only through tokens or a `data-material` CSS selector in its recipe, never through a JS branch that changes its structure.
- Not the registry default. The registry keeps shipping Press (Q17 stays open).

## Anti-goals (it fails even if it works)

- It reads as a costume: a page of chrome bevels where content is hard to read.
- Two looks in one view: some components hardware, some still stone.
- It needs its own components to look right, so an app that installed litt can't simply set the attribute.

## The material, depth by depth

The depth ladder (R3) said in hardware. Values come from `components/src/design-system/tokens.css` (the `--device-*` set), retuned to litt's checks.

| Depth | Press (today) | Device |
|---|---|---|
| The canvas | stone, flat | the **body**: a cool grey with a top-to-bottom gradient that never animates, the top edge lit |
| Surfaces (cards, panels) | a hairline and the top highlight | a **plate** on the body: a step lighter, a lit top edge, a 1px dark rim |
| Sunken: a tray (choices) | a floor a step down | a **well**: a darker cut into the body, its top wall in shade |
| Sunken: a cut for what you type (fields, the code input, command search) | white with the top wall's shade | **glass**: near-black LCD glass, light ink, the diagonal glare of the `components` LCD; the control line stays at 3:1 against the body |
| Sunken: a cut for what you mark (checkboxes, radios, color wells) | the same cut | a small **well** in the key face's light grey, so a checked box filled with ink (Monochrome's accent is the ink) still reads against it *(builder's call)* |
| Sunken: a slot (what fills: progress, sliders) | a floor and its shade | a well with a **lit fill**, like a meter's bar |
| Raised: a block (buttons, selected segment) | white, a soft cast | a **key**: a face gradient, a dark rim, a 2px skirt below it, and a press that sinks the full 2px (`--press-depth`) |
| Raised: a cap and its plate | a cap that casts 3px | a **knob cap**: the key's face, rounder light, same 3px |
| Floating (menus, dialogs, toasts) | glass with a glow and ring | **glass**, the same light or dark as the theme, cooler, with the key's dark rim. Not inverted: a light page keeps light overlays, so nothing inside needs a second theme *(builder's call)* |

The one accent (R6) stays one fill per view. Status colors keep their meanings (`--danger` is failed). The `components` lamps (red live, orange waiting) are left out of this round, since litt's runs have no waiting state and red already means failed *(builder's call)*.

## Type on Device

The before's command menu reads as a screen because its glass is in Geist Mono. Under Device:

- **On glass, the mono.** Text on glass sets in Geist Mono at 400: a field's value and placeholder, a code input's figures, a command menu's search and its result rows. Titles, buttons and body text in overlays stay in the sans at their R8 weights, since the mono loads at 400 only. This is an exception to R8's "the mono is for code only", scoped to Device and to glass. *(D2.)*
- **Legends are engraved.** 12px labels (R8's 600 weight) set uppercase with 0.08em tracking and a one-pixel engraving (`--engrave`, a light shadow below in light, a dark one above in dark). Sentence case stays everywhere else.
- **Nothing above 18px.** Unchanged. Readouts get their weight from contrast, not size. *(D3.)*

These are tokens (`--font-glass`, `--label-case`, `--label-tracking`, `--engrave`) that Press and Flat set to today's values, so a component that uses them changes under Device and nowhere else.

## What changes where

**Phase 1, tokens (one builder, by hand).** In `skills/litt-md/assets/tokens.css`:
- `--device-*` neutrals in the light block, the dark block and the system-dark block (check 3 keeps the dark blocks identical).
- A `[data-material="device"]` block after Flat's, in the same shape: the neutrals, every press token in the table above, `--press-depth: 2px`, the restated derived tints, the focus ring.
- The four type tokens above, defined for every material.
- Device's `@supports not (color: color-mix())`, `prefers-contrast: more` and forced-colors answers, after Flat's.

In `check.mjs`: check 5 runs every pair a third time under Device; a new check 12 holds Device's own invariants (the glass ink at 7:1 on the glass, the lamps at 3:1 on the body, the control line at 3:1 on the body). The script header lists it.

In the gallery: `Material` gains `"device"` in `look.ts` (the slug `-device`, so `pink-device-fun`), `MATERIALS` gains its row ("Device", "Keys, wells and glass"), the pre-paint script in `index.html` learns `-device` (and `test:look` proves the copy matches), and `lookAttributes` passes it on. Customize shows three materials.

**Phase 2, the survey (the swarm).** Build the gallery, screenshot every page in Device against Press, light and dark, and write one row per page under `## What the build showed` below: what reads, what doesn't, and which recipe should change. One Haiku worker per batch of pages; each returns its rows and its screenshots' paths.

**Phase 3, recipes (the swarm).** From the survey, each component that needs more than tokens gets a recipe change: a CSS rule on `[data-material="device"]` or the new type tokens, never a JS branch. One Haiku worker per component group (fields, buttons and keys, menus and overlays, data, agents). Each change must pass `verify`, `lint:litt`, `test:motion`, `test:wall` and `test:registry`, and the Press and Flat screenshots of its pages must not change by a pixel.

**Phase 4, taste.** Through `evolve.md`: journal entries for today's reactions, the profile to v1.5 (the Signature names three materials, R3 gains its Device paragraph, R8 its glass exception), Q18 opened (Device's place in the registry), `components.md` and `material.md` updated, a `CHANGELOG.md` `litt` line, the lock regenerated. Committed with `taste:`.

## Decisions for Nick

| # | Question | Suggested |
|---|---|---|
| D1 | The name | **Device**, matching the `--device-*` tokens it comes from. |
| D2 | Mono on glass | **Yes, under Device only**: fields, the code input, command search and floating glass. |
| D3 | Readout sizes | **Keep the 18px ceiling**; contrast carries it. Revisit after Phase 2's screenshots. |
| D4 | Fields as dark glass in the light theme too | **Yes.** A light page with dark fields is the before's look (an LCD set in a light body); a light field would read as Press. |
| D5 | Cool grey | **Yes, under Device only.** The Color decision says warm stone; Device's body is the `components` cool aluminium grey, as Flat's is neutral. |
| D6 | The press | **A 2px sink under Device only**, the key's full travel. R4 says half a pixel; Press and Flat keep it. |

D2, D4, D5, D6 and the engraved uppercase legends each change a fixed decision or a rule (Type, Signature, Color, R4, R8) for Device alone, so they go through `evolve.md` as Nick's decisions before anything is committed with `taste:`.

## Left to the builder

The exact values, as long as every check passes and they come from or near the `components` `--device-*` set. Which pages go to which worker. The recipe details within the rules above.

## What the build showed

*(Phase 2 writes this table.)*
