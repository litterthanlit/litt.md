# Changelog

Every change to the litt registry at https://littmd.vercel.app/r/, newest first. A release is named by its date, and each installed file says which release it came from in a comment at its top (`// @litt/button 2026.10.17`), so you can tell what changed since. Item names are the registry's: install one with `npx shadcn@latest add https://littmd.vercel.app/r/<name>.json`.

To update an item, read the entries since your version, then reinstall it with `--overwrite`. A **breaking** entry says what to change in your code.

## 2026-11-12 · Flat's accent switch and error ring; data, a body per world: Sparkline and Table; overlays open inside a frame

Two classes on one element that set the same property under the same variant have the same specificity, so Tailwind's order picks the winner, not the order they are written in. Two Flat bodies lost a state that way, and the gallery now checks its class lists for it.

- **fixed** `switch`: under Flat (`data-material="flat"`) a `tone="accent"` switch fills with the accent when it is on. It filled with the ink, which showed only once you asked for an accent (`data-accent="blue"` or `"pink"`), since Flat's own accent is the ink. The pill carried the ink's fill and the accent's at the same weight, and the ink's came later in the stylesheet; each tone now carries only its own. Flat's own look, Press and Device are unchanged, and so are the props.
- **fixed** `number-field`: under Flat, an error shows the danger ring on the pill. The pill's own `shadow-none` beat it, so the ring never showed.
- **changed** `sparkline`: a body per material. Press is a line in a groove: a sunken well with the line along its floor and the latest value a raised bead. Flat is the line as it was. Device is a row of lit dots on LCD glass, the latest column the strongest. The box keeps the caller's height in every world. Props are unchanged.
- **changed** `table`: a dress per material. Press is slats in a tray: the header a raised rail along its top, each row a slat drawn inside the row, the one under the hand or selected lifted. Flat is the table as it was. Device is a screen of mono columns on LCD glass, the header engraved on a plate, a lamp at the start of each row that lights under the hand, the keyboard or a selection; in Device rows never travel or fade, they appear. Row heights, props and semantics are unchanged. Flat's table now follows the material the part is in (`useMaterial`: the nearest `MaterialProvider`, else `data-material` on `<html>`), not CSS on any ancestor, so a subtree that sets `data-material="flat"` without a `MaterialProvider` gets the page's table, and a server-rendered Flat page paints Press's table until it hydrates.

