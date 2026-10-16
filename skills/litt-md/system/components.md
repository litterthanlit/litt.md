# Components

Reference specs for the core components. `assets/specimen.html` shows the static look of most of them (buttons, inputs, checkboxes, the segmented control, tags, kbd, cards, the glass header, the command menu, a static menu and a toast), so copy from there. Their motion behavior is specified below and built in the gallery (`gallery/` in this repo). Tooltip, tabs, modal, tables, pagination, stat tiles, charts, the app shell, empty and loading states, select, switch, slider and forms are not in the specimen. Every component needs all of its states designed: default, hover, active, focus-visible, disabled, and loading, empty or error where they apply.

## Contents
Button · Input · Select · Checkbox and radio · Switch · Slider · Segmented control · Tabs · Tag · Kbd · Card · Glass header · Tooltip · Command menu · Popover and dropdown · Modal · Toast · Table and list rows · Pagination · Stat · Chart · App shell · Empty and loading states · Forms

---

## Button
`--radius-control`. Three sizes on the shared control scale (P10); the label is wrapped in `.litt-trim` so the padding equals the visible air at sm and md. lg runs wider than its air, so a short label never makes a square block:

| Size | Height | Side padding | Label | Use |
|---|---|---|---|---|
| sm | `--control-sm` 32 | `--control-pad-sm` 12 | 13 | Table rows, toolbars, dense UI |
| md | `--control-md` 44 | `--control-pad-md` 16 | 15 | Default |
| lg | `--control-lg` 56 | `--button-pad-lg` 32 | 16 | Hero CTAs and the submit in a page form; full width in narrow forms. A dialog's actions are md. |

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

## Select
One value from a short list (a role, a region, a plan). It replaces the native `<select>`, whose list cannot be styled on the desktop and whose rows are 28 to 30px on a phone.
- **Trigger:** the Input's look and sizes: sm 32, md 44 (the default, in dialogs and stacked forms), lg 56; `--radius-control`, `--surface-1`, the inset `--line-control` edge, the same focus, error and disabled states, 16px text on coarse pointers. The value is `--fg`, the placeholder `--fg-subtle`, and a 16px chevron in `--fg-subtle` sits at the end, `--control-gap` from the text. The chevron never turns. No hover fill, like the Input.
- **List:** anchored below the trigger and flipped above it when there is no room, at least as wide as the trigger. It is the Menu's panel: glass at `--radius-surface` with the 4px inset, 44px rows at `--radius-control` with 12px side padding, and one gliding highlight. The current option carries a 16px check at the row's end in `--fg`: never bold, never a dot, never the accent. A long list scrolls inside the panel, which never grows past the room on screen.
- **Motion:** the responsive tier, as the Menu: the list grows from the trigger and travels a quarter of `--travel` from the side it opens on, and leaves on the exit token.
- **Keyboard:** Space, Enter or ↓ opens it on the current option; ↑↓ move, typing jumps to a match, Enter picks, Esc closes and keeps the value. Focus returns to the trigger.
- **Label:** above the trigger, as the Input's, with help text or an error under it. A form sends the value, through a hidden native field.
- **On compact screens** the list stays anchored, like a dropdown menu: a phone form's trigger is full width, so the list is too, and its rows are already 44px. It is not a sheet.
- Inside a dialog, a sheet or the header the list is solid (`--surface-2` and `--shadow-float`), never glass on glass.

## Checkbox and radio
Native inputs at 16px with `accent-color: var(--fg)`. A drawn checkbox is a 20px chip at `--radius-control`, filled with `--fg` and a `--canvas` mark when on. Not the accent (P1): a form can hold many checked boxes, and the accent stays on the one primary action. A switch follows the same rule. The label is on the right, `--space-2` gap, `--type-small-size`. The whole label is clickable.

