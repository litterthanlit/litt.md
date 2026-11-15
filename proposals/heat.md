# Heat: a world after a street-racing front end

Written 2026-11-15 for Nick. Nick asked for "a new world inspired by Need for Speed Most Wanted 2005 UI", then sent three of the game's menus (Audio, Controls and the music player) as the reference. This file says what was built, why, and what waits for Nick. Phase 1 (tokens, the check, the gallery's wiring and the world page) is built. Nothing in `taste/` changed, so the decisions below go through `evolve.md` before the profile names Heat. Heat is the sixth world, after Rack, so its check is 16 and its tokens follow Rack's.

## What the menus do, and what Heat takes from them

Heat takes the menus' grammar, not the game's brand. It copies no logo, blackletter titles, photographs, typeface, icons or layouts. The name is the pursuit meter's word, not the game's.

| The menus do | Heat says it as |
|---|---|
| A black panel over a sepia photograph | black slabs at night (`--heat-canvas` #050505), warm neutrals; by day the same menu on bleached sepia paper |
| Bands of diagonal hazard stripes above and below the panel | stripes of the slab's two darkest steps; in the scenes now, and a panel body's later |
| Four white corner brackets just outside the panel | the frame's brackets, in the ink |
| The selected row: amber label, amber corner brackets, ‹ › beside its value | `--accent-text` is the amber at night; the scenes draw the brackets and chevrons around the row under the keys or the pointer |
| Levels as gold dashed bars, unlit past the value | a row of dashes in `--accent-text`, the rest in `--line-strong` |
| Bindings as flat dark grey cells, the picked one amber-brown | `--block` cells; the picked one `--accent-tint` (#4a3210 at night) |
| Key hints along the foot, a keycap and a word | `Kbd` and a label |
| Cream bold type, labels set right against values | Saira, labels at the title weight in `--fg` (#f1ead6) |
| Square cells, no shadows | square corners and flat outlines; nothing casts, glows or sinks |

How it differs from the other five. Press is lit objects, Flat is fill alone, Device is hardware with glass, Plain is a page and Rack a quiet instrument. Heat is a menu you drive with keys. It is black and flat, and only the selection is lit.

## The motion language

The menus slide in from the side, fast. That makes Heat the one world whose sets travel sideways.

- **A set whips in from the left.** `deal` under Heat starts each piece `--travel` to the left and springs it home on the responsive spring (no bounce), with an opacity fade on the instant tier, a `--stagger` apart in reading order.
- **It leaves all at once, quicker than it came.** `gather` sends every piece half of `--travel` to the right, together, on the instant tier times `--exit`.
- **Overlays slide and never grow.** `useOverlayMotion` reports `slides` and `grow: 1` for Heat.
- **A press answers on the frame.** `--press-depth` is 0, and the outline darkens.

## What was built (phase 1)

- `skills/litt-md/assets/tokens.css`: `--heat-*` in the light, dark and system-dark blocks; the `[data-material="heat"]` block after Rack's; Blue 4, pink and monochrome restated after it; its answers without `color-mix()` and under `prefers-contrast: more`.
- `skills/litt-md/scripts/check.mjs`: check 5 runs every pair again as "heat light" and "heat dark", check 13 knows Heat's face, and new check 16 holds Heat's invariants. Every token is mapped, after Rack, square, with nothing sunk, cast, lit or glowing. By day the links and focus are the ink and a lit key's outline reaches 3:1 on the paper. By night the amber is its own words and ring.
- The gallery: `look.ts` (the material, its `-heat` slug, its row with foundations and abilities), `motion/deal.ts` (the language above), `index.html` (the pre-paint grammar and Saira), `typeface.ts` (Saira in the face picker), `customize-state.tsx` (Heat's square shape), the scenes (`systems/heat.tsx`: Audio, a settings menu you drive with the arrow keys; Controls, key bindings as cells; Standings, a scoreboard), the world page (`pages/00-heat.tsx`), and every test that lists the worlds.

## The values

Night: a #050505 canvas, #0c0c0b panels, #2a2927 cells, cream ink #f1ead6 and grey ink #c4bca6. Day: a #e4dfd2 paper canvas, #f2efe7 panels, ink #0d0c0a. The amber is #e4a230 with dark words, and its tint at night is #4a3210. The status inks and data hues are Rack's round-one values by day and Press's by night, except amber's slot, which is a brake red (#e0533a at night, #b23a1c by day) so the selection's amber keeps 0.12 from every hue. Every pair passes check 5.

## Decisions for Nick

| # | Question | Suggested |
|---|---|---|
| H1 | The name | **Heat**, the pursuit meter's word, short, and no collision in the code. "Pursuit" is the other good one. |
| H2 | The accent | **Amber, as the menus.** It sits near Device's orange and Rack's yellow, but the worlds never share a page, and check 5 keeps it 0.12 from every data hue. |
| H3 | The face | **Saira**, wide and squared. The menus' own face is not offered: it is the game's. |
| H4 | Stripes, brackets and dashes | **Bodies, not tokens.** They are shapes a part draws (a panel's bands, a row's brackets, a slider's dashes), so they go into Heat bodies for Menu, Select, Slider, Tabs, Segmented and a panel, as Plain's corner marks did. |
| H5 | A photograph behind the panels | **No.** The game's sepia city is its brand. The bleached sepia paper of the light theme keeps its warmth. |
| H6 | Motion from the side | **The whip above.** It changes R4's "a set settles" for Heat alone. |

H2 and H6 each change a rule (R6's own accent per world, R4) for Heat alone, so they go through `evolve.md` as Nick's decisions. Then the profile, SKILL.md's rules and `components.md` name Heat, committed with `taste:`.

## Next

- **Bodies.** Slider (the dashes, ‹ › on focus), Menu and Select (the amber brackets on the active row), Segmented and Tabs (‹ value › cycling, as the music player's "Sequential"), Button (a striped key with its keycap), Card (the striped bands and the frame's brackets).
- **The survey.** Every page shot in Heat against Press, light and dark, one row per page.
- **Fun mode under Heat.** Nothing yet. A boost (a short overshoot on the whip) is the obvious place.
