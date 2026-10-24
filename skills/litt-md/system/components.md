# Components

Reference specs for the core components. `assets/specimen.html` shows the static look of most of them (buttons, inputs, checkboxes, the segmented control, tags, kbd, cards, the glass header, the command menu, a static menu and a toast), so copy from there. Their motion behavior is specified below and built in the gallery (`gallery/` in this repo). Tooltip, tabs, modal, tables, pagination, stat tiles, details cards, charts, the app shell, empty and loading states, select, switch, slider, forms and the data-color step's items (token input, pad, avatar, callout, sparkline, breakdown, bar list, gauge, dot plot, spread, heatmap, timeline) the agents step's items (conversation and message, composer, thinking, tool call, plan, code block) the staples (combobox, date picker, color picker, slide to confirm, rolling number, accordion, scroll area, breadcrumb, context menu) the app screens' parts (code input, file drop, steps, progress) and the image parts (media, media player, carousel, lightbox) and the web app parts (number field, hover card, action bar, tree, resizable, log view) are not in the specimen. Every component needs all of its states designed: default, hover, active, focus-visible, disabled, and loading, empty or error where they apply.

## Contents
Button · Input · Number field · Code input · Token input · File drop · Select · Combobox · Date picker · Checkbox and radio · Switch · Slider · Pad · Color picker · Slide to confirm · Time scrubber · Segmented control · Tabs · Tag · Kbd · Icons · Avatar · Card · Media · Media player · Carousel · Callout · Accordion · Scroll area · Tree · Resizable · Glass header · Breadcrumb · Steps · Tooltip · Command menu · Popover and dropdown · Hover card · Context menu · Modal · Lightbox · Toast · Table and list rows · Action bar · Pagination · Stat · Details · Rolling number · Chart · Sparkline · Breakdown · Bar list · Gauge · Dot plot · Spread · Heatmap · Timeline · Log view · App shell · Empty and loading states · Progress · Forms · Conversation and message · Composer · Thinking · Tool call · Plan · Code block

---

## Button
`--radius-control`. Three sizes on the shared control scale (P10); the label is wrapped in `.litt-trim` so the padding equals the visible air at sm and md. lg runs wider than its air, so a short label never makes a square block:

| Size | Height | Side padding | Label | Use |
|---|---|---|---|---|
| sm | `--control-sm` 32 | `--control-pad-sm` 12 | 13 | Table rows, toolbars, dense UI |
| md | `--control-md` 44 | `--control-pad-md` 16 | 14 | Default |
| lg | `--control-lg` 56 | `--button-pad-lg` 32 | 16 | Hero CTAs only. A page form's submit and Cancel are md, like a dialog's actions. |

The label is at `--weight-title` at every size, with no extra tracking. Hover changes the fill and color, and press scales to `--press-scale`, both on the instant tier (`--dur-instant`, `--ease-out`). On coarse screens a pressed button also takes its hover fill, so the press shows under reduced motion. The box never moves. Grouped buttons sit `--control-group-gap` (12) apart.

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
`--radius-control`, on the same control scale as buttons: `--control-md` (44, padding 16, 14px text) by default, in dialogs and in stacked forms; `--control-lg` (56, padding 24, 16px) only when it shares a row with an lg button (the inline form); `--control-sm` (32) in tables and toolbars. Background `--surface-1`, text `--fg`, placeholder `--fg-subtle`. The edge is `inset 0 0 0 1px var(--line-control)`.
- **Inline form:** an lg input and an lg primary button side by side (`1fr auto`, `--space-2` apart), stacking full width below 640px.
- **Focus:** edge `--focus` plus `--focus-ring`. Remove the default outline only when you replace it this way.
- **Error:** edge `--danger`, set `aria-invalid="true"`, and add help text in `--danger` linked with `aria-describedby`. The message says how to fix it.
- **Label:** above the field, `--type-small-size` at `--weight-title` in `--fg`, `--space-2` gap. The typed text stays at `--weight`. Placeholders are never labels.
- **Help text:** `--type-small-size` in `--fg-subtle`, `--space-2` below.
- **Textarea:** the same field for longer text, with the same edge, focus, error, label and help text. It has no fixed height, so its size sets the air above and below the text, and it resizes vertically only.

## Number field
A number someone sets: seats on a plan, a limit, a price. The Input's field with − and + inside its end, a label above and a hint or an error below.
- **Field:** the Input's look, sizes and states (sm 32, md 44, lg 56; sm grows to 44 on coarse pointers). The number at `--weight` with tabular figures, so it never shifts as it changes, and an optional unit after it in `--fg-subtle`.
- **Steppers:** round ghost icon buttons in the field's end, − then +, 24, 32 or 40px with the field's own air around them, each disabled at its bound. A press steps once; held, it repeats after 400ms, every 70ms. They are not Tab stops and leave focus where it was, so a phone's keyboard never opens under a thumb that is only stepping.
- **Typing:** free while focused; read on leaving the field or Enter, in the page's locale, then kept between min and max, put on the step and shown formatted (`Intl.NumberFormat`, a currency or a percent). Text that is not a number goes back to the last value.
- **Keys:** ↑ ↓ step, Shift or Page Up and Page Down ten steps, Home and End the bounds.
- **Accessibility:** a spinbutton named by the label, with its value, bounds and the formatted value with its unit as `aria-valuetext`; the steppers are named "Increase seats".
- **Motion:** none. The edge fades on the instant tier, as the Input's.

## Code input
A short one-time code, such as the six digits from a sign-in email. It looks like one box per character and behaves like one text field.
- **Build:** one real `<input>` lies over the cells, invisible, with `autocomplete="one-time-code"`, so paste, the browser's autofill from a text message, password managers and screen readers all treat it as one field with its label. The cells are drawn from its value and hidden from assistive tech.
- **Anatomy:** the Input's field per cell (`--surface-1`, the inset `--line-control` edge, `--radius-control`), square on the control scale (md 44, lg 56), each character in the mono at the body size. In a box too narrow for them the cells share its width, never below 32px, so the page never scrolls sideways. Six cells split three and three with a wider gap. The label above at `--weight-title`, a hint or an error below, as a TextField.
- **Focus:** the cell the next character goes into takes the focus edge and ring, and an empty one shows a still 1px caret. Nothing blinks.
- **Typing:** only what the code can hold gets in (digits, or letters and digits in capitals), so a pasted "123 456" lands as 123456. The last character runs the completion callback once; the caller checks the code there. Backspace clears from the end.
- **Error and disabled:** an error puts the `--danger` edge on every cell and says what to do under them. Disabled is `--surface-2` and `--fg-disabled`. The edges fade on the instant tier.

## Token input
A field that collects short values as removable tokens: sender domains, recipients, tags. The Input's sibling, with the Tag inside.
- **Field:** the Input's: minimum heights `--control-sm`, `--control-md` (default) and `--control-lg`, `--radius-control`, `--surface-1`, the inset `--line-control` edge, the danger edge when invalid and the focus ring around the whole field while its text input is focus-visible. It grows by rows of 24px tokens, 4px apart; the text input takes the rest of the line, at least 8ch.
- **Tokens:** the Tag's look, in the sans at the label weight, with a 16px remove button named "Remove @stripe.com" whose target grows to 44px on coarse pointers. `collapseAfter` folds the rest into a "+N" token on `--surface-2` (named "N more") until the field is focused.
- **Adding and removing:** Enter, a comma or leaving the field adds what was typed; a paste splits on commas, semicolons and line breaks; duplicates and empties are ignored. A rejected value stays in the input with its message under the field. Backspace in an empty input removes the last token. The remove buttons are one roving stop: left and right walk them, right past the last returns to the input, and Backspace or Delete removes the focused one. `max` stops adding and says so.
- **Accessibility:** a real label; tokens are a list named by it; a polite live region says "Added stripe.com" and "Removed stripe.com"; the hint, the rejection and the limit are linked descriptions. `name` posts one hidden input per value.
- **Motion:** a new token fades in with a 0.98 scale on the responsive tier, its neighbors slide by transform, and a removed one fades out on the exit.

## File drop
Where someone adds files, by dropping or choosing them, and watches them upload.
- **Area:** a quiet panel at `--radius-surface` with a dashed `--line-strong` edge (a dashed edge is what says "drop here") and fg 3% inside. A row, not a centered stack: a raised 32px square with an up arrow, the words ("Drop files here", then the types and the limit in `--fg-subtle`) and a secondary sm button, Choose files. While files are over it the edge turns solid `--fg`, the fill goes to fg 6% and the words say what a drop will do, on the instant tier. On a touch screen it says "Add files".
- **Choosing:** the button opens the picker and is the only tab stop; a click anywhere on the area opens it too. Dragging is never the only way.
- **Checking:** a file of the wrong type or over the limit is turned away with one sentence under the area, in `--danger`, naming the file and why, in an alert. The rest are handed over.
- **Rows:** one per file, the name in the mono at the caption size, the size at the end, a Progress rail under the name while it uploads. A failed file keeps its rail where it stopped and says why, with Retry; Remove (or Cancel while it uploads) is a ghost icon button named for the file.
- **Disabled:** fg 3% with a `--line` edge, no drop and no tab stop. The words stay `--fg-subtle`, because they still say something (when it opens again), as a disabled Slide to confirm's do.

## Select
One value from a short list (a role, a region, a plan). It replaces the native `<select>`, whose list cannot be styled on the desktop and whose rows are 28 to 30px on a phone.
- **Trigger:** the Input's look and sizes: sm 32, md 44 (the default, in dialogs and stacked forms), lg 56; `--radius-control`, `--surface-1`, the inset `--line-control` edge, the same focus, error and disabled states, 16px text on coarse pointers. The value is `--fg`, the placeholder `--fg-subtle`, and a 16px chevron in `--fg-subtle` sits at the end, `--control-gap` from the text. The chevron never turns. No hover fill, like the Input.
- **List:** anchored below the trigger and flipped above it when there is no room, at least as wide as the trigger. It is the Menu's panel: glass at `--radius-surface` with the 4px inset, 44px rows at `--radius-control` with 12px side padding, and one gliding highlight. The current option carries a 16px check at the row's end in `--fg`: never bold, never a dot, never the accent. A long list scrolls inside the panel, which never grows past the room on screen.
- **Motion:** the responsive tier, as the Menu: the list grows from the trigger and travels a quarter of `--travel` from the side it opens on, and leaves on the exit token.
- **Keyboard:** Space, Enter or ↓ opens it on the current option; ↑↓ move, typing jumps to a match, Enter picks, Esc closes and keeps the value. Focus returns to the trigger.
- **Label:** above the trigger, as the Input's, with help text or an error under it. A form sends the value, through a hidden native field.
- **On compact screens** the list stays anchored, like a dropdown menu: a phone form's trigger is full width, so the list is too, and its rows are already 44px. It is not a sheet.
- Inside a dialog, a sheet or the header the list is solid (`--surface-2` and `--shadow-float`), never glass on glass.

## Combobox
Type to find one value, or several, in a long list: a client, a framework, a teammate. Select is for a short fixed list; Command menu is for actions.
- **Field:** the Input's look and sizes (sm 32, md 44 by default, lg 56), `--radius-control`, `--surface-1`, the inset `--line-control` edge, the same focus, error and disabled states, 16px text on coarse pointers. The text is the query. A 16px chevron button in `--fg-subtle` at the end opens and closes the list; it never turns. A label above it, help text or an error under it, as the Input's.
- **List:** anchored under the field and flipped above it when there is no room, as wide as the field. The Menu's panel: glass at `--radius-surface` with the 4px inset, 44px rows at `--radius-control`, one gliding highlight, the picked option's 16px check in a fixed cell at the row's start so labels never shift. Optional group labels, as the Menu's. At most eight rows show, then it scrolls inside. With no match a quiet row says "No matches for “marl”" and nothing is lit.
- **Behavior:** the combobox and listbox pattern: focus stays in the field and `aria-activedescendant` names the lit option. Typing opens the list and filters it in the original order, ignoring case and accents, and lights the first match. With an empty query the picked option is lit. ↓ opens or moves, ↑ moves, both wrap and skip disabled options; Enter picks the lit option; Esc closes the list first, then puts back the picked option's label. Leaving the field closes the list and puts the label back, so the field never holds text that is not a value.
- **Several values (`multiple`):** the picks sit inside the field as Token input's tokens, before the query, each with its remove button. A pick clears the query and keeps the list open. Backspace in an empty query removes the last token.
- **Motion:** the responsive tier, as the Menu: the list grows from the field and travels a quarter of `--travel` from the side it opens on, and leaves on the exit token. Typing changes the list at once; its height is never animated.
- **On compact screens** the list stays anchored, never a sheet, because a sheet would cover the field. Its height is the visible screen below the field less `--space-2`, read from the visual viewport, so no option hides behind the keyboard.
- **Accessibility:** a real label; `aria-expanded`, `aria-controls` and `aria-autocomplete="list"` on the field; a polite live region says how many options match a moment after typing stops ("4 options"). A form gets one hidden field per value with `name`.
- Inside a dialog, a sheet or the header the list is solid (`--surface-2` and `--shadow-float`), never glass on glass.