## Switch
An on or off setting that takes effect as a setting, such as an email when a build finishes. A choice that can be wrong, such as accepting terms, is a checkbox, so a switch has no error state.
- **Shape:** a pill track, 36 by 20, with a 16px round thumb inset 2px. Its 20px height matches the checkbox chip.
- **Off:** the track is `--surface-1` with an inset 1px `--line-control` edge, and the thumb is `--line-control`, at the start.
- **On:** the track fills with `--fg` and the thumb turns `--canvas`, at the end. Never the accent (P1). On and off differ in position, fill and thumb color, so color is never the only signal.
- **Motion:** the thumb slides by transform and the fill fades, both on the instant tier: a switch is a toggle. The box never moves.
- **Hover and press:** a wash at fg 6% over the track, like the checkbox; on a coarse pointer a press shows the wash too.
- **Disabled:** the track is `--surface-2` with a `--line` edge, and the thumb `--fg-disabled`; on and disabled, the track is `--surface-3`. The label dims to `--fg-disabled`, but the description stays `--fg-subtle`: it is often what says why the switch is off-limits, so it must stay readable. A checkbox's description does the same.
- **Label:** the label sits right of the switch, `--space-2` away, at the small size, and the whole row toggles it. A description can sit under the label in `--fg-subtle`. In a settings list the label and description come first and the switch sits at the row's end (`align="end"`), so the switches line up in one column.
- **Touch:** the row is at least 44px tall on coarse pointers.
- Build it on a `role="switch"` button with `aria-checked`. Space toggles it. A form sends it like a checkbox.

## Slider
A value on a continuous range, such as the default animation speed. Use it when the position matters more than the exact number; when the number matters, use an Input.
- **Rail:** 4px tall at `--radius-control`, filled at fg 12%. The range from the start to the thumb fills with `--fg`, never the accent (P1).
- **Thumb:** a 20px circle in `--surface-1` with an inset 1px `--line-control` edge, so it reads on the range and on the rail in both themes. Hover fills it `--surface-2`. The focus ring sits on the thumb.
- **Labels:** the label above, as the Input's. The value can sit at the end of the label row in `--font-mono` at the small size, `--fg-muted`, with tabular numbers. Words for the two ends ("Slower", "Faster") sit under the rail's ends at the caption size in `--fg-subtle`, and say which way is which.
- **Motion:** the thumb and the range follow the pointer one to one, with no easing, and an arrow key moves them at once. Their position is a layout value, and an eased jump would lag the key. Colors fade on the instant tier.
- **Keyboard:** ←→ and ↑↓ step, Page Up and Page Down step by a tenth of the range, Home and End go to the ends.
- **Touch:** the hit area is 44px tall on coarse pointers. A drag that starts on a slider never moves a sheet.
- **Disabled:** the rail at fg 6%, the range `--fg-disabled`, the thumb `--surface-2` with a `--line` edge. The label dims to `--fg-disabled`; the value and the end words stay `--fg-subtle`, because they are still read.

## Segmented control
A `--radius-surface` track with fill at fg 5%, an inset `--line` edge and 4px (`--space-1`) padding, so the segments inside it, at `--radius-control`, stay concentric. Each segment is caption size in `--fg-subtle`. The selected segment gets `--surface-1`, `--fg`, an inset `--line` and `--highlight`. Build it from `fieldset` and radio inputs, with a visually hidden legend.

## Tabs
Underline or segmented. Use the ARIA tabs pattern (`tablist`, `tab`, `tabpanel`); arrow keys move between tabs.
- **Indicator:** slides to the picked tab (transform, responsive tier).
- **Label:** changes color only, on the instant tier.
- **Panel:** fades in from the side of the picked tab (opacity plus a short translate, responsive tier).
- **Touch:** sm tabs grow to `--control-md` on coarse screens, so no tab is under 44px.

## Tag
The selected segment's look, in mono: 24px tall, `--radius-control`, a `--surface-1` fill with an inset `--line` and `--highlight`, and `--font-mono` at the caption size. A plain tag is `--fg-muted`. A status tag colors only its text with the status color (neutral is `--fg-subtle`), never the fill, and there is no dot: the word says the status. When several tags sit on one item, keep one status tag and let the rest be plain. Filter chips sit beside tags, so they take `--radius-control` too; they stay in the sans, because they are controls.

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
- The current page is `--fg` with `aria-current="page"`, a lightness step from its neighbours. No dot. In the menu on mobile, the current page carries a check.
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
Glass at `--radius-surface` with `--shadow-float`, padding `--space-3`/`--space-4`, small size in `--fg`. No status dot: an error's title is `--danger`, and the words say the rest. Bottom right on desktop, bottom center on mobile. `role="status"` (or `alert` for errors). Auto-dismiss after 5s, but never for errors. An undo action sits on the right as a ghost button or kbd hint.
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

