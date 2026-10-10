# Components

Reference specs for the core components. `assets/specimen.html` holds a working implementation of each one, so copy from there. Every component needs all of its states designed: default, hover, active, focus-visible, disabled, and loading, empty or error where they apply.

## Contents
Button · Input · Checkbox and radio · Segmented control · Tag · Kbd · Card · Glass header · Command menu · Popover and dropdown · Modal · Toast · Table and list rows · Empty and loading states

---

## Button
Square. Three sizes on the shared control scale (P10); the label is wrapped in `.litt-trim` so the padding equals the visible air:

| Size | Height | Side padding | Label | Use |
|---|---|---|---|---|
| sm | `--control-sm` 32 | `--control-pad-sm` 12 | 13 | Table rows, toolbars, dense UI |
| md | `--control-md` 44 | `--control-pad-md` 16 | 15 | Default |
| lg | `--control-lg` 56 | `--control-pad-lg` 24 | 16 | Hero CTAs and the submit in a form; full width in narrow forms |

Weight 400 at every size, no tracking. The transition covers background-color and color at `--dur-instant`. Press is `scale(var(--press-scale))`. Grouped buttons sit `--control-group-gap` (12) apart.

| Variant | Fill | Text | Edge | Use |
|---|---|---|---|---|
| Primary | `--accent` (hover `--accent-hover`) | `--accent-fg` | `--glow` plus a soft top highlight | The one main action per view (P1) |
| Secondary | `--surface-1` (hover `--surface-2`) | `--fg` | Inset 1px `--line-strong` and `--highlight`; no outer shadow | Everything else important |
| Ghost | Transparent (hover: fg at 6%) | `--fg-muted` → `--fg` | None | Tertiary actions, toolbars, cancel |
| Disabled | `--surface-2` | `--fg-disabled` | None | `cursor: not-allowed`; keep it in the tab order only if it explains itself |

- **Loading:** keep the width, swap the label for a 16px spinner (stroke `currentColor`, 1.5), and set `aria-busy="true"`.
- **Icons:** 16px, 1.5px stroke, `--control-gap` (8) from the label. Icon-only buttons are square in size (32/44/56), round (`--radius-pill`), and need an `aria-label`.
- **No arrow suffix by default.** An arrow is allowed only when the button navigates away from the site.

## Input
Square, on the same control scale as buttons: `--control-md` (44, padding 16, 15px text) by default, `--control-lg` (56, padding 24, 16px) next to an lg button, `--control-sm` (32) in tables and toolbars. Background `--surface-1`, text `--fg`, placeholder `--fg-subtle`. The edge is `inset 0 0 0 1px var(--line-control)`.
- **Inline form:** an lg input and an lg primary button side by side (`1fr auto`, `--space-2` apart), stacking full width below 640px.
- **Focus:** edge `--focus` plus `--focus-ring`. Remove the default outline only when you replace it this way.
- **Error:** edge `--danger`, set `aria-invalid="true"`, and add help text in `--danger` linked with `aria-describedby`. The message says how to fix it.
- **Label:** above the field, `--type-small-size` at `--weight` in `--fg` (color, not weight, sets it apart), `--space-2` gap. Placeholders are never labels.
- **Help text:** `--type-small-size` in `--fg-subtle`, `--space-2` below.

## Checkbox and radio
Native inputs at 16px with `accent-color: var(--accent)`. The label is on the right, `--space-2` gap, `--type-small-size`. The whole label is clickable.

## Segmented control
A square track with fill at fg 5%, an inset `--line` edge and 2px padding. Each segment is caption size in `--fg-subtle`. The selected segment gets `--surface-1`, `--fg`, an inset `--line` and `--highlight`. Build it from `fieldset` and radio inputs, with a visually hidden legend.

## Tag
24px tall, `--radius-pill`, `--surface-2` fill, inset `--line`, caption size in `--fg-subtle`. A status tag colors the text and a 6px dot with the status color, never the fill.

## Kbd
`--font-mono` at 11px and weight 400, a square 20px chip, `--surface-2`, inset `--line`. Use it for real shortcuts only.

## Card
`.litt-raised`: square, `--surface-1`, inset `--line`, `--highlight`, and no outer shadow (P4). Padding `--space-6` (or `--space-2` around a cover, then `--space-4`/`--space-3` for the body).
- A cover is square, optionally `.litt-lit .litt-grain` as the card's own top light.
- Hover (when the card links somewhere): the fill moves one step (`--surface-2`). No lift, no shadow growth, no scale.
- Cards are never glass (P3), never have an accent rail, and are not the default layout for features.

## Glass header
Sticky, `--header-h`, `.litt-glass`, content in a `--container-wide` wrap.
- Order: wordmark → nav (small size in `--fg-subtle`; hover `--fg` with fg-6% fill) → right-aligned actions.
- On mobile, hide the nav behind the command menu or a menu button. Don't squeeze it.

## Command menu
A native `<dialog>` in the top layer, `.litt-glass` with `--glass-shadow: var(--shadow-modal)`, square, max width 560px, 15vh from the top.
- **Input:** 52px tall, 16px search icon in `--fg-subtle`, no visible border except a bottom `--glass-border`.
- **Rows:** small size, square, padding `--space-2`/`--space-3`. The selected row gets an fg-7% fill and `--fg`, plus a `↵` kbd hint.
- **Behavior:** the combobox + listbox pattern (`aria-activedescendant`); ArrowUp and ArrowDown move, Enter selects, Esc closes (native), and a backdrop click closes.
- **Motion:** enters over `--dur-panel` with opacity, 4px translate and scale 0.98. No exit animation needed.
- Open with ⌘K or Ctrl+K and a visible trigger button.

## Popover and dropdown
Glass with `--shadow-float`, square, padding `--space-1`, rows as in the command menu. Positioned in the top layer (`popover` attribute) or a portal. Enter over `--dur-reveal` with opacity and 4px translate from the anchor side. Exit over `--dur-exit-reveal`.

## Modal
Square glass panel with `--glass-shadow: var(--shadow-modal)`, padding `--space-8`, max width 480px (forms) or 640px. The title is `--type-h4` in `--fg`. Actions sit bottom right: primary last, secondary or ghost before it. The backdrop tint is `color-mix(in oklab, var(--canvas) 55%, transparent)`.

## Toast
Square glass with `--shadow-float`, padding `--space-3`/`--space-4`, small size in `--fg`, an 8px status dot. Bottom right on desktop, bottom center on mobile. `role="status"` (or `alert` for errors). Auto-dismiss after 5s, but never for errors. An undo action sits on the right as a ghost button or kbd hint.

## Table and list rows
Rows are separated by 1px `--line`, padding `--space-3`/`--space-4`, small size. The primary cell is `--fg`; the rest are `--fg-subtle`. Numbers and dates use `--font-mono` caption size, right-aligned. Hover is an fg-4% fill. A sticky header row is caption size in `--fg-subtle`, sentence case.

## Empty and loading states
- **Empty:** one sentence saying what will appear here and one action to make it appear. Left-aligned in the container. No illustration unless art direction (Q5) says so.
- **Loading:** the skeleton fills with `--surface-2` at the real content's dimensions. Static, or a single opacity pulse of at most 240ms per pass, disabled under reduced motion. Never a sweeping shimmer gradient (P5).
- **Error:** what went wrong, in plain words, plus how to fix it or retry. Status color on the text or icon only.
