# Components

Reference specs for the core components. `assets/specimen.html` shows the static look of most of them (buttons, inputs, checkboxes, the segmented control, tags, kbd, cards, the glass header, the command menu, a static menu and a toast), so copy from there. Their motion behavior is specified below and built in the gallery (`gallery/` in this repo). Tooltip, tabs, modal, tables and empty and loading states are not in the specimen. Every component needs all of its states designed: default, hover, active, focus-visible, disabled, and loading, empty or error where they apply.

## Contents
Button · Input · Checkbox and radio · Segmented control · Tabs · Tag · Kbd · Card · Glass header · Tooltip · Command menu · Popover and dropdown · Modal · Toast · Table and list rows · Empty and loading states

---

## Button
`--radius-control`. Three sizes on the shared control scale (P10); the label is wrapped in `.litt-trim` so the padding equals the visible air:

| Size | Height | Side padding | Label | Use |
|---|---|---|---|---|
| sm | `--control-sm` 32 | `--control-pad-sm` 12 | 13 | Table rows, toolbars, dense UI |
| md | `--control-md` 44 | `--control-pad-md` 16 | 15 | Default |
| lg | `--control-lg` 56 | `--control-pad-lg` 24 | 16 | Hero CTAs and the submit in a page form; full width in narrow forms. A dialog's actions are md. |

Weight 400 at every size, no tracking. Hover changes the fill and color, and press scales to `--press-scale`, both on the instant tier (`--dur-instant`, `--ease-out`). On coarse screens a pressed button also takes its hover fill, so the press shows under reduced motion. The box never moves. Grouped buttons sit `--control-group-gap` (12) apart.

| Variant | Fill | Text | Edge | Use |
|---|---|---|---|---|
| Primary | `--accent` (hover `--accent-hover`) | `--accent-fg` | `--glow` plus a soft top highlight | The one main action per view (P1) |
| Secondary | `--surface-1` (hover `--surface-2`) | `--fg` | Inset 1px `--line-strong` and `--highlight`; no outer shadow | Everything else important |
| Ghost | Transparent (hover: fg at 6%) | `--fg-muted` → `--fg` | None | Tertiary actions, toolbars, cancel |
| Disabled | `--surface-2` | `--fg-disabled` | Inset 1px `--line`, so it keeps its shape on a surface-2 area | `cursor: not-allowed`; keep it in the tab order only if it explains itself |

- **Loading:** keep the width, swap the label for a 16px spinner (stroke `currentColor`, 1.5), and set `aria-busy="true"`.
- **Icons:** 16px, 1.5px stroke, `--control-gap` (8) from the label. An icon may also come as a child next to the label, as shadcn writes it: each run of text is a trimmed label and each element sits in the row. Icon-only buttons are square in size (32/44/56), round (`--radius-pill`), and need an `aria-label`.
- **No arrow suffix by default.** An arrow is allowed only when the button navigates away from the site.

## Input
`--radius-control`, on the same control scale as buttons: `--control-md` (44, padding 16, 15px text) by default, in dialogs and in stacked forms; `--control-lg` (56, padding 24, 16px) only when it shares a row with an lg button (the inline form); `--control-sm` (32) in tables and toolbars. Background `--surface-1`, text `--fg`, placeholder `--fg-subtle`. The edge is `inset 0 0 0 1px var(--line-control)`.
- **Inline form:** an lg input and an lg primary button side by side (`1fr auto`, `--space-2` apart), stacking full width below 640px.
- **Focus:** edge `--focus` plus `--focus-ring`. Remove the default outline only when you replace it this way.
- **Error:** edge `--danger`, set `aria-invalid="true"`, and add help text in `--danger` linked with `aria-describedby`. The message says how to fix it.
- **Label:** above the field, `--type-small-size` at `--weight` in `--fg` (color, not weight, sets it apart), `--space-2` gap. Placeholders are never labels.
- **Help text:** `--type-small-size` in `--fg-subtle`, `--space-2` below.
- **Textarea:** the same field for longer text, with the same edge, focus, error, label and help text. It has no fixed height, so its size sets the air above and below the text, and it resizes vertically only.

## Checkbox and radio
Native inputs at 16px with `accent-color: var(--fg)`. A drawn checkbox is a 20px chip at `--radius-control`, filled with `--fg` and a `--canvas` mark when on. Not the accent (P1): a form can hold many checked boxes, and the accent stays on the one primary action. A switch follows the same rule. The label is on the right, `--space-2` gap, `--type-small-size`. The whole label is clickable.

## Segmented control
A `--radius-surface` track with fill at fg 5%, an inset `--line` edge and 4px (`--space-1`) padding, so the segments inside it, at `--radius-control`, stay concentric. Each segment is caption size in `--fg-subtle`. The selected segment gets `--surface-1`, `--fg`, an inset `--line` and `--highlight`. Build it from `fieldset` and radio inputs, with a visually hidden legend.

## Tabs
Underline or segmented. Use the ARIA tabs pattern (`tablist`, `tab`, `tabpanel`); arrow keys move between tabs.
- **Indicator:** slides to the picked tab (transform, responsive tier).
- **Label:** changes color only, on the instant tier.
- **Panel:** fades in from the side of the picked tab (opacity plus a short translate, responsive tier).
- **Touch:** sm tabs grow to `--control-md` on coarse screens, so no tab is under 44px.