## Date picker
A day, or a range of days, from a month calendar: a launch date, a report's period. `Calendar` is the grid on its own; `DatePicker` is a field that opens it.
- **Values:** `YYYY-MM-DD` strings, never `Date` objects, so no time zone moves a day. `min`, `max` and `isDisabled` rule days out. The locale defaults to `en-GB` and the week to Monday, both props.
- **Calendar:** a header with the month and year at the body size in `--fg` ("October 2026") and previous and next as icon-only ghost sm buttons (pills). Weekday names in caption `--fg-subtle`, from `Intl`. Always six weeks, so the height never changes. Days are 40px cells (44px on coarse pointers) at `--radius-control`, numbers in `--font-mono` at the small size, tabular, `--fg`; days of the next and last month are `--fg-disabled`, and so are disabled days, which take no hover.
- **Day states:** hover fills with fg 6% on the instant tier. Today has an inset 1px `--line-strong` ring. The picked day is an `--fg` fill with `--canvas` text, never the accent (P1). In a range the two ends are filled and the days between them sit on an fg 8% band that runs square across the row and rounds only at its ends. While the second end is being chosen, hover previews the band.
- **Keyboard:** the date grid pattern: one day is a tab stop (the picked day, else today); ←→ move a day, ↑↓ a week, Home and End go to the week's ends, PageUp and PageDown a month, with Shift a year; Enter or Space picks. Focus is an inset 2px `--focus` ring.
- **Motion:** a new month slides half of `--travel` in from the side it comes from and cross-fades, on the responsive tier, as Tabs panels do; the month name cross-fades with it. Nothing else moves.
- **Date picker field:** the Select trigger's look and sizes, showing the date in words from `Intl` ("17 Oct 2026"; a range is "3 Oct to 17 Oct 2026") or a placeholder in `--fg-subtle`, with a 16px calendar icon at the end. It opens the Calendar in a Popover, which is a bottom sheet on compact screens. Picking a day closes it and focus returns to the field; in a range it closes after the second day. Optional presets ("Last 7 days") sit in a column of 36px rows beside the calendar, and above it as a row of sm secondary buttons on compact screens.
- **Accessibility:** the grid is labelled by the month; each day reads in full ("Friday 17 October 2026, today, selected"). The field is a button with `aria-haspopup="dialog"` and a real label. A form gets the value (or `start` and `end`) through hidden fields with `name`.

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
- **Label:** the label sits right of the switch, `--space-2` away, at the small size and `--weight-title`, and the whole row toggles it. A description can sit under the label in `--fg-subtle`. In a settings list the label and description come first and the switch sits at the row's end (`align="end"`), so the switches line up in one column.
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
- **Range:** two thumbs on one rail for a span, such as builds that took between 20s and 80s in a table filter. The part of the rail between the thumbs fills with `--fg`, and the rail outside it stays at fg 12%. Each thumb is named by the label and its end ("Build time, from" and "Build time, to"). The shown value reads "20s to 80s": words, never a dash. The thumbs never cross, and stay at least `minStepsBetweenThumbs` steps apart (1 by default). The pair sits in a group named by the label. The keys act on the focused thumb: Home and End take it to its end of the rail, as far as the other thumb allows. A form sends both values under `name`.

## Pad
Two values set at once on one surface, such as a reply's tone against its length. It is the Slider in two dimensions; use two Sliders when the values are independent.
- **Surface:** a well in `--surface-2` at `--radius-surface` with an inset `--line` hairline and a static dot grid (`--fg` at about 14%, 1.5px dots on a 16px pitch). The grid is a coordinate system inside a control, never page texture, and it never moves. The four axis words sit inside the edges, y's maximum at the top, in `--font-mono` at the caption size, `--fg-subtle`, sentence case, on plates in the well's color so the grid breaks around them. y grows upward.
- **Thumb:** the Slider's 20px circle (`--surface-1`, a `--line-control` edge, the top highlight), never the accent, and it never resizes. Its center stays 14px from every edge so the focus ring fits inside. A 1px dashed `--line-strong` line crosses the pad through it each way. `defaultMark` draws a 20px dashed circle in `--fg-subtle` with "Default" beside it.
- **Tooltip:** the chart tooltip's look (solid `--surface-3`, `--shadow-tooltip`) says the value in words beside the thumb, kept inside the pad; above a finger on touch. It shows while dragging, hovering or keyboard-focused, and Esc hides it.
- **Keyboard:** one tab stop. Left and right move x, up and down move y, Shift makes it 10 steps, Page Up and Page Down move y 10 steps, Home and End take x to its ends.
- **Accessibility:** two visually hidden range inputs, one per axis, named by the axis label and described by the pad's label, its help text and the words at the axis' ends, both with the formatted value as their value text. The y input is out of the tab order but reachable by a screen reader.
- **Touch:** the whole pad is the target (`touch-action: none`, `data-no-drag`).
- **Motion:** none on position. Only the tooltip fades, on the responsive tier.
- **Disabled:** the thumb in `--surface-2` with a `--line` edge, words in `--fg-disabled`, no tab stop.

## Color picker
One color that belongs to the person's content, not to the interface: a brand color for a Framer site, a project's cover. litt's own colors live in `tokens.css` and are never picked. `ColorPanel` is the picker on its own; `ColorPicker` is a field that opens it.
- **Value:** a six-digit lowercase hex string with the hash. No alpha. The panel keeps hue, saturation and brightness of its own, so dragging to black or grey never loses the hue.
- **The color is data.** It fills only the area, the rails, the thumbs and the chips, never chrome. Text or a mark drawn on it is black or white, whichever has more contrast by APCA (`getContrastInk`), because no token is sure to read on every color. Not by the WCAG 2 ratio: on mid tones such as a rust it calls the two even and picks black, where white reads twice as well.
- **Area:** saturation left to right, brightness bottom to top, at `--radius-control` with an inset `--line` hairline so white still has an edge. 160px tall by default.
- **Thumbs:** a 20px circle filled with the color, a 2px `--surface-1` ring inside and a 1px `--line-strong` edge outside, so it reads on any color in both themes. Its centre reaches the corners, which are real colors. Keyboard focus swaps the edge for a 2px `--focus` ring; a press shows no ring. It never changes size.
- **Hue:** a 12px rail at `--radius-control` with the six hue stops and the same thumb, filled with the pure hue. On coarse pointers the target reaches 16px above and below it.
- **Hex:** the Input at sm in `--font-mono`, beside a 32px chip of the color. It commits on Enter or blur, takes three or six digits with or without the hash, is `aria-invalid` while what was typed is not a color, and puts the last good color back.
- **Eyedropper:** an icon-only ghost sm Button beside the hex, only where the browser has the EyeDropper API, read after hydration.
- **Swatches:** optional, native radios in a fieldset with a hidden legend, 24px chips (32 on coarse pointers) at `--radius-control` with an fg-12% hairline, `--space-2` apart. The picked chip carries a 16px check in the contrast ink.
- **Keyboard:** the Pad's: two hidden range inputs for the area, one tab stop. ← → saturation, ↑ ↓ brightness, Shift for 10 steps, Page Up and Page Down brightness by 10, Home and End saturation's ends. The hue is a native range input. Every input's value text says the color in words and hex ("Dark blue, #…").
- **Field:** the Select trigger's look and sizes with a 16px chip, the hex in mono and a chevron, or "Choose a color" in `--fg-subtle`. It opens the panel in a Popover at md (320px, so eight swatches fit a row), a bottom sheet on compact screens, with focus on the area. The color changes live while it is open. A form gets the hex through a hidden field with `name`.
- **Motion:** none on the picker. Thumbs and colors follow the pointer and the keys at once, because an eased color lags the hand. The popover carries the only motion, on the responsive tier.

## Slide to confirm
A deliberate yes to something that cannot be undone, such as deleting a project on a phone. It asks for more than a tap, so a stray press does nothing. Anything that can be undone just happens, with Undo in a toast.
- **Anatomy:** the Segmented control's track (fg 5%, an inset `--line`, 4px padding, `--radius-surface`) and one raised segment as the thumb (`--surface-1`, the hairline, `--highlight`, `--radius-control`), square, with a 16px chevron. The words say what happens ("Slide to delete Atelier Nord") centered in the track at the small size in `--fg-subtle`. The passed part of the track fills at fg 6%. Never the accent: it is a safeguard, not the view's primary action.
- **Sizes:** md 44 (56 on coarse pointers), lg 56.
- **Drag:** the thumb follows the pointer one to one; the words fade by its position. Let go before the end and it springs back on the responsive tier (bounce 0). At the end (within 4px) it confirms: the thumb stays with a check, the words become the confirmed label, the callback runs once. Esc while dragging sends it back. Only transform and opacity change: the passed part is a full-width band scaled from the left.
- **Keyboard and assistive tech:** the thumb is a button named by the label and described by "Drag the thumb to the end, or press Enter". Enter, Space and a screen reader's activate confirm; a mouse click alone does not. After it confirms, the button is disabled and a polite status says the confirmed label.
- **Touch:** the thumb owns the drag (`touch-action: none`, `data-no-drag`).
- **Disabled:** the track at fg 3%, the thumb `--surface-2` with a `--line` edge, no tab stop. The words stay `--fg-subtle`, because they still say what it would do, as a disabled Slider's end words do.

## Time scrubber
A moment in a run that already happened, found by dragging a ruler of its time, such as a point in a deploy to replay its log up to there. A setting that stays is a Slider; a date for later is the Date picker.
- **Anatomy:** the Slider's label row (the label at the small size in `--fg`, the reading at its end in the mono, with the label of the event under the needle before it in `--fg-subtle`), then a 56px track: the Segmented control's well (fg 5%, an inset `--line`, `--radius-surface`). On it a ruler that slides under a fixed needle: a minor tick every step (8px tall, `--line-strong`, 12px apart), a major tick every few steps (14px, `--fg-disabled`) with its time under it in the mono at the caption size, and each event as a 2px mark, 20px tall, in its status color (neutral is `--fg-muted`). The ticks are lighter than every mark in light mode and dimmer in dark, so a mark stands out by lightness, height and width, never by hue alone: in light mode the status colors are as dark as `--fg-subtle`. The needle is a 2px `--fg` line in the middle, over the ticks and marks and ending above the times so it never cuts one, never the accent (P1).
- **Drag:** the ruler follows the pointer one to one. Let go and it settles on the nearest step, or on an event within half a step of the needle, on the responsive tier, from rest, never past either end. A press without a drag goes to the time under the pointer.
- **Keyboard and assistive tech:** the track is a slider named by the label; its value is the time, and `aria-valuetext` says it in words with the event under the needle ("+31s, Module not found"). ← and → move a step (Shift: ten), Page Up and Page Down go to the next and previous event, Home and End to the ends. A hint says how to move between events.
- **Touch:** the track owns sideways drags (`data-no-drag`, `touch-action: pan-y`), so the page still scrolls.
- **Disabled:** the well at fg 3%, the needle `--fg-disabled`, no pointer, no tab stop.
- **Motion:** the ruler moves by transform only, on the responsive tier when it settles; under reduced motion it jumps. In fun mode (a trial) it can be thrown: it coasts as far as its speed carries it and lands on the event nearest there, within three steps, on fun mode's throw spring, and gives like a rubber band past either end.

## Segmented control
A `--radius-surface` track with fill at fg 5%, an inset `--line` edge and 4px (`--space-1`) padding, so the segments inside it, at `--radius-control`, stay concentric. Each segment is caption size at `--weight-title` in `--fg-subtle`. The selected segment gets `--surface-1`, `--fg`, an inset `--line` and `--highlight`. Build it from `fieldset` and radio inputs, with a visually hidden legend.

## Tabs
Underline or segmented. Use the ARIA tabs pattern (`tablist`, `tab`, `tabpanel`); arrow keys move between tabs.
- **Indicator:** slides to the picked tab (transform, responsive tier).
- **Label:** at `--weight-title`. It changes color only, on the instant tier, never weight.
- **Panel:** fades in from the side of the picked tab (opacity plus a short translate, responsive tier).
- **Touch:** sm tabs grow to `--control-md` on coarse screens, so no tab is under 44px.

