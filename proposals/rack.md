# Rack: a fourth world

Written 2026-11-14 for Nick. Nick asked for "a fourth world inspired by ableton", with Emil Kowalski's design-engineering rules for the motion. This file says what was built, why, and what waits for Nick. Phase 1 (tokens, the check, the gallery's wiring and the world page) is built; nothing in `taste/` changed, so the decisions below go through `evolve.md` before the profile names Rack.

## What Ableton Live's interface is, and what Rack takes from it

Live is a tool people sit in for hours, so its interface is a quiet, dense instrument. Rack takes the interface's grammar, not its brand: no logo, colours, typeface or layouts copied, and the name is the rack a device chain lives in.

| Live does | Rack says it as |
|---|---|
| Flat grey panels on a darker grey ground, separated by the ground itself | the canvas is the body (`--rack-canvas`), surfaces are panels a step lighter with no edge (`--plate-lift` empty) |
| Every control is a flat box in a thin dark outline | the press tokens are zero-offset 1px outlines (`--block-lift`, `--tray-shade`, `--slot-shade`, `--cap-lift`); nothing casts |
| A toggle that is on lights up in a warm yellow | one yellow, `--rack-accent`, only ever a fill, always inside a key's outline |
| Small, dense values you set by dragging or typing | value boxes are light cuts in the control line; the face is Inter, built for small sizes; tabular figures as everywhere in litt |
| Square corners | it opens at 2px controls in 6px panels, a step the Customize shapes already offer |
| Nothing animates; a value changes on the frame you move it | the motion language below |

How it differs from the other three: Press is lit objects, Flat is fill alone with no edges and pills, Device is hardware with keys, glass and mono. Rack is software: outlines and fills, square, dense, and dead still.

## The motion language (after Emil Kowalski)

Emil's first question is how often someone sees an animation, and his answer for something touched hundreds of times a day is not to animate it (Raycast has no open animation). An instrument is that kind of tool, so Rack's language is the least motion of the four:

- **A set cuts in on the beat.** `deal` under Rack brings pieces in by opacity alone, on the instant tier (100ms) with its ease-out, the curve Emil prescribes for anything entering. Pieces are grouped into columns by their left edge, and each column launches together, `--stagger` after the one before, like a scene launching across tracks. Nothing travels, grows or bounces. The beat is even on purpose: quantisation is the metaphor, so this is the one place an even stagger is right.
- **It stops all at once, quicker than it came.** `gather` takes every piece out together over the instant tier times `--exit` (75ms): exits faster than enters, as Emil asks.
- **Overlays cut in where they stand.** `useOverlayMotion` reports `switches` for Rack, as for Device, so every overlay already takes its opacity-only path; Rack's transition is an ease-out cut (100ms in, 75ms out) in place of Device's three steps. No growth from the trigger, no slide: a menu in a tool you live in should be there when you ask.
- **A press answers on the frame.** `--press-depth` is 0; a pressed key darkens its outline (`--block-press`) and its fill (`--block-hover`) at once. litt's press scale stays, which is Emil's 0.97-to-0.98 button feedback.
- **Reduced motion** zeroes the instant tier and the stagger, so everything is simply there.

## What was built (phase 1)

