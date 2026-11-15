# Heat: a world after a street-racing front end

Written 2026-11-15 for Nick. Nick asked for "a new world inspired by Need for Speed Most Wanted 2005 UI". This file says what was built, why, and what waits for Nick. Phase 1 (tokens, the check, the gallery's wiring and the world page) is built. Nothing in `taste/` changed, so the decisions below go through `evolve.md` before the profile names Heat. Heat is the sixth world, after Rack, so its check is 16 and its tokens follow Rack's.

## What the game's front end is, and what Heat takes from it

Most Wanted's menus are a night street in a menu. Heat takes the interface's grammar, not its brand. No logo, typeface, colours, icons or layouts are copied, and the name is the pursuit meter's word, not the game's.

| The front end does | Heat says it as |
|---|---|
| Dark, gritty panels over a night city with a cool cast | asphalt at night (`--heat-canvas`), greys with a cool green cast; pale concrete by day |
| Hard-edged slabs, no soft shadows | panels are opaque slabs on a hard 3px ledge with no blur (`--plate-lift`); no glass blur |
| The selected row lights up hot | one lime, `--heat-accent`, the light of what is selected, glowing at night (`--glow`) |
| Condensed, fast type | Saira Semi Condensed, narrow, drawn for racing dashboards |
| Sharp corners, slanted bars | square, every corner 0; the slant waits for bodies (H5) |
| Menus whip in from the side | the motion language below |

How it differs from the other five. Press is lit objects, Flat is fill alone, Device is hardware with glass, Plain is a page, Rack is a quiet instrument. Heat is loud and fast: hard ledges, one glowing light, motion that arrives at speed.

## The motion language

- **A set whips in from the left.** `deal` under Heat starts each piece `--travel` to the left and springs it home on the responsive spring (no bounce), with an opacity fade on the instant tier, a `--stagger` apart in reading order, like cars off the line.
- **It leaves all at once, quicker than it came.** `gather` sends every piece half of `--travel` to the right, together, on the instant tier times `--exit`.
- **Overlays slide and never grow.** `useOverlayMotion` reports `slides` and `grow: 1` for Heat, so a menu comes in from the side it opens on.
- **A press lands.** `--press-depth` is 2px: a key sinks onto its 3px ledge (`--block-press` is a 1px ledge). Reduced motion stills it, as Device's.

## What was built (phase 1)

- `skills/litt-md/assets/tokens.css`: `--heat-*` in the light, dark and system-dark blocks; the `[data-material="heat"]` block after Rack's; Blue 4, pink and monochrome restated after it; its answers without `color-mix()`, under reduced motion and under `prefers-contrast: more`.
- `skills/litt-md/scripts/check.mjs`: check 5 runs every pair again as "heat light" and "heat dark"; check 8 bounds Heat's shadows; check 13 knows Heat's face; new check 16 holds Heat's invariants. Every token is mapped, after Rack, square, sinking 2px, with no light, only hard ledges and insets with no blur, the ink as links and focus by day, the lime by night, and a lit key's outline at 3:1 on the concrete.
- The gallery: `look.ts` (the material, its `-heat` slug, its row with foundations and abilities), `motion/deal.ts` (the language above), `index.html` (the pre-paint grammar and Saira), `typeface.ts` (Saira in the face picker), `customize-state.tsx` (Heat's square shape), the scenes (`systems/heat.tsx`: standings, telemetry, the garage, splits), the world page (`pages/00-heat.tsx`), and every test that lists the worlds (`test-look`, `test:worlds`, `test:wall`, `test:playground`, `test:study`).

## The values

Light ("daylight"): a #d9dcda concrete canvas, #eef0ef panels, the ink #0b0d0c, the grey ink #3d4340, and the control line #6a716d. Dark: a #0b0d0c asphalt canvas, #111413 panels, #f2f5f3 ink and #bac3be grey ink. The lime is #c6f432 with #0b0d0c words in both themes. The status inks and data hues are Rack's round-one values by day and Press's by night, so the hues already proven on a body this pale or this dark carry over. Blue 4 and pink by night are Press's. Every pair passes check 5.

## Decisions for Nick

| # | Question | Suggested |
|---|---|---|
| H1 | The name | **Heat**, the pursuit meter's word, short, and no collision in the code. "Pursuit" is the other good one. |
| H2 | The accent | **Lime**, glowing at night and only a fill by day. Orange is Device's and yellow Rack's. The game's own amber glow would sit on both. |
| H3 | The face | **Saira Semi Condensed**. Barlow Semi Condensed is the fallback in the stack. |
| H4 | Hard ledges as the depth ladder | **Yes, under Heat only.** R3's bounds hold (a cast at most 3px down), but the blur is 0, so a key reads as cut metal. |
| H5 | The slant | **In bodies, not tokens.** A selected row as a parallelogram is the front end's most recognisable shape. It belongs in a Heat body for Menu, Select, Tabs and Segmented, where the part can keep its hit area and text upright. |
| H6 | Motion from the side | **The whip above.** It changes R4's "a set settles" for Heat alone. |

H2, H4 and H6 each change a rule (R6's glow, R3, R4) for Heat alone, so they go through `evolve.md` as Nick's decisions. Then the profile, SKILL.md's rules and `components.md` name Heat, committed with `taste:`.

## Next

- **Bodies.** Button (a key on its ledge, the primary lit lime), Menu, Select, Tabs and Segmented (the slanted selection bar, H5), Gauge (a tachometer body with a redline), Stat (big narrow figures).
- **The survey.** Every page shot in Heat against Press, light and dark, one row per page.
- **Fun mode under Heat.** Nothing yet. A boost (a short overshoot on the whip) is the obvious place.
