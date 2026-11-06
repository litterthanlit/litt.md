# Device: a third material

Written 2026-11-05 for Nick. Nick put seven studies from the `components` repo (command menu, one-time code, agent run, agent loaders, number ticker, copy button, agent shapes) next to litt rebuilds that kept litt's quiet look and put the fun only in motion. Nick's verdict on the comparison: "before goes way harder". Nick picked out the Geist Mono on the command menu's glass, then: "we should build this into a design system on littmd", and chose **a whole look** over a family of loud readouts in a quiet app.

So Device is a third material beside Press and Flat: `data-material="device"` on `<html>`, answered by `tokens.css`, chosen in Customize and carried by `?look=`. Every component answers it, the way every component answers Flat.

Not to be confused with "the components theme" in `flat.md`, which carries litt.design's recipes (grey card frames, round icon buttons, `SoftSwap`) into the components. That plan is unchanged and separate.

## Why the before went harder

From the side-by-side spike (artifact "Litt Fun Components"), four reasons, which are the goals of this material:

1. **It is an object.** A body, a well, keys with travel, glass with glare. You know what a thing is before you touch it.
2. **Scale and contrast.** Readouts are light ink on near-black glass; litt's stone page is grey on grey.
3. **One world.** Mono figures, seven-segment ghosts, engraved uppercase legends. Every detail comes from the same hardware.
4. **It is alive.** This one is *not* a goal: see Non-goals.

R1 already says "the controls are objects you can hold", and R3 already names trays, cuts, slots, blocks, caps and glass. Device is R1 and R3 taken literally, with the hardware vocabulary the `components` repo already worked out in its `--device-*` tokens.

## Goals

- Pick Device in Customize and every page of the gallery reads as hardware: a brushed body, wells cut into it, keys standing on it, readouts behind glass.
- Every component keeps working: same props, same semantics, same states (R1: default, hover, pressed, focus, disabled, empty, loading, error).
- Light, dark and forced colors each designed (Fixed decisions, Themes).
- Every accent works under Device (Blue 4, Monochrome, Pink), so twelve looks become eighteen. Monochrome's accent is the ink, so nothing that fills with the accent may sit on dark glass.
- Contrast holds: every pair check 5 runs under Press and Flat also runs under Device.

## Non-goals

- **No ambient motion.** R4 holds: nothing moves on its own. No shimmer, scanlines, flicker or blinking caret. What the before had of "alive" comes in only through fun mode's moments (Arrival, Change, Touch) and, later, the token-driven agent indicator, which moves only when tokens arrive.
- No skeuomorphic texture images, grain, screws or fake brand plates. Light from the top (R2) and gradients that never animate.
- Not a fork of any component. A component may branch on the material only through tokens or a `data-material` CSS selector in its recipe, never through a JS branch that changes its structure.
- Not the registry default. The registry keeps shipping Press (Q17 stays open).

## Anti-goals (it fails even if it works)

- It reads as a costume: a page of chrome bevels where content is hard to read.
- Two looks in one view: some components hardware, some still stone.
- It needs its own components to look right, so an app that installed litt can't simply set the attribute.

## The material, depth by depth

The depth ladder (R3) said in hardware. Values come from `components/src/design-system/tokens.css` (the `--device-*` set), retuned to litt's checks.

| Depth | Press (today) | Device |
|---|---|---|
| The canvas | stone, flat | the **body**: a cool grey with a top-to-bottom gradient that never animates, the top edge lit |
| Surfaces (cards, panels) | a hairline and the top highlight | a **plate** on the body: a step lighter, a lit top edge, a 1px dark rim |
| Sunken: a tray (choices) | a floor a step down | a **well**: a darker cut into the body, its top wall in shade |
| Sunken: a cut for what you type (fields, the code input, command search) | white with the top wall's shade | **glass**: near-black LCD glass, light ink, the diagonal glare of the `components` LCD; the control line stays at 3:1 against the body |
| Sunken: a cut for what you mark (checkboxes, radios, color wells) | the same cut | a small **well** in the key face's light grey, so a checked box filled with ink (Monochrome's accent is the ink) still reads against it *(builder's call)* |
| Sunken: a slot (what fills: progress, sliders) | a floor and its shade | a well with a **lit fill**, like a meter's bar |
| Raised: a block (buttons, selected segment) | white, a soft cast | a **key**: a face gradient, a dark rim, a 2px skirt below it, and a press that sinks the full 2px (`--press-depth`) |
| Raised: a cap and its plate | a cap that casts 3px | a **knob cap**: the key's face, rounder light, same 3px |
| Floating (menus, dialogs, toasts) | glass with a glow and ring | **glass**, the same light or dark as the theme, cooler, with the key's dark rim. Not inverted: a light page keeps light overlays, so nothing inside needs a second theme *(builder's call)* |