- `skills/litt-md/assets/tokens.css`: `--rack-*` in the light, dark and system-dark blocks; the `[data-material="rack"]` block after Device's; Blue 4, pink and monochrome restated after it; its answers without `color-mix()` and under `prefers-contrast: more`.
- `skills/litt-md/scripts/check.mjs`: check 5 runs every pair again as "rack light" and "rack dark" (the inks, the hovered block, APCA, the accents' 0.12 from every data hue); check 13 knows Rack's face; new check 14 holds Rack's invariants: every token mapped, after Device, nothing cast (every press token a zero-offset 1px outline or empty), no sink, no light, the ink as links and focus, and a lit key's outline at 3:1 on the light body and panels, which is what lets the yellow fill skip its own 3:1 there.
- The gallery: `look.ts` (the material, its `-rack` slug, its row with foundations and abilities, a `bodies` flag), `motion/deal.ts` (the language above), `index.html` (the pre-paint grammar and Inter), `customize-state.tsx` (Rack's locked shape), the scenes (`systems/rack.tsx`: an effect, the mixer, the arrangement, automation, a filter pad), the world page (`pages/00-rack.tsx`), and every test that listed the worlds (`test-look`, `test:worlds`, `test:wall`, `test:playground`, `test:study`).
- `chart` and `file-drop` read their per-world tables through `byWorld`, so a world without its own body falls back to Press, as `byWorld` promises.
- Bodies stages show only worlds that have bodies (`BODY_WORLDS`); "Under each material" on a study shows all four, since it shows tokens, not bodies.

## The values

Light: a #c8c8c8 body, #e2e2e2 panels, the grey ink #434343 (the lightest grey that keeps 4.5:1 and APCA Lc 60 on every surface and a hovered key), the control line #6c6c6c (3:1 on the body, panels and the cut). Dark: a #161616 body, #262626 panels, #bebebe grey ink. The yellow is #ffc933 with #111111 words in both themes. The data hues start from Device's (fitted to a grey body) and are toned until every mark reaches 3:1 and every text tone 4.5:1, its tint included; the rose loses a quarter of its chroma so pink stays 0.12 away. Every value was fitted by script against the same maths as check 5.

## Round two: colour (2026-11-14)

Nick, on the first build: "I meant more colorful, check this out", with two screenshots: Live's arrangement view (salmon, blue, cyan, magenta, purple and green clips with dark waveforms on a light grey ground) and a dark music-AI panel (orange waveforms on deep orange clips, magenta controls, near-black panels).

What both have in common is that the colour belongs to what you make, a track or a clip, and the chrome around it stays grey. litt already has that pair: a data hue's tint behind its mark (R7). So round two keeps R6 and R7 and moves the colour there:

- **Five clip colours.** Rack's data hues become clip colours: blue, an orange in amber's slot, a cyan in teal's, a purple in violet's and a green in rose's. Magenta is left out because it would sit on the pink accent; the green is Live's keyboard clip. Each hue's angle was moved until it keeps 0.12 (OKLab) from the yellow, Blue 4 and pink, in both themes.
- **The tint is its own value.** `--rack-data-*-tint` is a fill you see, not a 12% hint. In light it is a pastel clip with the hue's dark mark and dark words on it, as Live draws clips. In dark it is a deep clip with a bright mark, the dark orange behind the bright orange of the second screenshot. Check 5 holds every text tone to 4.5:1 on its own tint; check 14 requires the tints to be Rack's own.
- **Scenes in colour.** Each track keeps one colour on the whole page: its name is a chip in the Tracks table, the sections it leads colour the arrangement strip, and its level is a bar in it.

What this round did not take, and is Nick's call:

| # | Question | Suggested |
|---|---|---|
| K7 | Coloured controls (Live's yellow, cyan and orange buttons; the second screenshot's magenta sliders) | **Not yet.** It breaks R6's one accent. Pink as Rack's accent (`?look=pink-rack`) gives the second screenshot's magenta controls today. |
| K8 | Rounder, as the second screenshot | **Keep Rack square**, as Live is; Customize's shapes still round it. |
| K9 | A clip body: a coloured block with a waveform in it | **Yes, next**, as Rack's first body of its own. |

## Decisions for Nick

| # | Question | Suggested |
|---|---|---|
| K1 | The name | **Rack**, the thing a device chain lives in; no collisions in the code. "Session" is the other good one. |
| K2 | The accent | **Yellow, only ever a fill**, with links and focus in the ink. Orange is Device's. |
| K3 | The face | **Inter**, dense and made for small sizes. Hanken Grotesk is the alternative already offered. |
| K4 | Square | **2px controls in 6px panels**, Rack's own locked shape, as Flat locks the pill. |
| K5 | No motion to speak of | **The cut and the beat above.** It changes R4's "a set settles" for Rack alone. |
| K6 | Outlines as the depth ladder | **Yes, under Rack only.** R3 says only raised things cast; Rack casts nothing and draws a 1px edge on raised and sunken alike, the fill telling them apart. |

K2, K4, K5 and K6 each change a rule (R6, the shape, R4, R3) for Rack alone, so they go through `evolve.md` as Nick's decisions, then the profile, SKILL.md's rules and `components.md` name Rack, committed with `taste:`.

## Next

- **Bodies.** Rack draws Press's body everywhere today. The ones that would say it most: the switch as a flat key that lights yellow with its word on it (Live's toggle), the slider as a thin track with a filled bar, the table as thin rows on one panel (Press's slats read chunky here), the number field as a value you drag.
- **The survey.** As Device's phase 2: every page shot in Rack against Press, light and dark, one row per page.
- **Fun mode under Rack.** Nothing yet; the beat is the obvious place.