## Tag
24px tall, `--radius-pill`, `--surface-2` fill, inset `--line`, caption size in `--fg-subtle`. A status tag colors the text and a 6px dot with the status color, never the fill. When several tags sit on one item, keep one status tag and let the rest be plain.

## Kbd
`--font-mono` at the caption size (12px) and weight 400, a 20px chip at `--radius-control`, `--surface-2`, inset `--line`. Use it for real shortcuts only.

## Card
`.litt-raised`: `--radius-surface`, `--surface-1`, inset `--line`, `--highlight`, and no outer shadow (P4). Padding `--space-6` (or `--space-1` around a cover, then `--space-4` above and at the sides and `--space-3` below for the body).
- A cover is `--radius-control` when the card pads it by 4px, and takes the card's `--radius-surface` when full-bleed. Optionally `.litt-lit .litt-grain` as the card's own top light.
- Hover (when the card links somewhere): the fill moves one step (`--surface-2`). No lift, no shadow growth, no scale. On coarse screens a press shows the same step.
- Cards are never glass (P3), never have an accent rail, and are not the default layout for features.

## Glass header
Sticky, `--header-h`, `.litt-glass`, content in a `--container-wide` wrap.
- Order: wordmark → nav (small size in `--fg-subtle`; hover `--fg` with fg-6% fill) → right-aligned actions.
- It is full-bleed, so it sets `border-radius: 0` (`.litt-glass` carries the surface radius).
- On mobile, hide the nav behind the command menu or a menu button. Don't squeeze it.
- **On compact screens** the nav stays behind the menu button and opens as the anchored dropdown (see Popover and dropdown). The bar stays sticky at the safe-area inset and never hides on scroll. Links and the menu button are `--control-md` on coarse screens.

## Tooltip
Solid, not glass, with `--shadow-tooltip`, `--radius-control` and small type in `--fg`.
- **Delay:** opens after a 200ms hover delay, and at once on focus.
- **Motion:** responsive tier. It grows from the trigger from `--press-scale` (0.98) and travels in a quarter of `--travel` from the side it renders on.
- **Exit:** `--dur-exit-responsive` with `--ease-out`.
- **On touch** a tooltip opens on a press and hold of 500ms, not on a tap, so a tap only does what the button does. (500ms is an interaction delay, like the 200ms hover delay, not a motion token.) It closes on the next touch anywhere. Shortcut chips are hidden on coarse screens. The label that matters must also be the button's `aria-label`, or visible text.

## Command menu
A native `<dialog>` in the top layer, `.litt-glass` with `--glass-shadow: var(--shadow-modal)`, `--radius-surface`, max width 560px, 15vh from the top.
- **Input:** 52px tall, 16px search icon in `--fg-subtle`, no visible border except a bottom `--glass-border`.
- **Rows:** small size, `--radius-control`, padding `--space-2`/`--space-3`, in a list padded `--space-1` so the corners stay concentric. The lit row gets an fg-7% fill and `--fg`, plus a `↵` kbd hint.
- **Behavior:** the combobox + listbox pattern (`aria-activedescendant`). The first enabled row is always lit. ArrowUp and ArrowDown move, wrap and skip disabled rows. Enter fires only on the lit row. Esc clears the query first, then closes. A backdrop click closes.
- **Filtering:** typing changes the list instantly, in the original order, and the panel never animates its height. The empty state says nothing matches and drops the Enter hint.
- **Motion:** responsive tier. It drops in over a dimmed canvas (`--dur-responsive`, `--ease-responsive`) with opacity, a quarter of `--travel` and `--press-scale`, and leaves on `--dur-exit-responsive`. One gliding highlight (transform, responsive) follows the lit row. The specimen shows the entrance and a per-row fill; the glide is built in the gallery.
- Open with ⌘K or Ctrl+K and a visible trigger button.
- **On compact screens** the panel sits at the top edge: `--space-2` below the safe-area inset and `--space-2` from each side, not 15vh down. Its list height is the visible screen less the keyboard, read from the visual viewport, so no row hides behind the keyboard.
- **Motion on compact** stays on the responsive tier: it drops from the top by half of `--travel`, scales from `--press-scale`, and leaves on `--dur-exit-responsive`. It is not draggable, because its list scrolls.
- **Touch:** the hints (↑↓, ↵, esc and row shortcuts) are hidden. A Cancel button, `--control-md` tall, sits beside the field. The field takes focus, because typing is the point.