The one accent (R6) stays one fill per view. Status colors keep their meanings (`--danger` is failed). The `components` lamps (red live, orange waiting) are left out of this round, since litt's runs have no waiting state and red already means failed *(builder's call)*.

## Type on Device

The before's command menu reads as a screen because its glass is in Geist Mono. Under Device:

- **On glass, the mono.** Text on glass sets in Geist Mono at 400: a field's value and placeholder, a code input's figures, a command menu's search and its result rows. Titles, buttons and body text in overlays stay in the sans at their R8 weights, since the mono loads at 400 only. This is an exception to R8's "the mono is for code only", scoped to Device and to glass. *(D2.)*
- **Legends are engraved.** 12px labels (R8's 600 weight) set uppercase with 0.08em tracking and a one-pixel engraving (`--engrave`, a light shadow below in light, a dark one above in dark). Sentence case stays everywhere else.
- **Nothing above 18px.** Unchanged. Readouts get their weight from contrast, not size. *(D3.)*

These are tokens (`--font-glass`, `--label-case`, `--label-tracking`, `--engrave`) that Press and Flat set to today's values, so a component that uses them changes under Device and nowhere else.

## What changes where

**Phase 1, tokens (one builder, by hand).** In `skills/litt-md/assets/tokens.css`:
- `--device-*` neutrals in the light block, the dark block and the system-dark block (check 3 keeps the dark blocks identical).
- A `[data-material="device"]` block after Flat's, in the same shape: the neutrals, every press token in the table above, `--press-depth: 2px`, the restated derived tints, the focus ring.
- The four type tokens above, defined for every material.
- Device's `@supports not (color: color-mix())`, `prefers-contrast: more` and forced-colors answers, after Flat's.

In `check.mjs`: check 5 runs every pair a third time under Device; a new check 12 holds Device's own invariants (the glass ink at 7:1 on the glass, the lamps at 3:1 on the body, the control line at 3:1 on the body). The script header lists it.

In the gallery: `Material` gains `"device"` in `look.ts` (the slug `-device`, so `pink-device-fun`), `MATERIALS` gains its row ("Device", "Keys, wells and glass"), the pre-paint script in `index.html` learns `-device` (and `test:look` proves the copy matches), and `lookAttributes` passes it on. Customize shows three materials.

**Phase 2, the survey (the swarm).** Build the gallery, screenshot every page in Device against Press, light and dark, and write one row per page under `## What the build showed` below: what reads, what doesn't, and which recipe should change. One Haiku worker per batch of pages; each returns its rows and its screenshots' paths.

**Phase 3, recipes (the swarm).** From the survey, each component that needs more than tokens gets a recipe change: a CSS rule on `[data-material="device"]` or the new type tokens, never a JS branch. One Haiku worker per component group (fields, buttons and keys, menus and overlays, data, agents). Each change must pass `verify`, `lint:litt`, `test:motion`, `test:wall` and `test:registry`, and the Press and Flat screenshots of its pages must not change by a pixel.

**Phase 4, taste.** Through `evolve.md`: journal entries for today's reactions, the profile to v1.5 (the Signature names three materials, R3 gains its Device paragraph, R8 its glass exception), Q18 opened (Device's place in the registry), `components.md` and `material.md` updated, a `CHANGELOG.md` `litt` line, the lock regenerated. Committed with `taste:`.

## Round two: the screenshot (2026-11-05)

