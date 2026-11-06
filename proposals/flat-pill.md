# Flat, its own language: the components theme

Written 2026-11-06 for Nick. Nick, on the Flat number field: "I think the number field is too similar to press, each theme should be its own thing." Then, from a screenshot of pill controls (an ink pill button, an ink switch, a grey bubble segmented control, a round ink checkbox, a round grey stepper): "let's see the whole flat system molded after those." On the result, the artifact Flat, Molded: "I really like this! Feels so easy on the eye!" and, after the shape picker: "Let's transform flat completely."

This is the components theme `proposals/flat.md` left open ("Out of scope: the components theme (next)"). Tokens alone made Flat a recoloured Press. This gives Flat its own recipes.

## The five rules

1. **One shape for every control, a pill by default.** Flat opens at the Pill shape (`--radius-control` 28, `--radius-surface` 16), and every other shape the Customize panel offers still works: each corner reads the radius tokens, never a number. A key with one symbol (an icon button, a stepper's − and +, an avatar, a radio) is a circle at every shape.
2. **An outline means off.** The only line left in Flat is the 3:1 `--line-control` edge of a control that is off: a switch, an unticked checkbox, an unpicked radio, a step to come. Groups (segmented tracks, steppers, card pickers, tables, cards) lose their frame.
3. **Ink means on.** A control that is on, a value committed, the one primary action: the accent fill (`--accent`, the ink in Monochrome) with `--accent-fg` on it. A switch that is on is an accent tray with a canvas knob; a ticked checkbox an accent circle.
4. **A grey bubble means chosen.** The current tab, page, segment, menu row or nav row sits in a soft grey fill (`--block`, `--surface-3` under Flat), as do fields. A field is a grey pill with no outline; focus is the ink ring (`--focus-ring`).
5. **No lines between things.** Rows, tables, menus and groups part with space and type: no dividers, no frames. A table keeps no header rule; a row lights up as a grey bubble under the pointer.

## What does not change

- **Press and Device.** Every Flat recipe is scoped to Flat (`in-[[data-material=flat]]:` in Tailwind, or `[data-material="flat"]` in `tokens.css`), so a Press or Device page renders to the pixel as before.
- **Words carry state (R1).** The switch drops its On and Off words in Flat only because side and fill say it, and the switch keeps `role="switch"` and its accessible name.
- **Status colour.** `--danger`, `--success` and `--warning` keep their roles. Flat changes shape and fill, not what colour means.
- **Motion.** Flat's motion language (taste v1.8: from the touch) stays. A grey bubble that moves between items (segmented, tabs) slides on the responsive spring, as today.
- **Accessibility floor.** Every off control keeps a 3:1 edge (WCAG 1.4.11). Under forced colors a grey bubble vanishes, so every chosen state also sets something the system colours keep (an outline, `forced-color-adjust`, or the existing forced-colors rule): `test:forced-colors` holds it.

## Recipes by family

| Family | Flat recipe |
|---|---|
| Button | Primary: accent pill. Secondary: `--block` grey pill, no cast. Ghost: bare, grey bubble on hover. Icon-only: a grey circle. Disabled: grey fill, `--fg-disabled`, no hairline. |
| Fields (input, textarea, number field, code input, token input, select trigger, combobox, date field, composer, file drop) | `--cut` is `--surface-3` under Flat: a grey field with no control line and no shade. Focus: the ink ring. Error: the `--danger` ring and the sentence. A multi-line field rounds to `--radius-surface`. The number field is a grey track with the value in a `--surface-1` bubble and round − and + either side. |
| Switch | Off: a transparent tray inside the 1.5px `--line-control` edge, a `--line-control` knob at the start. On: an accent tray, a canvas knob at the end. No On or Off words. |
| Checkbox and radio | Off: transparent, the `--line-control` edge. On: an accent fill, the mark in `--accent-fg`. Both round under Pill (the radio is always round); the checkbox follows `--radius-control` at other shapes. |
| Segmented and tabs | No track frame. The chosen item is a grey bubble (`--block`) at the control radius; the others are `--fg-muted` words. Underline tabs become bubble tabs. |
| Slider | A thin `--surface-3` track, the accent fill, a small accent knob. |
| Card picker and option picker | Each option a grey card; the chosen one lifts to `--surface-1` with a 2px accent ring and the accent radio. |
| Menus and lists (menu, context menu, select list, combobox list, command menu, sidebar, pagination) | Rows are grey bubbles under the pointer or for the current item, at the surface radius less the panel's padding (concentric). No separators: a gap of `--space-2` sets groups apart. Shortcuts are plain `--fg-muted` text, no key caps. |
| Overlays (popover, dialog, hover card, tooltip, toast) | A `--surface-1` card at `--radius-surface`, the float shadow, no hairline. A tooltip and a toast are accent pills (ink in Monochrome). |
| Data (table, list, stat, card, accordion, bar list, chart bars, progress, timeline, steps) | No rules or frames. Table rows and list rows light up as grey bubbles. A card is a `--surface-1` card with the float shadow, its cover inset and concentric. Bars, tracks and progress are pills. Steps: done is accent with a tick, now is an accent ring, to come is the `--line-control` edge. |
| Feedback (tag, callout, empty state, skeleton, kbd) | Tags are grey pills. A callout is a grey card with no hairline. Kbd is plain text. |

## Built

The reference is the throwaway page Flat, Molded (the session's scratchpad, not the repo). The work is split by family, one builder each, and every component keeps its Press and Device render.