## Popover and dropdown
Glass with `--shadow-float`, `--radius-surface`, padding `--space-1`, rows at `--radius-control` as in the command menu. Positioned in the top layer (`popover` attribute) or a portal.
- **Motion:** responsive tier. It grows from the trigger's corner from `--press-scale` (0.98) and slides a quarter of `--travel`. One gliding highlight (transform, responsive) follows the lit row. Exit on `--dur-exit-responsive`.
- **Open:** a pointer open lights nothing until the pointer moves. A keyboard open (Enter or ArrowDown) lights the first row with a focus ring.
- **Submenus** are solid, because glass never sits on glass.
- **Checkbox and radio rows** keep the check in a fixed 16px cell, so labels never shift, and the menu stays open while options change.
- **Edges:** near the bottom edge the menu flips up, and the entrance follows the side it opens on.
- **On compact screens** a popover becomes a bottom sheet (see Modal), because it holds fields and pickers that need the width and a place above the keyboard. A dropdown menu stays anchored: its rows are already 44px and the finger is beside it.
- **Submenus on compact screens** do not fly out sideways. The submenu replaces the list in the same panel, with a Back row first. The two lists cross-fade and slide as Tabs panels do: half of `--travel` in, a quarter out, on the responsive tier. The panel's height snaps to the new list and is never animated.
- **Touch rows** fill when pressed (instant tier, color only). Shortcut hints are hidden on coarse screens.

## Modal
Glass panel at `--radius-surface` with `--glass-shadow: var(--shadow-modal)`, padding `--space-8`, max width 480px (forms) or 640px. The title is `--type-h4` in `--fg`. Actions sit bottom right at md, primary last, secondary or ghost before it. Fields in a dialog are md too. The backdrop tint is `color-mix(in oklab, var(--canvas) 55%, transparent)`.
- **Motion:** the view's expressive moment: placed, not thrown. It rises by `--travel` and settles from `--press-scale` (0.98), and may bounce slightly (`--dur-expressive`, `--ease-expressive`). If the view has already used its expressive moment, the dialog uses the responsive tier (a `tier` choice on the component).
- **Exit:** `--dur-exit-expressive` with `--ease-out`. It never bounces.
- **On compact screens** it is a bottom sheet. `side="right"` becomes the same sheet, so no strip of page is left at the edge. It is glass, flush with the bottom, with `--radius-surface` on the top corners only, and it pads its footer by the safe-area inset. A 32px by 4px grabber in `--line-strong` sits at the top centre. The body scrolls inside, with `overscroll-behavior: contain`.
- **Motion on compact:** it always rises on the expressive spring and does not use up the view's expressive moment (Foundations section 6), whatever `tier` says. It rises by its own height, by transform only, and may bounce as the token allows (`--ease-expressive` peaks at 1.0012, about half a pixel on a 450px sheet). It leaves the same way on `--dur-exit-expressive` with `--ease-out`.
- **Above the keyboard:** the sheet's bottom follows the visual viewport, so the keyboard never covers its footer or the field being typed in.
- **Drag and buttons:** it can be dragged down from anywhere that follows the rules in Foundations section 6. The close button is 44px on coarse screens. Cancel, Esc and a scrim tap also close it.

## Toast
Glass at `--radius-surface` with `--shadow-float`, padding `--space-3`/`--space-4`, small size in `--fg`, an 8px status dot. Bottom right on desktop, bottom center on mobile. `role="status"` (or `alert` for errors). Auto-dismiss after 5s, but never for errors. An undo action sits on the right as a ghost button or kbd hint.
- **Motion:** it arrives from just below its corner and settles. That is the expressive tier when the toast is the view's moment, otherwise the responsive tier. It leaves sideways by the same small distance, on the exit token for its tier.
- **Stacking:** older toasts stack behind the newest and open into a list on hover or focus.
- **On compact screens** the toast spans the page gutters, sits `--space-4` above the bottom edge or the safe-area inset, and leaves downward by `--travel` on a timeout, not sideways.
- **Over a sheet:** while a sheet is open on a compact screen, the toast docks at the top edge, `--space-2` below the safe-area inset (where the command menu sits), and arrives and leaves upward, so it never covers the sheet's buttons.
- **Swipe:** a sideways drag moves the toast one to one. It leaves past `--dismiss-distance` of its width or faster than `--dismiss-velocity`, in the direction it was going. The close button stays, 44px on coarse screens. A tap on the stack pins it open, as before.

## Table and list rows
Rows are separated by 1px `--line`, padding `--space-3`/`--space-4`, small size. The primary cell is `--fg`; the rest are `--fg-subtle`. Numbers and dates use `--font-mono` caption size, right-aligned. Hover is an fg-4% fill. A sticky header row is caption size in `--fg-subtle`, sentence case.
- **Hover:** the fg-4% fill is for airy lists (project rows, tables). Dense lists (menus, the command menu) use the gliding highlight. Hover never moves anything.
- **Entrance:** rows and raised cards arrive in one staggered cascade (`--stagger`, `--travel`, expressive tier). That cascade is the page's single expressive moment.
- **Filter and insert:** responsive and position-only (FLIP via transform), so text never stretches.

## Empty and loading states
- **Empty:** one sentence saying what will appear here and one action to make it appear. Left-aligned in the container. No illustration unless art direction (Q5) says so.
- **Loading:** the skeleton fills with `--surface-2` at the real content's dimensions, and it is static. No pulse and no shimmer: a loop is motion that is not a response to the user, and a sweeping gradient animates material (P5).
- **Error:** what went wrong, in plain words, plus how to fix it or retry. Status color on the text or icon only.
