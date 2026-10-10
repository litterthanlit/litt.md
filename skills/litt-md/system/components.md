# Components

Reference specs for the core components. `assets/specimen.html` holds a working implementation of each one, so copy from there. Every component needs all of its states designed: default, hover, active, focus-visible, disabled, and loading, empty or error where they apply.

## Contents
Button · Input · Checkbox and radio · Segmented control · Tag · Kbd · Card · Glass header · Command menu · Popover and dropdown · Modal · Toast · Table and list rows · Empty and loading states

---

## Button
Height 40px (32px compact), horizontal padding `--space-4`, `--radius-control`, `--type-body-size` at `--weight` (400). The transition covers background-color and color at `--dur-instant`. Press is `scale(var(--press-scale))`.

| Variant | Fill | Text | Edge | Use |
|---|---|---|---|---|
| Primary | `--accent` (hover `--accent-hover`) | `--accent-fg` | `--glow` plus a soft top highlight | The one main action per view (P1) |
| Secondary | `--surface-1` (hover `--surface-2`) | `--fg` | Inset 1px `--line-strong`, `--highlight`, `--occlusion-subtle` | Everything else important |
| Ghost | Transparent (hover: fg at 6%) | `--fg-muted` → `--fg` | None | Tertiary actions, toolbars, cancel |
| Disabled | `--surface-2` | `--fg-disabled` | None | `cursor: not-allowed`; keep it in the tab order only if it explains itself |

- **Loading:** keep the width, swap the label for a 16px spinner (stroke `currentColor`, 1.5), and set `aria-busy="true"`.
- **Icons:** 16px, 1.5px stroke, `--space-2` gap. Icon-only buttons are 40×40 and need an `aria-label`.
- **No arrow suffix by default.** An arrow is allowed only when the button navigates away from the site.

## Input
Height 40px, padding `0 var(--space-3)`, `--radius-control`, background `--surface-1`, text `--fg`, placeholder `--fg-subtle`. The edge is `inset 0 0 0 1px var(--line-control)`.
- **Focus:** edge `--focus` plus `--focus-ring`. Remove the default outline only when you replace it this way.
- **Error:** edge `--danger`, set `aria-invalid="true"`, and add help text in `--danger` linked with `aria-describedby`. The message says how to fix it.
- **Label:** above the field, `--type-small-size` at `--weight` in `--fg` (color, not weight, sets it apart), `--space-2` gap. Placeholders are never labels.
- **Help text:** `--type-small-size` in `--fg-subtle`, `--space-2` below.

## Checkbox and radio
Native inputs at 16px with `accent-color: var(--accent)`. The label is on the right, `--space-2` gap, `--type-small-size`. The whole label is clickable.

## Segmented control
A track with fill at fg 5%, an inset `--line` edge, 2px padding and `--radius-control`. Each segment is caption size in `--fg-subtle`. The selected segment gets `--surface-1`, `--fg`, an inset `--line`, `--highlight` and `--occlusion-subtle`. Build it from `fieldset` and radio inputs, with a visually hidden legend.

## Tag
24px tall, `--radius-pill`, `--surface-2` fill, inset `--line`, caption size in `--fg-subtle`. A status tag colors the text and a 6px dot with the status color, never the fill.

## Kbd
`--font-mono` at 11px and weight 400, a 20px chip, 4px radius, `--surface-2`, inset `--line` plus `inset 0 -1px 0 var(--line-strong)` to suggest a keycap. Use it for real shortcuts only.

## Card
`.litt-raised`: `--surface-1`, `--radius-card`, inset `--line`, `--highlight`, `--occlusion-subtle`. Padding `--space-6` (or `--space-2` around a cover, then `--space-4`/`--space-3` for the body).
- A cover is `--radius-control` inside, optionally `.litt-lit .litt-grain` as the card's own top light.
- Hover (when the card links somewhere): the fill moves one step (`--surface-2`). No lift, no shadow growth, no scale.
- Cards are never glass (P3), never have an accent rail, and are not the default layout for features.

## Glass header
Sticky, `--header-h`, `.litt-glass`, content in a `--container-wide` wrap.
- Order: wordmark → nav (small size in `--fg-subtle`; hover `--fg` with fg-6% fill) → right-aligned actions.
- On mobile, hide the nav behind the command menu or a menu button. Don't squeeze it.

## Command menu
A native `<dialog>` in the top layer, `.litt-glass`, `--radius-panel`, max width 560px, 15vh from the top.
- **Input:** 52px tall, 16px search icon in `--fg-subtle`, no visible border except a bottom `--glass-border`.
- **Rows:** small size, `--radius-control`, padding `--space-2`/`--space-3`. The selected row gets an fg-7% fill and `--fg`, plus a `↵` kbd hint.
- **Behavior:** the combobox + listbox pattern (`aria-activedescendant`); ArrowUp and ArrowDown move, Enter selects, Esc closes (native), and a backdrop click closes.
- **Motion:** enters over `--dur-panel` with opacity, 4px translate and scale 0.98. No exit animation needed.
- Open with ⌘K or Ctrl+K and a visible trigger button.

## Popover and dropdown
Glass, `--radius-card`, padding `--space-1`, rows as in the command menu. Positioned in the top layer (`popover` attribute) or a portal. Enter over `--dur-reveal` with opacity and 4px translate from the anchor side. Exit over `--dur-exit-reveal`.

## Modal
Glass panel, `--radius-panel`, padding `--space-8`, max width 480px (forms) or 640px. The title is `--type-h4` in `--fg`. Actions sit bottom right: primary last, secondary or ghost before it. The backdrop tint is `color-mix(in oklab, var(--canvas) 55%, transparent)`.

## Toast
Glass, `--radius-panel`, padding `--space-3`/`--space-4`, small size in `--fg`, an 8px status dot. Bottom right on desktop, bottom center on mobile. `role="status"` (or `alert` for errors). Auto-dismiss after 5s, but never for errors. An undo action sits on the right as a ghost button or kbd hint.

## Table and list rows
Rows are separated by 1px `--line`, padding `--space-3`/`--space-4`, small size. The primary cell is `--fg`; the rest are `--fg-subtle`. Numbers and dates use `--font-mono` caption size, right-aligned. Hover is an fg-4% fill. A sticky header row is caption size in `--fg-subtle`, sentence case.

## Empty and loading states
- **Empty:** one sentence saying what will appear here and one action to make it appear. Left-aligned in the container. No illustration unless art direction (Q5) says so.
- **Loading:** the skeleton fills with `--surface-2` at the real content's dimensions. Static, or a single opacity pulse of at most 240ms per pass, disabled under reduced motion. Never a sweeping shimmer gradient (P5).
- **Error:** what went wrong, in plain words, plus how to fix it or retry. Status color on the text or icon only.