Later the same day, an app shown inside a frame (the Playground's phone, a preview pane) can keep its overlays inside it: they open in the frame and wear its world, not the window's.

- **added** `motion`: `OverlayRoot` and `useOverlayRoot`. Wrap an app in `<OverlayRoot container={el}>` and every litt part inside it opens its overlays in `el`, which must be a containing block for fixed boxes (`contain: layout`, or a transform). Without one, `useOverlayRoot()` is `undefined` and nothing changes.
- **changed** `combobox`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `command-menu`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `context-menu`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `dialog`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `hover-card`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `lightbox`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `menu`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `popover`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `select`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `toast`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.
- **changed** `tooltip`: its overlay opens in the nearest `OverlayRoot`, when there is one; otherwise in the page's body, as before. Props are unchanged.

## 2026-11-11 · Data, a body per world: the line and stacked charts

- **changed** `chart`: BarChart, LineChart and StackedBarChart have a body per material. Press is a sunken well with the marks standing on its floor and the labels on a raised rail. Flat is the chart as it was. Device is a dot-matrix screen: bars and stacks as columns of lit dots, a line as a trace of dots, and the current value in seven segments, so the item installs `seven-segment` with it. Meter is unchanged, and so are the props.

## 2026-11-10 · Data, a body per world: Stat

Each world shows data in its own way (`proposals/worlds.md`, decision 15). Stat is the first data part with a body per material; the others follow.

- **changed** `stat`: a body per material. Press is a plate with the figure on a raised face set into it. Flat is the figure in ink on the page at 18px, with no box. Device is a plate with the label engraved above an LCD window that shows the figure in seven segments, so the item now installs `seven-segment` with it. Props are unchanged.
- **changed** `chart`: BarChart has a body per material. Press is a sunken well with the bars standing on its floor and the labels on a raised rail. Flat is the chart as it was. Device is a dot-matrix screen, bars as columns of lit dots and the current value in seven segments, so the item now installs `seven-segment` with it. LineChart, StackedBarChart and Meter are unchanged, and so are the props.

## 2026-11-09 · Each world has its own color and type

A world you can tell apart at a glance has its own color and its own voice (`proposals/worlds.md`, decision 14). With no `data-accent` each world shows its own accent, and with no face chosen its own face: Press is Blue 4 in Helvetica Neue, Flat is the ink in Geist, Device is orange in Geist Mono, as it was. An accent you ask for, or a face you choose, still wins in every world.

- **breaking** `litt`: Press sets Helvetica Neue (Helvetica or Arial where it is not installed), not Geist, and Flat (`data-material="flat"`) runs in the ink, as monochrome does, not Blue 4, and sets Geist. New: `data-accent="blue"` asks for Blue 4 in any world, with its tones `--litt-accent-blue`, `--litt-accent-blue-hover`, `--litt-accent-blue-fg`, `--litt-accent-blue-text`, `--litt-accent-blue-tint` and `--litt-focus-blue` (Press's `--litt-accent` and `--litt-focus` read them; Device retunes them to its body and its screens). New: `--litt-font-choice`, a face you choose, which every world sets in place of its own; litt never declares it. Migrate: a Flat project that wants Blue 4 back puts `data-accent="blue"` on `<html>` beside `data-material="flat"`. A Press project that wants Geist back sets `--litt-font-choice: "Geist", "Geist Sans", sans-serif` on `:root` (`base-styles` already loads Geist). A project that sets `data-accent="mono"` or `"pink"` changes nothing. Device has one orange too: on the light body the fill is now the bright orange of its screens with dark words (`--litt-device-accent`, `--litt-device-accent-hover`, `--litt-device-accent-fg`), where it was a deep orange with white words; links and the focus ring keep the deep orange.
- **changed** `base-styles`: an element that sets a theme or a material (`data-theme`, `data-material`, `.dark`, `.light`) sets the family again, so a part shown in another world takes that world's face.
- **changed** `motion`: the Customize snippet's face line is `--litt-font-choice`, the one every world reads, in place of `--litt-font-sans`.

Later the same day, wave one of the worlds (`proposals/worlds.md`, Three directions and decision 15): nine parts a hand presses and types into get three bodies, each world pushed to its extreme. Press is the instrument, objects on a bench lit from above; Flat is the page, ink on paper; Device is the machine, keys, wells, LCD glass and lamps. The props, the keyboard and what a screen reader hears are the same in all three, so nothing in your code changes. **Press is what the registry installs, so under Press these nine look different from before.** The bodies ship inside each item (`components/litt/bodies/`).

- **changed** `checkbox`: Press seats an ink block flush in a cut when checked, and a radio is a cup that takes a raised bead. Flat is a bare outline when off and an ink fill when on, a radio an ink disc. Device is a square key that latches down and lights its lamp; a radio group is a row of the same keys, interlocked.
- **changed** `segmented`: Press is a tray with the chosen block raised, and the hand can drag the block along the tray to the nearer option. Flat is words alone with a grey bubble that glides to the chosen one. Device is a row of keys in one well, the chosen one latched down, its face a step darker, its lamp lit, and nothing glides.
- **changed** `input`: Press is a field cut into the surface it sits on, its top wall shaded and its lower wall lit, with no drawn outline. Flat is a grey pill with the label in ink, the hint in grey words and an error in words in `--litt-danger` with the fill tinting. Device is LCD glass in a bezel well, the label engraved above, the hint a dim line on the glass and an error's lamp on the body beside it.
- **changed** `select`: Press is a raised block with a window cut for its mark, and its list a glass tray of slats with the current slat lifted. Flat is a grey pill whose list is one solid sheet that grows from it, the current row in a grey bubble. Device is the value on an LCD readout with up and down keys that step through the options without opening it, and a list screen with a lamp on the current row.
- **changed** `tabs`: Press is folder tabs cut from a plate's top edge, the current one standing forward and joined to its panel; the segmented variant is blocks in a tray. Flat is words with a grey bubble behind the current one and the panel bare. Device is engraved legends with a lamp under the current one; the segmented variant is a row of keys, the chosen one latched. Fun mode glides the chosen face, since Press no longer has an underline.
- **changed** `number-field`: Press is the figure in a cut beside one rocker block, minus and plus its two halves, the pressed half sinking. Flat is one grey pill of words: minus, the figure in ink, plus. Device is the figure on an LCD readout with minus and plus keys on their skirts beside the glass.
- **changed** `code-input`: Press is a raised plate with one cut per character, a typed character's cut catching the light on its lower wall. Flat is one grey pill per character, the typed ones darker with the character in ink. Device is one glass pane per character showing a dim seven-segment eight until its digit lights. It is still one text field underneath.
- **changed** `slide-confirm`: Press is a gripped cap ridden along a slot cut into a plate to a raised end stop, the words in the slot's floor. Flat is a grey pill with a plain ink circle; confirmed, the whole pill turns ink. Device is a latch key pushed along a well to a stop, the words on an LCD strip and a lamp at the stop that lights once confirmed; let go short and it goes home in steps.
- **changed** `option-picker`: Press is values as blocks in a tray, the chosen one raised and lit, a sold-out one a cut lying flat. Flat is words in grey pills, the chosen one an ink pill, sold out struck through and said. Device is a row of latching keys with engraved legends, the chosen one down with its lamp lit; a sold-out key lies flat and says so.

Later still, wave two of the worlds: ten more parts. Seven a hand presses get a body in each world, and Switch, Button and Slider, which had three bodies already, have their Press and Flat pushed to their extremes. **Under Press these ten look different from before.** Nothing in your code changes.

- **changed** `switch`: Press is now a thick block thrown along a deep tray to a stop, uncovering On or Off set in the tray's floor. Flat is a small ink pill with a canvas knob when on and an outline pill when off, its word in type beside it. Device stays the toggle key with its word on LCD.
- **changed** `button`: Press is now a thick block seated in its own plate, with a lit top edge and a wall at its foot, sinking into the plate when pressed; the primary keeps the accent and its glow, and a ghost has no plate. Flat is a pill whatever the shape, the primary in ink (or the accent) with no glow, a ghost words alone. Device stays the key on its skirt.
- **changed** `slider`: Press is now a cap in a deep slot cut into a plate, notches lighting as the fill passes, the value on a small raised face that rides with the cap. Flat is a bare pill track with an ink fill, a round ink knob and the value in words at its end. Device stays the fader. `SliderBodyProps` gains `shown`.
- **changed** `card-picker`: a body per material. Press is plates in a tray, the picked plate raised and lit. Flat is pictures and words, the picked one in a grey bubble with an ink tick. Device is a bank of keys in a well, the picked one set down with its lamp lit.
- **changed** `token-input`: a body per material. Press is a cut with each token a raised block and a small block to remove it. Flat is a grey pill field with darker grey token pills and a bare cross. Device is LCD glass with each token an inverted cell of lit words and a small key to remove it. Tokens no longer use Tag's `raised`.
- **changed** `composer`: a body per material. Press is a deep well cut into a plate, its tools a rail of blocks and Send the one lit block. Flat is a grey capsule that grows with the text, its tools as grey words and Send an ink circle. Device is LCD glass behind a prompt mark, files as lit cells, the tools a row of keys and Send the accent key.
- **changed** `file-drop`: a body per material. Press is a deep tray in a plate whose lower wall lights while a file is over it, each file a slat. Flat is a grey sheet with one sentence, "Drop files or choose", ringed in ink while a file is over it, each file a line of words. Device is an engraved legend over LCD glass with a Choose key, each file a glass line whose upload lights in segments.
- **changed** `legend`: a body per material. Press is blocks in a tray with hue chips, a hidden series sunk flush and saying Hidden. Flat is words with a hue dot, a hidden one grey with an outline dot. Device is latching keys whose lamps light in the series' data hue.
- **changed** `pagination`: a body per material. Press is the range on a raised face and Previous and Next as blocks at the ends of a tray. Flat is the range in words and Previous and Next as grey word pills. Device is the range in seven-segment panes with step keys at its ends; a screen reader still hears the range in words.
- **changed** `tag`: a body per material. Press is a small raised block with a lit top edge. Flat is the word in a grey pill. Device is the word engraved in capitals on a small plate, a status tag adding a lamp in its status color.

## 2026-11-08 · Device goes deeper: its own parts, and Only here

A world goes deeper by parts and abilities that exist in it alone (`proposals/worlds.md`, Depth). A part names its worlds in its page's `meta.worlds`; the wall, the nav and the other world pages hide it, and its world page lists it under Only here. Device gets the first four, brought home from the studies on litt.design: each needs `data-material="device"` on `<html>` and says so in its install notes.

- **added** `agent-indicator`: AgentIndicator, what an agent is doing in hardware, one mechanism per phase (thinking, searching, reading, reasoning, running, writing), moving only while tokens arrive, crossfading between phases, holding one frame under reduced motion.
- **added** `copy-button`: CopyButton, a key that copies the command on its LCD, sinks its 2px, draws its check and decodes the command back in a glyph wave.
- **added** `tape-progress`: TapeProgress, Progress said as two reels at the tape's constant pace, the value in words.
- **added** `seven-segment`: SevenSegment, a figure on seven-segment digits behind glass, its segments fading like phosphor.

Later the same day, the first bodies (`proposals/worlds.md`, Bodies): a part a hand touches keeps one contract and has a body per material, its own markup and its own interaction, picked by `data-material` at runtime. Nothing in your code changes; under Press each part renders as before.

- **changed** `switch`: a body per material. Press is the block in its tray with On and Off in words, as before. Flat is an ink pill when on and an outline when off, with no words, the knob sliding. Device is a toggle key that flips with a detent, its word on LCD. The bodies ship inside the item (`components/litt/bodies/`).
- **changed** `button`: a body per material. Press is the raised block that sinks half a pixel, as before. Flat is a pill, fill only, a step darker under the hand. Device is a key on a 2px skirt that sinks the whole 2px.
- **changed** `slider`: a body per material. Press is the cap in its slot, as before. Flat is a pill track with the filled part in ink and a round knob. Device is a fader in a well on a notched rail.
- **changed** `motion`: `byWorld(material, { press, flat, device })`, `useMaterial()` and `MaterialProvider` are exported, so a part picks its body by the material on `<html>`, or by the material a frame around it sets.
- **changed** `thinking`: an `indicator` slot beside the clock, for what the agent is doing while it thinks. Nothing changes until you pass it; the Agent block passes an AgentIndicator under Device.
- **changed** `agent`: under Device the Thinking row carries an AgentIndicator beside the clock while the agent thinks. Press and Flat render exactly as before.
- **changed** `code-input`: no change to the code; its page gains a study.

## 2026-11-07 · Worlds: each material is a page you arrive on

Press, Flat and Device are now places (`proposals/worlds.md`): a page each, with its line, who it is for, the block it opens on live at real size, its five foundations and the install steps. The sidebar and the phone menu lead with the three, the overview shows the current world's block under the deck, and Material leaves the Customize panel for them. `llms.txt` gains a Worlds section. Nothing in the registry changes for it, but one block had two landmarks with one name.

- **fixed** `case-study`: the pictures' carousel is named "Series pictures", so it no longer shares "The series" with the section around it (two landmarks with one name; WCAG 1.3.1). Nothing you see changes.

## 2026-11-06 · Flat, its own language; details that make it feel right

Flat stops being Press in grey. Under `data-material="flat"` every component follows five rules: one shape for every control, a pill by default; an outline means off; ink (never the accent, so one accent fill per view still holds) means on; a grey bubble means chosen; and no lines between things. Press and Device render exactly as before, and nothing changes until you set the attribute.

Four rules from design engineers, now kept: a theme switch is instant, a list of rows has no dead space between them, link text passes 4.5:1 on every surface, and on a touch screen every control takes a finger at 44 by 44px.

- **changed** `litt`: under `data-material="flat"` the shape is the Pill (`--litt-radius-control` 28px, `--litt-radius-surface` 16px), a tray has no frame (`--litt-tray-shade` is the empty shadow) and a cut is grey (`--litt-cut` is `--litt-surface-3`), so a field is a grey pill. Set your own `--litt-radius-control` and `--litt-radius-surface` after it to keep another shape.
- **changed** `button`, `kbd`, `tag`: under Flat a disabled button is a grey fill with no hairline, a tag a grey pill (a tag inside a field a `--litt-surface-1` bubble), and a key plain grey text.
- **changed** `switch`, `checkbox`, `slider`, `slide-confirm`, `segmented`, `option-picker`, `card-picker`: under Flat a switch is a 44 by 26 tray with no On or Off words (off: an outlined tray and an outlined knob at the start; on: an ink tray and a canvas knob at the end, or the accent for `tone="accent"`), a checkbox and a radio are outlined when off and ink when on (round at the Pill), a slider is a thin grey track with an ink fill and a small ink knob, slide to confirm a grey track with an ink thumb, and a card picker's cards are grey, the picked one `--litt-surface-1` in a 2px ink ring. Segmented and the option picker follow the tokens. The switch and the slider read their travel from a custom property; under Press and Device it is the same as before.
- **changed** `input`, `number-field`, `code-input`, `token-input`, `select`, `combobox`, `date-picker`, `file-drop`, `color-picker`, `time-scrubber`, `form`: under Flat a field is a grey pill with no outline (a textarea rounds to the surface radius), focus is the ink ring and an error the danger ring with its sentence. The number field is a grey track with the value in a white bubble and round − and + either side. The date picker's range ends are ink circles on a grey band, the file drop is a grey area with no dashed edge that deepens under a file, and a form's sections part with space, not rules.
- **changed** `glide`, `menu`, `popover`, `hover-card`, `dialog`, `command-menu`, `tooltip`, `toast`, `action-bar`: under Flat an overlay is a solid `--litt-surface-1` card with its shadow and no hairline, rows and the moving highlight sit concentric in it (the surface radius less its 4px padding), separators are space, and the command menu's search is a grey bubble. A tooltip, a toast and the action bar are ink pills with `--litt-canvas` words; a toast's error says so in words, since red does not read on the ink.
- **changed** `tabs`, `pagination`, `breadcrumb`, `steps`, `accordion`, `app-shell`, `header`, `tree`, `scroll-area`, `resizable`, `details`, `carousel`: under Flat a chosen tab or page is a grey bubble (a Highlight outline under forced colors), links take a grey bubble on hover, steps are ink when done, an ink ring now and outlined to come, an accordion's open item is a grey card with a round key, and sidebars, headers, trees and details lose their rules. A resizable's line is a small grey grip.
- **changed** `table`, `list`, `card`, `stat`, `callout`, `states`, `progress`, `avatar`, `timeline`, `bar-list`, `chart`, `media`, `cohort-grid`: under Flat there are no frames or row rules; a table or list row lights up as a grey bubble, a card is a `--litt-surface-1` card with the float shadow, a stat has no box, a callout and an empty state are grey cards, tracks are grey pills and a timeline's done marks are ink.
- **changed** `message`, `composer`, `thinking`, `tool-call`, `sources`, `plan`, `code-block`, `file-changes`, `run-card`, `log-view`, `product-card`, `cart`, `rule-builder`: under Flat the agent's message is a grey bubble and yours an ink one, the composer a grey field with a round ink send key, and every card (thinking, tool calls, sources, plans, code, file changes, runs, logs) a grey card with no frame or dividers; plan ticks are round ink marks. Product cards and the cart lose their hairlines, and a rule builder's rows lose their frames and rail.
- **changed** `litt`: `--litt-accent-text` in dark is `#6579fd` (was `#5e78fe`), so a link passes 4.5:1 on every surface, the darkest included; Device's light `--litt-device-accent-text` is `#a23200` (was `#a8380a`) for the same reason. New `.litt-target`: on a coarse pointer, an invisible `::before` grows a positioned control's tap area to at least 44 by 44px without changing how it looks. Nothing in your code has to change.
- **changed** `button`, `tabs`, `segmented`, `date-picker`, `option-picker`, `color-picker`, `range-chart`, `number-field`: on a touch screen each control takes a finger at 44 by 44px or more (`.litt-target`), however small it is drawn. Nothing you see changes. Reinstall `litt` with them.
- **changed** `list`: its filter chips take a finger at 44px on a touch screen, and a row reaches over the divider under it, so a pointer between two rows is always on one. Nothing you see changes. Reinstall `litt` with it.
- **changed** `app-shell`: a sidebar link reaches 2px past each edge, over the 4px between links, so the hover never drops between two of them. Nothing you see changes.

## 2026-11-05 · Device, a third material, and nothing rounder than what holds it; things come from where you touched them

Device says litt's depth ladder in hardware, after the components studies: one attribute on `<html>`, `data-material="device"`, and the components follow. Press stays the default.

At the pill, rows and fields that wrap keep their one-line corners, and nothing sits rounder than the box that holds it.

A surface can now open out of the element that opened it and go back into it, the choreography of the gallery's mosaic, as one building block in the motion engine. Dialogs and menus use it: they grow out of the button that opened them. And the page is pure white, with the old canvas kept as the ground under a part shown on its own.

- **changed** `number-field`, `tag`: a stepper, and a raised tag in a field, take the field's radius less their 4px inset, never under 2px. At litt's own radius they are 2px as before; at 6px they are 2px instead of 4px, so they share the field's corner center instead of sitting rounder. Nothing in your code has to change.
- **changed** `litt`: a third material, Device. `data-material="device"` on `<html>` sets an aluminium body (`--litt-device-*`, in each theme), plates on it, wells cut into it, keys that stand on a 2px skirt and sink the whole 2px when pressed, and fields behind LCD glass. The accents, status inks and data hues are retuned for the body, so every contrast pair still passes; `data-accent="pink"` and `"mono"` still win on the same element. New tokens every material sets: `--litt-field`, `--litt-field-ink`, `--litt-field-ink-subtle`, `--litt-field-line`, `--litt-field-shade` and `--litt-field-font` (the cut, the inks and the sans, outside Device), and `--litt-label-case`, `--litt-label-tracking` and `--litt-engrave` with the `litt-legend` class (a 12px label, engraved capitals under Device). Reduced motion keeps a key still. Nothing changes until you set the attribute. Device sets field text in Geist Mono, so load it at 400.
- **changed** `litt`: Device, reshaped after the studies. Every word sets in Geist Mono (Device sets `--litt-font-sans` to the mono; load it at 400, 500 and 600). Its accent is orange: a deep orange with white words on the light body, a bright orange with dark words in the dark, with `--litt-accent-fg` and `--litt-accent-tint` to match; Pink and Monochrome still win when set. Every panel (`litt-raised`) and overlay (`litt-glass`) is a dark LCD screen set into the light body, with its own inks, keys and hues (`--litt-device-screen-*`), so a component inside one needs nothing. Under Device, amber is an ochre and rose a mauve, so both stand apart from the orange. New `--litt-accent-pink-fg` keeps the words on a pink fill white wherever a material changes `--litt-accent-fg`.
- **changed** `input`, `number-field`, `code-input`, `combobox`, `token-input`, `composer`: the box you type into reads the field tokens (`bg-litt-field`, `text-litt-field-ink`, `--litt-field-line`, `--litt-field-shade`, `font-field`), so under `data-material="device"` it is LCD glass with its text in the mono. Under Press and Flat these are the cut, the inks and the sans, so nothing changes there. A `mono` Input keeps the mono everywhere. The code input's caret takes the field's ink.
- **changed** `command-menu`: under Device the search and the results set in the mono, and the group labels are engraved. Nothing changes under Press or Flat.
- **changed** `menu`, `app-shell`, `gauge`, `table`, `cohort-grid`, `run-list`, `combobox`: their 12px group and column labels carry `litt-legend`, engraved capitals under Device. Nothing changes under Press or Flat.
- **changed** `rule-builder`: a condition row's corners stop at half its one-line height (22px) and a group's are at least 4px rounder than its rows, so at the pill a row that wraps keeps its one-line corners instead of turning into a lozenge, and a group never holds rows rounder than itself. At litt's own radius, and anything up to 22px, nothing moves. Reinstall `combobox` with it.
- **changed** `combobox`, `token-input`: a field's corners stop at half its one-line height, so at the pill a field that wraps to a second row of tokens stays concentric with them instead of curving into the first one. On one line, and at radii up to 16px, nothing moves. Nothing in your code has to change.
- **changed** `card`, `list`: a cover set 4px into the card (the inset and plain cover styles) takes the surface radius less 4px. That is the control radius at every shape but the pill, where a 28px cover sat rounder than its 16px card; there it is 12px. Nothing in your code has to change.
- **changed** `card-picker`: the large size's cards take the tray's surface radius less 4px, so at the pill they are never rounder than the tray. At every other shape nothing moves.
- **changed** `run-list`, `tool-call`: the selected run's block and the command under approval take the surface radius less 4px, so at the pill they are never rounder than the panel or card around them. At every other shape nothing moves.
- **changed** `states`: Skeleton has a `cover` radius, the surface radius less 4px, for a cover set into a card as Card's is. `control`, the default, is unchanged.
- **changed** `litt`: the page is pure white in light, under Press and Flat: `--litt-canvas` and `--litt-flat-canvas` move from the off-white to white. New `--litt-well` and `--litt-flat-well` (utility `bg-litt-well`), the old off-white: the ground under a part shown on its own, such as a tile in a grid of examples, a step off the page and drawn without a line. In dark the page is unchanged and the well is a step lighter than it. Under Device the well is `--litt-device-well`, a plate of the body, and `--litt-device-screen-well` on its screens. Nothing in your code has to change; white cards on the page keep their hairline, which is what sets them apart now.
- **changed** `range-chart`: a segment's accessible name is its visible words in their order ("Before the redesign 32%", no comma), so a voice command that says what it sees presses it (WCAG 2.5.3). Nothing you see changes.
- **changed** `motion`: new `lib/litt/motion/deal.ts`. `deal(pieces, from, motion)` starts each piece where it comes from and springs it to its place on the expressive spring, `--litt-stagger` apart, appearing on the instant tier. It runs as Web Animations of transform and opacity only, which the browser keeps running off the main thread, so a deal stays smooth while what it brings in is still mounting; no blur, which would repaint every frame. `from` is a small deck on one element (`{ deck: box }`: the pieces fan out of it, the nearest first), one element per piece (`{ each: boxes }`: each grows out of its own) or a nudge of `--litt-travel` from an element's side (`{ toward: box }`, or `null` for from below). `gather(order, to, motion)` takes them back into a deck on one element, the farthest first, on the expressive exit, from wherever they are drawn, so a close can interrupt a deal. `useDealMotion()` reads the tiers from the tokens as Web Animations timings (milliseconds and the springs as CSS curves); under reduced motion nothing moves and both resolve at once. For an overlay that grows from its trigger: `GROW` (0.9), the scale it starts from; `useOpeners()` and `openerBox()`, the box of the press that just opened it (read at the press, so a menu row that has already closed still answers, and `null` when nothing was pressed); and `originOn(panel, opener, scale)`, the transform-origin that sits on the opener. Nothing else in the engine changes, and nothing in your code has to change.
- **changed** `dialog`: under Flat, opened by a press (a button, a menu row), the centred panel grows out of what was pressed: its transform-origin sits on the opener and it scales up from 0.9 without travelling, and it shrinks back into it on close. Opened any other way (from code, a shortcut) it rises from below as before. The side sheet and the phone sheet are as before. Nothing in your code has to change.
- **changed** `menu`: under Flat the panel grows from its trigger's corner from 0.9 instead of 0.98, so the growth reads as coming out of the button. Submenus too. Nothing in your code has to change.
- **changed** `context-menu`: under Flat it grows from the pointer's corner from 0.9, as the Menu does. Nothing in your code has to change.
- **changed** `menu`: not modal any more, so it opens without a stall: a modal menu locked the page's scroll and pointer events, and either one made the browser restyle the whole page as it opened. The page keeps its scroll while a menu is open, and a press outside closes the menu and reaches what it lands on (it used to be swallowed). Focus, Esc, the arrow keys and typeahead are as before.
- **changed** `popover`, `hover-card`, `select`, `combobox`, `tooltip`: under Flat they grow from the trigger's corner from 0.9 instead of 0.98, as the Menu does (the Combobox's list from its field). Date picker and Color picker open in a Popover, so they follow. Nothing in your code has to change.
- **changed** `command-menu`: under Flat, opened by a press (a search button), the panel grows out of it, as a Dialog does; opened by the shortcut it drops in from above as before. Nothing in your code has to change.
- **changed** `lightbox`: under Flat, opened from its Media frame, the image grows out of the frame and shrinks back into it; opened any other way it rises as before. Nothing in your code has to change.
- **changed** `motion`: `useGrowFrom(open, enabled)`, the Dialog's way of growing from the press that opened it as one hook, now shared by Dialog, Command menu and Lightbox.
- **changed** `motion`: each material has its own motion language. `useMaterial()` reads `data-material` on `<html>` (Press when there is none) and follows it. `deal()` and `gather()` move by it: under Flat a set deals out of what opened it and gathers back; under Press it settles into place from half of `--litt-travel` above, one after another, and lifts away the way it came; under Device it switches on and off in place in three steps on the instant tier. `useOverlayMotion()` tells an overlay how to move: its grow scale (0.9 under Flat, 0.98 under Press, 1 under Device), whether it slides, and the step transitions Device switches on and off with. `useGrowFrom` grows from the opener only under Flat.
- **changed** `menu`, `context-menu`, `popover`, `hover-card`, `select`, `combobox`, `tooltip`: they move in the material's language: from 0.9 under Flat, from 0.98 under Press (as before today), and under Device they switch on and off in steps where they stand, with no slide. Nothing in your code has to change.
- **changed** `dialog`, `command-menu`, `lightbox`: under Device the panel (the image) switches on and off in steps where it stands; under Press it rises and settles as it always has; only under Flat does it grow out of what opened it. Nothing in your code has to change.

## 2026-11-04 · A slider that fits a pill

The Slider's cap no longer rubs the round ends of a pill-shaped plate.

- **changed** `slider`: the cap's travel starts at the larger of 14px and the plate's corner radius (at most half its height), and the slot and the notches follow it, so on a pill (`--litt-radius-control` past 14px) the cap stands in the middle of each round end, as clear of the curve as of the top and bottom. At litt's own radius, and anything up to 14px, nothing moves. `RangeSlider` does the same. Nothing in your code has to change.

## 2026-11-03 · Another way through: type to confirm, and toasts that fit their words

A slide is a drag, and not everyone can drag. Slide to confirm takes the words to type as its other way through, the pattern GitHub and Vercel use to delete a project. And a toast now grows to fit what it says, so a narrow screen never cuts the part that says what to do.

- **changed** `slide-confirm`: new `confirmText`, the words to type instead of sliding (WCAG 2.5.7). It adds "Or type to confirm" under the track, which opens a labelled field and a danger button with the label's verb ("Delete Atelier Nord"); the button waits for the exact words (trimmed, case kept), and it or Enter confirms by the slide's own path. Esc closes the field. It now installs `input` and `button`. After it confirms, the thumb is `aria-disabled` instead of `disabled`, so focus stays on it rather than falling to the page. Without `confirmText` nothing else changes.
- **changed** `toast`: a toast grows to fit its words instead of cutting them (WCAG 1.4.10, 1.4.12). It is at least 72px tall; the title wraps to two lines and the description to four, so on a narrow screen a long error keeps the part that says what to do. Toasts behind the front peek at its height, the open list places each by its measured height, and a height change snaps. Short toasts look exactly as before. Nothing in your code has to change.
- **changed** `settings`: Delete studio passes `confirmText`, so the studio can be deleted by typing its name. Reinstall `slide-confirm` with it.
- **changed** `date-picker`: the calendar fits a 320px screen (WCAG 1.4.10). Its seven columns are 40px (44px for a finger) wherever they fit and share the room evenly where they do not, so Sunday and the next-month arrow are never cut off. Anywhere it fitted before it looks exactly the same. Nothing in your code has to change.
- **changed** `toast`: screen readers hear every toast (WCAG 4.1.3). A toast is no longer its own live region, which VoiceOver and NVDA with Firefox often miss when it arrives with its words already in it. The Toaster keeps two hidden live regions mounted, polite and (for errors) assertive, and writes the toast's title and description into one after it appears; the same toast twice is read twice. Nothing you see changes. A test that finds a toast by its words now matches the visible toast and the hidden announcement, so scope it to the toast: `locator("[data-toast-id]").getByText(…)`.
- **changed** `states`: Loading's status mounts empty and takes its label a frame later, so a screen reader says "Loading projects" when it appears. Nothing you see changes.
- **added** `framed`: `Framed` says a whole screen sits inside a page that already has its own main landmark and h1, such as a preview in a docs page (WCAG 1.3.1, 2.4.6). Inside it, a block's `Main` is a div and its `Heading`s drop one level, so the page keeps one main, one h1 and an outline that never skips. Classes set the look, so nothing you see changes. Without it nothing changes.
- **changed** `app-shell`: inside a `Framed` the page area is a div, as `mainLandmark={false}` makes it, so a framed dashboard never adds a second main. Set `mainLandmark` to choose either way. Nothing in your code has to change.
- **changed** `activity`, `case-study`, `collection`, `dashboard`, `deployment`, `product`, `projects`, `settings`, `sign-in`, `team`: the headings (and Sign in's main landmark) come from `framed`, so inside a `Framed` the block adds no second main or h1 and its headings sit one level lower. Rendered as your page it has the same main and h1 as before, and looks the same either way. Reinstall `framed` with it.
- **changed** `chart`: a line in the teal, violet or rose data hue is dashed, dotted or dash-dotted, in the legend swatch too, so five lines are never told apart by color alone (WCAG 1.4.1). Blue and amber, the first two hues, stay solid, and the dash follows the hue as the color does. Bars and the quiet foreground are as before.
- **changed** `legend`: new `lines`, for a Legend that keys a LineChart: a teal, violet or rose swatch is cut dashed, dotted or dash-dotted, as the chart draws that line. Blue and amber, and every swatch without `lines`, are as before.
- **changed** `time-scrubber`: a warning's mark carries a 6px diamond on its top and a danger's a 6px dot, so status is never color alone, and in forced colors, where every mark is CanvasText, they still differ (WCAG 1.4.1). Neutral and success marks are as before.
- **changed** `dot-plot`: its hidden data table sits in a clipped wrapper, as the chart's does, so a long one never widens a phone's page (WCAG 1.4.10). A table will not shrink to `sr-only`'s 1px on its own. Screen readers read the same table, and nothing you see changes.

## 2026-11-02 · Flat: a second material

Flat says litt's depth ladder by fill alone, on neutral greys: one attribute on `<html>`, `data-material="flat"`, and the components follow. Press, the raised-and-sunken material, stays the default. A raised block under a pointer now reads one token, `--litt-block-hover`, so a material can set its own hover.

- **changed** `litt`: a second material, Flat. `data-material="flat"` on `<html>` says the depth ladder by fill alone, on neutral greys (`--litt-flat-*`, the stone neutrals at chroma 0, in each theme): a tray is a hairline, a raised block a grey fill, and nothing casts or catches the light. Glass and its glow stay. An element that sets its own theme needs the attribute too. Nothing changes until you set it; Press stays the default. A block under a pointer reads `--litt-block-hover`: 4% ink under Press, as before, and 2.5% under Flat, so the words on a grey block keep 4.5:1.
- **changed** `button`: a secondary or destructive button under a pointer reads `--litt-block-hover`, and under `data-material="flat"` the primary and a destructive dialog's confirm catch no top highlight. Nothing changes under Press.
- **changed** `checkbox`: under `data-material="flat"` a checked or mixed box catches no top highlight. Nothing changes under Press.
- **changed** `select`, `date-picker`, `number-field`, `color-picker`, `run-card`: a raised trigger or step under a pointer reads `--litt-block-hover`. Under Press it is the same 4% as before; under Flat a placeholder on a hovered trigger keeps 4.5:1.
- **changed** `button`: `loading` no longer disables the button. It keeps its look and its focus, sets `aria-disabled` beside `aria-busy`, ignores presses (a submit's too, so Enter in a field cannot send the form twice) and does not sink until loading ends. If you put focus back on a submit after a save, you can drop that code.
- **changed** `settings`: Save no longer puts focus back on itself when a save ends, since a loading button now keeps its focus. Reinstall `button` with it.
- **changed** `glide`: under forced colors (Windows contrast themes) the highlight is the system's Highlight fill; before, the system painted it away and a highlighted row looked like the rest. A row on it needs HighlightText: the menu, select, combobox and command menu rows here already do. New `forcedHighlight: false` keeps it off for a list where Highlight already means selected. Nothing in your code has to change.
- **changed** `menu`, `select`, `combobox`, `command-menu`: under forced colors the highlighted row is Highlight with HighlightText, its icon and shortcut included, so the arrow keys show where you are. The context menu gets it through `menu`. Nothing in your code has to change.
- **changed** `run-list`: under forced colors the selected run's words show on its Highlight block (the browser's backplate hid them), and the hover highlight stays out of the way, so Highlight still means selected.
- **changed** `tabs`: under forced colors the underline variant's line is Highlight; before, the system painted it away.
- **changed** `code-input`: under forced colors the current cell takes a Highlight outline, since its focus ring is a shadow the system removes, and the caret shows in CanvasText.
- **changed** `litt`: line heights are in rem (`--litt-type-*-leading`), the same 28, 22, 20 and 16px at the default size, so text a reader has set larger no longer runs into its own lines. Under `prefers-contrast: more` the grey ink is the full ink, both hairlines take the control outline's 3:1 and glass is its solid fill, in both themes and under Flat. `--litt-gutter` is never less than the safe area on either side, so a phone in landscape keeps the page clear of the notch (with `viewport-fit=cover`). Nothing in your code has to change.
- **changed** `toast`: a toast with an `action` stays until it is dismissed, like an error, so there is time to reach its button; pass `duration` to time it out as before. The region is named "Notifications (F8)", so a screen reader says how to reach it.
- **changed** `tag`: a tag is never wider than its container. A text label cuts at the end with an ellipsis instead of running out of the box; a tag still keeps its width beside other things in a row.
- **changed** `hover-card`: a card taller than the room the screen leaves scrolls inside itself. Nothing changes for a card that fits.
- **changed** `token-input`, `combobox`: a value's remove button shows the pointer cursor.
- **changed** `color-picker`: the hue rail takes a press 6px above and below it with a mouse, a 24px target, as it already did 16px for a finger.
- **changed** `checkbox`, `table-filter`, `header`: the shadow no longer fades with the fill, so the material steps at once (R2). The focus ring is unchanged.
- **changed** `message`, `thinking`, `lightbox`: running text keeps to `--litt-measure` (65ch) instead of its own width; a message and the reasoning were 68ch.
- **changed** `agent`, `case-study`, `product`: running text keeps to `--litt-measure` (65ch).

## 2026-11-01 · Tune: one line that tunes a component against litt's rules

One call gives a component typed live values and a panel to tune them in, with litt's rules saying Fits or Change as you drag, and the result copied as litt's own tokens. The rules it checks against now live in `motion` beside the spring rules. Then the card picker, the Customize panel's tiles grown into a registry item that also draws plans and onboarding questions.

- **added** `tune`: `useTune(name, (t) => ({ … }))` returns typed live values and builds an Inspector for them under a `TuneRoot` you mount once. The builder is the rule: `t.radius` is checked against litt's corners, `t.space` against the spacing scale and `t.spring` against its tier, each a Fits or Change row; `t.easing`, `t.toggle`, `t.choice`, `t.number` and `t.action` (a button that runs in every copy) carry none. A corner or a space comes back as litt's token `var()` while it sits on one, else a px length; a spring as a Motion transition that holds still under reduced motion; a choice as its options' type. Components that share a name share one panel. Copy tokens writes custom properties that hold `--litt-` names, and Save keeps versions under the name and the fields. The panels show only in a development build: `enabled` shows them in production too, and `inline` draws them after the children instead of floating. The code ships wherever it is imported, hidden or not.
- **added** `card-picker`: one choice shown as cards. `size="sm"` is a row of tiles, a picture over a word in one tray (the gallery's Customize panel uses it); the default is cards with a title, a `description` and a `detail` such as a price, in one row of equal cards while each gets 12rem and stacked when they do not, decided by the picker's own width. Native radios (`name`, `required`, the arrow keys); the pick is the raised block gliding on the responsive tier, never the accent; nothing starts picked without `value` or `defaultValue`, and `value={null}` keeps it empty; `help` and `error` as RadioGroup's.
- **changed** `motion`: `rules.ts` adds the corner and spacing rules: `cornerRule(px, subject)` (0, `--litt-radius-control`, `--litt-radius-surface` or the pill, as litt's check reads them), `spaceRule(px, subject)` (a step of the spacing scale, and off it the steps on either side), `SPACE_SCALE` (each step in px with its token) and `RADIUS_PILL` (999, `--litt-radius-pill`). Nothing in your code has to change.

## 2026-10-27 · Hands and agents: a range to brush, a run to fold, rules to build, sources, file changes and runs

Three components from Nick's moodboard that answer a hand, and the one file of the motion engine they share. The hand's rules are the ones the Time scrubber and Slide to confirm already follow: the part follows the pointer one to one and holds where it was taken, a release settles on the responsive spring and commits once it has arrived, and nothing coasts unless fun mode is on. Then the agents' second round: where an answer came from (`sources`), what an agent changed and whether you keep it (`file-changes`), the agent's other runs (`run-list`), and a tool call that shows what it found (`tool-call`'s `details` and `result`). The Agent block uses all of them. None of them changed a token. Then a second accent: pink, beside Blue 4 and monochrome (`litt`). Then the tuning kit: a spring and an easing curve you shape by hand, and an inspector that holds them with the other controls, checks them against litt's rules and copies them as tokens.

- **added** `spring-editor`: a spring shaped by hand, as time and bounce (Motion's `visualDuration` and `bounce`). The Pad's well with the spring's curve on its floor: the cap's x is the visual time on the curve's own time axis and its height is the bounce, so the curve redraws under your hand. The label row says the time and the bounce, a line under the well says what they do ("Settles in 540ms and overshoots 1%"), and a dot crosses a rail on the spring each time you let go. `tier="expressive"` or `"responsive"` washes the floor beyond litt's limits for that tier and adds a Fits or Change row per rule. Time and Bounce are two range inputs with one tab stop, as on the Pad; a double-click goes back to `defaultMark`.
- **added** `curve-editor`: an easing shaped by hand, as a cubic Bézier (`[x1, y1, x2, y2]`). Two round caps with arms from the curve's ends, on a well that shows progress from -0.25 to 1.25, so a curve can pull back or pass its end. A press on a handle takes it where it is; a press elsewhere sends the nearer handle there. Under the well, the curve as CSS (`toCubicBezier`) and in words (`describeCurve`: "Starts quick and eases into place"), and a dot that crosses on it when you let go. One tab stop per handle.
- **added** `inspector`: a floating glass panel for tuning one thing live. `InspectorGroup`s fold; a Select of `presets` and the versions you Save puts any of them back (kept under `storageKey`); `checks` lists a Fits or Change row per rule in a Rules group; `tokens` adds Copy tokens and a Tokens group in mono. Reset goes back to `defaultValue`, and the header folds the panel to its title. It holds any litt control, the Spring editor and the Curve editor included.
- **changed** `motion`: new `rules.ts`, imported as `@/motion/rules`: litt's motion limits (`LIMITS`) and `springRules(spring, tier)`, the rows that check one spring against the responsive or the expressive tier. Nothing in your code has to change.
- **changed** `litt`: a second accent, pink. `data-accent="pink"` on `<html>` or `<body>` swaps Blue 4 for a hot raspberry at its weight (white text past 5.9:1), with its own hover, link text, tint and focus ring in each theme: `--litt-accent-pink`, `--litt-accent-pink-hover`, `--litt-accent-pink-text`, `--litt-accent-pink-tint` and `--litt-focus-pink`. Like Blue 4 it keeps 0.12 (OKLab) from every data hue, rose included, so its link text is a deep berry in light and a pale pink in dark. Nothing changes until you set the attribute; Blue 4 stays the default.
- **added** `file-changes`: what an agent changed in a codebase, to review before keeping it: a header that counts the files and the lines and says what is left to review, with Keep all and Undo all (a raised block and a ghost; `accent` makes Keep all primary on a screen with no composer), and a row per file with its kind in words, its lines added and removed, a diff that opens under it, and Keep and Undo on the row. `onDecide(ids, decision)` is the only write path and the component holds no decision; Keep the rest and Undo the rest act on pending files only. A change with no diff can load one when it opens (`onOpenChange`). One polite status says each decision, and in fun mode the checks Keep all decides pop in a wave.
- **added** `sources`: where an answer came from. `Sources` holds a turn's sources and numbers them once; `Citation` is a quiet numbered chip in the running text, a link to the source in a new tab that previews it in a hover card (the site, the title, the passage or the mark's own `quote`, when it was read); `SourceList` lists them under the answer, or one search's results inside a tool call's details, where the cited rows wear their numbers and the rest say Not cited. Rest on a chip and its row lights with every other chip of that source; rest on a row and its chips light, color only. `citationId` reads the `#cite-<id>` link a model writes and `unlinkCitations` cleans the text for Copy. Only http and https urls become links. In fun mode, resting on a row pops its chips in reading order.
- **added** `run-list`: an agent's runs for a sidebar or an inbox: each run's title, its status in words and a mark (running, needs you, done, failed, stopped), where it has got and when it last changed in your words, the runs that need you lifted above the rest in your order, a Select that filters by status with counts, and Stop or Archive on the row. The open run is a raised block that glides to the row you press, and a filter glides the rows to their new places; a run the agent changes moves at once. One Tab stop with arrow keys, and a polite status when a run needs you, fails or is done. In fun mode the block glides on a springier spring and a run that changes into one of those pops its mark.
- **added** `range-chart`: one quantity over time as a barcode of thin bars, its segments and their shares in a tray above, and a range you brush by hand: drag across the bars, drag either cap, or drag the whole span. The edges follow the pointer one to one and settle on a bar or a segment start; the segment the range matches is the raised block, and the total of what is brushed rolls as you go, its last group in the quiet ink. Three sliders (from, to, move range) carry the keys, and `onValueCommit` fires once the edges have settled. In fun mode the span can be thrown and the bars it sweeps rise.
- **added** `rule-builder`: rules built from rows of field, operator and value, joined by And or Or (a Segmented control at the head of each group's rail), with groups inside groups up to `maxDepth`, a locked trigger row, `errors` by condition id and `name` posting the rule as one JSON string. Take a row by its handle and it rises into a raised block and follows your hand while the rows it passes make room; it settles, then commits once. Space picks a row up for the arrow keys.
- **added** `run-card`: an agent run as a card: its title, where it is in words ("Step 1 of 3", "Step 2 failed", "Done", "Waiting"), a ring of ticks and a figure for how far it has got, and its steps beside an optional preview, with an `actions` slot and Hide. Hide folds it into a raised block you press to open again: the ring travels between its two seats, the title, the words and the figure glide to theirs, and the height snaps. One polite status says each new step, open or folded.
- **changed** `motion`: new `hand.ts`, imported as `@/motion/hand`: `useHand` (a pointer gesture: slop, capture, the release speed, the page's scroll given back, Escape, and the click swallowed after a drag), `useSettle` (settle on the responsive spring and commit once; fun mode's coast, throw and rubber live here and nowhere else) and `snap` (a step grid with anchors that pull). Nothing in your code has to change; the other components keep their own copies for now.
- **changed** `plan`: new `bare`, only the list with no label row, count, rail or live region, for a parent that says them itself. Nothing in your code has to change.
- **changed** `combobox`: new `hideLabel`, the label for screen readers only, as Number field's. Nothing in your code has to change.
- **changed** `tool-call`: new `details`, a part with its own surface (a LogView, a SourceList, a FileChanges) drawn as given when the row opens, after the input and output wells, so it is never a well inside a well; and new `result`, a few words after the target on what the call found or changed ("5 sources", "+2 −2"), kept when the target is cut. Nothing in your code has to change.
- **changed** `agent`: the block cites, reviews and lists runs. The turn sits in `Sources`; a build's call streams its log as a `LogView` and says "Exit 1" or "Exit 0", a web search lists what it found as a `SourceList` and says "4 sources", and the edit opens to its file as a `FileChanges`. The answer cites two of those sources with `Citation`s (Copy carries them as reference links, never as `#cite-` links), the review of every file Litt changed replaces the answer's diff, and a `SourceList` follows the answer. Keep and Undo are React state beside the script, one decision per file, shared by the edit call and the review; the finished chat shows them kept. On a frame wide enough, a `RunList` of the studio's runs sits beside the chat, its Halo row read from the same moment ("Needs you" while the approval waits); it hides by the frame's width or on a phone, never by the window alone. It now installs `sources`, `file-changes`, `run-list` and `log-view`, and no longer `code-block` directly.
- **changed** `table`: the region becomes focusable in the same frame that rows make it scroll, never a frame later, so a keyboard user or an accessibility check never finds a scrolling table it cannot reach. Nothing in your code has to change.

## 2026-10-26 · litt 1.0: nine rules, the depth ladder and Blue 4

litt's rules are rewritten as nine (the litt.md profile, v1.0), and the registry follows them. The accent is Blue 4, a brighter cobalt that still carries white text past 5.5:1, or a project runs monochrome. Depth is one ladder: sunken, flat, raised and floating, one recipe each, lit from the top. Selected is raised: the selected segment, a segmented tab, the current page, a tree's selected row and an active table filter are the same block a switch moves. The secondary button is that block too, and it sinks half a pixel when pressed. The slider is the post: a cap you hold, riding in a slot on a raised plate. Every other control takes its place on the ladder (litt.md profile v1.1): what you type or put a mark into is a cut (every field, a checkbox's box, a radio's ring, a color well), what you press is raised (a select's trigger, a stepper's − and +, a key cap, a tag in a field), what fills is a slot (progress), and a destructive action is a block with red words, lit red only as a dialog's confirm. Comments across the registry cite the new rule IDs, R1 to R9 (the profile maps the old P1 to P12).

- **breaking** `litt`: the accent is Blue 4 in both themes (`--litt-accent`, `--litt-accent-hover`, `--litt-accent-text`, `--litt-accent-tint`, `--litt-focus`), and the accent stays 0.12 (OKLab) from every data hue. `data-accent="mono"` on `<html>` or `<body>` runs a project monochrome: the primary action, links and the focus ring in the ink, the glow a block's lift. New: the slider's post, `--litt-slot`, `--litt-slot-shade`, `--litt-slot-fill`, `--litt-slot-fill-shade`, `--litt-plate-lift`, `--litt-cap`, `--litt-cap-held`, `--litt-cap-lift`, `--litt-cap-press`, `--litt-cap-grip`, `--litt-notch` and `--litt-notch-home`, with their colors (`bg-litt-slot`, `bg-litt-cap` and the rest); and `--litt-press-depth`, how far a pressed block sinks (0 under reduced motion). New: the cut, `--litt-cut` and `--litt-cut-shade` (`bg-litt-cut`), a field's floor and its top wall's shade inside the control line; `--litt-key-lift`, a key cap's lift with its darker lower edge; and `--litt-danger-fg` (`text-litt-danger-fg`), the words on a dialog's danger confirm. Gone: `--litt-block-round` and `--litt-block-roll`, the old slab slider's. Migrate: nothing in litt uses them any more; if your own code does, use `--litt-block-lift` for a raised block, or the post's tokens for a slider.
- **changed** `button`: a secondary button is the raised block (`--litt-block`, `--litt-block-lift`), and its cast tightens while pressed. A press sinks a button half a pixel (`--litt-press-depth`) instead of shrinking it. The primary keeps its glow. New `variant="danger"`: a raised block with words in `--litt-danger`, for a destructive action; in a dialog's footer it is the one red fill (words in `--litt-danger-fg`), and it lies flat while disabled. Nothing else in your code has to change.
- **changed** `icons`: the set is solid (litt.md profile v1.2, R8). A shape that encloses something is filled with its details cut out, and a mark that is only a line (chevrons, arrows, plus, x, check) stays a 1.5 stroke. Every name and prop is unchanged; `StatusIcon` fills its done and failed marks. Nothing in your code has to change.
- **changed** `select`: the trigger is a raised block, like a secondary button, since you press it: it sinks while pressed and stays down while its list is open. An invalid trigger keeps the danger line. Nothing in your code has to change.
- **changed** `combobox`: the field is the cut, as Input's, and a picked value inside it is a raised tag. Nothing in your code has to change.
- **changed** `number-field`: the field is the cut, and − and + are raised blocks inside it that sink when pressed and lie flat at either end of the range. Nothing in your code has to change.
- **changed** `code-input`: every cell is the cut, as Input's. Nothing in your code has to change.
- **changed** `token-input`: the field is the cut, and each token a raised tag you can lift out. Nothing in your code has to change.
- **changed** `file-drop`: the zone is the cut, as Input's, in place of the dashed border, and a file dragged over it turns its line to the focus color. Nothing in your code has to change.
- **changed** `color-picker`: the trigger is a raised block, as Select's; the color area and the hue track are cut into the popover, and their thumbs are caps that cast down. Nothing in your code has to change.
- **changed** `kbd`: a key cap is the smallest raised block (`--litt-key-lift`), with a darker lower edge. Nothing in your code has to change.
- **changed** `pagination`: the page numbers sit in a tray and the current one is the raised block in it, as the Segmented control's pick; Previous and Next stay secondary buttons, and at either end one lies flat. Nothing in your code has to change.
- **changed** `dialog`: the footer marks itself (`data-dialog-footer`), so a `danger` button in it is the one red fill. Nothing in your code has to change.
- **changed** `progress`: the rail is a slot cut into the page (`--litt-slot`, `--litt-slot-shade`), 8px tall, with its walls drawn over the fill so the fill sits down in it; the fill's end is square. Nothing in your code has to change.
- **changed** `segmented`: the track is a sunken tray and the selected segment the raised block in it, as the Switch's, 2px in, its corners the control radius less 2px. Nothing in your code has to change.
- **changed** `tabs`: the segmented variant's track is the tray and its fill the raised block. The underline variant is unchanged. Nothing in your code has to change.
- **changed** `option-picker`: words sit in the Segmented control's tray, the picked one the raised block. Nothing in your code has to change.
- **changed** `slide-confirm`: the track is the tray and the thumb the raised block, as the Switch's; a disabled thumb lies flat. Nothing in your code has to change.
- **changed** `header`: the current page is the raised block. Nothing in your code has to change.
- **changed** `app-shell`: the current page in the sidebar is the raised block. Nothing in your code has to change.
- **changed** `tree`: the selected row is the raised block. Nothing in your code has to change.
- **changed** `table-filter`: a filtering column's funnel is the raised block. Nothing in your code has to change.
- **changed** `slider`: the post. A raised plate the control's height, a slot cut into it, the fill a step darker, and a cap riding in the slot that casts down. Take the cap and it follows your hand 1:1, sinks and leans when pushed fast; press the slot, or use a key, and it glides there on the responsive spring. New `marks` draws notches under the slot, and `home` (by default the `defaultValue`) is a longer notch the cap holds a little. The value now shows at the end of the label row, not inside the control; `showValue={false}` still leaves it out. `RangeSlider` is two caps in one slot with the fill between them. Nothing in your code has to change.
- **changed** `action-bar`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `avatar`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `bar-list`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `breakdown`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `callout`: its four icons are the set's solid Info, Check circle, Warning and X circle, a filled shape with the mark cut out. Nothing in your code has to change.
- **changed** `card`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `carousel`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `cart`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `case-study`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `chart`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `checkbox`: the box is the cut, as a field's; checked, it fills with the ink and its top edge catches the light. A chosen radio fills with the ink and holds a raised bead in place of the dot. Nothing in your code has to change.
- **changed** `code-block`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `cohort-grid`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `collection`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `composer`: the box is the cut, as Input's, and a file you can remove is a raised chip; a sent attachment and a disabled composer's chips lie flat. Nothing in your code has to change.
- **changed** `date-picker`: the trigger is a raised block, as Select's, since you press it. Nothing in your code has to change.
- **changed** `details`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `dot-plot`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `form`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `funnel`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `gauge`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `growth`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `heatmap`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `input`: the field is a cut: a white floor (`--litt-cut`) a hair into the page, the control line around it, and its top wall's shade (`--litt-cut-shade`). Focus and an error still turn the line, and a disabled field still lies flat. Nothing in your code has to change.
- **changed** `insights`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `legend`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `list-cover`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `message`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `pad`: the well is the cut you reach into, and the thumb a round cap (`--litt-cap`, `--litt-cap-lift`) that sinks while held. Disabled, everything lies flat. Nothing in your code has to change.
- **changed** `plan`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `product`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `product-card`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `scroll-area`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `sparkline`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `spread`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `stat`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `switch`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `table`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `tag`: new `raised`, a plain tag drawn as a raised block, for a tag you can lift out of a field (Token input and Combobox use it). Without it a tag is the flat chip it was.
- **changed** `thinking`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `time-scrubber`: the track is the Pad's well, the cut, with the ruler sliding under its edge, and the needle is the Slider's cap riding over it, its grip line on the exact time. Disabled, the well and the cap lie flat. Nothing in your code has to change.
- **changed** `timeline`: a done or failed step is a filled disc with its check or x cut out; pending, running and skipped keep their rings. Nothing in your code has to change.
- **changed** `tool-call`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.
- **changed** `usage`: its comments cite the v1.0 rules (R1 to R9). Nothing else changes.

## 2026-10-25 · Geist for numbers, the mono for code

Geist Mono is now only for code and terminal output: code blocks, commands, logs, and the identifiers inside them (a hash, a path, a token name). Everything else that was in the mono, such as a number, a date, a key cap, a count, a file name or a hex value, is set in Geist with tabular figures (`tabular-nums`), so digits still line up by place. At the caption size a tabular figure in Geist is as wide as one in the mono (7.2px at 12px) and its letters run narrower, so nothing grows. Nothing in your code has to change; reinstall to pick it up. In your own code, set a figure as `tabular-nums` rather than `font-mono`.

- **changed** `litt`: the type notes in the tokens and the theme say the mono is for code and terminal output only, and a caption that is a value (a reading, a count, a key) adds `font-normal`. Only comments change.
- **changed** `kbd`: the key cap is Geist at 400. A `<kbd>` is mono by default, so the chip sets `font-sans`.
- **changed** `tooltip`: its shortcut is the new Kbd.
- **changed** `command-menu`: a row's shortcut is in Geist.
- **changed** `menu`: an item's shortcut hint is in Geist.
- **changed** `input`: `mono` is for code a person types, such as a slug, a path or a command. A domain, a link or a number stays in the sans. The prop is unchanged.
- **changed** `details`: `mono` is for a hash, an ID or a path. A version, a region or a number stays in the sans. The prop is unchanged.
- **changed** `slider`: the slab's value, the thumb's and RangeSlider's span are Geist in tabular figures, and the grip is measured in Geist.
- **changed** `time-scrubber`: the reading and the ruler's times are Geist in tabular figures.
- **changed** `code-input`: the cells are Geist in tabular figures at the body size.
- **changed** `date-picker`: the days are Geist in tabular figures.
- **changed** `color-picker`: the hex in the field and the panel is Geist, in tabular figures in the field.
- **changed** `avatar`: the initials are Geist.
- **changed** `chart`: axis labels and the meter's reading are Geist in tabular figures, and the room kept for a label is measured in Geist.
- **changed** `dot-plot`: tick labels, the median and the goal are Geist in tabular figures.
- **changed** `spread`: the medians and the scale are Geist in tabular figures.
- **changed** `heatmap`: the labels, totals and the tooltip's value are Geist in tabular figures.
- **changed** `cohort-grid`: the cohort sizes and each cell's share are Geist in tabular figures.
- **changed** `bar-list`: the values are Geist in tabular figures.
- **changed** `breakdown`: the reading and each part's value are Geist in tabular figures.
- **changed** `funnel`: the overall conversion and each step's figures are Geist in tabular figures.
- **changed** `legend`: a series' reading is Geist in tabular figures.
- **changed** `timeline`: the starts, durations and totals are Geist in tabular figures.
- **changed** `pad`: the axis words are Geist.
- **changed** `progress`: the reading is Geist in tabular figures.
- **changed** `steps`: the count is Geist in tabular figures.
- **changed** `plan`: the count is Geist in tabular figures.
- **changed** `thinking`: the clock is Geist in tabular figures.
- **changed** `tool-call`: the time at the end of a row is Geist in tabular figures. The target, the input and the output stay in the mono.
- **changed** `log-view`: the label is Geist. The lines and their gutter stay in the mono.
- **changed** `composer`: a file chip's name is Geist, and its size and the character count are in tabular figures.
- **changed** `file-drop`: a file's name is Geist, and its size is in tabular figures.
- **changed** `list`: the dates are Geist in tabular figures.
- **changed** `table`: a numeric cell is Geist in tabular figures, still right-aligned at the caption size.
- **changed** `cart`: CartButton's count is Geist in tabular figures.
- **changed** `table-filter`: the counts are Geist in tabular figures.
- **changed** `pagination`: the range and the page numbers are Geist in tabular figures.
- **changed** `carousel`: the range, "3 of 12", is Geist in tabular figures.
- **changed** `lightbox`: "3 of 12" is Geist in tabular figures.
- **changed** `tree`: an item's detail at the end, a size or a change mark, is Geist in tabular figures.
- **changed** `activity`: an event's time is Geist in tabular figures. A deploy's branch and commit stay in the mono.
- **changed** `deployment`: the domain is Geist. The branch and the commit stay in the mono.
- **changed** `insights`: the figures and the word count are Geist. A commit stays in the mono.
- **changed** `sign-in`: the versions are Geist in tabular figures.

## 2026-10-24 · Commerce, focus you can see, and controls you can feel

The first store parts: a price, a product's options, a product card and a cart, for a store on Shopify or anywhere else. They take plain data (an amount and a currency code, a product, a cart line), so the same parts work with any backend. A price ranks by weight under the page's one title and a sale is never red; a grid of products has no buy buttons, so Add to cart stays the page's one accent fill; and the cart is a sheet, with Check out its one accent fill and Remove undone from a toast.

And three focus rings that keyboard users could not rely on, found by an accessibility audit of the gallery's overview. From the same audit, a Toaster inside another one hands its toasts to the outer one, and AppShell and FormSection take options that keep a page to one main landmark and its headings in order. Nothing in your code has to change; reinstall to pick them up.

And the switch and the slider, rebuilt as things a hand moves: a raised block in a sunken tray, lit from the top. The switch's block says On or Off and can be dragged across; the slider is a slab you push, and it says its value. They bring the press material to the `litt` item, the one place litt allows a shadow with an offset.

- **added** `price`: Price, one amount at the title weight with tabular figures, from Shopify's MoneyV2 shape, with a struck-through compare-at price, From, a unit price and an optional neutral saving tag; and formatMoney, multiplyMoney, sumMoney and savingOf.
- **added** `option-picker`: OptionPicker, one option of a product as native radios with a legend that names the pick: a segmented track for words, chips for colors and images, and sold-out values that stay pickable and say so.
- **added** `product-card`: ProductCard and ProductGrid, one product in a grid as one link to its page, with no buy button; and the Product type with priceRange, findVariant, defaultPicks, optionsFor and isSoldOut.
- **added** `cart`: Cart, the cart as a sheet with its lines, a free-shipping meter, a rolling subtotal and Check out; CartLine and CartSummary for a cart page; CartButton for the header; AddToCart with its Added state; and useCartState, a cart in memory.
- **added** `shopify`: the commerce parts on a Shopify store, in lib/litt/shopify.ts: createStorefront, a Storefront API client pinned to 2026-04; getProduct, getProducts and getCollection, which return litt's Product; and toProduct and PRODUCT_FIELDS for your own queries. No React in it, so it runs in a server component too.
- **added** `shopify-cart`: ShopifyCart and useShopifyCart, a cart kept in Shopify with the same CartState as useCartState, so Cart, CartButton and AddToCart work with it unchanged.
- **added** `product`: ProductPage, one product's page as one screen: pictures beside the details (a carousel on a phone), options with sold-out picks said in words, the quantity, Add to cart, an accordion and the cart.
- **added** `collection`: Collection, a store's products as one screen: the title and the count, a filter row, a grid of product cards with no buy buttons, an empty state and the cart.
- **changed** `icons`: BagIcon, for a cart. Nothing in your code has to change.
- **changed** `number-field`: `hideLabel` keeps the label for screen readers only, where the row already says what the number counts, such as a cart line's quantity. Nothing in your code has to change.
- **fixed** `resizable`: the handle between two panels shows its focus ring when you reach it with the keyboard. Its `outline-none` set the outline style to none, so the ring had a width and a color but never drew.
- **fixed** `table`: the edge that resizes a column shows its focus ring when you reach it with the keyboard, for the same reason.
- **fixed** `tree`: only the focused item's row shows the focus ring. Items nest, and focusing an open folder lit the ring on every row inside it too, so you could not tell which item had focus.
- **changed** `toast`: a Toaster inside another one adds nothing: its toasts go to the outer one, so a page that nests them (a section that brings its own Toaster) still has one stack and one Notifications region for a screen reader. Nothing in your code has to change.
- **changed** `app-shell`: AppShell takes `mainLandmark`. Set it to `false` when the shell is shown inside another page that has its own main landmark, such as a preview in a docs site, and the page area is a div, so the page keeps one main. It defaults to `true`, so nothing in your code has to change.
- **changed** `litt`: the press material, for a control a hand moves: `--litt-tray` and `--litt-tray-shade` (a sunken tray: a hairline and its top wall's shade), `--litt-block`, `--litt-block-lift` and `--litt-block-press` (a raised block: a contact line and a soft cast, which tightens while pressed), `--litt-block-round` and `--litt-block-roll` (a slab's soft top and bottom, and its leading end in shade), tuned for each theme; and `bg-litt-tray` and `bg-litt-block`. Nothing in your code has to change.
- **changed** `switch`: a raised block in a sunken tray, 92 by 32, that says Off or On, instead of a pill with a round thumb. It can be dragged across as well as clicked, and it presses down under a finger. `tone="accent"` fills the block with the accent when on, for the one switch that is a view's main choice; `words` changes its two words. It is wider and its rows are 44px tall, so check a tight row; nothing in your code has to change.
- **changed** `slider`: a raised slab in a sunken tray, the control's height, that grows to the value and says it at its leading end, instead of a thin rail and a round thumb. A press on the slab holds it where it was taken. The value now shows in the slab by default and no longer at the end of the label row: pass `showValue={false}` for a plain slab. `RangeSlider` is one slab between two ends, and still shows its span in the label row with `showValue`. In fun mode a held thumb no longer lifts and stretches, since there is no thumb to lift.
- **changed** `form`: FormSection takes `headingLevel` (2, 3 or 4) for its title, so a form under a heading of its own, in a card or a dialog, keeps the page's outline in order. It looks the same at every level and defaults to 2, so nothing in your code has to change.

## 2026-10-23 · Fun mode, more to touch, and a time scrubber

More of fun mode's touch, still a trial and still only with a `FunMode` on: highlights that reach for where they are going, numbers you can scrub, and toasts you can throw. And a time scrubber, for going back through a run. Each comes to rest on exactly the frame it draws without fun mode, and reduced motion turns it all off. Off by default, so nothing changes until you turn it on.

- **added** `time-scrubber`: TimeScrubber, a moment in a run that already happened, found by dragging a ruler of its time under a fixed needle, with the run's events marked in their status color. It settles on the nearest step or an event, Page Up and Page Down go from event to event, and in fun mode it can be thrown and coasts to the event its speed reaches. Pair it with what it replays, such as a LogView.
- **changed** `litt`: the dark theme's grey, `--litt-fg-muted` and `--litt-fg-subtle`, is lighter on the same warm hue, so body and supporting text in dark mode read as clearly as in light (APCA Lc 41 before, 71 now). Only dark mode changes. Reinstall to pick it up; nothing in your code changes.
- **changed** `log-view`: the times share one right-aligned column as wide as the longest, so the text stays in line when a time grows a digit ("+9.6s", then "+10.2s"). Nothing in your code has to change.
- **changed** `color-picker`: `getContrastInk` picks black or white by APCA instead of the WCAG 2 ratio, so a mid tone such as a rust gets white ink, which reads twice as well, where it used to get black. Text you draw on a user's color with it may turn from black to white on mid tones; nothing else has to change.
- **changed** `motion`: in fun mode, anything dragged and let go short of leaving (a toast, a sheet) springs home on fun mode's throw spring, with a little life, instead of without a bounce. Nothing in your code has to change.
- **changed** `motion`: `StillMotion` takes `active`, and `active={false}` lets what it holds move again without remounting it, so a preview held still on arrival can come alive when someone reaches for it, with its state kept and its entrance never replayed. It defaults to `true`, so nothing in your code has to change.
- **changed** `glide`: in fun mode the highlight stretches toward the row it is going to and gathers itself there, in every menu, context menu, select, combobox and command menu. Nothing in your code has to change.
- **changed** `tabs`: in fun mode the underline stretches to the new tab, its leading edge first, and the segmented fill springs to its tab. Nothing in your code has to change.
- **changed** `number-field`: in fun mode a step kicks the number the way it went, and dragging the label sideways scrubs the value, giving like a rubber band past min and max. Nothing in your code has to change.
- **changed** `toast`: in fun mode a mouse can throw the front toast away too, and it leaves with the speed it was thrown at. Nothing in your code has to change.

## 2026-10-22 · Blocks, images, and the parts a web app needs

The first blocks: ten whole screens, the gallery's five composed pages and five app screens (projects, settings, team, activity and sign in), each installable as one item that brings the components it uses. The app screens are a page's content, to render inside your app's shell. A block lands in `components/litt-blocks/` with its sample data at the top of the file, and unlike a component it is yours to change: it is a starting point, so edit it in place and never reinstall it over your edits.

And four components app screens need: a progress rail for work happening now, a one-time code input, a file drop and steps for a flow.

And the first image components: a frame for one picture that keeps its shape while it loads, a carousel that never moves on its own, a lightbox for seeing a set at the size of the screen, and a case study page that puts the three together.

And fun mode, a trial: a switch that changes how litt moves, never how it looks at rest. Wrap any part of your app in `FunMode` (from the motion engine) and the data parts arrive and change with springs (a heatmap's dots in two waves with a lens under the pointer, a gauge's needle with weight, meters, bars, sparklines and stats that grow and count honestly, a timeline that pops, draws and celebrates a run that went live), while buttons squish, checkboxes draw their tick and the segmented control's surface springs. What you hold is physical too: a switch stretches toward where it will go, a slider's thumb lifts and stretches with your speed, and a slide to confirm or a carousel can be thrown, coasting to where that speed carries it. Each comes to rest on exactly the frame it draws without fun mode, and reduced motion turns it all off. Off by default, so nothing changes until you turn it on.

And six parts every web app reaches for: a number field with steppers, a hover card that previews a link, an action bar for a selection, a tree for files, panels with a line to drag between them, and a log view for a build as it runs. The deployment screen puts four of them together, and the projects screen's grid now acts on what it selects.

And the icon set, grown from 34 to 98 and redrawn to one grid, with a page of its own to search it.

- **changed** `icons`: the set grows from 34 to 98, drawn on one grid with four keylines. New in navigation: ChevronUp, ChevronsUpDown, ArrowLeft, ArrowRight, Home, Sidebar, Expand, Shrink, Undo, Redo and LogOut. In actions: Edit, Link, Download, Send, Sort, Grip, Eye, EyeOff, Lock, Unlock, Star and Pin. In objects: Play, Pause, Code, Terminal, Globe, Layers, Frame, Cursor, Grid, List, Box, Database and GitBranch. In status: CheckCircle, XCircle, Warning, Help, Clock, History, Zap, Activity, Shield, Key, Flag, Cloud, Sparkle and Lightbulb. In people and data: Users, Building, Mail, Inbox, Message, AtSign, Hash, Command, ChartBar, ChartLine, ChartPie, TrendUp, TrendDown and CreditCard. SettingsIcon is a gear now, because its spokes read as SunIcon, and ArrowUpRightIcon is a size larger, to match the other arrows. Nothing in your code has to change.
- **changed** `motion`: `FunMode` and `useFun` turn on fun mode, a trial, for everything inside (reduced motion and `StillMotion` still win), and `useFunValue` and `countText` are the honest count the parts share: a figure never shows more than its data and never counts back. `useFunGrab` is a thumb you hold (it lifts, stretches with the finger's speed and wobbles back), and fun mode's motion has a throw spring with `coast` and `rubber` for things you throw. Nothing changes until you render a `FunMode`.
- **changed** `button`: in fun mode the press goes deeper and springs back on fun mode's press spring, still in CSS. Nothing in your code has to change.
- **changed** `checkbox`: in fun mode a drawn box that someone checks pops and draws its tick. Nothing in your code has to change.
- **changed** `segmented`: in fun mode the selected surface springs to its segment and settles. Nothing in your code has to change.
- **changed** `switch`: in fun mode the thumb crosses on a spring and lands a hair past its end, and while held it stretches toward where it will go. Nothing in your code has to change.
- **changed** `slider`: in fun mode a held thumb lifts, stretches along the rail with your speed and wobbles back to its size when let go, on the Slider and the RangeSlider. Nothing in your code has to change.
- **changed** `slide-confirm`: in fun mode the thumb can be thrown: it coasts to the end and confirms if your speed would carry it there, or springs back, squashing against the end it hits; the check pops in. Nothing in your code has to change.
- **changed** `carousel`: in fun mode a mouse drag can be thrown and coasts to the slide its speed reaches, buttons and keys land on the same spring, and a drag past either end gives like a rubber band. Nothing in your code has to change.
- **changed** `chart`: in fun mode a Meter's fill grows in and springs to new values, its reading counts with it, the target tick pops as the fill passes it and steps light in turn. Nothing in your code has to change.
- **changed** `gauge`: in fun mode the lit ticks sweep to the value with a needle's weight and the figure counts with them. Nothing in your code has to change.
- **changed** `bar-list`: in fun mode the bars grow in rank order and spring to new values, the values count, and rows that trade places slide past each other (rows are keyed by label while it is on). Nothing in your code has to change.
- **changed** `sparkline`: in fun mode the line draws itself on arrival and the dot lands as the pen reaches it. Nothing in your code has to change.
- **changed** `stat`: in fun mode a number value counts up with the same pen as a Sparkline in its trend. Nothing in your code has to change.
- **changed** `timeline`: in fun mode a step that changes status pops its icon, a finished step draws its check, a failed one shakes once, a phase total arrives, and a result added during a run rises in, with a few dots in the phases' hues when it went live. Nothing in your code has to change.
- **changed** `heatmap`: in fun mode the grid arrives in two waves (the dots, then the data by level, peaks last) drawn on one canvas, plain counts in the totals count up, and a lens follows the pointer. Nothing in your code has to change.
- **changed** `avatar`: `look` draws a picture from the name in place of the initials: `fluid` (warped noise from ink through the hue to cream), `film` (diagonal bands with a streak of light) or `thermal` (a heat map in the hue and its partner), under static grain. The same name always draws the same mark. The default is still the initials, so nothing in your code has to change.
- **added** `dashboard`: Dashboard, a deploy dashboard as one screen: an app shell with a sidebar, four number tiles, a chart of deploys per day and a table of recent deploys with its pagination.
- **added** `usage`: Usage, a plan's usage as one screen, drawn only in rails: trends, storage and bandwidth by kind of file, limits against their budgets and build times by site.
- **added** `growth`: Growth, twelve weeks of growth as one screen: sign-ups by source with a legend and a week range that filter them, the funnel from visit to paid and retention by signup week.
- **added** `insights`: Insights, seven panels of inbox and build insights in the data colors, two columns when wide and one on a phone.
- **added** `agent`: AgentChat, a chat with an agent as one screen, from the first word to the deploy, played by a script you replace with your agent's stream.
- **added** `projects`: Projects, a studio's projects as one screen: status filters, a search, a list or grid switch and New project, with an empty state for every case.
- **added** `settings`: Settings, an account's settings as one screen: profile, notifications and appearance, an error summary on a failed save, a toast on a good one, and deleting the studio behind a slide to confirm.
- **added** `team`: Team, a studio's people as one screen: seats as a meter, roles changed in place, open invites, an invite dialog for several addresses and a removal undone from its toast.
- **added** `activity`: Activity, a studio's activity as one screen: events grouped by day, filtered by kind, each one sentence in two inks with its time in the mono.
- **added** `sign-in`: SignIn, the page before the app: email and password, a second way in, wrong fields that take focus and a refusal in a callout.
- **added** `progress`: Progress, a rail for work happening now, filling on the instant tier and ending done or failed in words; with no value yet it stays empty and still.
- **added** `code-input`: CodeInput, a one-time code drawn as one cell per character and built as one real field, so paste and one-time-code autofill work; onComplete runs once.
- **added** `file-drop`: FileDrop, FileList and FileRow: drop or choose files, turned away by type or size with a reason, each uploading on a Progress rail with Retry and Remove.
- **added** `steps`: Steps, where someone is in a flow of a few steps, in the step marks, as a row, a column or Step 2 of 4 in a narrow box.
- **added** `media`: Media, one picture in a frame with a fixed shape: still surface-2 while it loads, then a fade in on the instant tier, and its words when it fails. Lazy unless `priority`; with `onOpen` it is a button that opens a Lightbox.
- **added** `carousel`: Carousel, CarouselContent, CarouselItem and CarouselControls: slides that scroll sideways with the browser's own scrolling and snap to the start edge, one, two or three in view with the next one peeking. The range in words, a page per press, never autoplay.
- **added** `lightbox`: Lightbox, one image of a set at the size of the screen, opened from a Media. The view's expressive moment; arrow keys, Previous and Next or a swipe move through the set.
- **added** `details`: Details, DetailsItem and DetailsLink, an information card of labelled facts about one thing: rows with the labels in one column, or a grid with each label above its value. A value can be copied, a missing one says Not set, and a loading card keeps its height.
- **added** `case-study`: CaseStudy, one project told as a page: a hero image, the facts, the story beside its labels, the series in a carousel, the details in a grid and the next project, with one lightbox for every image.
- **changed** `icons`: `ImageIcon`, a picture's mark, which Media shows when an image fails to load. Nothing in your code has to change.
- **added** `number-field`: NumberField, a labelled number with − and + in the field: arrow keys, a press or a hold to step, typed text read in the page's locale, kept between min and max and on the step, shown with Intl.NumberFormat.
- **added** `hover-card`: HoverCard, HoverCardTrigger and HoverCardContent: a preview of what a link points at, after the pointer rests or at once on keyboard focus. A touch never opens it, so the link must lead to the same thing.
- **added** `action-bar`: ActionBar, a glass toolbar that floats at the bottom of the view while something is selected: the count in words, sm actions and Clear; arrow keys inside, Esc clears.
- **added** `tree`: Tree, things inside things from data: indented rows with a hairline guide per level, the selected segment's look, and a file tree's keys, including typing to jump.
- **added** `resizable`: ResizablePanelGroup, ResizablePanel and ResizableHandle: panels with a hairline to drag between them, kept between their bounds, moved by the arrow keys too, and kept for next time with autoSaveId.
- **added** `log-view`: LogView, a run's output as it arrives: numbered, timed lines, warnings and errors in their color with a mark and a hidden word, following the newest line until you scroll up.
- **added** `deployment`: Deployment, one deploy as a screen: its status and facts, a progress rail, the changed files in a tree beside the build log with a line to drag, and each file's diff a press away.
- **changed** `projects`: cards ticked in the grid bring up an action bar with Archive for all of them. Reinstall only if you have not edited the block; otherwise copy the ActionBar lines from the new file.
- **changed** `icons`: `MinusIcon`, for the number field's stepper. Nothing in your code has to change.
- **changed** `table`: big tables. `TableVirtualBody` draws only the rows in view, so ten thousand scroll as lightly as forty, with aria-rowcount and aria-rowindex kept; `TableSelectHead`, `TableSelectCell` and `useRowSelection` select rows by box, Shift for a range, and `selected` on a `TableRow` fills it. It now installs `checkbox` with it. Nothing in your code has to change.
- **added** `table-filter`: TableFilter, a column's filter in its header: a funnel button that opens the column's values as Menu rows, checkboxes with a count each or radio buckets for a number, and wears the selected segment while it filters.
- **changed** `table`: `filter` on a TableHead takes a TableFilter, beside the label or the sort button (before it over numbers). Nothing in your code has to change.
- **changed** `table`: wide tables. `stickyColumns` keeps the first one or two columns in view while the table scrolls sideways, with a hairline at their edge once something is under them; `resizable` on a TableHead adds a handle to drag, step with the arrow keys or double click to fit, and `columnsId` keeps the widths. Nothing in your code has to change.
- **changed** `icons`: `FilterIcon`, the funnel. Nothing in your code has to change.
- **changed** `table`: loading from a server as you scroll. `TableVirtualBody` takes `hasMore` and `onLoadMore` and asks for the next page twenty rows before the end, once per count; `loading` draws three still skeleton rows at the end and says "Loading more rows", `loadError` is a row in words with Retry, and `total` keeps aria-rowcount true. TableSkeleton takes a `box` column. It now installs `button` with it. Nothing in your code has to change.
- **changed** `table-filter`: `useUrlFilter` and `useUrlParam` keep filters, a search or a sort in the page address, so a filtered view can be bookmarked, shared or reloaded, and Back brings the last one back. Nothing in your code has to change.

## 2026-10-21 · The header's wordmark is bare again, a color picker, a rolling number and slide to confirm

Taste profile v0.16's P12 covers the current page only: the wordmark in a segment stays the gallery's own, not the language's. And three staples: a color picker for the person's own colors, a rolling number for a figure that changes while someone watches, and slide to confirm for what cannot be undone.

- **added** `color-picker`: ColorPicker and ColorPanel, one color as a hex string, from a saturation and brightness area, a hue rail, the hex, an eyedropper where the browser has one, or swatches.
- **added** `rolling-number`: RollingNumber, a figure whose changed digits roll to the new value, up when it rises and down when it falls. Pass it as a Stat's value to roll a tile.
- **added** `slide-confirm`: SlideConfirm, a track and a thumb to slide to the end for an action that cannot be undone. The thumb is also a button, so keys and screen readers confirm too.
- **changed** `motion`: `StillMotion` holds everything inside it still, as reduced motion does: the hooks return 0, Motion skips its animations and the CSS tier tokens read 0. Wrap a thumbnail or a preview of live components in it. Nothing changes for existing code.
- **breaking** `header`: the wordmark is bare again, as before 2026.10.20, and the `wordmarkFrame` prop is gone. The current link keeps the selected segment's look (P12).
  Migrate: drop `wordmarkFrame` if you passed it. To keep the segment around your wordmark, wrap it yourself in the segmented control's track and one raised segment.

## 2026-10-20 · Geist, md form buttons, growth and stone neutrals

The face of taste profile v0.13: Geist replaces Inter, as on Nick's portfolio. Sizes, weights and tracking are unchanged. And v0.14's P10: lg is for hero CTAs only, so a page form's submit and Cancel are md, like its fields. And the growth step: three more data views in the rail idiom, a legend that filters, and stacked rails in the chart. And v0.15's Color decision: the neutrals move from cool blue-gray to warm stone. And v0.16's P12: selected is a raised segment, in the header's current link, its wordmark and the app shell's current link.

- **changed** `header`: the current link wears the selected segment (P12), `surface-1` with the hairline and the top highlight, and keeps it on hover; the others keep the hover fill. The wordmark sits in a segment, the segmented control's track with one raised segment; pass `wordmarkFrame={false}` to keep a logo bare. Nothing in your code has to change.
- **changed** `app-shell`: the current sidebar link keeps its `surface-2` fill and gains the hairline and the top highlight, the selected segment's look (P12). Nothing in your code has to change.
- **changed** `litt`: the neutrals are warm stone (OKLCH hue about 60) in both themes: `--litt-canvas`, the surfaces, the lines, the inks, the dark glass and the light theme's glass border and glows. Lightness and chroma are unchanged, so contrast is too. Reinstall to pick it up; nothing in your code changes.
- **changed** `litt`: Geist replaces Inter in `--litt-font-sans`, falling back to Helvetica Neue, Helvetica and Arial. The stack names both "Geist" (Google Fonts) and "Geist Sans" (Fontsource).
- **changed** `base-styles`: loads Geist at 400, 500 and 600 and Geist Mono at 400 (`@fontsource/geist-sans` replaces `@fontsource/inter`).
- **added** `funnel`: how many went on at each step, as rows: a thin rail per step against the first, in one data hue, with the step-to-step conversion in words.
- **added** `cohort-grid`: retention by signup week as a real table, a dot in one hue's four steps and the number in every cell, the cohort column held while the periods scroll.
- **added** `legend`: toggles which series a chart shows, each item a hued rail swatch and a name, pressed while its series shows. `legendHues` keeps a series' color when another is hidden.
- **changed** `chart`: `StackedBarChart`, each category's parts as one thin stacked rail with a hue per series and the total in the tooltip; and `legend={false}` turns off a chart's own legend when a Legend drives it. Nothing changes for an existing chart.
- **changed** `button`: the size docs say lg is for hero actions only, md in a page form and a dialog. Nothing renders differently; pass `size="md"` (or leave size out) on a page form's buttons.
- **changed** `form`: FormActions' docs ask for md buttons, submit and Cancel. Nothing renders differently; drop `size="lg"` from the buttons you pass it.

## 2026-10-19 · Staples, versions and type

Six staples, and from this release every item carries its version, in the registry and at the top of each file it installs.

The type of taste profile v0.12, after Nick's own portfolio: Inter for every role, nearly everything at 14px with an 18px title, three weights by role (text 400, titles 500, 12px labels 600), two inks, and tags in the sans. The six staples below already ship it.

- **added** `combobox`: type to find one value, or several, in a long list.
- **added** `date-picker`: Calendar and DatePicker, a day or a range as YYYY-MM-DD strings.
- **added** `accordion`: sections that open in place without the page jumping.
- **added** `scroll-area`: native scrolling with litt's thumb and edge hairlines.
- **added** `breadcrumb`: where a page sits, folding long trails into a menu.
- **added** `context-menu`: the Menu at the pointer, by right-click, Shift+F10 or a hold on touch.
- **changed** `menu`: its rows also work inside a ContextMenu. Nothing changes for an existing Menu.
- **changed** `icons`: ChevronLeftIcon.
- **changed** `litt`: Inter replaces Hanken Grotesk in `--litt-font-sans`. Three weights by role: `--litt-weight` (400, text), `--litt-weight-title` (500, titles) and `--litt-weight-label` (600, 12px labels), with the utilities `font-litt-title` and `font-litt-label`. The scale tops out at 18px: display and h1 are 18 on 28, h2 to h4, reading and body 14 on 22, small 13 on 20 and caption 12 on 16, all on whole-pixel line heights. `text-litt-display` to `text-litt-h4` carry the title weight and `text-litt-caption` the label weight. Control labels are 13, 14 and 16. `--litt-fg-muted` takes the grey of `--litt-fg-subtle` in both themes, so there are two inks.
- **changed** `base-styles`: loads Inter at 400, 500 and 600 and Geist Mono at 400 (`@fontsource/inter` replaces `@fontsource/hanken-grotesk`). Headings, b and strong take the title weight and table headers the label weight.
- **changed** `tag`, `token-input`: tags are set in the sans at the caption size and the label weight, no longer in mono. The tokens of a token input and its +N chip follow.
- **changed** `button`, `tabs`, `segmented`, `pagination`: labels at the title weight. Page numbers stay in mono at 400.
- **changed** `input`, `select`, `checkbox`, `switch`, `slider`, `pad`, `form`: field labels, legends and form section titles at the title weight. Typed text stays at 400.
- **changed** `card`, `callout`, `list`, `states`, `toast`, `dialog`, `command-menu`, `tool-call`, `plan`, `message`, `header`, `app-shell`: titles at the title weight, and wordmarks too. A dialog's title sits 4px above its description, and a description at the caption size stays at 400. MessageText sets headings and strong text at the title weight, never bold.
- **changed** `table`: column headers at the label weight. Mono figures stay at 400.
- **changed** `avatar`, `breakdown`, `chart`, `code-block`, `composer`, `dot-plot`, `gauge`, `heatmap`, `menu`, `spread`, `stat`, `thinking`, `timeline`: mono captions stay at 400 under the caption's label weight, and avatar initials stay at 400 at every size. A stat's value takes the title weight from its step.
- **changed** `code-block`: keywords take `--fg`, so comments stay the one grey in code now that body text and metadata share an ink.

## 2026-10-18 · Agents

A chat and the modules an agent shows while it works (`proposals/agents.md`), and the Slider's range.

- **added** `message`: Conversation and Message, the turns between a person and an agent.
- **added** `composer`: where the person writes to an agent, with Send and Stop.
- **added** `thinking`: the agent's reasoning as a quiet disclosure with a clock.
- **added** `tool-call`: what an agent did, as rows, a folding group and an approval.
- **added** `plan`: an agent's steps, ticked off as it works.
- **added** `code-block`: code in an answer, a tool's output or a diff.
- **changed** `slider`: RangeSlider, two thumbs on the Slider's rail for a span.
- **changed** `icons`: ArrowUpIcon, ArrowDownIcon, StopIcon, PaperclipIcon, RetryIcon, and StatusIcon with the Timeline's five marks.

## 2026-10-17 · Dashboards, data color, rails

Parts for dashboards and data panels, and five data hues (taste profile v0.11, P11: color carries data and never chrome).

- **added** `stat`, `chart`, `app-shell`, `pagination`: number tiles, bar and line charts with a Meter, the sidebar shell and paging.
- **added** `token-input`, `pad`, `avatar`, `callout`, `bar-list`, `gauge`, `dot-plot`, `heatmap`, `timeline`: the data-color parts.
- **added** `breakdown`, `sparkline`, `spread`: data drawn as thin rails.
- **changed** `litt`: five data hues, each with a mark tone, a text tone and a tint (`--litt-data-blue`, `--litt-data-blue-text`, `--litt-data-blue-tint`, and amber, teal, violet and rose).
- **changed** `tag`: takes a hue for a category.
- **changed** `chart`: a hue per series, the Meter takes a hue, a target and steps.
- **changed** `bar-list`: each row can take its own hue.
- **changed** `stat`: a trend slot for a Sparkline.

## 2026-10-16 · Forms

Select, Switch, Slider and the field patterns, and Litt's own accent (taste profile v0.9 and v0.10).

- **added** `select`, `switch`, `slider`, `form`: the forms step.
- **changed** `litt`: the accent is cobalt, a fill with white text in both themes, and accent text has its own token. lg buttons run wider (`--litt-button-pad-lg`).
- **changed** `button`: lg buttons have 32px side padding.
- **changed** `checkbox`: a checked box shows its hover.
- **breaking** `litt`: the accent is a fill only.
  Migrate: replace `text-litt-accent` with `text-litt-accent-text` wherever the accent colors text, such as links.

## 2026-10-15 · Phones and touch, the open decisions

Motion on phones and touch (taste profile v0.6), the open decisions after the agent tests (v0.7) and tags in mono (v0.8). Desktop motion is unchanged.

- **changed** `motion`: the compact and coarse device signals and drag to dismiss.
- **changed** `dialog`: a bottom sheet on phones that drags to close and sits above the keyboard. Dialog takes a `tier`.
- **changed** `popover`: a bottom sheet on phones.
- **changed** `menu`: a submenu replaces the list in place on phones, and pressed rows fill.
- **changed** `command-menu`: sits at the top edge on phones, with a Cancel button on touch.
- **changed** `toast`: swipes away, leaves downward on phones, docks at the top over a sheet, and stays 5s. No status dot.
- **changed** `tooltip`: opens on a 500ms hold on touch.
- **changed** `button`: takes an icon child, fills when pressed on touch and keeps its hairline when disabled.
- **changed** `checkbox`: checked boxes and radios fill with the foreground color.
- **changed** `tag`: mono at the control radius on surface-1, with status as colored text and no dot.
- **changed** `header`: the current page steps its text color instead of a dot.
- **changed** `kbd`: the caption size.
- **changed** `list`: the Project shape asks only for what it uses.

## 2026-10-13 · Breadth

- **added** `input`, `checkbox`, `segmented`, `tag`, `popover`, `header`, `card`, `table`, `states`: the components the spec described and the gallery did not show yet.
- **removed** `dialog-fields`: replaced by Input and Segmented control.
  Migrate: import TextField from `input` and Segmented from `segmented`, and install those two items.

## 2026-10-12 · The registry

The first release: litt's components install into any React and Tailwind v4 project, with every token renamed `litt-…`.

- **added** `litt`, `base-styles`, `motion`, `glide`, `icons`, `kbd`: the tokens, the optional base styles, the motion engine, the gliding highlight, icons and the key cap.
- **added** `button`, `tooltip`, `tabs`, `menu`, `command-menu`, `dialog`, `dialog-fields`, `toast`, `list`, `list-cover`: the first components.
