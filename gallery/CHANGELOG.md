# Changelog

Every change to the litt registry at https://littmd.vercel.app/r/, newest first. A release is named by its date, and each installed file says which release it came from in a comment at its top (`// @litt/button 2026.10.17`), so you can tell what changed since. Item names are the registry's: install one with `npx shadcn@latest add https://littmd.vercel.app/r/<name>.json`.

To update an item, read the entries since your version, then reinstall it with `--overwrite`. A **breaking** entry says what to change in your code.

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