Nick, on the first build: "We should be using full mono. This isnt like the screenshot I showed you, accent should be orange. Fully reshaping the system." Chosen: reshape Device (not litt's default); panels and overlays become dark LCD screens set into the light body; orange is Device's accent, with Pink and Monochrome still winning when set. So D2 widens to every word, D3's 18px ceiling stays, and the lamps stay out.

- Full mono: the device block sets `--font-sans` to the mono; Geist Mono loads at 400, 500 and 600.
- Orange: `--device-accent` #c2410c with white words on the light body, #ff8a1f with dark words on a screen and in dark, plus `--accent-fg` and `--accent-tint` per scope. Under Device amber is an ochre and rose a mauve, 0.12 from the orange.
- Screens: one rule, `[data-material="device"] :is(.litt-raised, .litt-glass)`, maps every token onto `--device-screen-*` (the same in each theme), with pink and monochrome restated inside. No component changes.

## Decisions for Nick

| # | Question | Suggested |
|---|---|---|
| D1 | The name | **Device**, matching the `--device-*` tokens it comes from. |
| D2 | Mono on glass | **Yes, under Device only**: fields, the code input, command search and floating glass. |
| D3 | Readout sizes | **Keep the 18px ceiling**; contrast carries it. Revisit after Phase 2's screenshots. |
| D4 | Fields as dark glass in the light theme too | **Yes.** A light page with dark fields is the before's look (an LCD set in a light body); a light field would read as Press. |
| D5 | Cool grey | **Yes, under Device only.** The Color decision says warm stone; Device's body is the `components` cool aluminium grey, as Flat's is neutral. |
| D6 | The press | **A 2px sink under Device only**, the key's full travel. R4 says half a pixel; Press and Flat keep it. |

D2, D4, D5, D6 and the engraved uppercase legends each change a fixed decision or a rule (Type, Signature, Color, R4, R8) for Device alone, so they go through `evolve.md` as Nick's decisions before anything is committed with `taste:`.

## Left to the builder

The exact values, as long as every check passes and they come from or near the `components` `--device-*` set. Which pages go to which worker. The recipe details within the rules above.

## What the build showed

Phase 2, 2026-11-05: every gallery page (104, the changelog and AI pages aside) shot at 1280×1600 in Blue 4 Press and Blue 4 Device, light and dark, side by side, read by six Haiku workers, each with the component source. Read-only; the rows are theirs, lightly checked.

**What all six found.** (1) Every text field was still the light cut: no component read `--field` yet. (2) No 12px label used `.litt-legend`. (3) Tracks and meters (Chart's Meter, Plan, Funnel, Progress, Breakdown) are a 12% ink tint, not wells, so they read as Press. (4) Small floating chips (Tooltip, chart tooltips) are solid `--surface-3`, by design. Phase 3 takes (1) and (2); (3) needs a track token every material sets, the next round.

| Page | Reads as Device | Doesn't | Recipe |
|---|---|---|---|
| accordion | Plate, open section, switch On thumb key | Switch Off track nearly disappears into the plate in dark Device; off state hard to read | switch.tsx off-track (not on the survey list); verify its contrast against the plate |
| action-bar | Cards on plates with checkbox corners read as Device | The floating glass bar is outside the 1600px crop, so it cannot be judged from these images | none confirmed; action-bar.tsx:119 `litt-glass` needs a full-height capture |
| activity | segmented tray with a raised "All" key; badges and avatars read as before | nothing visibly off | none |
| agent | the run list plates and the raised selected run read as Device | the composer "Message Litt" is a light or dark bg-cut box, not glass, and its text is sans; the Litt select sits on the same box | composer.tsx:212-213 and :228 (placeholder layer): bg-cut to bg-field, text-fg to text-field-ink, add font-field, placeholder to text-field-ink-subtle; the select inside uses the field too |
| app-shell | sidebar sits darker on the body; the selected nav item is a raised plate | the mobile header and sidebar edge are faint, close to Press | none (app-shell.tsx:89 bg-surface-1 is token-driven) |
| avatar | Colored discs read on the plate; rows and sizes stay quiet | Reads as Press; no cut or key cue, and none expected | none |
| bar-list | Blue and ink bars and the shortcut keycaps read the same as Press | Tracks look flat, not wells; nothing else reads as Device | bar-list.tsx track class (not confirmed in the image) |
| breadcrumb | the body and plate tones carry over; text sits on the surface | nothing hardware-like on this page; plain text, which is right | none |
| breakdown | Segmented bars and their colored segments read on the body | The track is a thin light line, not a cut well (Press-like) | the Meter track (the track class lives in the Meter, not in `breakdown.tsx`): make it a well per the slot row; check it in a full screenshot |
| button | keys stand on the body, blue primary and secondary keys read as raised blocks | skirt and face gradient not clearly visible at this scale, so the key may look Press-flat | none (bg-block and --block-lift are token-driven in button.tsx:82-88) |
| callout | callouts sit as plates in the page flow; kbd "H" reads as a small key | the four tone rows barely separate from the body in light Device | none (callout.tsx line 87 is `litt-raised`, already Device-aware) |
| card | plates a step lighter than the body with a rim; the cover tiles read as sunk | light-mode cards are close to the body, the lit top edge is faint; the "Sent" and tag chips look Press | none in card.tsx (plate is surface-token driven); check the lit edge in the shared surface token |
| card-picker | unselected plans are sunken wells, the selected one is a raised block | the legend "Plan" and "What will you use Halo for?" are sentence case, not engraved legends | card-picker.tsx:231 legend: add litt-legend |
| carousel | slide plates and the next key read as Device | counter "1 of 6" and "1 to 3 of 6" are plain sans readouts, which is acceptable | none |
| cart | the cart plate and the swatches read as wells; the Add to cart key reads as raised | the quantity steppers come from number-field, so they share its problem (light box, sans text) | cart.tsx uses NumberField: fix in number-field.tsx:42-47 |
| case-study | hero frame, plate and Copy install key read as Device | nothing visible; looks close to Press apart from the grey | none (blocks/case-study.tsx) |
| chart | plate and bars and line read as Device; last bar ink is clear | nothing visible | none (data ink, no field) |
| checkbox | Checked boxes filled with ink read clearly; plate and body separate; disabled rows are quiet | Unchecked boxes look like Press white-grey, the well is not visibly cut at this size; labels sentence case | checkbox.tsx:62 bg-cut kept (verify --cut is the key-face light grey the proposal asks for); labels none confirmed |
| code-block | Plate with mono code reads as Device | Nothing visible; code is a display, not a field, so the plate is right | none |
| code-input | body and cells read as sunken hardware; error red and disabled states hold | cells are light boxes in light Device (`bg-cut` ≈ #f4f5f7); digits in sans, not Geist Mono; "Sign-in code" label sentence case | code-input.tsx:131 `bg-cut text-fg` → `bg-field text-field-ink font-field`; label → `litt-legend` |
| cohort-grid | the table sits on a plate; cells and dots keep their tints | column headers (Cohort, Users, Week 0 and so on) are sentence case 12px `font-label`, not engraved uppercase legends | components/cohort-grid.tsx line 161 headCell: replace `font-label` with `litt-legend` (same header in table.tsx line 775) |
| collection | Product frames, filter tray and plates read as Device; the Featured select is a choice, not typed text | Nothing broken | none |
| color-picker | Trigger and Save read as raised keys; the hue and area stay legible on the body | The hex input is a light box in light mode (not glass); "Label color" and other legends are sentence case | `Input` in `components/input.tsx` (the shared `field` string): `bg-cut text-fg` to `bg-field text-field-ink font-field`, placeholder to `text-field-ink-subtle`; label at `input.tsx:108` gets `litt-legend` |
| combobox | Body and plate read as hardware; the trigger sits in a well on the plate | Trigger and the chip input are a light cut, not LCD glass; value and placeholder are sans; label is sentence case | combobox.tsx:172 `bg-cut text-fg` to `bg-field text-field-ink font-field`; :501 `placeholder:text-fg-subtle` to `placeholder:text-field-ink-subtle`; :510 label add `litt-legend` |
| command-menu | Floating glass in the theme's tone with the dark rim reads as a menu | The search row is light glass with sans text, so it does not read as the LCD glass Device asks for; result rows are sans too | command-menu.tsx:196-214: put `bg-field` on the search row, and the input at :214 gets `font-field text-field-ink placeholder:text-field-ink-subtle` (text-body stays); result-row labels take `font-field` |
| composer | Plate with the send key and model Select key | Box is a light or dark cut in sans; placeholder "Message Litt" is sans; not glass | composer.tsx:212 `bg-cut font-normal text-fg` → `bg-field font-field text-field-ink`; line 213 shadow → field-line and field-shade; line 215 focus shade; line 228 placeholder `bg-cut text-fg-subtle` → `bg-field text-field-ink-subtle font-field` |
| context-menu | the menu is a cooler, lighter glass panel with a shadow | reads as a grey plate with a faint edge, the dark rim and glass not clearly visible; looks close to Press | none in context-menu.tsx; menu.tsx:854 litt-glass surface is the one to check against proposals/device.md's float row |
| curve-editor | the plot reads as a well with raised caps on it | the well's cut is faint in light Device; the cubic-bezier readout is a plain mono line, not wrong | none |
| dashboard | Plate, nav key on Overview, ink last bar | Chart area is not a well; bars read as Press | none in the crop (chart is not on the field path) |
| date-picker | Plate on body; trigger reads as a raised key (bg-block), Schedule launch key with its skirt | Trigger text is sans on a light key, not glass (but the trigger is a Select-style key, so glass may not apply); label "Launch date" is sentence case, not an engraved legend | date-picker.tsx:753 label `text-small font-title` → `text-caption litt-legend font-title`; trigger (line 649, bg-block) keeps its key; none for the trigger |
| deployment | The progress bar (`bg-slot` in `components/progress.tsx:71`) reads as a meter with a lit fill; the build-log panel reads as a well | The progress track is faint in light mode | none; the build log is a code block, not a field |
| details | the plate and its dividers read as a panel on the body | dt labels ("Status", "Domain", "Region") are sentence case text-small; not engraved legends | details.tsx:229 dt: add litt-legend if labels count as legends (a design call) |
| dialog | Publish and Invite buttons read as keys; destructive button red | Open dialog glass is not in the crop; the trigger previews look like Press | none in the crop; check the open dialog below the fold |
| dot-plot | dots, median and segmented keys read as Device | the tooltip "Rui · 33 h" is a grey box (`bg-surface-3`), not glass, so it reads as Press's floating style | dot-plot.tsx:599 SOLID `bg-surface-3` → glass (`litt-glass`), per the proposal's floating row |
| file-changes | Diff block, file rows, and Keep all / Undo read clearly | The "Message Litt" composer is a light box in light mode, not glass | `components/composer.tsx:212`: `bg-cut text-fg` to `bg-field text-field-ink font-field`; its textarea placeholder to `text-field-ink-subtle` |
| file-drop | The drop zone is a well (`bg-cut`) cut into the body; file rows and the red error read on the body | Progress track is a faint line in light mode, not a visibly cut well | none for the drop zone (a drop target, not a typed field); the progress track follows the slot row |
| form | Plate, raised Send brief key, radio and checkbox wells read as Device | Name, Email, Company and Project brief are light cuts with sans text; labels and the "Budget" legend are sentence case, not engraved | input.tsx:29 `bg-cut` to `bg-field text-field-ink font-field placeholder:text-field-ink-subtle` (Textarea shares it at :191); input.tsx:108 label and form.tsx:161 Fieldset legend add `litt-legend` |
| funnel | Plate and bar hues read as Device | Track is a 12% fg tint (a flat line), not a well; bars have no lit fill, so it reads like Press | funnel.tsx:39 TRACK `bg-[color-mix(...)]` to `bg-slot shadow-(--slot-shade)` (slider's slot pattern); fill at :142 add `shadow-(--slot-fill-shade)` |
| gauge | Tick arc on the plate, ink needle and teal scale unchanged | Unlit ticks nearly vanish in dark Device | none (no field or well on this page) |
| growth | stat tiles read as raised plates; the Weeks range slider track reads as a slot | the Weeks label is 14px sentence case; the range track is a faint well in dark | none (optional: Weeks label to litt-legend if it is treated as a field label) |
| header | glass bar stays distinct from the body; "Start a project" is a key | nothing visible; the bar is glass, so it doesn't show the plate or the cut | none |
| heatmap | Dot grid and legend read on the body in both themes | Looks like Press; nothing to fix | none |
| hover-card | Plate surfaces and the Live / In review / Draft tags read on the body; the install bar is a well | The floating card is not in the crop, so its glass is unverified | none in this crop; the floating surface is `litt-glass` (`components/hover-card.tsx:250`) |
| icons | body and the grid read as a plate; the selected Settings tile is a raised cell | icon cells are flat, with no key or well feel; search box "Search 100 icons" is a light box in light Device | search: input.tsx:29 → `bg-field text-field-ink font-field`; cells: none (icons are content, not controls) |
| input | body and lit top edges of the card; fields keep their 3:1 line | fields are still light cut in light (`bg-cut`) and identical to the body in dark; typed text is sans, not Geist Mono; labels are sentence case 14px, not engraved legends | components/input.tsx line 29: `bg-cut font-normal text-fg placeholder:text-fg-subtle` to `bg-field text-field-ink placeholder:text-field-ink-subtle font-field`; the label on line 108 (`text-small font-title`) gets `litt-legend` |
| insights | the chart and card plates and the pad well read as Device | "Mail from" (token-input), "That says" (input) and the "Test" key: fields are bg-cut boxes, not glass; labels sentence case | token-input.tsx:75-76 and input.tsx:29: bg-cut to bg-field, text-fg to text-field-ink, placeholder to text-field-ink-subtle, add font-field; legends per number-field's note |
| inspector | plates, slider wells, spring well and Rules list read as Device | dark-mode switch off side is near black, its "Off" text barely visible; the "label"/"length" fields in the side panels are light boxes | input.tsx:29 and number-field.tsx:42 (same fix as select); section and field labels still sentence case, so `litt-legend` if they are 12px labels (not confirmed) |
| kbd | Keycaps already take `shadow-(--key-lift)` on a `bg-block` face, so they stand up off the page | Glyphs are `text-fg-subtle` and faint on the light face; in light Device the keys barely separate from the page | kbd.tsx:21 `text-fg-subtle` to `text-fg` if the glyph should read on the key face (judgement; no token change needed) |
| legend | chart bars and lines sit on a plate and read as before | key labels are 14px sentence case, which is body size so the legend rule does not apply; "Less / More" 12px caption stays sentence case | none |
| lightbox | Image frames and the stage read on the body | The lightbox overlay is not in the crop | none in this crop |
| list | rows and cards read as plates on the body | list rows look flat and the raised cards have a faint edge; little that says hardware | none (list.tsx uses surface tokens); the "Live" and status tags look Press |
| log-view | the code wells read as sunken plates; the orange and red lines stay legible | the output reads like a well, not a screen; the copy icons sit flat | log-view.tsx surface: builder's call whether read-only output takes glass; none required |
| media | Frame plates and the image wells read as Device plates | Nothing material; loading and failed tiles look like Press | none |
| menu | card reads as a plate; the "View" trigger is a key with a skirt | the floating menu is below the crop, so unverified; "Nothing picked yet" hint sits flat | none visible; check the open menu's glass (menu.tsx:323 `litt-glass`) against proposal's glass row |
| message | user bubble is a raised plate; the Show names switch track reads as a well | assistant text and inline code chips are unchanged in Device, which is correct for read-only text | none |
| number-field | steppers read as raised keys; body grey and plate lift are right | field is a light or dark bg-cut box, sans text, not LCD glass; the "Seats", "Price" labels are sentence case, not engraved legends | number-field.tsx:42-47 field wrapper: bg-cut to bg-field, text-fg to text-field-ink, add font-field, shadow line to --field-line; line 365 label: add litt-legend (no component uses it yet) |
| option-picker | the tray and raised selected block read as Device; Gloss is clearly disabled | the white swatch (Frame, Color) vanishes on the light key face; the 12% hairline ring (option-picker.tsx:~188) is too faint; the black Frame swatch nearly vanishes on dark body | swatch chips: give them a well (the proposal's color-well row) instead of the 12% hairline; option-picker.tsx:~188 |
| overview | body and plates step apart in dark; Material control shows Device selected | tile plates barely step off the body in light; nothing else visibly off | none |
| pad | the well is a dark cut with dashed guides and a dot-grid floor; the thumb reads as a knob | the plate and the well look close to Press in light; the well's shade and glass are not visible | pad.tsx:164 wellOn and :363 plate: bg-cut to bg-field, text-fg-subtle to text-field-ink-subtle only if the pad shows numbers; otherwise none |
| pagination | Tray with raised selected page, raised Previous and Next keys | Nothing clear | none |
| plan | the plate reads as a panel; step radios read as wells | the progress track is a 12% fg tint, not a well with a lit fill; it reads as a hairline | plan.tsx:94 TRACK: bg-slot shadow-(--slot-shade) (as progress.tsx:71 does); fill plan.tsx:175 bg-fg is fine |
| playground | Button, Tabs, Menu and segmented presets read as keys and trays; Tune sliders read as wells | nothing visible at this crop; the Tune checkboxes are light squares (checkbox.tsx:62 `bg-cut`, the key-face well, which the proposal asks for) | none |
| popover | trigger buttons (Share, Nina Morgan, Filters) read as raised keys with a skirt | the floating glass panel is below the top 1600px, so glass and dark rim cannot be judged; trigger faces are close to the plate in light | none in view; check popover.tsx line 346 (`litt-glass`) on the full page |
| price | Plates and tabular figures read as Device | Reads like Press: no key, well or glass shows the material | none |
| product | Add to cart key, option tray and the poster frame read as Device | the Quantity stepper "1" is a light box (number-field.tsx:42 `bg-cut`); the white Frame swatch is faint on light | number-field.tsx:42 `bg-cut text-fg` → `bg-field text-field-ink font-field`; swatches: as option-picker (blocks/product.tsx) |
| product-card | Plates with lit top edge; framed prints unchanged | Nothing | none |
| progress | Track and ink fill read as a flat well | Track is barely distinct from Press; no lit fill, no visible well; error red reads | progress.tsx:71 bg-slot and line 81 slot-shade OK; add the lit fill to the fill at line 77 (bg-fg) |
| projects | List plate, raised New project key and the List/Grid tray read as Device | "Search projects" is a light cut with sans text, not LCD glass; it has no legend label | input.tsx:29 `bg-cut` to `bg-field font-field text-field-ink placeholder:text-field-ink-subtle`, used by blocks/projects.tsx:87 |
| range-chart | Darker tray, raised brush caps and the slot-filled histogram read as Device | Nothing material | none |
| resizable | Tree and code pane sit on the plate; the selected file row reads as a raised key | The splitter line is not visible in the crop; the code pane looks like Press | none in this crop |
| rolling-number | Deploy key reads as a key; stat plates read on the body | The Money value and locale inputs are light boxes (white in light mode), not glass | `components/input.tsx` (or `number-field.tsx:42`, also `bg-cut text-fg`): `bg-cut` to `bg-field`, `text-fg` to `text-field-ink`, add `font-field`, placeholder to `text-field-ink-subtle` |
| rule-builder | Group plates, the And/Or tray and the error ring read as Device | Text inputs ("Uber", "main") and the Build minutes number field are light cuts in light Device, sans text; rule-builder.tsx itself has no cut, the fields come from its children | input.tsx:29 `bg-cut` (Input), number-field.tsx:42 `bg-cut` (and its inner input at :400 add `font-field`), combobox.tsx:172 and token-input.tsx:75 as above |
| run-card | the run plate and the folded key (Publishing the Halo site, Next step) read as Device | "Message Litt" composer is a light box in light Device, and reads as a field, not glass | composer.tsx:212 `bg-cut text-fg` → `bg-field text-field-ink font-field`; composer.tsx:222 and 228 placeholder → `text-field-ink-subtle` |
| run-list | Plates, the lifted selected row and the status marks read as Device | Dashed "Stopped" mark and the grey meta text are faint on the light plate (minor, Press has it too) | none |
| scroll-area | the deploy log and "Recent work" thumbnails read as plates; scrollbar hairline is quiet | the log is a light readout plate, not a well; nothing wrong in dark | none |
| segmented | Tray is a well and the selected segment is a raised key; clear in both themes | Selected key barely separates from the tray in light Device | none |
| select | body, plate and key (Deploy, Save account) read as Device | "Full name" and "Work email" are light boxes (`bg-cut`); "Role" and the trigger are raised keys, which is fine for a pick | input.tsx:29 `bg-cut text-fg placeholder:text-fg-subtle` → `bg-field text-field-ink placeholder:text-field-ink-subtle font-field`; select.tsx:116 trigger stays `bg-block` (a key, a choice) |
| settings | Plate, switches as wells with keys, Role Select as a key | Name and Email are light or dark cut boxes in sans, not glass; labels are sentence case | input.tsx:29 field string → `bg-field font-field text-field-ink placeholder:text-field-ink-subtle` with `--field-line` and `--field-shade`; input.tsx:108 label → `text-caption litt-legend font-title`; keep Role (SelectField, bg-block) as a key |
| shopify | Segmented size control, product card and frame swatches read as keys and plates | Nothing visible | none |
| sign-in | Plate card on the body; Sign in and Continue with GitHub read as keys; links are clear | Email and Password are light boxes (white in light mode), not LCD glass; labels are sentence case, not engraved legends | `components/input.tsx`: the `field` string (`bg-cut text-fg` to `bg-field text-field-ink font-field`, placeholder to `text-field-ink-subtle`); label at `input.tsx:108` gets `litt-legend` (confirm it is 12px) |
| slide-confirm | tray is a well, thumb is a raised key, reads as a hardware slot | nothing broken; track has no lit fill (the proposal's slot) | none (track `bg-tray` and thumb `bg-block` already match the slot and key rows); its side-panel `label` and `confirmedLabel` inputs are light boxes via input.tsx:29 |
| slider | Slot well with a lit fill and a raised cap read as hardware in both themes | Nothing material; dark-Device fill is a little low-contrast against the well | none |
| sources | Plates, numbered rows and keyed chips read as Device | Nothing Device-specific beyond the plate | none |
| sparkline | Plates and cards read as Device; figures sans | Nothing | none |
| spread | Rails, median ticks and the legend read in both themes | Rails are faint lines, Press-like | none |
| spring-editor | Plates, curve well, thumb keys and Play read as hardware | Curve well and track look the same as Press; labels "Toast entrance" and "Change" sentence case, not legends | spring-editor.tsx:304 label → `text-caption litt-legend font-title`; wells (line 110, bg-cut) none confirmed |
| stat | tiles read as raised plates with a lit top edge in dark | labels are 14px sentence case above the figure; nothing is broken | none |
| states | the empty state is a tray; skeleton bars read as plates | the empty tray is a light box in light mode, not clearly a well | none (states.tsx uses bg-surface-2) |
| steps | Check, half and empty dots, the segment progress and the Back/Continue keys read as Device | The `current` number input in the checklist sample is a light cut with sans digits | number-field.tsx:42 `bg-cut` to `bg-field`; digits at :400 to `font-field`; steps.tsx progress segments not checked in code |
| switch | Keys (`bg-block`) on the body; the On track's blue reads in both themes | Nothing visible at this size | none |
| table | plate, status pills and selection checkboxes read as Device | the table's "Search site, branch or id" box is a light box (Input); column headers stay sentence case | search: input.tsx:29 → `bg-field`; headers: table.tsx:775 `text-caption font-label`, a `litt-legend` candidate if it is the 12px label |
| tabs | segmented tray is a well and the selected segment is a raised key | underline tabs are flat (no key or cut); tray steps off the plate only faintly in light | none |
| tag | nothing clearly reads as hardware; tags sit flat on the plate | PLAIN tags are bg-surface-1 with a hairline, identical to Press, and the dark tints are hard to tell apart | tag.tsx:46 PLAIN: none (or bg-block shadow-(--block-lift) if tags should key out; a design call) |
| team | the table sits on a plate; the Invite key reads as a key with the accent | the Seats meter track is a 12% fg tint, not a well, and the lit fill is plain bg-fg, so the slot does not read as a hardware meter; "Seats" label is sentence case | components/chart.tsx TRACK (around line 813, `bg-[color-mix(in_oklab,var(--fg)_12%,transparent)]`) to a well (`bg-cut` with the inset line and `--cut-shade`); the fill (around line 821, `bg-fg` by default) needs a Device lit-fill token; the "Seats" label to litt-legend if it is a legend |
| thinking | Disclosures and the thought text read on the plate | Looks like Press; nothing Device-specific expected | none |
| time-scrubber | the ruler is a cut well with lit notches; disabled archived track reads as recessed | the build-log block under the ruler is a light plate (`bg-surface-2`), not glass; tick labels are sans caption; the readout is acceptable as a plate | none (log is read-only; glass is for typed text) |
| timeline | step rails, bars and status colors read as before; the rails are lit lines | nothing that breaks; no glass or well surfaces here | none |
| toast | "Save changes", "Deploy", "Fire three" triggers read as keys | no toast is in frame, so glass cannot be judged | none in view; check toast.tsx line 397 (`litt-glass`) when a toast is open |
| token-input | Plate, surface-2 token chips and the "Finance" tag read as Device | Both input rows are light cuts with sans text; "Mail from", "That says" and "Send the invoice to" are sentence-case labels, not legends | token-input.tsx:75 `bg-cut text-fg` to `bg-field text-field-ink font-field`; :381 input `text-fg placeholder:text-fg-subtle` to `text-field-ink font-field placeholder:text-field-ink-subtle`; :292 label add `litt-legend` |
| tool-call | row list and status icons are clear; the command block reads as a light plate | the command block (tool-call.tsx line 471, `bg-surface-2 font-mono`) is a readout, so glass is not required; looks like Press | none (optional: glass only if commands count as typed text, which they do not) |
| tooltip | Chip is a raised surface with inset highlight, sits on the plate | Chip is a solid surface-3 chip, not glass, contrary to the proposal (floating = glass with the key rim); it still looks like Press | tooltip.tsx:238 `bg-surface-3 shadow-tooltip` → glass recipe, or record the exception (its comment says too small for glass) |
| tree | the selected row is a raised plate with a dark rim and reads clearly | nothing | none |
| tune | Plan card reads as a plate; Save, Replay and the Choose button read as keys; the spring panel reads | Slider tracks look like thin lines, not wells with a lit fill | none in this crop; check the slider track in `components/slider.tsx` against the slot row |
| usage | the bar tracks are slots and the limit ticks read as hardware | bar tracks are faint and the fills are plain colour; the slot does not read as a well with a lit fill | progress.tsx:71 bg-slot and :81 shade already set; check the Limits and Files tracks in the gauge or chart component before changing |
