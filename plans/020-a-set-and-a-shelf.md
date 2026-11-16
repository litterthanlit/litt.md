# Plan 020: The player shows a world's best, and its gallery shows everything

> **Executor instructions**: Read `.claude/CLAUDE.md`, plan 018 (the object) and plan 019 (closed worlds) first. This
> plan changes gallery chrome only. Nothing in `src/components`, `src/motion`, `src/blocks` or `tokens.css` changes.

## Status

- **Priority**: P1 (Nick asked for it on 2026-11-16)
- **Effort**: M
- **Risk**: LOW. Gallery chrome and its checks.
- **Depends on**: plan 019, phases 1 to 3 (merged in #115).
- **Category**: direction

## Why

Nick, 2026-11-16, after the player gained a Home index, twelve groups and a rail: "maybe we need to bring the best
elements of each world to the player and have the rest in the gallery view."

The player ran every component in the world, about ninety, on twelve shelves. A player is a showcase. Ninety takes
made it a catalog inside a device, and it needed two levels of keys, a Home index and a rail to be usable at all. A
catalog is better as a page you scroll, where every component is live at once and you can see the groups side by side.

## Decision: a set and a shelf

| Where | What it holds | How you move |
|---|---|---|
| `#<world>` (the player) | The world's **set**: about twelve parts that show it best, its own parts first. | One row. Left and Right (or Up and Down) step, Home goes to Home, End to the last. Play runs the set. |
| `#<world>/components` (the gallery) | **Every** component in the world as a live tile, in the gallery's twelve groups. | Scroll, or jump to a group. A tile's name opens `#<world>/<component>`. |

The player's Home lists the set and links to the gallery ("Every component"). The rail lists the set with the same
link at its foot. On Device's dial, the top key goes to Index and the bottom key opens the gallery, as a click wheel's
top key is its menu. The world's top row gains Components between its name and About.

Worlds stay closed (plan 019): the gallery shows one world, and every link in it stays inside that world.

## The sets

Twelve each (Nick, 2026-11-16: "yes lets see it with 12. just pick the ones that present the world the best in their way"), in `gallery/src/gallery/play-object/takes.ts` (`SET`), each picked against the world's lines in `taste/litt-principles.md`: Press leads with what is raised and what is cut in, Flat with pills and what grows from where you touched, Rack with values you set and the things a person makes, Heat with its menu and its levels. `test:playground` fails if an id in a set is not in its world.

| World | Set |
|---|---|
| Press | button, switch, segmented, slider, input, select, dialog, menu, toast, stat, chart, table |
| Flat | button, switch, media, carousel, lightbox, card, accordion, avatar, header, tabs, popover, toast |
| Device | composer, agent-indicator, tool-call, message, seven-segment, tape-progress, switch, slider, gauge, copy-button, button, command-menu |
| Plain | form, input, select, checkbox, button, table, details, callout, breadcrumb, pagination, tabs, dialog |
| Rack | slider, curve-editor, spring-editor, pad, time-scrubber, inspector, number-field, color-picker, segmented, switch, button, range-chart |
| Heat | menu, tabs, segmented, button, slider, stat, gauge, rolling-number, progress, table, select, toast |

Device leads with the four parts that exist only in Device (agent indicator, seven segment, tape progress, copy button).
No other world has parts of its own yet.

## What this removes

The shelves in the player, the group keys (Up and Down between groups, Page Up and Page Down), the group ticks on the
tape, and the shelf sections in Home. The groups live on in the gallery view, where they help.

## Checks

- `test:playground` reads the flat keys, the set in Home and the rail, and that Home's "Every component" opens a
  gallery holding a tile for every component in the world, each named link staying in the world.
- `routes.mjs` adds `#<world>/components`, so the per-page checks (a11y, reflow, text zoom, forced colors, gaps,
  corners, motion) read the six galleries.
- `test:wall` reads the six galleries for empty tiles and sideways scroll as it reads the overview.

## Open, for Nick

1. **The sets.** Picked on 2026-11-16. Name what to swap.