## Pagination
Previous and next for a table or list that shows one page of many. The range is the main information, so it comes first, in words.
- **Range:** "21 to 40 of 143" in `--font-mono` at the caption size, `--fg-subtle`, tabular, at the start of the row. No dashes and no en dashes. With no rows it says "No results". It is a polite live region, so a screen reader hears the new range after a page change.
- **Buttons:** Previous and Next are `sm` secondary buttons, text only, no arrows, sitting `--control-group-gap` (12) apart at the end of the row. The first page disables Previous and the last disables Next. If the button that was just pressed becomes disabled, focus moves to the other one, so it never falls to the page.
- **Page buttons:** numbered ghost buttons (`sm`, mono) between the two, with the current page as a secondary button and `aria-current="page"`. Long runs fold into an ellipsis: first, last, and one either side of the current page. They only show when the row is at least 36rem wide (the row measures itself, not the window). Below that the range and the two buttons are enough.
- **Semantics:** a `nav` with its own `aria-label` ("Deploys pages"), and a list inside it. It sits `--space-4` under the table it pages.
- **Motion:** none of its own. The rows it pages are the table's job (Table, `animateChanges`).
- **On compact screens** the buttons are 44px tall on coarse pointers, like every `sm` button there.

## Stat
A number tile for one figure that tells you how things stand: active projects, deploys this week, median build time.
- **Surface:** `.litt-raised` at `--radius-surface`, no shadow (P4), never glass (P3), never an accent rail. Padding is `--space-4` in a narrow group and `--space-6` from 48rem wide. The tile never has a hover, because it links nowhere.
- **Label:** above the value, small size, `--fg-subtle`, sentence case, no colon.
- **Value:** `--type-h3-size` in `--fg`, in the sans (not mono), with tabular numbers so a figure does not wobble when it updates. An optional unit ("s", "%") follows it directly, same size, in `--fg-subtle`.
- **Delta:** an optional line under the value at the caption size: a word and the number, "Up 12% on last week". The word says the direction. The color says whether it is news: `--success` for good, `--danger` for bad, `--fg-subtle` for neither. So a build time that fell is "Down 3 s on last week" in `--success`. Never an arrow glyph alone, never a dot. The good or bad judgment is also in hidden text ("good news"), so color is never the only signal.
- **Group:** a grid that measures itself. Two tiles across, four across from 36rem wide, one below 20rem. Tiles in a row share the row's height, and the gap is `--space-4`.
- **Semantics:** a description list. The label is the term and the value is its description, so a screen reader reads "Active projects, 12".
- **Motion:** none. A value that changes just changes. The entrance cascade belongs to the page.

## Chart
Bars compare amounts and a line follows change over time. Both are drawn in plain SVG, with no chart library, and both are quiet: P1 is the reason, because the accent belongs to the one primary action and a chart is made of many marks.
- **Color:** a mark is never the accent. One series is `--fg` at about 55% for bars and `--fg` for a line. The current mark (the last bar, or the last point) and the hovered or focused one are full `--fg`; while a mark is hovered or focused it replaces the current one, so only one is ever full. Up to three series step down the foreground: `--fg`, 55% and 30%, with a legend above the plot. At 30% a mark is under 3:1 against the card, so the third series' bars carry a 1px edge at 55% and its line is dashed.
- **Gridlines:** horizontal only, `--line` hairlines, with the zero baseline in `--line-strong`. Three to five lines in all. No vertical lines, no gradient, no area fill, no shadow, no glow on a mark.
- **Axis labels:** the caption size in `--font-mono`, `--fg-subtle`, tabular. Values sit at the start of their gridline, categories under their mark. When the marks are too close for their labels, every nth label shows, counting back from the last one so the current mark always keeps its label. Labels never overlap.
- **Bars:** at most 32px thick and at most 60% of their slot, so there is always air between them. Tops are square. A 2px corner is not on the radius scale, and the control radius would turn a 14px bar on a phone into a bullet. Grouped series sit side by side with a 2px gap. Bars grow up from the baseline.
- **Lines:** 2px, round joins, with a 4px marker on the current point and on the hovered or focused one. The points sit in the middle of their slots, so the first and last labels are never cut.
- **Tooltip:** a hovered or focused mark shows the Tooltip's look (solid `--surface-3`, `--shadow-tooltip`, `--radius-control`): the label in `--fg-muted` and the value in mono `--fg`, above the mark and kept inside the chart. It follows the pointer from mark to mark without re-entering. Esc hides it without moving focus. It repeats what the mark's label already says, so it is hidden from screen readers.
- **Marks:** the hit area is the whole column of the mark, not only the painted bar. Hover changes color only, on the instant tier. A keyboard-focused mark gets a 2px `--focus` ring drawn around it, 2px away.
- **Motion:** one entrance on the responsive tier. Bars grow from the baseline by `scaleY`, and a line fades in by opacity. Height, width and path data never animate; new data redraws at once. Reduced motion is handled by the hooks.
- **Keyboard:** one tab stop, on the current mark. Left and right arrows move along the marks, Home and End go to the ends.
- **Accessibility:** the SVG is `role="img"` with a label that summarises the data ("Deploys per day, last 14 days: from 5 to 1, peak 9"), and a visually hidden table lists every value. The marks are buttons in a labelled group, outside the image.
- **Touch:** a tap on a mark shows its tooltip and keeps it; a tap anywhere else clears it. The chart fills its container's width, the height is the caller's, and the plot never needs a horizontal scroll.
- **Meter:** a horizontal progress bar for one value against a limit, such as storage used. The label sits at the start in the small size, the value at the end in mono at the caption size, and the 4px rail under them is `--radius-control`, filled at fg 12% and then with `--fg` to the value. `role="meter"` with a name and a value text. The fill is never the accent. It does not animate.