## Tag
The selected segment's look, in the sans: 24px tall, `--radius-control`, a `--surface-1` fill with an inset `--line` and `--highlight`, and `--font-sans` at the caption size and `--weight-label`, in sentence case. A plain tag is `--fg-muted`. A status tag colors only its text with the status color (neutral is `--fg-subtle`), never the fill, and there is no dot: the word says the status. When several tags sit on one item, keep one status tag and let the rest be plain. Filter chips sit beside tags, so they take `--radius-control` too; they are controls, so their labels take `--weight-title`.
- **Category (a hue tag, P11):** a tag that files a thing under a category (Finance, Clients, Hiring) may take one of the five data hues: the hue's `-tint` as the fill, its `-text` tone for the label (4.5:1 on the tint, checked), and an inset hairline of the hue at 24% under `--highlight`. One hue means one category in a view, and the word still says it. A hue is never a status: how something stands takes `status`. With more than five categories, leave them plain.

## Kbd
`--font-mono` at the caption size (12px) and weight 400, a 20px chip at `--radius-control`, `--surface-2`, inset `--line`. Use it for real shortcuts only.

## Icons
One set, drawn for litt on one grid. Use it before reaching for another set, so a view never mixes two drawings.
- **Grid:** 16 units, a 1.5 stroke, round caps and joins, in `currentColor`, with no fill except a solid mark (Stop, the running status, the grip's dots). Shapes are drawn square; the round join is their only softening, as the radius is the controls'. Strokes stay inside 1 to 15, so nothing clips at any size.
- **Keylines:** every icon fits one of four: a circle of radius 6.25, a square of 11.5, a landscape box of 12.5 by 9.5 or a portrait one of 9.5 by 12.5. A circle is drawn larger than a square because it covers less of its box, so the four read as one size in a row.
- **Details:** arrows carry 4.25 heads on their own and 3 heads inside a mark (download, sort, undo). A point (the dot of an i) is a zero-length line, a row of dots is circles of 0.75, and a grid of six is filled circles of 0.5, so the grip weighs what a line icon weighs. A circle smaller than its stroke is filled, or some browsers draw it with a hole. Two strokes that cross a gap leave at least one stroke width of air.
- **Size:** 16px beside text and in every control, `--control-gap` (8) from its label. 24 or 32 only alone, as in an empty state; the stroke scales with it.
- **Color:** the text color it sits in. A status color goes on the icon only, never on its own: the words beside it say the same thing.
- **Still:** an icon never spins, pulses, bounces or draws itself in. A running step is the half-filled circle, not a spinner.
- **Look-alikes:** a mark that reads like another one at 16px gets redrawn. Settings is a gear because spokes read as the sun; Frame has its lines at the edges because the hash is a #.
- **Missing one:** draw it on the same grid and keylines, or write the word. Never fill the gap from another set.

## Avatar
A round mark for a person, a client or a company, and a group that stacks them.
- **Surface:** `--radius-pill` at sm 24 (beside a tag, dense rows), md 32 (list rows, the default) or lg 44 (a profile header). A photo is object-cover under an inset `--line` hairline, so a white photo keeps its edge.
- **Color (P11, identity is data):** initials sit on the hue's `-tint` in its `-text` tone, with an inset hairline of the hue at 24% under `--highlight`, the hue tag's look. With no `hue`, a stable hash of the name picks one of the five, so a client keeps its hue everywhere; two names can share one, so the name stays the identifier. `neutral` is `--surface-2`, `--fg-muted` and a `--line` hairline.
- **Type:** initials in the sans at `--weight` (400) at every size: caption at sm, small at md, body at lg, from the first letter of the first two words, skipping leading symbols ("@stripe.com" gives "S").
- **Pictures (`look`: fluid, film, thermal):** instead of initials, a soft field drawn from the name under static one-pixel grain, like a small photograph. Fluid is warped noise from `--fg` through the hue's mark tone to a cream (`--canvas` with a little `--data-amber`); film is diagonal bands, a pale corner at the top where the light is (P2), then `--fg`, then the hue with a streak of light on its edge; thermal is a heat map smeared top to bottom, the hue's partner (blue and amber, teal and rose, violet and teal) for the cool parts and the hue for the hot ones. A seeded hash of the name places everything, and each mark is balanced by its own percentiles, so every name spans ink, hue and cream, and every thermal mark shows both hues. The colors are read from the light theme in both themes, as a photo looks the same on a dark page. Nothing moves (P5). Fluid and film keep one hue per name; thermal puts two hues in one mark, which bends P11's one hue for one meaning. It carries no letters, so use it where the name is written beside it. The initials stay in the box, invisible, so the text baseline does not move.
- **Group:** avatars overlap by a quarter of their size, the first on top, each ringed 2px in the surface it sits on by a zero-offset spread shadow (`ring`: canvas, surface-1, surface-2). `max` (4) shows the first few, then a "+N" pill in mono caption on `--surface-2`, named "N more". The group is labelled ("Project team, 26 people").
- **Accessibility:** initials are an image named by the name; a photo's alt is the name; `decorative` hides it when the name is written beside it. A failed photo falls back to the initials.
- **States and motion:** none. No hover, no focus stop; a link around it is the caller's.

## Card
`.litt-raised`: `--radius-surface`, `--surface-1`, inset `--line`, `--highlight`, and no outer shadow (P4). Padding `--space-6` (or `--space-1` around a cover, then `--space-4` above and at the sides and `--space-3` below for the body).
- A cover is `--radius-control` when the card pads it by 4px, and takes the card's `--radius-surface` when full-bleed. Optionally `.litt-lit .litt-grain` as the card's own top light.
- Hover (when the card links somewhere): the fill moves one step (`--surface-2`). No lift, no shadow growth, no scale. On coarse screens a press shows the same step.
- Cards are never glass (P3), never have an accent rail, and are not the default layout for features.

## Media
One picture in a frame: a screenshot, a photograph, a poster. Every image in the page flow sits in one, and so do a card's cover, a carousel's slide and the lightbox's image.
- **Frame:** a fixed shape (16/9, 8/5 the default, 4/3, 1/1, 4/5, or the image's own as a number), so the page never jumps when the image arrives. `auto` lets the image set the height, with its width and height passed so the space is kept. `--radius-surface` on its own, `--radius-control` inside a card that pads it by 4px, none at the edge of a full-bleed area. An inset `--line` hairline lies over the image, so a pale image keeps its edge, as an avatar's photo does.
- **Loading:** the frame is `--surface-2` and still, the skeleton's look: no pulse, no shimmer, no blur-up. The image fades in on the instant tier when it has loaded, opacity only. Lazy unless it is the one image the page opens on (`priority`, which also raises its fetch priority).
- **Failed:** the frame keeps its size and says "Image didn't load" beside a 16px image mark in `--fg-subtle`; a narrow frame shows the mark only. The alt text still names it.
- **Open:** a frame that opens a larger view is a button named by its alt, with `aria-haspopup="dialog"`. Hover strengthens the hairline to `--line-strong` on the instant tier and the pointer is a zoom; nothing lifts or scales. Focus is the 2px ring at a 2px offset around the frame.
- **Caption:** small, `--fg-subtle`, 8px under the frame, in a figure.
- **Never** text over a photograph (it fails contrast somewhere in the image), a video that plays on its own, or an image that animates on scroll.

## Media player
A video or a sound that someone plays: a site's walkthrough, a launch film, a studio note. `VideoPlayer` is a Media frame with one quiet row of controls under the picture; `AudioPlayer` is the same row under a title. Neither has a card of its own.
- **Never on its own:** nothing autoplays, loops or plays muted in the background (Foundations, Motion). It loads the file's metadata, so the length shows before anyone presses play; `preload="none"` waits for the press and shows a given length. Starting one player pauses any other.
- **Frame:** Media's: a fixed shape (16/9 by default), `--radius-surface`, `--surface-2` and still while it loads, the inset `--line` hairline over the picture, and a poster that fades in on the instant tier. Nothing ever sits on the picture; a press on it plays and pauses.
- **The row, 8px under the picture, never over it:** over it, controls would need a scrim and still fail contrast somewhere in the picture, so they never hide either. Each control is its mark and nothing else, in `--fg-muted`, with no fill, edge or disc; hover darkens it to `--fg` on the instant tier, and a press on a touch screen fills it at fg 6%. Play, then the rail, the time, and only what applies of Captions, Speed, Mute and Full screen. Play and Pause are solid marks, as every player draws them and as the set's Stop is; the rest are the set's strokes. The first and last sit outside the row by the air around their marks, so the marks line up with the picture's edges. 32px targets on a fine pointer, 44px on a coarse one.
- **Rail:** the Slider's 4px rail at fg 12%, what has played in `--fg`, never the accent (P1). No thumb and no buffered band: the end of the played part is the playhead. The whole row height is the target, and keyboard focus rings the rail.
- **Time:** "0:12 of 0:42", in words as a range always is ("3 of 12"), at the small size in `--fg-subtle`, in the sans with its own figures: the even-width set pads a 1 into "0:1 4". The elapsed part keeps the width of the length's widest digits, so the row never shifts as it counts. Under 20rem only the elapsed time shows.
- **Motion:** the playhead follows the media one to one with no easing, painted each frame without a render; under reduced motion it steps a few times a second. Colors change on the instant tier. Nothing else moves.
- **Buffering, ended, failed:** a stall puts the Button's spinner in Play, which stays Pause and can still be pressed. At the end Play becomes Play again with the retry mark. A file that fails keeps the frame and says "Video didn't load" beside a mark in `--fg-subtle`, and the row goes; a sound says it under its title.
- **Captions:** one WebVTT track. Its cues show between the picture and the row at the small size in `--fg`, never on the picture, with two lines kept so the row does not move between cues. The button is a toggle (`aria-pressed`) whose mark fills while they are on.
- **Speed and volume:** `rates` adds a ghost button that says the speed ("1.5×") and steps to the next on a press, because a menu would open outside a full-screen player. Mute is a toggle with a crossed mark; the level is the device's.
- **Full screen** (video): the player fills the screen on `--canvas`, the picture letterboxed and the row under it. On an iPhone the system player takes over.
- **Keys** anywhere in the player: Space (off a button) and K play and pause, ← → 5 seconds, J and L 10, Home and End, M mute, C captions, F full screen, < > speed. On the rail the arrows move 5 seconds and Page Up and Page Down a tenth.
- **Accessibility:** a group named by the label or the title. The rail is a slider named Seek whose value text says the time in words ("1 minute 12 seconds of 3 minutes"), changed once a second, never per frame. The press on the picture is a shortcut for Play, not a second tab stop.

## Carousel
A set people look through in order, such as a project's screens, or a strip of cards. Never for content people must see: most people never reach a later slide.
- **Scrolling** is the browser's: a track with scroll snap, each slide resting at the start edge, so a swipe, a trackpad and Shift and the wheel keep their own momentum. A mouse can drag it, and the release goes to the nearest slide in the way it was going. The scrollbar is hidden; the peek and the controls say there is more.
- **Never on its own:** no autoplay, no loop, no timer. The person always moves it, so there is nothing to pause (Foundations, Motion).
- **Slides per view:** one, two or three, with the next slide peeking 48px (96px for one slide in a wide box), or slides of their own width. The box decides by a container query, not the screen; a narrow box is always one slide and a peek. Slides sit 16px apart.
- **Controls:** under the track, the range in words at the start ("3 of 12", "4 to 6 of 12"), in the mono at the caption size in `--fg-subtle`, as Pagination's; round secondary sm icon buttons for Previous and Next at the end, 44px on coarse pointers. Next brings the first slide not wholly in view to the start; Previous goes a page back. At an end the button is disabled and hands its focus to the other one.
- **Keys:** the track is a tab stop with an inset focus ring; ← and → move one slide (swapped right to left), Home and End go to the ends.
- **Motion:** a button, a key or a drag's release scrolls smoothly; under reduced motion it jumps. No fades at the edges: material is static (P5).
- **Accessibility:** a region named by its label with `aria-roledescription="carousel"`, each slide a group with `aria-roledescription="slide"` named "3 of 12". Slides out of view stay readable. After a button or a key the new range is said once in a polite status.

## Callout
An inline note in the page flow: a tip, a heads-up, a result to act on.
- **Surface:** `.litt-raised`, padding `--space-4`, gap `--space-3`. In the flow, so never glass and no shadow, and never a left rail, a tinted fill or a colored border.
- **Anatomy:** a 16px icon on the title's first line, the title (body, `--weight-title`, `--fg`), a line of detail (small, `--fg-subtle`) 4px under it, an optional action at the end (an sm secondary Button or a Kbd) and, with `onDismiss`, a pill ghost close button named "Dismiss". It measures itself: under 28rem the action drops below the text.
- **Color:** only the icon takes `--success`, `--warning` or `--danger`; neutral is `--fg-subtle`. A non-neutral tone puts a hidden word before the title ("Warning: "), so the color never says it alone. A tip takes the neutral tone with its own icon.
- **Accessibility:** `role="note"`; `live` makes it a status, or an alert for danger, for a callout that appears after an action. Dismissing unmounts it, and the caller places focus.
- **Touch:** the close button and a Button action grow to 44px; a Kbd action hides, as key hints do on touch.
- **Motion:** none.

## Accordion
Sections that open in place: questions and answers, groups of settings, a long spec.
- **Anatomy:** rows split by 1px `--line` hairlines, with one above the first and one below the last. Each trigger is a full-width button at least 56px tall, its label at the body size and `--weight-title` in `--fg`, left-aligned, and a 16px chevron in `--fg-subtle` at the end that brightens to `--fg` on hover (instant tier, color only). The content sits under its trigger in `--fg-muted` at the small or body size, at most `--measure` wide, with `--space-6` below it. No card around it unless the page puts one there; no fills, no accent.
- **Behavior:** one open at a time by default (`type="single"`, and the open one can close), or several (`type="multiple"`). Triggers sit in headings (h3 unless told otherwise) and carry `aria-expanded` and `aria-controls`.
- **Keyboard:** Enter or Space toggles; ↑↓ move between triggers; Home and End go to the first and last.
- **Motion:** the panel's height is never animated: it snaps open. Its content fades in and drops a quarter of `--travel`, the chevron turns half a turn, and the rows below move to their new place by transform (Motion `layout`, position only), all on the responsive tier, so the page never jumps. Closing fades the content on the exit token while the rows below rise.

## Scroll area
A region that scrolls inside the page: a long list in a fixed-height card, a log, a side panel. Never the page itself.
- **Scrolling** stays native (wheel, touch, keyboard, momentum). Only the scrollbar is litt's: a 6px thumb at `--radius-control` in fg 24%, fg 40% while hovered or dragged, on a transparent track with 2px of inset, so the hit area is 10px. It overlays the content and shows while the area scrolls or the pointer is over it, then fades out on the instant tier after a short pause.
- **Edges:** a 1px `--line` hairline appears on any edge that has more content beyond it, and goes when that edge is reached (instant tier, color only). No gradient fades: material is static (P5).
- **Focus:** a scrolling region is a tab stop with an accessible name, so the arrow keys scroll it, with an inset 2px `--focus` ring.
- **Axes:** vertical by default, horizontal or both on request.
- **On coarse pointers** the thumb shows only while scrolling, because there is no hover.

## Tree
Things inside things, opened a level at a time: a project's files, a docs site's pages.
- **Rows:** 32px (44 on coarse pointers) at `--radius-control`, indented 16px a level. A 16px chevron for a branch, an icon (folder or file unless given), the label at the small size, truncated, and an optional detail in mono caption `--fg-subtle` at the end (a size, a change mark). A 1px `--line` guide runs down each level under the chevrons, so nesting reads without color.
- **States:** hover fills fg 6% on the instant tier. The selected row is the selected segment (P12): one surface up from what the tree sits on, the hairline and `--highlight`, its label in `--fg` at `--weight-title`. Never the accent.
- **Opening:** the chevron turns a quarter on the responsive tier; the children appear in place at once. No height animates, as in the Accordion.
- **Keys:** one Tab stop. ↑ ↓ through the rows that show, → opens or goes in, ← closes or goes out, Home and End, Enter and Space select (and toggle a branch), * opens the siblings, typing jumps to a name.
- **Accessibility:** the WAI-ARIA tree: `tree`, `treeitem` with level, set size, position, `aria-expanded` and `aria-selected`, children in a `group`.

## Resizable
Panels side by side or stacked, with a line between each two that a person drags: a tree beside a log, a list beside its detail.
- **Line:** a 1px `--line` hairline with a 12px hit area (44 on coarse pointers). `--line-strong` under the pointer and `--fg-subtle` while dragged, on the instant tier. No grip and no dots; the cursor says it moves. The focus ring when it has keyboard focus.
- **Behavior:** sizes are percents, each panel between its minimum and maximum. A handle moves only the two panels beside it, one to one with the pointer, with no easing or snapping. A double click puts the two back. ← → (↑ ↓ stacked) move it 5%, Shift 20%; Home and End give the panel before it its bounds. The layout can be kept in the browser.
- **On compact screens** two panels side by side are rarely both readable: show one at a time behind a Segmented control.
- **Accessibility:** each handle is a `separator` with its value (the size of the panel before it), its bounds and `aria-controls`, named for what it resizes.

## Glass header
Sticky, `--header-h`, `.litt-glass`, content in a `--container-wide` wrap.
- Order: wordmark (body size at `--weight-title`) → nav (small size in `--fg-subtle`; hover `--fg` with fg-6% fill) → right-aligned actions.
- **The current page wears the selected segment (P12):** `--fg` on `--surface-1` with the hairline and `--highlight`, and `aria-current="page"`. It keeps that look on hover. No dot, no underline, no accent, no weight change. In the menu on mobile, the current page carries a check.
- It is full-bleed, so it sets `border-radius: 0` (`.litt-glass` carries the surface radius).
- On mobile, hide the nav behind the command menu or a menu button. Don't squeeze it.
- **On compact screens** the nav stays behind the menu button and opens as the anchored dropdown (see Popover and dropdown). The bar stays sticky at the safe-area inset and never hides on scroll. Links and the menu button are `--control-md` on coarse screens.

## Breadcrumb
Where a page sits: Studio / Projects / Marlow Labs / Settings.
- **Anatomy:** a `nav` landmark named "Breadcrumb" holding an ordered list on one line. Each level is a link at the small size in `--fg-muted` that turns `--fg` on hover (instant tier, color only, no underline); the last is the current page, `--fg`, not a link, with `aria-current="page"`. Between levels a `/` in `--fg-subtle`, `--space-2` each side, hidden from screen readers. No dots, no chevrons, no accent.
- **Targets:** a link's hit area is 32px tall, and 44px on coarse pointers, without moving the text.
- **Long trails:** past four levels the middle ones fold into an icon-only ghost sm "…" button (a pill) named "Show 3 more levels", which opens a Menu of them. The current page truncates with an ellipsis rather than wrapping.
- **On compact screens** only the last two levels show; the rest fold into the "…" button.
- **Router:** links are plain `<a>` unless the caller passes its own link component.
- **Motion:** none.

## Steps
Where someone is in a flow of three to six steps, such as setting up a studio. Not for views someone moves between freely (Tabs) or a page's place in a hierarchy (Breadcrumb).
- **Marks:** the step marks of Plan and Tool call, so one mark means one thing everywhere: a check in a circle for done (`--fg-muted`), a half-filled circle for the current step (`--fg`, never spinning or pulsing), an empty circle for what is left (`--fg-subtle`). Never a number in a colored disc and never the accent.
- **Words:** the current label at `--weight-title` in `--fg`, done ones in `--fg-muted`, the rest in `--fg-subtle`, at the small size.
- **Row:** a hairline between steps, in `--fg` once the step before it is done. In a box narrower than about 640px it becomes "Step 2 of 4" and the current label, with one 4px rail per step, done and current in `--fg`. The box decides, by a container query, not the screen.
- **Column:** the hairline runs down between the marks, with a line under each step, for a side panel or a checklist.
- **Going back:** done steps may be buttons that go back. The current step and what is left never are: a flow moves forward by its own Continue.
- **Accessibility:** an ordered list named by the flow, `aria-current="step"` on the current one, each state in hidden text. Nothing animates.

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

## Hover card
A preview of what a link points at: a person behind their name, a project behind its link.
- **Only a preview.** The trigger is a real link or button to the same thing. A touch screen has no hover, so a tap follows the link and the card never opens: nothing may live only in the card.
- **Open and close:** after the pointer rests 500ms on the trigger, or at once on keyboard focus (focus-visible only, so a tap never opens it). It closes 200ms after the pointer leaves both the trigger and the card, so the pointer can cross the gap, and at once on blur or Esc. Focus never moves into it.
- **Surface:** the Popover's: floating glass at `--radius-surface` with `--shadow-float`, padded `--space-4`, 256 or 320 wide; solid when its trigger sits inside glass.
- **Motion:** the Popover's, on the responsive tier: it grows from the trigger and travels a quarter of `--travel` from the side it opens on, and leaves on the exit token.

## Context menu
Actions on the thing under the pointer: right-click a row, a file, a card.
- **Look and rows:** the Menu's exactly: glass at `--radius-surface` with `--shadow-float`, 44px rows, the gliding highlight, checkbox and radio rows in a fixed 16px cell, solid submenus, labels and separators. The same row components work in both.
- **Open:** a right-click opens it at the pointer; Shift+F10 or the menu key opens it on the focused target; on touch, a press and hold of 500ms (the tooltip's hold) opens it at the finger and stops the browser's own callout and text selection on that target.
- **Motion:** the responsive tier. It grows from the pointer's corner and travels a quarter of `--travel` from the side it opens on after collision flipping, and leaves on the exit token.
- **Every action in it is also reachable another way** (a "⋯" Menu on the row, a toolbar, a shortcut). A context menu is a shortcut, never the only path, because a touch or keyboard user may never find it.
- **On compact screens** it stays anchored at the finger, like the Menu, and a submenu replaces the list in place with a Back row first.

## Modal
Glass panel at `--radius-surface` with `--glass-shadow: var(--shadow-modal)`, padding `--space-8`, max width 480px (forms) or 640px. The title is `--type-h4` (14px at `--weight-title`) in `--fg`, 4px above its description. Actions sit bottom right at md, primary last, secondary or ghost before it. Fields in a dialog are md too. The backdrop tint is `color-mix(in oklab, var(--canvas) 55%, transparent)`.
- **Motion:** the view's expressive moment: placed, not thrown. It rises by `--travel` and settles from `--press-scale` (0.98), and may bounce slightly (`--dur-expressive`, `--ease-expressive`). If the view has already used its expressive moment, the dialog uses the responsive tier (a `tier` choice on the component).
- **Exit:** `--dur-exit-expressive` with `--ease-out`. It never bounces.
- **On compact screens** it is a bottom sheet. `side="right"` becomes the same sheet, so no strip of page is left at the edge. It is glass, flush with the bottom, with `--radius-surface` on the top corners only, and it pads its footer by the safe-area inset. A 32px by 4px grabber in `--line-strong` sits at the top centre. The body scrolls inside, with `overscroll-behavior: contain`.
- **Motion on compact:** it always rises on the expressive spring and does not use up the view's expressive moment (Foundations section 6), whatever `tier` says. It rises by its own height, by transform only, and may bounce as the token allows (`--ease-expressive` peaks at 1.0012, about half a pixel on a 450px sheet). It leaves the same way on `--dur-exit-expressive` with `--ease-out`.
- **Above the keyboard:** the sheet's bottom follows the visual viewport, so the keyboard never covers its footer or the field being typed in.
- **Drag and buttons:** it can be dragged down from anywhere that follows the rules in Foundations section 6. The close button is 44px on coarse screens. Cancel, Esc and a scrim tap also close it.

## Lightbox
One image of a set at the size of the screen, opened from a Media.
- **Layer:** the whole screen, on the canvas at 97% that only fades (instant tier), so the image is the one surface and the page behind is a trace. No blur and no glass: the image is the material.
- **Image:** as large as the screen allows less the bars, at its own shape, in a Media frame (the surface radius, the hairline, `--surface-2` while it loads). Its width and height give it its shape before it loads.
- **Bars:** the label at the small size and `--weight-title` with "3 of 12" in the mono caption beside it, and a round Close at the end, at the top. The caption under the image at the small size in `--fg-muted`, at most `--measure` wide. Previous and Next are round secondary buttons beside the image on a wide screen and at the end of the caption row on a compact one, 44px on coarse pointers, disabled at the ends. Nothing loops.
- **Motion:** opening is the view's expressive moment, as a dialog's: the image rises by `--travel` and settles from `--press-scale`, and leaves on the exit token; `tier="responsive"` when the view has spent it. The next image fades in from `--travel` on the side it comes from and the last one out by half that, on the responsive tier.
- **Touch:** a finger swipes the image sideways one to one (Foundations section 6). Past `--dismiss-distance` of its width or faster than `--dismiss-velocity` it carries on out and the next one comes in; pulled where there is nothing, it resists. The buttons stay.
- **Keys and focus:** focus lands on the panel so ← → Home and End work at once; Esc, Close or a click on the ground around the image closes it, and focus goes back to the image that opened it, or the slide it closed on.
- **On compact screens** it stays full screen; it is not a sheet, because it already fills the screen.

## Toast
Glass at `--radius-surface` with `--shadow-float`, padding `--space-3`/`--space-4`: the title at the small size and `--weight-title` in `--fg`, an optional description under it at the caption size in `--fg-subtle`, at `--weight`. No status dot: an error's title is `--danger`, and the words say the rest. Bottom right on desktop, bottom center on mobile. `role="status"` (or `alert` for errors). Auto-dismiss after 5s, but never for errors. An undo action sits on the right as a ghost button or kbd hint.
- **Motion:** it arrives from just below its corner and settles. That is the expressive tier when the toast is the view's moment, otherwise the responsive tier. It leaves sideways by the same small distance, on the exit token for its tier.
- **Stacking:** older toasts stack behind the newest and open into a list on hover or focus.
- **On compact screens** the toast spans the page gutters, sits `--space-4` above the bottom edge or the safe-area inset, and leaves downward by `--travel` on a timeout, not sideways.
- **Over a sheet:** while a sheet is open on a compact screen, the toast docks at the top edge, `--space-2` below the safe-area inset (where the command menu sits), and arrives and leaves upward, so it never covers the sheet's buttons.
- **Swipe:** a sideways drag moves the toast one to one. It leaves past `--dismiss-distance` of its width or faster than `--dismiss-velocity`, in the direction it was going. The close button stays, 44px on coarse screens. A tap on the stack pins it open, as before.

## Table and list rows
Rows are separated by 1px `--line`, padding `--space-3`/`--space-4`, small size. The primary cell is `--fg`; the rest are `--fg-subtle`. Numbers and dates use `--font-mono` caption size at 400, right-aligned. Hover is an fg-4% fill. A sticky header row is caption size at `--weight-label` in `--fg-subtle`, sentence case.
- **Hover:** the fg-4% fill is for airy lists (project rows, tables). Dense lists (menus, the command menu) use the gliding highlight. Hover never moves anything.
- **Entrance:** rows and raised cards arrive in one staggered cascade (`--stagger`, `--travel`, expressive tier). That cascade is the page's single expressive moment.
- **Filter and insert:** responsive and position-only (FLIP via transform), so text never stretches.
- **Selection:** a 20px box as the first column (the Checkbox, its label hidden and named for the row), a select-all box in the header that is mixed while only some rows shown are selected, and Shift for the range from the last box pressed. A selected row fills fg 6%, the press fill; the box carries the state. What to do with them goes in an Action bar after the table.
- **Filters:** a column's filter sits in its header, a 28px funnel button (44 under a finger) at the end of the header cell, before the label over numbers. It opens the Menu with the column's values: checkbox rows, any number on, each with how many rows it would show in the mono hint, then Show all under a hairline; or radio rows with All first for buckets of a number. None on is no filter. Rows filter as they toggle; there is no Apply. While a column filters its button wears the selected segment (P12), `--surface-2`, the hairline and `--highlight`, with how many values are on in the mono. Never the accent. The count of rows shown is said in words above the table, in a polite status, with Clear filters beside it.
- **Wide tables:** the first one or two columns (the box and the row's name) can stick to the start edge while the table scrolls sideways, so a row never loses its label. They take an opaque fill that follows the row's hover and selection, and a 1px `--line` hairline at their edge once anything is scrolled under them. No shadow (P4).
- **Resizing columns:** a resizable header has a 12px handle at its end edge (20px under a finger) with a 1px hairline in `--line-strong` that shows under the pointer and on focus, `--fg-subtle` while dragged, on the instant tier. It follows the pointer one to one, never past the column's minimum; ← and → move it 16px (Shift 64), Home gives the minimum, a double click fits the column to its widest cell drawn. The first resize fixes every column at the width it has, so nothing jumps; from then a cell wider than its column ends in an ellipsis. The widths can be kept in the browser. The handle is a separator named for its column, valued in px.
- **Loading as you scroll:** rows too many to load at once come from the server a page at a time, asked for well before the end (twenty rows), so a steady scroll never waits. While a page loads, three skeleton rows wait after the last one, static like every skeleton, and the table says "Loading more rows" in its status. A page that fails is one row: what went wrong in words with the alert mark in `--danger`, and Retry. Never a spinner, and never a Load more button for a list someone is scrolling. Loading only goes forward; when people need to jump to a place or know the page they are on, use Pagination.
- **Filters in the address:** a table's filters, its search and its sort live in the page's query string, one parameter per value (`?status=failed&site=Halden+Gallery`), so a filtered view can be bookmarked, shared and reloaded, and Back brings the last one back. Writes replace the history entry, never add one, and wait a beat after typing. An empty filter leaves the address. Read it as untrusted: keep only values that are options. Selection, drafts and widths are not part of the view to share; they stay out of the address.
- **Big tables:** past a few hundred rows draw only the rows in view (a virtual body between two spacer rows), so ten thousand scroll as lightly as forty. Every row is then one line, the same height, and the table has a max height. It fixes the column widths the first rows give, so columns never shift as other rows scroll by; a wider cell ends in an ellipsis. It keeps its semantics: `aria-rowcount` on the table and `aria-rowindex` on each row. The entrance cascade and change motion are off: a long list arrives at once. Filter with a deferred query, so typing never waits on the rows, and give the table a search field, because the browser's find only sees the rows drawn.

## Action bar
What can be done to the rows or cards someone selected, while the selection lasts.
- **Place:** after the list, in the same scrolling area, sticky `--space-4` above the bottom of the view, centered; at the list's end it rests under it, so it never covers the last row.
- **Surface:** floating glass (it floats over content, P3) at `--radius-surface` with `--shadow-float`, padded `--space-1`. The count in words at the start ("3 selected", small, `--fg`), a hairline, the actions as sm buttons (secondary, or ghost for quieter ones), then a round ghost Clear. Never an accent fill; a destructive action says so in its word. Two or three actions; the rest behind a "More" Menu.
- **Motion:** it rises by `--travel` and fades in on the responsive tier, and drops by half that on the exit token. The count changes in place.
- **Keyboard:** a toolbar: one Tab stop, ← → between its buttons, Home and End, Esc clears. When it goes with focus inside, focus returns to where it came from.
- **Accessibility:** `role="toolbar"` named for what it acts on, and the count said once in a polite status as it changes.

## Pagination
Previous and next for a table or list that shows one page of many. The range is the main information, so it comes first, in words.
- **Range:** "21 to 40 of 143" in `--font-mono` at the caption size, `--fg-subtle`, tabular, at the start of the row. No dashes and no en dashes. With no rows it says "No results". It is a polite live region, so a screen reader hears the new range after a page change.
- **Buttons:** Previous and Next are `sm` secondary buttons, text only, no arrows, sitting `--control-group-gap` (12) apart at the end of the row. The first page disables Previous and the last disables Next. If the button that was just pressed becomes disabled, focus moves to the other one, so it never falls to the page.
- **Page buttons:** numbered ghost buttons (`sm`, mono) between the two, with the current page as a secondary button and `aria-current="page"`. Long runs fold into an ellipsis: first, last, and one either side of the current page. They only show when the row is at least 36rem wide (the row measures itself, not the window). Below that the range and the two buttons are enough.
- **Semantics:** a `nav` with its own `aria-label` ("Deploys pages"), and a list inside it. It sits `--space-4` under the table it pages.
- **Motion:** none of its own. The rows it pages are the table's job (Table, `animateChanges`).
- **On coarse pointers** the buttons are 44px tall, page numbers included.

## Stat
A number tile for one figure that tells you how things stand: active projects, deploys this week, median build time.
- **Surface:** `.litt-raised` at `--radius-surface`, no shadow (P4), never glass (P3), never an accent rail. Padding is `--space-4` in a narrow group and `--space-6` from 48rem wide. The tile never has a hover, because it links nowhere.
- **Label:** above the value, small size, `--fg-subtle`, sentence case, no colon.
- **Value:** the h3 step (14px at `--weight-title`) in `--fg`, in the sans (not mono), with tabular numbers so a figure does not wobble when it updates. An optional unit ("s", "%") follows it directly, same size, in `--fg-subtle`.
- **Delta:** an optional line under the value at the caption size: a word and the number, "Up 12% on last week". The word says the direction. The color says whether it is news: `--success` for good, `--danger` for bad, `--fg-subtle` for neither. So a build time that fell is "Down 3 s on last week" in `--success`. Never an arrow glyph alone, never a dot. The good or bad judgment is also in hidden text ("good news"), so color is never the only signal.
- **Group:** a grid that measures itself. Two tiles across, four across from 40rem wide, one below 20rem. Tiles in a row share the row's height, and the gap is `--space-4`.
- **Semantics:** a description list. The label is the term and the value is its description, so a screen reader reads "Active projects, 12".
- **Trend:** an optional Sparkline at the foot of the tile (`trend`), under the delta and full width, so the trends in a row of tiles line up whether or not a tile has a delta. It reads after the value and the delta.
- **Motion:** none. A value that changes just changes. The entrance cascade belongs to the page.

## Details
An information card of labelled facts about one thing that people look up rather than compare: a deployment's domain and commit, an invoice's dates, a client's plan.
- **Surface:** `.litt-raised` at `--radius-surface`, no shadow (P4), never glass (P3), never an accent rail. `bare` drops the surface for a list that already sits on one, such as a dialog or a side panel. It links nowhere, so it has no hover.
- **Header:** an optional title (body size at `--weight-title`, `--fg`), a description (small, `--fg-subtle`) and one action at the end, an sm secondary Button on the title's line. A `--line` hairline separates it from the facts.
- **Rows (the default):** the label beside the value, rows split by `--line` hairlines, `--space-3` above and below so a line of text makes a 44px row. The labels share one column, as wide as the longest up to 40% of the card, so the values line up, and each label shares a baseline with its value's first line. Under 20rem wide (the card's own width) the label moves above the value.
- **Grid:** the label above the value, `--space-1` apart, in columns that measure the card: one under 20rem, two from there, up to four once it is wide. A long item such as a note takes the whole row.
- **Type (P9):** the label is small in `--fg-subtle`, the value body in `--fg`. Hashes, IDs, versions and region codes are Geist Mono at the small size. A long value wraps; it never truncates.
- **Copy:** an icon-only ghost button at the end of the row copies the value exactly. It swaps to a check at once and a polite live region says "Domain copied". Always visible, 44px on a coarse pointer, and it never makes the row taller.
- **States:** a missing value says "Not set" in `--fg-subtle`, never a dash. Loading swaps each value for a still `--surface-2` bar one line tall, so the card keeps its height; no pulse.
- **Semantics:** a description list, so a screen reader reads "Region, fra1". A status in a value is a Tag. A link in a value is `--accent-text` with a soft underline.
- **Motion:** none. A value that changes just changes.

## Rolling number
A figure that updates in place while someone watches, because of something they did: a deploy count after Deploy, credits after a build. A Stat stays still ("a value that changes just changes"); a caller opts in by passing a Rolling number as its value.
- **Type:** the number only, in the font, size and color of where it sits, with tabular figures, formatted by `Intl.NumberFormat` (any locale and options: currency, percent).
- **Motion:** only the characters that change move. Each old one leaves half of `--travel` and fades, the new one comes in from the other side and fades in, on the responsive tier, inside a cell that clips them, as the Date picker's months do. Up from below when the value rises, down from above when it falls. Never further than the travel token, never a bounce, never the view's expressive moment. Characters line up from the right, so a new column and its separator simply appear. The first render does not roll; under reduced motion the digits simply change.
- **Accessibility:** the whole formatted figure is text for screen readers and the rolling cells are hidden. A change is not announced; the caller says it in a live region if it matters.
- Not for a figure that loads once, or one that changes many times a second (a timer).

## Chart
Bars compare amounts and a line follows change over time. Both are drawn in plain SVG, with no chart library, and both are quiet: P1 is the reason, because the accent belongs to the one primary action and a chart is made of many marks.
- **Color:** a mark is never the accent. By default it is the quiet foreground: one series is `--fg` at about 55% for bars and `--fg` for a line. The current mark (the last bar, or the last point) and the hovered or focused one are full `--fg`; while a mark is hovered or focused it replaces the current one, so only one is ever full. Up to three series step down the foreground: `--fg`, 55% and 30%, with a legend above the plot. At 30% a mark is under 3:1 against the card, so the third series' bars carry a 1px edge at 55% and its line is dashed.
- **Data hues (P11):** when telling series apart is the point, or a series has a color elsewhere in the view, it takes a data hue: `hue` on the series, or `hues` on the chart to give every series without one the next hue in the fixed order (blue, amber, teal, violet, rose). Color follows the series, never its place, so a filter never repaints the others. A hue series rests in the mark tone (3:1 on every surface) and a single series' emphasised mark takes the hue's `-text` tone, a step stronger; no edge and no dash are needed. Up to five hue series; a hue series and a foreground one can share a chart ("This week" in blue against "Last week" in the foreground). The legend and the tooltip still name every series.
- **Gridlines:** horizontal only, `--line` hairlines, with the zero baseline in `--line-strong`. Three to five lines in all. No vertical lines, no gradient, no area fill, no shadow, no glow on a mark.
- **Axis labels:** the caption size in `--font-mono`, `--fg-subtle`, tabular. Values sit at the start of their gridline, categories under their mark. When the marks are too close for their labels, every nth label shows, counting back from the last one so the current mark always keeps its label. Labels never overlap.
- **Bars:** at most 32px thick and at most 60% of their slot, so there is always air between them. Tops are square. A 2px corner is not on the radius scale, and the control radius would turn a 14px bar on a phone into a bullet. Grouped series sit side by side with a 2px gap. Bars grow up from the baseline.
- **Lines:** 2px, round joins, with a 4px marker on the current point and on the hovered or focused one. The points sit in the middle of their slots, so the first and last labels are never cut.
- **Tooltip:** a hovered or focused mark shows the Tooltip's look (solid `--surface-3`, `--shadow-tooltip`, `--radius-control`): the label in `--fg-muted` and the value in mono `--fg`, above the mark and kept inside the chart. It follows the pointer from mark to mark without re-entering. Esc hides it without moving focus. It repeats what the mark's label already says, so it is hidden from screen readers.
- **Marks:** the pointer target is the whole plot, and the mark under the pointer is the active one, so a thin bar is as easy to reach as a wide one. Hover changes color only, on the instant tier. A keyboard-focused mark gets a 2px `--focus` ring drawn around it, 2px away.
- **Motion:** one entrance on the responsive tier. Bars grow from the baseline by `scaleY`, and a line fades in by opacity. Height, width and path data never animate; new data redraws at once. Reduced motion is handled by the hooks.
- **Keyboard:** one tab stop, on the current mark. Left and right arrows move along the marks, Home and End go to the ends.
- **Accessibility:** the SVG is `role="img"` with a label that summarises the data ("Deploys per day, last 14 days: from 5 to 1, peak 9"), and a visually hidden table lists every value. A visually hidden button per category, named by its values ("3 Oct: 5 deploys"), sits in a labelled group outside the image: they are the keyboard's stops.
- **Touch:** a finger scrubs. The mark under it is active and shows its tooltip, which stays until the next touch elsewhere, and a vertical drag still scrolls the page. A column on a phone is narrower than a finger, which is why the target is the plot and not the column. The chart fills its container's width, the height is the caller's, and the plot never needs a horizontal scroll.
- **Stacked (growth step):** when each category is made of parts (storage added per day by kind), `StackedBarChart` stacks them into one rail per category: at most 8px wide, each segment at `--radius-control`, 2px of air between segments, like the Breakdown's split rail. A hue is a thread, never a block. Every series takes a data hue (its own `hue`, else the next in the fixed order), so a Legend can drop one without repainting the rest. The tallest stack sets the scale. The hovered or focused column takes its series' text tones over a faint column band, the tooltip lists each part and a Total under a hairline, and the hidden table adds a Total column. Up to five series.
- **Meter:** a horizontal progress bar for one value against a limit, such as storage used. The label sits at the start in the small size, the value at the end in mono at the caption size, and the 4px rail under them is `--radius-control`, filled at fg 12% and then with `--fg` to the value, or with a data hue's mark tone when the color names the thing (images, video and fonts in a storage breakdown). `role="meter"` with a name and a value text. A `target` (a budget) is a 2px tick in `--fg-subtle`, 12px tall so it reads over the fill and the track alike, and is said after the reading. `steps` splits the rail into equal segments 2px apart for a count of a few (7 of 10 checks). The fill is never the accent. It does not animate.

## Legend
Toggles which series a chart shows. The Legend filters and the chart draws: it holds which series are hidden, and the page passes the shown series to any chart, a table, or both.
- **Item:** a toggle button, `--control-sm` (32) tall with `--space-2` side padding at `--radius-control`: a 12 by 4px swatch rail in the hue's mark tone, the name (small, `--fg`), and an optional reading after it (mono caption at 400, `--fg-subtle`, tabular), such as a total. Hover fills fg 6%. On coarse pointers it is `--control-md` (44) tall and a press fills fg 6%, as rows do.
- **Hidden:** the swatch becomes the Meter's track (fg 12%) and the name `--fg-subtle`. Only color changes, on the instant tier: nothing moves, the weight stays 400, and the box keeps its size.
- **Hues (P11):** assigned exactly as the Chart's `hues`: a set hue is kept, and each item without one takes the next in the fixed order, counted over the whole list. A chart counts only the series it is given, so pin each shown series' hue (`legendHues`) and none repaints when another is hidden. Five items at most. Turn the chart's own legend off (`legend={false}`) so there is one.
- **The last one stays:** the last shown item cannot be hidden. It carries `aria-disabled` and a hidden note, "At least one series stays shown.", and is never natively disabled, so it keeps its tab stop.
- **Layout and keyboard:** a wrapping row, 4px apart, in a `role="group"` named by its label. Each item is its own tab stop with the house `:focus-visible` ring; Space or Enter toggles. Alt with a click or Enter shows only that item.
- **Motion:** none beyond the instant color change.

## Sparkline
A trend in one thin line, with no axes and no labels: median build time beside its figure, visits per day in a table row.
- **Anatomy:** a 2px line with round joins and caps, drawn at the container's width (the height is the caller's, 32 by default), and a dot on the latest point, 8px across over a 2px ring in the surface it sits on (`surface`). No area, no gradient, no glow.
- **Color:** the quiet default is the line at fg 55% and the dot in `--fg`. With a data hue the line takes the mark tone and the dot the `-text` tone, so today is the strongest mark. One hue means one quantity (P11).
- **Scale:** each line fits its own values with 2px of air. Fix `min` and `max` so a column of sparklines compares. `baseline` (a goal or an average) is a 1px dashed `--line-strong` line across the full width, and the scale includes it.
- **Accessibility:** `role="img"` with a summary ("Median build time, last 14 days: from 44 s to 41 s, low 37 s, high 46 s, baseline 45 s"). It shows shape, not values, so the exact figure always sits beside it: in a Stat, or a mono table cell. Not interactive: no tab stop, no tooltip.
- **In a Stat:** `trend` puts it at the foot of the tile, under the delta and full width, so the trends in a row of tiles line up.
- **Motion:** none. New data redraws at once.

## Breakdown
One whole split into its parts: storage by kind, credits by feature. The Meter, grown into a set.
- **Header:** the Meter's: the label at the start (small, `--fg`) and the reading at the end (mono caption, `--fg-subtle`: "91 of 100 GB").
- **Split rail:** 4px, a segment per part as wide as its share of the total, each at `--radius-control` with 2px of air between them, in the part's hue; when the total is more than the parts, the free space is one last segment at fg 12%. A part too small to draw keeps 4px, taken from the widest segment, so the rail never overflows.
- **Rows** (the default): one per part, `--space-6` apart, each exactly a Meter: the label, the reading with the share of the total in mono ("24 GB  24%"), and a 4px rail on the fg-12% track filled in the part's hue. **Legend** (`layout="legend"`, for a tile): under the split rail, a wrapping row of entries, each a 12 by 4px swatch rail, the label and the reading.
- **Hues (P11):** parts take the fixed order unless the caller pins one, and a pinned hue is reserved so pinning never repaints the others. A hue is never used twice. Past five parts, the rest fold into Other at fg 55%.
- **Accessibility:** the split rail is an image with a summary naming the whole and every part ("Storage, 91 of 100 GB: Video 58 GB, Images 24 GB, Documents 6 GB, Fonts 3 GB, 9 GB free"); each row's rail is a meter named by its label, with its reading as the value text; the legend is a list.
- **Motion:** none. No hover, no focus stop.

## Bar list
A ranked list where each row carries a thin bar for its share: most-used shortcuts, busiest repos, top pages.
- **Anatomy:** an optional lead (a Kbd, a 16px icon or a small avatar, up to 48px so two key caps fit), the label (small, `--fg`, truncates), the bar, the value (mono, small, `--fg`, tabular, at the end) and an optional delta. Rows are at least 44px, split by `--line` hairlines. One grid with subgrid rows keeps every bar starting and ending at the same place and the values in a column. The list measures itself: under 28rem the bar drops under the label at the row's full width.
- **Bar:** the Meter's rail: 4px at `--radius-control`, the track fg 12%, the fill `--fg` or one data hue's mark tone, as wide as the row's share of the largest value (or `max`). One hue means one thing: the quantity the bars measure, or, when the rows are kinds, each row's own hue (`hue` on the item), the one that kind keeps across the page.
- **Delta:** a word and a number at the caption size, colored and judged exactly as the Stat's: `--success` for good news, `--danger` for bad, `--fg-subtle` for neither, with the judgment in hidden text. Never an arrow alone.
- **Rows:** a row with `href` is a link, and with `onSelect` a button: an fg-4% hover fill at `--radius-control` on the instant tier, fg 6% pressed on coarse pointers, and an inset focus ring. A static row has no hover and no focus stop.
- **Accessibility:** an ordered list named by its label; a row reads "Archive, 412 times" with the delta's words. The lead and the bar are hidden: put anything that matters in the label.
- **Motion:** none. The bars never animate.

## Funnel
How many went on at each step: visited, signed up, activated, paid. Rows, not a trapezoid: the Meter, once per step, every rail measured against the first.
- **Header:** the Breakdown's: the label at the start (small, `--fg`) and the overall conversion at the end (mono caption, `--fg-subtle`: "4.1% overall", the last step as a share of the first). `overallText` replaces it.
- **Steps:** one row per step, in order, each exactly a Meter: the label, the reading with the step's share of the first in mono ("6,930  38%"), and a 4px rail on the fg-12% track filled to that share. Shares are whole percentages, with one decimal under 10% so the small end still reads ("4.1%").
- **Between steps:** one quiet line at the caption size, weight 400, in `--fg-subtle`, that says how many of the step before went on, in words ("38% continued"). Never red, never an arrow or a dash doing the talking. `formatStep` rewrites it.
- **Hue (P11):** one data hue for the whole funnel, blue unless `hue` says otherwise. It is one quantity, so it takes one hue. Never the accent.
- **Bad data:** a step larger than the one before still draws, held at 100% of the first, and its line says "121% of the step before" instead of calling it a conversion. A first step of 0 draws empty rails and no shares.
- **Accessibility:** an ordered list named by the label. Each step's rail is a meter named by its label, from 0 to the first step's value, with the value and its share as its text ("6,930 people, 38% of 18,240"). The line between steps is plain text at the start of the next item, so it is read in order. The visible header and readings are hidden, and a visually hidden line says the overall ("Signups, 4.1% overall: 748 of 18,240").
- **Motion:** none. No hover, no focus stop.

## Gauge
One value against a range, on a half circle of fine ticks with the figure in its opening: credits left, storage used. A sibling of the Meter for when the number is the point.
- **Marks:** 48 radial ticks over 180 degrees, 2px wide with square ends. The ticks up to the value take a data hue's mark tone, or `--fg` without one (the quiet default); the rest are fg at 12%. The last filled tick marks the value: it reaches 4px further out, in the hue's `-text` tone or `--fg`. No needle, no glow, no gradient.
- **Opening:** the label above (caption, `--fg-subtle`), the figure in the sans at the h2 size in `--fg` with tabular numbers, and an optional caption below (caption, `--fg-subtle`). The text is HTML over the SVG, so it stays crisp while the drawing scales down to its container. Under about 200px leave the caption out.
- **Accessibility:** `role="meter"` named by its label, with a minimum, a maximum, a value and a value text; the caption describes it. The ticks and the text over them are hidden, so nothing is read twice.
- **Motion:** none, like the Meter: no entrance, no hover, no focus stop.

## Dot plot
A distribution as stacks of dots, so you see where most values fall without reading numbers: reply times, build times. Plain SVG, a sibling of the Chart.
- **Anatomy:** one stack per bin on an 8px pitch (a 6px dot and 2px of air), so the bin count follows the width, on a linear or log axis. Stacks grow out from a center line, mirrored. A dot stands for the fewest items that fit the tallest stack in the height, and the legend says so when it is more than one. No gridlines, no area, no glow.
- **Color (P11):** with a goal, dots at or under it take the hue's mark tone and dots past it `--fg-subtle`, split on an exact bin boundary. Without a goal every dot takes the hue. The goal is a 1px dashed `--line-strong` line labelled at its foot; the median a 2px line in the hue's `-text` tone, labelled "Median" in that tone. A marker is a 10px dot ringed 2px in `--fg` on the center line, named in the tooltip's look.
- **Type:** tick, goal and median labels in mono caption; ticks in `--fg-subtle`, tabular, and a label that would touch its neighbor is left out.
- **Legend:** a 6px dot, the name and the share in mono `--fg`. A key, never a status.
- **Interaction:** one pointer layer; the bin under the pointer turns to the hue's text tone (`--fg` past the goal) on the instant tier, with the chart's tooltip ("1 h to 2 h, 34 replies"). One tab stop, on the median's bin; arrows, Home and End move between non-empty bins, Esc hides the tooltip, and a focused bin gets a 2px `--focus` ring. A finger scrubs, with `touch-action: pan-y`.
- **Accessibility:** `role="img"` with a summary ("Reply times, 412 replies: median 1 h 5 m, 84% within the 4 h goal") and a hidden table of every bin, then the median, the goal and the markers.
- **Motion:** one fade on the responsive tier. Dots never squash or grow.

## Spread
How values spread, one thin rail per row on a shared scale: build times by site, reply times by client. The Dot plot's quiet sibling.
- **A row:** the label at the start (small, `--fg`, truncates), the rail, and the median at the end (mono caption, `--fg-subtle`, tabular). The rail: a 4px track at fg 12% across the scale, the full range over it at fg 24%, the middle half (the 25th to the 75th percentile) in the hue's mark tone, and the median as a 2 by 12px tick in the hue's `-text` tone. All at `--radius-control`. Rows are `--space-6` apart, with no dividers.
- **Alignment:** one grid, so every rail starts and ends at the same place and the medians line up. Under 28rem the label moves above its rail.
- **Scale:** linear or log, the ends rounded outward. The tick labels sit once under the last row, and a label that would touch its neighbor is left out. A goal is a 1px dashed `--line-strong` line through every rail, labelled once under the rows. The hue means the measure, so a row past the goal keeps it and says so in words.
- **Legend:** one line in words, with swatches in the same tones: "Faint: the full range. Blue: the middle half. Tick: the median."
- **Accessibility:** a list named by its label; each row reads "Halo site: median 41 s, middle half 32 s to 48 s, range 22 s to 71 s", with ", past the 4 h goal" when it is. The rails are hidden.
- **Motion and keyboard:** none; nothing is pressable.

## Heatmap
A dot matrix whose depth says how much: usage per day, deploys per week, mail per hour.
- **Anatomy:** circles on a pitch of the dot plus 4px (an 8px dot on 12px by default). A row has a mono caption label in `--fg-subtle` at the start and an optional total at the end (mono small, `--fg`, tabular); optional ticks name chosen columns. Under the grid, at its end: "Less", the five levels, "More". Under a 16px pitch only every second row is labelled, and a screen reader still hears all of them.
- **Color (P11, magnitude):** zero is fg at 8%; the four steps are one hue's mark tone over transparent at 30, 55, 80 and 100%, starting at the quartiles of the non-zero values unless `steps` says otherwise. No data draws nothing.
- **Interaction:** hover rings a dot 1px in `--fg` and shows the chart's tooltip above it ("3 Oct, 14 deploys"). A `role="grid"` with one tab stop: arrows move in two dimensions, Home and End along a row, Ctrl with them to the corners, Esc hides the tooltip; the focused dot gets a 2px `--focus` ring, 2px away.
- **Fit:** dots keep their size. A grid wider than its box scrolls sideways inside it, starting at the latest column, with an 8px static fade on an edge that has more beyond it; labels and totals stay put. A finger scrubs while the grid fits and taps to pick while it scrolls.
- **Accessibility:** the grid is named by its label and described by a summary ("Deploys per day, 214 in all, most on 12 Oct with 31"); every dot is named by its row, its column and its value.
- **Motion:** none beyond the tooltip's responsive entrance.

## Cohort grid
Retention by signup week, as a real table: a row per cohort, a column per period since signup.
- **Columns:** the cohort (small, `--fg`, sticky at the start), its size (mono caption, `--fg-subtle`, end-aligned, headed "Users"), then a cell per period: an 8px dot just before the value (mono caption at 400, `--fg`, tabular). Every number keeps the width of the grid's longest, so the dots and the figures each line up. A low value is never set quieter: both inks pass 4.5:1.
- **Color (P11, magnitude):** the Heatmap's: zero is fg at 8%, the four steps are one hue's mark tone over transparent at 30, 55, 80 and 100%, starting at the quartiles of the non-zero values unless `steps` says otherwise. A period a cohort has not reached draws nothing. Under the table, at its end: "Less", the five levels, "More", hidden from screen readers.
- **Look:** the Table's: a hairline box at `--radius-surface` filled surface-1, 44px rows on 1px `--line`, the header at the caption size and `--weight-label` in `--fg-subtle`. Period cells are compact, about 64px. `average` adds a last row over a `--line-strong` hairline: "All cohorts" (every user who reached the period, so cohorts weigh by size), or "Average cohort" for counts (the plain mean of the cohorts that reached the period).
- **Fit:** the table keeps its width and scrolls sideways inside its box, so the page never does. The cohort column stays put on the box's surface, with a hairline at its edge once the periods pass under it. While it scrolls, the box is one tab stop, a group named by the caption.
- **Accessibility:** a native table with a hidden caption, column headers and a row header per cohort ("12 Oct, Week 3, 41%"). An empty cell reads "no data". No roving grid and no tooltip: every number is on screen.
- **Motion:** none. No hover, nothing to pick.

## Timeline
The steps of a run in order: when each started, how long it took and how it ended, grouped into phases. TimelineBar draws the whole run as a strip beside it.
- **Anatomy:** an ordered list in four columns: the start (mono caption, `--fg-subtle`, tabular), the rail (a 1px `--line-strong` line through 16px status icons), the label (small, `--fg`; skipped and pending in `--fg-subtle`) and the duration (mono caption, `--fg-subtle`; "skipped" in words). Rows are at least 32px. A phase is a heading row (small `--fg-subtle` label, mono total) over a nested, labelled list; the rail breaks at phase headings. The list measures itself, so the start column narrows on a phone and labels wrap.
- **Status:** a check in a circle (`--fg-muted`), a half-filled circle for running (`--fg`, never spinning or pulsing), an empty circle for pending and a dashed one for skipped (`--fg-subtle`), an x in a circle for failed (`--danger`). Every status is also said in hidden text. No dots.
- **Drawn to scale (`proportional`):** a step's row is at least its seconds times `secondHeight` (4px) tall, and a long step's rail becomes a 4px bar at `--radius-control` in its phase's hue (P11: the hue says which phase), or fg 55% without one; a failed step's bar is `--danger`. With the last run's time, a ghost bar at fg 12% stands beside it with "was 31s" at its foot. Short steps keep the thin line.
- **Result:** `TimelineResult` closes the run: its label at the body size in `--success`, `--danger` or `--fg` with the tone in hidden text, and the total in mono at the end.
- **Strip:** `TimelineBar`, 32px at `--radius-control`, segments sized by seconds, square and 2px apart, in their phase's hue; phase labels above ("Build · 24s") and the times at phase boundaries below, in mono caption. A hovered or touched segment lifts by an fg-16% wash on the instant tier and shows the chart's tooltip. It is an image with a summary ("Build 24 seconds, deploy 18 seconds, 42 seconds in all"), and its segments are not focusable, because it always sits beside a list or a table of the same steps. On coarse pointers its hit layer is 44px tall; a tap pins the tooltip and a drag scrubs.
- **Accessibility:** a step reads "00:02, Run build commands, done, 19 seconds".
- **Motion:** none in the list; a running step never moves. Only the strip's tooltip enters, on the responsive tier.

## Log view
The lines a build, a deploy or a job writes as it runs. The Code block's surface, for output.
- **Surface:** `--surface-2` with the inset `--line` hairline at `--radius-surface`, a 32px header with the label in mono caption `--fg-subtle`, actions and Copy, and the lines in mono at the small size, padded `--space-4`.
- **A line:** its number in a gutter (mono caption, `--fg-subtle`, never selected or copied), its time in one right-aligned column as wide as the longest (so the text stays in line as "+9.6s" becomes "+10.2s"), then the text: info in `--fg-muted`, debug in `--fg-subtle`, success in `--success`. A warning's text is `--warning` and an error's `--danger`, each with the alert mark in the gutter and a hidden "Warning:" or "Error:", so color is never alone.
- **Following:** at the bottom, new lines keep the view there. Scroll up to read and it stays; a secondary sm button at the bottom says how many lines came since and goes back (smoothly, at once under reduced motion).
- **Accessibility:** the scroller is a named region and a Tab stop; lines are an ordered list and are not read out one by one. Say how the run ended in a status of its own (a Progress, a Toast).
- **Motion:** none of its own.

## App shell
The frame around an app's pages: a sidebar for moving between them and a main area for the page.
- **Desktop:** a 240px sidebar on `--surface-1` with a `--line` hairline on its edge, and a main area that scrolls with the page. The sidebar column runs the full height of the page, so it reaches the bottom of a tall page. Its content is sticky and as tall as the window, so the wordmark and the links stay in view while the page scrolls.
- **Wordmark:** at the top of the sidebar, body size, `--weight-title`, `--fg`, in a row as tall as the glass header (`--header-h`).
- **Links:** 36px rows at the small size and `--radius-control`, with 12px side padding. The current page wears the selected segment (P12), one step raised from the `--surface-1` sidebar: `--fg` on `--surface-2` with the hairline and `--highlight`, and `aria-current="page"`. The others are `--fg-muted`, and hover fills them with fg at 6% and brightens the text, on the instant tier. No dots, no accent, no weight change. An optional 16px icon sits before the label. The sidebar holds one or more `nav` landmarks, each with its own name.
- **Main:** the page's own landmark, with the page gutter at the sides and `--space-8` above and below.
- **On compact screens** the sidebar is gone. A glass top bar, sticky at the safe-area inset like the header, shows the wordmark and an icon-only menu button, 44px, labelled "Open navigation", with `aria-expanded` and `aria-controls`. It opens the nav as the bottom sheet (see Modal): the same links in 44px rows, a heading, a close button, drag to close. Picking a link closes the sheet. The sheet does not use up the view's expressive moment.
- **Motion:** none of its own. The sheet is the Modal's.

## Empty and loading states
- **Empty:** one sentence saying what will appear here and one action to make it appear. Left-aligned in the container. No illustration unless art direction (Q5) says so.
- **Loading:** the skeleton fills with `--surface-2` at the real content's dimensions, and it is static. No pulse and no shimmer: a loop is motion that is not a response to the user, and a sweeping gradient animates material (P5).
- **Error:** what went wrong, in plain words, plus how to fix it or retry. Status color on the text or icon only.

## Progress
Work that is happening now, such as an upload or an import, with a known end. A quantity against a limit that stands still is a Meter (Chart).
- **Anatomy:** the Meter's lockup: the label at the small size in `--fg`, the reading at the end in the mono at the caption size in `--fg-subtle`, and a 4px rail at `--radius-control`, the track at fg 12% and the done part in `--fg`. Never the accent and never a data hue.
- **Ending:** done fills the rail and the reading says Done; failed keeps the rail where it stopped in `--danger` and says Failed, with a message under it that says what to do. The end is announced once in a polite status.
- **Not known yet:** an empty rail and the reading in words ("Waiting"). Nothing sweeps, pulses or shimmers; a wait with no end in sight is the loading state of the button that started it.
- **Motion:** the done part is a full-width band scaled from the left, a transform on the instant tier. Under reduced motion it jumps.
- **Accessibility:** `role="progressbar"`, named by the label, `aria-valuenow` while known and the reading as `aria-valuetext`.

## Forms
How the controls above make a page. One left-aligned column, never centered (P7).
- **Spacing:** fields sit `--space-6` (24) apart. Related controls share a fieldset with a legend at the small size and `--weight-title` in `--fg`, like a field's label. A section's title sits 4px above its description. Groups sit `--space-12` (48) apart.
- **Settings page:** sections, each a title (`--type-body-size` in `--fg`) with one line of description in `--fg-subtle`, then its fields. From 1024 up the title and description take the left third and the fields the rest; below that they stack. A `--line` hairline and `--space-12` of air separate sections. Save comes last, alone, lg and primary.
- **Sign-up or contact:** one narrow column (about 400 wide), md fields, a consent checkbox above the submit, and the submit lg, primary and full width (P10).
- **Optional fields:** mark the optional ones, not the required ones: "(optional)" in `--fg-subtle` after the label. No asterisks.
- **Errors:** validate on submit, then again as each field changes, so a fixed field clears itself. Each invalid field shows its error under it, in `--danger`, saying how to fix it. Above the form an error summary names every problem: a `.litt-raised` panel with an inset 1px `--danger` edge, a title in `--fg` ("Fix 2 fields to save") beside a 16px alert icon in `--danger`, then one link per error that moves focus to its field. The summary takes focus when a submit fails. A form of three fields or fewer skips the summary and focuses its first invalid field.
- **Actions:** in a page form, the submit comes first at the column's start, with Cancel (ghost) after it, both md. Below 640 they stack full width, submit on top. A dialog keeps its own order: bottom right, primary last, md. Never disable the submit to say a field is wrong; let the submit show the errors.
- **Saving:** the submit shows its loading state, then a toast confirms. A failed save keeps every value.

---

# Agents

A chat between a person and an agent, and what the agent shows while it works: its thinking, its plan, its tool calls and the code it writes. The same rules hold here as everywhere. The one accent fill is Send. Nothing shimmers, pulses or loops. A live state is said in words and a clock, never in a moving gradient. Parts of a turn are bare on the page; only the person's bubble, an approval and a code block are boxes.

## Conversation and message
A chat, read top to bottom, newest at the foot.
- **The agent's turn has no bubble.** Its words sit on the page at the body size in `--fg-muted` (body copy, as everywhere), with a measure of about 68ch. `MessageText` styles what a markdown renderer puts inside it: paragraphs `--space-3` apart, headings at the body size and `--weight-title` in `--fg`, lists with the marker in `--fg-subtle`, links in `--accent-text`, inline code in `--font-mono` on fg 6% at `--radius-control`, strong text in `--fg` at `--weight-title` (never bold, P9), emphasis in `--fg`, upright, and table headers at the caption size and the label weight. The answer is the content, and a box around long prose cramps it.
- **The person's turn is a bubble:** right-aligned, `.litt-raised` at `--radius-surface`, padding `--space-3` and `--space-4`, text at the body size in `--fg`, at most 80% of the column (85% on compact screens) and 32rem. No tail and no accent fill: the accent stays on Send. Files the person sent sit above the bubble as the Composer's chips.
- **Who is speaking:** the side says it. Each turn is an `article` with a visually hidden heading ("You", or the agent's name). An optional `name` shows above an agent's turn at the small size and `--weight-title` in `--fg`, for a thread with more than one agent or person, with an optional sm Avatar beside it. A name is never colored.
- **Spacing:** turns sit `--space-8` apart. The parts of one turn (thinking, a plan, tool calls, the answer, its actions) sit `--space-3` apart.
- **Actions:** under a finished agent turn, a row of sm ghost icon-only buttons with tooltips: Copy (it swaps to a check and a polite live region says "Copied"), Retry, and the caller's own. They always show under the latest turn; under older turns they show on hover and focus-within, and always on coarse pointers, where they grow to 44px. A hidden row keeps its height, so nothing shifts when it shows. There are none while the turn streams, and none on a turn that stopped, whose Retry is in its error line.
- **Streaming:** text appears as it arrives, with no fade per word, no blinking caret and no shimmer. The composer's Stop and the Thinking clock say the agent is working. The actions appear when the turn ends.
- **Error:** a turn that stopped says so on a line under its text: a 16px AlertIcon in `--danger`, the words in `--fg-muted` ("The answer stopped: the connection dropped."), and a Retry sm secondary button. Status color on the icon only.
- **Conversation:** a labelled region that scrolls on its own and holds the turns in a column up to 48rem wide, centered in it, so the composer under it can share the column. It keeps the latest line in view while content grows, unless the reader has scrolled up. Then a "Jump to latest" sm secondary button with an ArrowDown icon shows `--space-4` above the bottom, centered, and jumps without a smooth scroll (litt has no token for one). It is `aria-busy` while the agent answers, and a polite live region says when a turn starts and ends ("Litt is answering", "Litt answered", or "Litt stopped answering" after an error), never the words as they stream. When the person sends, the view follows to the foot again.
- **Empty:** before the first turn, the Empty state's rule: one sentence on what the agent can do, then the Composer's suggestions.
- **Motion:** a new turn arrives once on the responsive tier: opacity and half of `--travel` upward. Not the expressive tier, because a chat has many turns and the view's one moment stays free. Nothing moves while text streams. The Jump button fades in and out on the responsive tier.
- **On compact screens** the column takes the full width inside the page gutter, the bubble 85%.

## Composer
Where the person writes to the agent: a text field that grows, files, a toolbar and Send.
- **Surface:** a box at `--radius-surface` on `--surface-1` with the Input's inset `--line-control` edge. While its text field has focus, the edge is `--focus` plus `--focus-ring`, as the Input's. It holds a text area and, under it, a toolbar row of sm controls, padded `--space-2`.
- **Text:** the body size (16px on coarse pointers) in `--fg`, the placeholder in `--fg-subtle` ("Message Litt"), side padding as the Input's md. It starts one line tall and grows a line at a time (the height snaps; it is never animated) up to `maxRows` (8), then scrolls inside. A visually hidden label names it.
- **Keys:** with a mouse or a trackpad, Enter sends and Shift+Enter starts a new line. On a touch screen, whose soft keyboard has no Shift, Return starts a new line and Send sends. `enterSends` chooses either way; with it off, for long writing, ⌘Enter or Ctrl+Enter sends. Enter during IME composition never sends, and while an answer streams Enter sends nothing, so the next message can be drafted. Esc stops a streaming answer while the field has focus.
- **Toolbar:** the caller's controls at the start (an Attach ghost icon-only button that opens the file picker, a model Select at sm), Send at the end.
- **Send:** an icon-only round primary button at sm (44px on coarse pointers) with an ArrowUp icon, named "Send". It is the view's one accent fill (P1). It is disabled, in the Button's disabled look (so not an accent fill), while the field is empty or the agent waits on an approval. While the agent answers it becomes Stop: a secondary icon-only button with a filled square, named "Stop". Send and an approval's Allow are never both enabled, so a view never holds two accent fills.
- **Files:** chips above the text in the token look (`--surface-1`, inset `--line` and `--highlight`, `--radius-control`, 32px): a FileIcon, the name in mono at the caption size in `--fg`, cut at the end with an ellipsis, the size in `--fg-subtle`, and a remove button named "Remove brief.pdf" that grows to 44px on coarse pointers. A file still uploading shows its percent in mono. A paste attaches files only when the clipboard holds files and no text. Removing a chip moves focus to the next chip, or to the field. Files dragged over the composer turn its edge `--focus` and show "Drop to attach" in place of the placeholder, on the instant tier.
- **Suggestions:** before the first turn, up to four prompts above the composer as secondary sm buttons (the sans, the control radius). A click puts the prompt in the field and focuses it, so the person can edit before sending.
- **Hint and limit:** an optional line under the composer at the caption size in `--fg-subtle` ("Litt can be wrong. Check what matters."). With `maxLength`, a mono caption count shows in the toolbar once 80% is used, in `--danger` at the limit.
- **Disabled:** `--surface-2` with a `--line` edge, the text `--fg-disabled`, and the reason in the hint.
- **On compact screens** it sits at the foot of the chat with the safe-area inset under it, and the caller keeps it above the keyboard (`useVisibleScreen`). The toolbar's buttons grow to 44px.
- **Motion:** only instant color fades. Send and Stop swap at once. A file chip enters as a token does (the responsive tier, opacity and a 0.98 scale) and leaves on the exit token.

## Thinking
The agent's reasoning, as a quiet disclosure above its answer.
- **Row:** a button 32px tall (44px on coarse pointers) with no fill: a 16px chevron first, in the column where a tool call shows its status mark, then the label at the small size in `--fg-muted` and the clock in `--font-mono` at the caption size in `--fg-subtle` with tabular numbers. While the agent thinks it reads "Thinking 4s"; when it stops, "Thought for 12s" ("1m 5s" past a minute, "Thought for a moment" under a second). Hover brightens the label to `--fg` on the instant tier.
- **No shimmer, no pulse, no spinner.** The live signal is the clock, which counts whole seconds. A sweeping gradient animates material (P5), and a loop is motion that is not a response to the person.
- **Body:** the reasoning at the small size in `--fg-subtle`, indented to the label, with no box, no rail and no tint. Paragraphs sit `--space-2` apart.
- **Open and closed:** it is open while the agent thinks, so the reader can watch it work, and closes itself when thinking ends, unless the reader toggled it. `open` and `onOpenChange` control it. The chevron turns a quarter on the instant tier.
- **Motion:** the body fades in and travels a quarter of `--travel` down on the responsive tier, and leaves on the exit token. Its height snaps and is never animated.
- **Accessibility:** the row is a button with `aria-expanded` and `aria-controls`. The ticking clock is hidden from screen readers; a polite live region says "Thinking" once at the start and "Thought for 12 seconds" at the end.

## Tool call
What the agent did: a row per call, a group that folds a run of them, and an approval that asks first.
- **Row:** at least 32px tall (44px on coarse pointers): the 16px `StatusIcon`, the action in words at the small size in `--fg-muted` ("Read", "Ran", "Searched"), the target in `--font-mono` at the small size in `--fg` ("src/app.tsx", "npm test"), cut at the end, and the time in mono at the caption size in `--fg-subtle` at the row's end. A call with details shows a chevron in a 16px slot at the row's end and opens them, as Thinking does; the slot stays on rows without details, so a run's times line up.
- **Status:** the Timeline's marks from `StatusIcon`. Running is the half-filled circle in `--fg`, never spinning. Done is the check in `--fg-muted`. Failed is the x in `--danger`, with "Failed" in words before the time. Waiting is the empty circle in `--fg-subtle` with "Waiting for approval", and denied is the dashed circle with "Denied". Every status is also said in hidden text.
- **Details:** the input and the output, each under a caption-size label in `--fg-subtle`, in mono at the caption size in `--fg` on `--surface-2` with an inset `--line` at `--radius-surface`, padded `--space-3`. Past about 16rem they scroll inside, focusable and labelled ("Output of npm test"). Output stays `--fg` when the call failed: the status says it.
- **Group:** `ToolCallGroup` folds a run of calls under one row with the caller's summary ("Read 3 files and ran the tests"), or "4 tool calls". Its chevron sits at the row's end. It is open while any call runs, and closes itself when they are all done unless the reader toggled it.
- **Approval:** `ToolApproval` asks before a call runs. A `.litt-raised` panel in the flow (never glass), padded `--space-4`: a title at the body size and `--weight-title` in `--fg` ("Run a command?"), the call in mono on `--surface-2` at `--radius-control`, one line in `--fg-subtle` on what it touches, then md actions: Allow (primary, the view's one accent fill, because Send is disabled while it waits) and Deny (ghost), with an optional checkbox to always allow. After a choice it becomes a tool row, "Allowed" (the check) or "Denied" (the dashed circle). It does not take focus when it appears, because the person may be reading; a polite live region says "Waiting for your approval: npm run deploy". When the choice was made from inside the panel, focus moves to the row, so it never falls to the page.
- **Motion:** rows arrive with their turn. A status mark swaps at once and colors fade on the instant tier. Details open as Thinking's body does.

## Plan
An agent's steps for a task, ticked off as it works.
- **Header:** the label at the small size and `--weight-title` in `--fg` and the count in mono at the caption size in `--fg-subtle` ("3 of 7"), over a 4px rail in the Meter's look, the done share in `--fg`. Progress is not a category, so it takes no hue (P11).
- **Steps:** an ordered list, rows at least 32px tall, each the 16px `StatusIcon` and the label at the small size. Pending is `--fg-subtle`. Running, the current step, is `--fg` with the half-filled circle. Done is `--fg-muted` with the check, never struck through: the color steps it back. Failed takes the x in `--danger`, its label stays `--fg`, and "Failed" follows in words. Skipped is the dashed circle in `--fg-subtle` with "Skipped". A step can carry a detail line under it at the caption size in `--fg-subtle`.
- **Surface:** bare in a turn, like the turn's other parts. It can also sit in a raised panel beside the chat; the panel is the caller's.
- **Accessibility:** an `ol` named by the label, each step's status in hidden text, and `aria-current="step"` on the running step. A polite live region says "Step 4 of 7: Run the build" when the running step changes, "Step 4 of 7 failed: Run the build" when one fails, and "Plan done" when every step is done or skipped. It never speaks on the first render. The count is done steps over all steps, so a skipped step leaves it one short.
- **Motion:** none on the steps. A status swaps at once and colors fade on the instant tier. The rail's fill moves at once, as the Slider's range does. Steps added when the plan changes fade in on the responsive tier.

## Code block
Code in an answer, in a tool's output, or a diff.
- **Surface:** `--surface-2` with an inset `--line` at `--radius-surface`. A header row 32px tall holds the file name or the language in mono at the caption size in `--fg-subtle`, and a Copy button (sm ghost icon-only, "Copy code"; it swaps to a check and a polite live region says "Copied"; 44px on coarse pointers). The code is mono at the small size in `--fg`, padded `--space-4`, with a tab size of 2.
- **Highlighting:** quiet, through tokens only: identifiers and properties `--fg`, keywords and signs `--fg-muted`, comments `--fg-subtle`, strings `--accent-text` mixed 90% into `--fg`, as the gallery's own code blocks. Code is not data, so the data hues stay out (P11). JavaScript and TypeScript are highlighted; other languages show plain.
- **Diff:** with `lang="diff"`, each line's first character is its sign. The sign sits in its own column: `+` in `--success`, `-` in `--danger`. Added lines are `--fg`, removed lines `--fg-subtle`, and both changed kinds band with an fg 4% fill. Status color stays on the sign, as on an error's icon. A changed line starts with a hidden "Added:" or "Removed:" for screen readers. A diff's header lines and `@@` lines are quiet text with no sign.
- **Lines:** optional numbers in a gutter, mono at the caption size in `--fg-subtle`, hidden from screen readers and from a copy.
- **Overflow:** long lines scroll sideways inside the block (or wrap with `wrap`), and a block taller than `maxHeight` scrolls down. The scroller is focusable and labelled, so a keyboard can scroll it.
- **Motion:** none. The copy icon swaps at once.