## App shell
The frame around an app's pages: a sidebar for moving between them and a main area for the page.
- **Desktop:** a 240px sidebar on `--surface-1` with a `--line` hairline on its edge, and a main area that scrolls with the page. The sidebar column runs the full height of the page, so it reaches the bottom of a tall page. Its content is sticky and as tall as the window, so the wordmark and the links stay in view while the page scrolls.
- **Wordmark:** at the top of the sidebar, body size, `--fg`, in a row as tall as the glass header (`--header-h`).
- **Links:** 36px rows at the small size and `--radius-control`, with 12px side padding. The current page is `--fg` on a `--surface-2` fill with `aria-current="page"`. The others are `--fg-muted`, and hover fills them with fg at 6% and brightens the text, on the instant tier. No dots, no accent, no weight change. An optional 16px icon sits before the label. The sidebar holds one or more `nav` landmarks, each with its own name.
- **Main:** the page's own landmark, with the page gutter at the sides and `--space-8` above and below.
- **On compact screens** the sidebar is gone. A glass top bar, sticky at the safe-area inset like the header, shows the wordmark and an icon-only menu button, 44px, labelled "Open navigation", with `aria-expanded` and `aria-controls`. It opens the nav as the bottom sheet (see Modal): the same links in 44px rows, a heading, a close button, drag to close. Picking a link closes the sheet. The sheet does not use up the view's expressive moment.
- **Motion:** none of its own. The sheet is the Modal's.

## Empty and loading states
- **Empty:** one sentence saying what will appear here and one action to make it appear. Left-aligned in the container. No illustration unless art direction (Q5) says so.
- **Loading:** the skeleton fills with `--surface-2` at the real content's dimensions, and it is static. No pulse and no shimmer: a loop is motion that is not a response to the user, and a sweeping gradient animates material (P5).
- **Error:** what went wrong, in plain words, plus how to fix it or retry. Status color on the text or icon only.

## Forms
How the controls above make a page. One left-aligned column, never centered (P7).
- **Spacing:** fields sit `--space-6` (24) apart. Related controls share a fieldset with a legend at the small size in `--fg`, like a field's label. Groups sit `--space-12` (48) apart.
- **Settings page:** sections, each a title (`--type-body-size` in `--fg`) with one line of description in `--fg-subtle`, then its fields. From 1024 up the title and description take the left third and the fields the rest; below that they stack. A `--line` hairline and `--space-12` of air separate sections. Save comes last, alone, lg and primary.
- **Sign-up or contact:** one narrow column (about 400 wide), md fields, a consent checkbox above the submit, and the submit lg, primary and full width (P10).
- **Optional fields:** mark the optional ones, not the required ones: "(optional)" in `--fg-subtle` after the label. No asterisks.
- **Errors:** validate on submit, then again as each field changes, so a fixed field clears itself. Each invalid field shows its error under it, in `--danger`, saying how to fix it. Above the form an error summary names every problem: a `.litt-raised` panel with an inset 1px `--danger` edge, a title in `--fg` ("Fix 2 fields to save") beside a 16px alert icon in `--danger`, then one link per error that moves focus to its field. The summary takes focus when a submit fails. A form of three fields or fewer skips the summary and focuses its first invalid field.
- **Actions:** in a page form, the submit comes first at the column's start, with Cancel (ghost) after it, both lg. Below 640 they stack full width, submit on top. A dialog keeps its own order: bottom right, primary last, md. Never disable the submit to say a field is wrong; let the submit show the errors.
- **Saving:** the submit shows its loading state, then a toast confirms. A failed save keeps every value.
