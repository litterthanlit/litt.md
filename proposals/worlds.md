# Worlds: three materials as three places, each proven by studies

Written 2026-11-07 for Nick. Nick asked what the play for the repo is, then: "I feel like we dont have enough components and not impressive enough, also each theme needs to be its own world, motion language etc", "I started off competing against these guys [bencho.dev, fluidfunctionalism.com] but then I found graphical and thought that was the move", "also feel like our components aren't deep enough like my components repo [litt.design/studies]", and "this guy has it laid out very well: design.how/systems".

This is a proposal, not a build. Nothing here changes a taste rule; it changes how the gallery is organised, what a component page shows, and which of Nick's studies come into litt. The decisions at the end wait for Nick, and the builders work to this file once they are answered.

## What the four references are

Each was read on 2026-11-07 (text only; motion judged from the docs and from Nick's own reactions in the journal).

| Site | What it is | Size | Why it impresses | Already in litt? |
|---|---|---|---|---|
| bencho.dev | React micro-interactions tagged by gesture (Press, Hover, Drag, Swipe, Type, Loop) and a Sounds page | about 150 blocks | Each block is one physical mechanism, live, with nothing around it (a genie that pours out of a dock, a liquid toggle, a ruler that coasts to a step) | The wall and its verb filter (2026-10-23). Not the depth per block, not sound. |
| fluidfunctionalism.com | A shadcn registry with one motion system (three spring tiers, exits never reuse the enter spring) and a live customizer (accent, font, radius, size, icons, hover) | 33 components, 8 system pages | One signature, a hover highlight that glides between rows, done obsessively; depth of states documented per component | The tiers, the gliding highlight, the customizer. Litt has three times the parts. |
| design.how/systems | Four opinionated systems "for agents" (Sodium, Glaze, Quartz, Lime), each a named world with a tagline, a realistic hero screen and the same docs tree | 60 to 75 components each | Each system is a place: a name, a one-line point of view, a hero built from the parts in use, an On this page rail, Foundations that include Motion and Anti-slop, Copy prompt for an agent | The materials, the Copy prompt, `llms.txt`. Not the presentation: a material is a radio button in Customize. |
| litt.design/studies | Nick's 24 studies: one component each, a live demo, Anatomy, Replay, the source inline, a header comment that explains the mechanism | 24 | Physics with stated constants, sound tied to the visual event, WebGL where it earns it, a shared frame loop, reduced motion handled, states and sub-states (Spool's ready, ghost and hand) | Seven were rebuilt for the Device comparison (`device.md`). None is a litt component. |
| litt.md today | 95 components, 14 blocks, 3 materials with their own motion languages, 3 accents, Calm and Fun, a registry, a plugin, a score | 95 | The wall, the deck, the mosaic, Customize | |

Two things follow. **The count is not the gap**: Fluid Functionalism has a third of litt's parts and reads as bigger. **The depth and the worlds are**: litt's three materials already move differently (foundations.md, Motion languages), and Nick's deepest work sits in another repo.

## What litt is missing

1. **The worlds are not places.** Press, Flat and Device have names, tokens and motion languages, but a visitor meets them as a `Material` radio in the Customize popover. design.how's whole move is the opposite: a system is a page you arrive on, with a tagline, a hero and a tree.
2. **A component page is a demo, not a study.** A page today is a title, a lede, tier chips, Install and Copy prompt, then `Stage`s with demos and a props table from `gen-docs.mjs`. Nick's studies add what makes a part feel made: Anatomy, Replay, every state in a row, the mechanism in a paragraph, and the source where you can read it.
3. **Device has no proof.** The material ships (keys, wells, LCD glass, the mono, orange) but its claim, "the depth ladder in hardware", is carried by recoloured components. The studies that *are* hardware (agent indicators, tape reels, a spool, a one-time code behind glass) stay on litt.design.
4. **The first screen shows the deck, not a world.** The hero (`00-overview.tsx`, `deck.tsx`) is litt's controls wired to the wall. It proves the language changes under a hand; it does not show a product built in a world, which is what affectUI and design.how open on and what `gallery-wow.md` already proposed as "a live screens showcase".

## The shape

### A world is a material, and a material is a place

Three worlds, named after the materials, each with a tagline, a hero and the same tree. The tree is one: every component already answers every material through tokens (`--field-*`, `--label-case`, `--engrave`, `data-material` selectors), so a world is a mode of the one gallery, not a second set of pages. This is where litt is better placed than design.how, whose four systems are four component sets: **a new world is a tokens block and a motion language, never a new component set.**

| World | Tagline (Nick's call) | For | Hero block | Motion language (foundations.md) |
|---|---|---|---|---|
| Press | Lit from above. Objects you can hold. | Product UI, settings, dashboards, the registry's default | `30-dashboard.tsx` | Things have weight: a set settles from above, an overlay rises from `--press-scale` |
| Flat | Grey is the object. Nothing casts. | Sites, portfolios, reading, the gallery's default | `30-case-study.tsx` or `30-collection.tsx` | Things come from where you touched them: deal and gather, an overlay grows from its opener |
| Device | Hardware. Keys, wells and LCD glass, every word in the mono. | Agents, terminals, tools | `30-agent.tsx` | Things are mechanisms: a set switches on in steps where it stands, nothing fades or travels |

A world page (`00-press.tsx`, `00-flat.tsx`, `00-device.tsx`, `meta.world` set, no sidebar like the overview) opens on:

1. **The name and the tagline**, at the hero's size (the 56px exception from `gallery-wow.md`, still a question for Nick), with the one accent fill as Install.
2. **The hero**, the world's block live at real size in one frame, the material applied. It is the block the world is for, not a swatch sheet. An On this page rail on the right names its sections the way `design.how` does (Sodium: "A backfill", "Runs", "On call"; litt's Agent: the plan, the run, the approval, the review).
3. **Foundations**, as a row of short cards that open the pages below: Color, Type, Space, Shape, Light (the material itself), Motion language, Sound (if decision 8 says yes), and Tells (the "Never, unless Nick asks" list from `SKILL.md`, design.how's "Anti-slop" in litt's words). Most of these pages exist as prose in `foundations.md` and `material.md`; the gallery renders them live under the world, with the specimen's parts.
4. **Components**, the sidebar's groups as they are, every tile under the world's material. A tile that has the study treatment (below) carries a small Study mark.
5. **Install**, the three steps the home has (the plugin, `shadcn add`, the score), with the world's own line first: `data-material="device"` on `<html>`, or nothing for Press. Copy prompt's Match the look step already says this (`look.ts`, `lookSetup`); the world page is where you read it.

Entering a world sets the material for the whole gallery (`setLook({ material })`, `customize-state.tsx`), so every component page you open afterwards is in that world. The URL already names it: `?look=device`, `?look=pink-flat`, the grammar `look.ts` owns, and the pre-paint script in `index.html` paints it before React. Customize keeps the accent, the feel, the theme, type and shape; **Material moves out of the popover and into the nav**, as the first thing, since it is the one choice that is a place.

### The home

The home stays the way in, with one change: **the deck gains Material as its first control, and the current world's hero block sits live under the deck.** Flip Press to Device on the deck and the dashboard under it becomes hardware; the wall below follows as it does today. That answers `gallery-wow.md`'s question 2 (should the first screen show a component beside the deck) with the biggest component there is: a whole screen. The three steps for agents stay after the wall.

### The study treatment

A component page that has it gains five parts, in this order, before the props table. They are features of `Page` in `kit.tsx`, driven by page data, so a builder adds them to a page without touching the kit.

| Part | What it is | Where it comes from |
|---|---|---|
| **Anatomy** | The first demo again, at rest, with hairline callouts naming its parts (the tray, the cap, the slot, the words), litt's `Inspector` idiom | A page-level `anatomy` list: part name, a selector or ref. Rendered by the kit; nothing in `src/components` changes. |
| **Replay** | A button that re-runs the part's arrival or its mechanism (a Slide to confirm that confirms itself, a Toast that fires, a Thinking that thinks for 3 seconds). Under reduced motion it jumps to the end state. | A page-level `replay` function. Fun mode's hint (`meta.fun`) already says what to try; Replay does it. |
| **States** | Every R1 state in one row: default, hover, pressed, focus, disabled, empty, loading, error, as the states strip the Button page already has, held to the same order on every page | A `states` Stage the builder writes; `gen-docs.mjs` lists which pages have it |
| **Mechanism** | One paragraph in Nick's studies' voice: what the hand does, what springs on which tier, what the material changes, what reduced motion does. The header comment of a study, on the page. | `meta.mechanism`, a string, so `gen-llms.mjs` ships it to agents too |
| **Source** | The registry file inline, read-only, with the version stamp, from `docs.json`'s `files` | Already in `docs.json`; the kit renders it in a `CodeBlock` |
| **Under each material** | A strip of three small frames, the same demo under Press, Flat and Device, each with `lookAttributes` | The kit; this is what shows a world is one language |

The first wave is eight pages, all parts a hand holds or watches (decision 5): Button, Switch, Slider, Slide to confirm, Command menu, Dialog, Thinking, Range chart. The rest follow in release-sized waves. A page without the treatment stays as it is; nothing is deleted. The score of a wave is simple: does the page read like a study on litt.design?

### Device, proven: the studies come home

The studies that are hardware become litt components, under Device first, each one a registry item with a Study page. From litt.design/studies and the `components` repo (`device.md` lists the seven Nick compared):

| Study | Becomes | Notes |
|---|---|---|
| Agent indicators (six mechanisms: a seven-segment chase, a tuner needle, stereo meters, a dot-matrix, step lights, two tape reels) | `agent-indicator`, a new item; under Device the Thinking row carries it (decision 7) | Moves only while tokens arrive, which `device.md`'s non-goals already allow. Under Press and Flat the Thinking clock stays. |
| Tape reels | Progress's Device recipe: two reels and real tape physics | A recipe through tokens and a `data-material` selector, never a JS branch (Q18's suggested answer). If it needs a branch, it is a second component, `tape-progress`. |
| One-time code | Code input already exists; its Device recipe is the LCD | Done in the field tokens round; the Study page is what is missing. |
| Number ticker | Rolling number already exists | Study page. |
| Command menu | Exists; the Device recipe (mono on dark glass) was the start of Device | Study page. |
| Copy button | `copy-button`, a new item | A key that sinks its 2px and says Copied in words (R5). |
| File browser (Quick Look, a spring-driven accent bar, a single-tab-stop listbox) | Tree gains Quick Look; or `file-browser`, a block | Decide by whether Tree's props carry it. |
| Spool (hold to spool, speed ramps to a redline, the strip bends) | Time scrubber's Device recipe, or a `spool` item for media | WebGL stays out of the registry; the canvas version is enough for the mechanism. |
| Spotlight card (light that follows the cursor) | Fun mode only, as the heatmap's lens is | Cursor-following is banned outside fun mode (R4). Decision 6. |
| Agent shapes, agent run, the others | Nick picks | |

Each one is a `litt` or item line in `CHANGELOG.md`, versioned as every item is, and goes through `test:registry` because Device recipes read tokens the host must have.

### Breadth: domains are the rows, worlds the columns

Nick: "I also had plans for shopify integration and ecomerce components etc. every possible component possible." Breadth and worlds are the two axes of one grid, not two plans. A **domain** (Forms, Data, Agents, Commerce, and the next ones) is a row: its parts, and a block that shows them composed, as Commerce shipped Product and Collection with seven items and the Shopify client (`commerce.md`, decided 2026-10-24, waiting on Nick's tests). A **world** is a column. Every domain's block is a hero under every material, so each domain adds one screen to each world page's On this page rail, and a new world costs every domain nothing.

Two rules keep breadth from becoming the count trap:

- A new part answers a need in litt's own world (journal, 2026-10-22), never a line on a competitor's list. "Every component" means every need a product has, said in litt.
- A domain ships as parts plus a block, never parts alone. The block is the proof, the hero and the agent test's task.

Commerce's next needs, in order: store search from the Command menu and Combobox (`commerce.md` decision 1 deferred it); an account area (orders as a Timeline, addresses as a Form, a payment method as a Card picker); order status in words (R5); a promo code as a Token input; a size guide as a Dialog; reviews as a Bar list, stars never in color (R7). Checkout stays Shopify's. Under Device a store is a point-of-sale terminal, a hero no reference has.

### Depth: each world's own abilities and parts

Written 2026-11-07, after units 1 and 2 were built. Nick: "I think each theme should go deeper into its own world and its strengths." Units 1 and 2 made the worlds places and the parts deep; this makes each world deep in its own direction.

**The line to hold.** A shared part stays one component, with tokens and a motion language per world and never a JavaScript branch (Q18, decision 10). Depth comes from two other things: an **ability** only one world has, and a **part** only one world has. A world-only part is a separate registry item, so it costs the other worlds nothing; a shared part that forks per world costs every builder a branch forever. A world goes deep by adding leaves, never by splitting the trunk.

| World | What it is | Its strength | Abilities only it has | Parts only it has (new, or brought home) | Its hero, deepened |
|---|---|---|---|---|---|
| Press | The instrument | Precision, depth you can feel, data | One light from above; glass that floats; caps in slots; a press that sinks half a pixel | A knob with detents; a meter bank (level, VU, a gauge row); an instrument panel block built from the tuning kit (Inspector, Spring editor, Curve editor, Pad) | A control room: the tuning kit over a live chart, not a dashboard |
| Flat | The page | Quiet, imagery, reading | Soft focus on a hand; deal and gather from what you touched; the pill; no lines between things | litt.design's work slider (grey frames, hover a step darker); a large cover in a grey frame; an editorial reading layout; a photo essay block | A portfolio home with one large image, which answers Q5 (art direction for imagery) for Flat alone |
| Device | The machine | Agents, terminals, hardware | Sound on a key (decision 8); LCD readouts; engraved labels; every word in the mono | The studies (agent indicators, tape reels, spool, a seven-segment counter, a one-time code behind glass); a terminal block | An agent console that could be a physical box |

**How a world-only part is said.** A page gains `meta.worlds`, the materials the part belongs to, defaulting to all three (`["press", "flat", "device"]`). The wall, the sidebar, the phone menu and the world pages hide a part outside its worlds; the registry stamps the attribute the part needs in its install notes and `llms.txt`; a world page gains a section after Components, **Only here**, listing its abilities and its own parts. That is one field and three filters, and it is the honest answer to "is this a theme or a world": a theme recolours the same parts, a world has parts and abilities the others do not.

**What stays shared.** Everything that exists today. A part that makes sense in every world (a button, a table, a dialog) is never made world-only to seem deeper; the test of a world-only part is that it is wrong in the other two (a knob with detents on a flat page, a photo essay on an LCD).

**Order.** Device first, since its parts exist on litt.design and its abilities are decided; Flat second, since its parts exist on litt.design too and its hero answers an open question; Press last, since it is already the deepest and its new parts are inventions. Each wave is a release with its own changelog lines, and `test:wall` and `test:worlds` gain a claim that a world-only part shows in its world alone.

### Bodies: one contract, three bodies

Written 2026-11-08, after the Device wave shipped. Nick, shown the three worlds: "shouldn't we start by making each theme different, I think they're currently sharing a different look of the same component." That is right. Tokens, Flat's five rules and the motion languages change how a part looks and settles, but a Switch is the same switch in every world: the same elements, the same hand. Decision 10 ("recipes through tokens, never a JavaScript branch") was the economy that capped the worlds at themes, and Nick has changed it (decision 13).

**The layers of different.** Tokens and type, done. Recipe (fills and lines), done for Flat, partly for Device. Motion language, done. World-only parts, started. The two layers still shared are **structure** (what elements a part has: a key's skirt, a tray, an LCD well, words or none) and **interaction** (how the hand works it: a detent, a travel, a slide). Those two are where a hand feels a world.

**The line moves** from "one component, tokens per world" to **one contract, three bodies**. A part keeps one contract: its props, its accessibility, its keyboard, its state machine, so a host swaps worlds with the attribute as today and nothing it wrote changes. Under the contract each world may have its own body: its own markup and its own interaction, in a body file the component picks by material at runtime. Not every part needs three bodies. The test is whether the hand touches it: the controls you press, slide and type into get three; data and layout parts stay token-only.

| Part | Press (the instrument) | Flat (the page) | Device (the machine) |
|---|---|---|---|
| Button | A raised block that sinks half a pixel | A pill, fill only, a step darker under the hand | A key on a 2px skirt that sinks the whole 2px |
| Switch | A block that slides in a tray, On and Off in words | An ink pill when on, an outline when off, no words | A toggle key that flips with a detent, its word on LCD |
| Slider | A cap in a slot that casts | A pill track, the filled part in ink, a round knob | A fader in a well on a notched rail |
| Checkbox | A cut with a tick in ink | Outline off, ink on | A square key that latches down and lights |
| Segmented | A raised segment that glides | A grey bubble that glides | A row of keys, the chosen one down |
| Input | The cut with the top wall's shade | A grey field with no outline | LCD glass in the mono |
| Select | A raised trigger, a glass menu | A grey bubble, a solid card | An LCD readout with up and down keys |
| Tabs | An underline that glides | A grey bubble that glides | Engraved labels with a lamp under the current one |
| Dialog | Glass that rises with weight | A solid card that grows from its opener | A screen that switches on in steps |
| Toast | A glass slip | An ink pill | An LCD line |

Flat's column is mostly built, which is why Flat reads closest to a world. Press and Device are the work: Press has the depth but shares Flat's interactions; Device has the colors but not the mechanisms.

**How a body is built.** `byWorld(material, { press, flat, device })` in the motion engine picks a body from `useMaterial()`; both are exported from `@/motion`. A part's file (`src/components/switch.tsx`) keeps the contract and the Press body, which is the default; `src/components/bodies/switch.flat.tsx` and `switch.device.tsx` hold the other two and export one component that takes the contract's resolved state (`SwitchBodyProps`, declared in the main file). The main file imports both, so the registry ships them inside the one item (`components/litt/bodies/…`), and a host that flips the attribute gets the right body with no reinstall. Every body's root carries `data-body="press|flat|device"`, so a test can tell them apart. The study pages already draw a part under each material, so the three bodies stand side by side on every study page, and `test:study` holds each body to itself; `test:wall` runs per material; a new claim in `test:study` asserts that a part with bodies draws a different `data-body` under each material. `components.md` gains a **Bodies** line per part naming the three.

**Rules that hold across bodies.** R1's states, R5's words (Flat may drop the switch's word only because the outline and the ink say it, and the accessible state still does), R6's one accent fill, the motion bounds and tiers, the 44px targets, reduced motion. A body may not change what the part is for, only what it is made of and how the hand works it. Sound (decision 8) belongs to Device's bodies as they arrive.

**Cost, said plainly.** Three bodies for ten parts is about thirty recipes with their hand tests, two to three times the Device wave. It reverses decision 10 and answers Q18, a `taste:` change through the evolve protocol.

**Order.** Three waves. First Switch, Button and Slider, because the deck uses them, so the home proves it the moment it lands. Then Checkbox, Segmented, Input, Select. Then Tabs, Dialog, Toast. The Flat parts (the work slider, the article, the photo essay, the portfolio hero) come after, on a Flat that has its own hands.

### Sound, as a world's ability

bencho sells Sounds; Nick's studies tie a sound to the visual event; `gallery-wow.md` proposed sounds in fun mode and left it as Nick's call. In a world, sound is an ability a material brings (Nick: "each system provides new abilities"). Device is the one that has it: a key's click on press, a notch's tick on the slider, a switch's clack, a code digit's beep behind the glass. Synthesised with Web Audio, no files, so the registry ships no assets. Off by default; a Sound choice in Customize, Silent or On; only in answer to a hand, never on arrival or on its own (R4 holds for the ear too); reduced motion leaves it alone, since it is not motion, but a system-level mute does not exist, so the default is Silent.

## Inventory: body or recipe, per world

Written 2026-11-08 for Nick, after wave one of the bodies (Switch, Button, Slider), for Nick to strike before Device wave one is built. It covers every part with a page, decides which worlds give it a body and which give it a recipe, and orders the bodies into waves. The test from Bodies, above: a part gets a body in a world when the hand touches it there, or when that world's structure is different (a key, not a block or a pill; a fader, not a slot; a readout on LCD glass, not a field; a lamp; a detent; segments). In every other cell the part gets a recipe, with the reason written down. A body may change what a part is made of and how the hand works it, never what it is for.

The rows are the 95 items with a page (`docs.json` names 97). Framed and Glide have no page and get no row. Framed draws nothing. Glide is the highlight that travels between rows, and under Device nothing travels, so the Device bodies that hold rows put a lamp on the current row in its place (Select's list builds the lamp row; Menu, Command menu, Combobox and Tree reuse it). Shopify, Shopify cart, Icons and Tune have rows even though they draw nothing of their own or draw only glyphs.

Press is the default body in each part's own file. A Press cell says `body` only where Press's body should change from today. Press is built last.

The order is world by world: Device first, then Flat, then Press. A Device wave that touches a part with a Flat body lifts today's Flat recipe (its `in-[[data-material=flat]]:` classes) into that body unchanged, to the pixel, as wave one did; Flat's own redesign of its bodies comes in Flat's waves. The Flat and Press columns are a first pass: each world gets its own read of this table before its waves, so a recipe there is a default, not a verdict.

| Part | Press | Flat | Device | Wave |
|---|---|---|---|---|
| Accordion (`accordion`) | recipe: today's header rows and hairlines | recipe: grey pill per section, no lines (already a class recipe) | body: each header an engraved legend on a plate, with a small toggle key at its end that latches down while its section is open | D3 |
| Action bar (`action-bar`) | recipe: glass bar of Buttons | recipe: the ink bar (already a class recipe) | recipe: the bar is a screen by the `.litt-glass` rule, and its actions are Buttons, which are keys already | none |
| Agent indicator (`agent-indicator`) | n/a (Device only) | n/a (Device only) | built (a Device part) | built |
| App shell (`app-shell`) | recipe: layout | recipe: no hairlines, grey hover (already a class recipe) | recipe: layout; the sidebar is a plate on the body, the current link steps its ink, the mono comes with the material | none |
| Avatar (`avatar`) | recipe: a picture in a circle | recipe: a grey circle, no edge | recipe: a picture or initials in a circle; nothing to press, nothing to read off glass | none |
| Bar list (`bar-list`) | recipe: data | recipe: data; grey track | recipe: data; the thin bars are lit fills from the slot tokens, the rows are links | none |
| Breadcrumb (`breadcrumb`) | recipe: words and links | recipe: grey pill on hover (already a class recipe) | recipe: words and links in the mono | none |
| Breakdown (`breakdown`) | recipe: data | recipe: data | recipe: data; one rail in the data hues | none |
| Button (`button`) | built | built | built | built |
| Callout (`callout`) | recipe: a note on a raised surface | recipe: a grey fill, no cast (already a class recipe) | recipe: a note on a plate; tokens | none |
| Card (`card`) | recipe: layout | recipe: layout | recipe: layout; a screen by the `.litt-raised` rule | none |
| Card picker (`card-picker`) | recipe: today's picked card raised | recipe: grey cards, the picked one ringed in ink (already a class recipe) | body: each card a plate with a lamp in its corner; the picked one set down 2px into a well with its lamp lit, so picked reads as latched, not raised | D2 |
| Carousel (`carousel`) | recipe: slides and Buttons | recipe: slides and Buttons (the work slider is a Flat part of its own) | recipe: the slides are pictures, and its controls are Buttons, which carry the key | none |
| Cart (`cart`) | recipe: composes Dialog's sheet, Number field and Button | recipe: the same parts' Flat bodies and recipes | recipe: composes Dialog's sheet, Number field and Button, which carry their own Device bodies | none |
| Chart (`chart`) | recipe: data | recipe: data; grey Meter track | recipe: data; marks in the data hues, the Meter a lit fill in a well from the slot tokens | none |
| Checkbox and radio (`checkbox`) | recipe: today's cut with a tick in ink, and the ring with its bead | body: an outline when off and an ink fill when on, the radio a ring around an ink dot; no cut and no shade (today a class recipe; it moves into its body) | body: a square key that latches down and lights its lamp in the ink when checked, half lit when mixed; a radio group is a set of the same keys, interlocked, so pressing one lets the last one up | D1, F1 |
| Code block (`code-block`) | recipe: code on a surface | recipe: no hairline, a grey copy pill (already a class recipe) | recipe: already a screen in the mono; its copy action is a Button | none |
| Code input (`code-input`) | recipe: today's cells | recipe: grey cells with no outline (already a class recipe) | body: one glass cell per character showing the ghost "8" of the seven-segment study, each typed digit lit in segments; still one text field underneath | D1 |
| Cohort grid (`cohort-grid`) | recipe: data table | recipe: no lines (already a class recipe) | recipe: a data table; the mono and the screen inks | none |
| Color picker (`color-picker`) | recipe: today's wells and rails | recipe: grey wells and the Popover's solid card | body: the swatch a lit well, the hex on the Input's glass, and the panel a screen whose hue and alpha rails are faders in wells with key caps | D2 |
| Combobox (`combobox`) | recipe: today's cut and glass list | recipe: grey field, solid card (already a class recipe) | body: the Input's glass field; its list a screen with the lamp row; chosen values as lit cells, as Token input has them | D3 |
| Command menu (`command-menu`) | recipe: today's glass | recipe: solid card, grey search (already a class recipe) | body: a terminal: the search a prompt line on glass with an engraved mark, the results screen lines with the lamp row, the footer's shortcuts as key caps | D3 |
| Composer (`composer`) | recipe: today's cut and toolbar | recipe: grey field from the cut tokens (already a class recipe) | body: the Input's glass with an engraved prompt mark, file chips as lit cells, the toolbar a row of keys, and Send the one key in the accent | D2 |
| Context menu (`context-menu`) | recipe: Menu's panel and rows | recipe: Menu's panel and rows | recipe: it renders Menu's panel and rows, so it gets Menu's Device body with no code of its own | none |
| Copy button (`copy-button`) | n/a (Device only) | n/a (Device only) | built (a Device part) | built |
| Curve editor (`curve-editor`) | recipe: today's instrument | recipe: grey floor, ink curve, round handles from tokens | body: a scope: the curve a lit trace on LCD glass, its two handles knob caps, and `cubic-bezier(…)` an LCD line | D2 |
| Date picker (`date-picker`) | recipe: today's field and calendar | recipe: grey day pills, the chosen day in ink, from tokens | body: the date on an LCD readout; the calendar a screen of small day keys, the chosen day latched with its lamp lit and a range lit between its ends | D3 |
| Details (`details`) | recipe: labelled facts | recipe: labelled facts | recipe: facts on a plate; the labels engraved by `--label-case` and `--engrave` | none |
| Dialog (`dialog`) | recipe: today's glass that rises with weight | body: a solid card that grows from its opener, no glass and no ring | body: a screen set into the body by a bezel that switches on in three steps where it stands; the title an engraved legend, the actions keys | D3, F2 |
| Dot plot (`dot-plot`) | recipe: data | recipe: data | recipe: data; dots in the data hues | none |
| File changes (`file-changes`) | recipe: a review list | recipe: a review list | recipe: a review list on a screen; its actions are Buttons | none |
| File drop (`file-drop`) | recipe: today's cut | recipe: a grey area, a ring while a file is over it, from tokens | body: a slot cut into the body with an engraved legend and a Choose key; each file a line on LCD glass, its upload Progress's segments | D2 |
| Forms (`form`) | recipe: layout | recipe: layout | recipe: layout of fields that carry their own bodies | none |
| Funnel (`funnel`) | recipe: data | recipe: data | recipe: data; one rail per step | none |
| Gauge (`gauge`) | recipe: today's ticks (the meter bank is a Press part of its own) | recipe: ticks in ink on grey | body: a moving-coil meter: a needle over engraved ticks behind glass, the figure in segments under it; the needle settles on the responsive spring only when the value changes | D4 |
| Header (`header`) | recipe: sticky glass | recipe: solid, no highlight | recipe: the glass is a screen by the rule; nav words in the mono | none |
| Heatmap (`heatmap`) | recipe: data | recipe: data | recipe: already a dot matrix in the data hues; the screen inks do the rest | none |
| Hover card (`hover-card`) | recipe: glass | recipe: a solid card from the glass tokens | recipe: a screen by the glass rule; the motion language switches it on where it stands | none |
| Icons (`icons`) | recipe: glyphs in `currentColor` | recipe: glyphs in `currentColor` | recipe: glyphs in `currentColor` take the ink they sit in | none |
| Input (`input`) | recipe: today's cut with the top wall's shade | body: a grey field with no outline, the focus ring the only line | body: LCD glass set in a bezel well, the label engraved on the body above, the hint and the error as dim LCD lines, an error saying its word beside a lamp in `--danger` | D1, F1 |
| Inspector (`inspector`) | recipe: a panel of litt's controls | recipe: the controls' Flat bodies | recipe: a panel of Sliders, Switches, Segmented and Inputs, which carry their own bodies; the panel is a screen | none |
| Kbd (`kbd`) | recipe: a key cap from `--key-lift` | recipe: a grey cap | recipe: already a key cap; Device's key tokens give it the skirt, and it is never pressed | none |
| Legend (`legend`) | recipe: today's toggles | recipe: grey pills, a hidden series an outline | body: a row of latching keys, each with a lamp in its series' data hue; down shows the series, up hides it, and its word says which | D2 |
| Lightbox (`lightbox`) | recipe: glass around a picture | recipe: grows from the thumbnail (the motion language) | recipe: a picture at screen size stays a picture; the motion language switches it on, its controls are Buttons | none |
| List and cards (`list`) | recipe: rows and cards | recipe: rows and cards | recipe: rows and cards; the filter chips are Tags and Buttons | none |
| List cover (`list-cover`) | recipe: rectangles and hairlines | recipe: rectangles and hairlines | recipe: abstract covers drawn in the screen inks | none |
| Log view (`log-view`) | recipe: lines on a surface | recipe: lines on a surface | recipe: already lines on a screen in the mono, the Code block's surface | none |
| Media (`media`) | recipe: a picture in a frame | recipe: a grey frame (the large cover is a Flat part of its own) | recipe: an image stays an image; the frame reads tokens | none |
| Menu (`menu`) | recipe: today's glass and Glide | recipe: a solid card and a grey bubble that glides, from Flat's glass and block tokens | body: a screen list whose current row is marked by the lamp row, switching row to row with no glide; shortcut legends engraved | D3 |
| Message (`message`) | recipe: reading | recipe: reading | recipe: words in the mono on the body; nothing for the hand | none |
| Number field (`number-field`) | recipe: today's cut with − and + blocks | recipe: a grey pill with round grey − and +, from tokens and the radius | body: the figure on an LCD readout, − and + as keys on their 2px skirts beside the glass, not inside it | D1 |
| Option picker (`option-picker`) | recipe: today's words in a tray | recipe: grey pills, the chosen one in ink, from the tray and block tokens | body: the values as a row of latching keys with engraved legends, the chosen one down with its lamp lit (the radio's keys); a sold-out value lies flat and says so | D1 |
| Pad (`pad`) | recipe: today's floor and cap | recipe: a grey floor and a mid grey cap with no cast, from tokens | body: an XY pad behind LCD glass: a dot grid, a lit crosshair through a knob cap, both values as readouts on the glass | D2 |
| Pagination (`pagination`) | recipe: the range in words and two Buttons | recipe: the same | recipe: the range in words and two Buttons, which are keys | none |
| Plan (`plan`) | recipe: steps ticked off | recipe: steps ticked off | body: a column of step lamps on an engraved strip, each done step's lamp lit, the step at work with the Agent indicator beside it while it works | D4 |
| Popover (`popover`) | recipe: glass | recipe: a solid card that grows from its trigger | recipe: a screen by the glass rule; the motion language switches it on in place | none |
| Price (`price`) | recipe: a figure | recipe: a figure | recipe: a figure in the mono; tokens | none |
| Product card (`product-card`) | recipe: a Card | recipe: a Card | recipe: a Card, so a screen by the rule | none |
| Progress (`progress`) | recipe: today's slot and fill | recipe: a pill track with an ink fill, from tokens | body: segments in a well that light in steps, the percent in seven segments; an unknown length is the Chase's step lights, moving only while the work runs | D4 |
| Range chart (`range-chart`) | recipe: data | recipe: data | recipe: data; its total is a Rolling number, which gets segments, and its brush reads the tray and cap tokens | none |
| Resizable (`resizable`) | recipe: a line and a grip | recipe: no line, a grey grip | recipe: the hand drags the grip 1:1 and needs no detent; the grip reads the key tokens | none |
| Rolling number (`rolling-number`) | recipe: digits that roll | recipe: digits that roll | body: the figure on seven-segment digits behind glass, a changed digit switching in three steps where it stands instead of rolling (nothing travels) | D4 |
| Rule builder (`rule-builder`) | recipe: rows of Select, Input and Button | recipe: the same parts' Flat bodies | recipe: rows of Select, Input and Button, which carry their own bodies | none |
| Run card (`run-card`) | recipe: card, ring and words | recipe: card, ring and words | body: the ring a dial of lit segments that light in steps, the step it is on an LCD line, the folded run a key you press to open it again | D4 |
| Run list (`run-list`) | recipe: rows | recipe: rows | recipe: rows that say where each run stands in words; tokens | none |
| Scroll area (`scroll-area`) | recipe: a scrollbar from tokens | recipe: the same | recipe: the scrollbar reads tokens; nothing to say in hardware | none |
| Segmented control (`segmented`) | body: today's raised segment, which the hand can also drag along its tray to land on the nearer option, as the Switch's block does (Nick's call) | body: a grey bubble that glides between the words, no tray | body: a row of keys on one skirt, the chosen one latched down with its lamp lit; a press lets the last one up, with no glide | D1, F1, P1 |
| Select (`select`) | recipe: today's raised trigger and glass list | body: a grey bubble trigger and a solid card list, no glass | body: the value on an LCD readout with up and down keys at its end that step through the options without opening it; pressing the readout opens the list as a screen with the lamp row; the keyboard is the contract's | D1, F1 |
| Seven-segment (`seven-segment`) | n/a (Device only) | n/a (Device only) | built (a Device part) | built |
| Shopify (`shopify`) | recipe: a library that draws nothing | recipe: draws nothing | recipe: draws nothing | none |
| Shopify cart (`shopify-cart`) | recipe: a cart provider that draws nothing | recipe: draws nothing | recipe: draws nothing | none |
| Slide to confirm (`slide-confirm`) | recipe: today's cap in a tray | recipe: a pill track and a mid grey cap from Flat's cap tokens | body: a latch key pushed along a well to an end stop, the track's words on an LCD strip and a lamp at the stop that lights once confirmed; let go short and it goes home in steps | D1 |
| Slider (`slider`) | built | built | built | built |
| Sources (`sources`) | recipe: numbered marks and a list | recipe: the same | recipe: numbered marks and a list in words | none |
| Sparkline (`sparkline`) | recipe: data | recipe: data | recipe: data; one line | none |
| Spread (`spread`) | recipe: data | recipe: data | recipe: data; one rail per row | none |
| Spring editor (`spring-editor`) | recipe: today's instrument | recipe: a grey floor and a mid grey cap, from tokens | body: the Pad's glass with the spring's curve drawn as a lit trace, time and bounce as readouts on the glass | D2 |
| Stat (`stat`) | recipe: a figure in a tile | recipe: a figure in a tile | recipe: a figure on a screen; a changing figure uses Rolling number, which carries the segments | none |
| States (`states`) | recipe: empty, loading and error | recipe: the same | body: loading as the Chase's step lights in a well, moving only while it loads; empty and error as LCD lines with their words, an error with a lamp in `--danger` | D4 |
| Steps (`steps`) | recipe: today's steps | recipe: grey steps from tokens | body: a strip of numbered lamps, done ones lit in the ink, what is left dark, the current step's word on an LCD line | D4 |
| Switch (`switch`) | built | built | built | built |
| Table (`table`) | recipe: data | recipe: data; no lines | recipe: data; rows and columns in the mono and the screen inks | none |
| Table filter (`table-filter`) | recipe: a Button that opens the Menu | recipe: the same | recipe: a Button that opens the Menu, and both carry their own bodies | none |
| Tabs (`tabs`) | recipe: today's underline that glides | body: a grey bubble that glides behind the current label, no underline | body: engraved legends on the body with a lamp under the current one, switching on, never gliding; the segmented variant takes Segmented's row of keys | D1, F1 |
| Tag (`tag`) | recipe: a word | recipe: a grey pill | recipe: a status is a word; tokens give it the mono | none |
| Tape progress (`tape-progress`) | n/a (Device only) | n/a (Device only) | built (a Device part) | built |
| Thinking (`thinking`) | recipe: today's disclosure and clock | recipe: the same | body: the clock in seven segments on a small LCD, the Agent indicator in its slot (decision 7), the reasoning on glass in the mono | D4 |
| Time scrubber (`time-scrubber`) | recipe: today's ruler and needle | recipe: a grey ruler and an ink needle, from tokens | body: a tape counter: the time in seven segments over an engraved ruler in a well under the fixed needle; the arrow keys move it in detents | D2 |
| Timeline (`timeline`) | recipe: data | recipe: data | recipe: steps in order, with times and outcomes in words | none |
| Toast (`toast`) | recipe: today's glass slip | body: an ink pill with canvas words, its action inside the pill | body: one LCD line in a bezel, the message in the mono and its action a key at the end; it switches on in steps, and a failure says its word beside a lamp in `--danger` | D3, F2 |
| Token input (`token-input`) | recipe: today's cut with tags as blocks | recipe: a grey field, tokens as grey pills (Tag's Flat recipe) | body: the Input's glass with each token an inverted cell of lit mono words and a small engraved key to remove it, since a raised tag cannot stand on glass | D2 |
| Tool call (`tool-call`) | recipe: rows that fold | recipe: the same | recipe: rows that fold; its approval is Buttons | none |
| Tooltip (`tooltip`) | recipe: glass | recipe: a solid label | recipe: a small screen by the glass rule; words only | none |
| Tree (`tree`) | recipe: today's raised selected row | recipe: a grey bubble on the selected row | body: rows on a screen, the selected row marked by the lamp row instead of raised, a folder's toggle a small key that latches down while it is open | D3 |
| Tune (`tune`) | recipe: it builds an Inspector | recipe: the Inspector's | recipe: it builds an Inspector, so it follows the Inspector's parts | none |

### Pieces built once

Device's bodies share five mechanisms, so each is built once in the first wave that needs it and reused after:

- **The latching key row** (Checkbox and radio, D1): Segmented, Tabs, Option picker, then Card picker and Legend.
- **The readout with step keys** (Select and Number field, D1): Date picker and Time scrubber.
- **The lamp row** (Select's list, D1): Menu, Command menu, Combobox and Tree. It replaces Glide under Device.
- **The segments** (Seven-segment, shipped): Code input, Rolling number, Progress, Thinking, Time scrubber, Gauge.
- **The Chase** (Agent indicator, shipped): Progress with no known length, and States' loading.

### The rules every body keeps

- One accent fill per view. A lamp lights in the ink, or the glass's own ink, unless the part is the view's one accent: a primary key, or a `tone="accent"` switch. Legend's lamps take the data hues because there the color carries data.
- Nothing moves on its own. A lamp lights on a state change, a segment switches when its figure changes, and the Chase runs only while the work does.
- 44px targets on coarse pointers. A small key (Tree's folder key, Token input's remove key, Select's step keys) keeps its look and grows its hit area.
- States in words. A lamp or an outline never says a state alone: the word stays, or the accessible state says it where Flat drops the word.
- Sound (decision 8) arrives in Device's bodies as they ship, Silent by default.

### Device waves

1. **D1:** Checkbox and radio, Segmented, Input, Select, Tabs, Number field, Code input, Slide to confirm, Option picker (9). The controls a hand presses and types into on every form and settings page, and the agreed table's remaining controls. They build the key row, the readout and the lamp row on the key, well and glass that Switch, Button and Slider proved.
2. **D2:** Card picker, Pad, Spring editor, Curve editor, Time scrubber, Token input, File drop, Composer, Legend, Color picker (10). The rest of what a hand drags or types into. Each is built from wave one's glass, keys and readouts, so it comes after them.
3. **D3:** Dialog, Toast, Menu, Command menu, Combobox, Date picker, Accordion, Tree (8). What a hand opens. Each is a screen that switches on where it stands, its rows marked by wave one's lamp row and its actions on keys that are already built.
4. **D4:** Progress, Rolling number, Gauge, Steps, Plan, Thinking, Run card, States (8). What a hand watches. These are readouts that move only when the work does, built on the segments and the Chase already shipped, last because no hand waits on them.

### Flat waves

1. **F1, after D4:** Checkbox and radio, Segmented, Input, Select, Tabs (5). Their Flat bodies are lifted in D1, unchanged; F1 is where Flat redesigns them.
2. **F2, with F1:** Dialog, Toast (2), lifted in D3.

After them come Flat's own parts, not bodies: the work slider, the large cover, the editorial reading layout and the photo essay.

### Press waves

1. **P1, after Flat's waves:** Segmented (1). The block drags along its tray, as the Switch's does, and Tabs' segmented variant follows. This is the one place where Press's hand should change from today's, and it waits on Nick.

After it come Press's own parts, not bodies: the knob, the meter bank, the instrument panel and the control room.

### Counts

Of the 95 parts:

- **Device:** 38 with a Device body (3 built, 35 to build in D1 to D4), 4 Device-only parts (built), and 53 recipes.
- **Flat:** 10 with a Flat body (3 built, 7 to build in F1 and F2), 81 recipes, and 4 n/a.
- **Press:** 3 built bodies, 1 body change (Segmented, P1), 87 recipes, and 4 n/a.

## What this says about the business

Litt is not a builder, and this proposal is why: Graphical sells "make any theme" to people who want their own; design.how gives "a few worlds with a point of view" to people who want someone else's taste. Litt is the second kind, and its worlds are already built. What is worth taking from Graphical is the skill file as the product artifact (litt has it) and one-time pricing (decision 9).

- **Free, forever, MIT:** every component, every world's tokens, the registry, the plugin, the score. Device's tokens are already public in `tokens.css`, so a paid Device would be a paid attribute, which is nothing.
- **The first paid thing:** a world for a brand. The interview, audit, profile and evolve workflows already produce a `profile.md`, a `tokens.css` and a look; for a client they produce a fourth world, with litt's checks holding it. This is what the studio sells today, as a repeatable artifact.
- **Later, if the studies land:** a studies pack as a one-time purchase in Graphical's framing, the Device mechanisms with their sounds and source. Only once eight are in and the free worlds have an audience; a pack of three sells nothing.
- **The share unit on X** is a world's hero and a study page, so every world page and every Study page gets an OG image per look (the pre-paint script in `index.html` already knows the look from the URL).

## Decisions for Nick

Built as recommended unless Nick says otherwise.

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Does entering a world write your look, or preview it like a `?look=` link? | **Write it.** A world is where you are; `?look=` keeps previewing without writing. | Two kinds of "in Device" (one saved, one not) would confuse the panel's Your look. The link grammar is unchanged. |
| 2 | The first screen: the deck alone (today) or the current world's hero block live under it? | **The hero block live, and Material on the deck.** | `gallery-wow.md`'s open question 2, answered with a whole screen. It is the live screens showcase, folded into worlds. |
| 3 | One component tree across worlds, or one tree per world like design.how? | **One tree.** A world is a mode. | Every component already answers every material; three trees would be the same 95 pages three times, and would hide what makes litt one language. |
| 4 | The hero block per world | **Press: Dashboard. Flat: Case study. Device: Agent.** | Each is what the world is for, and each exists. Flat could be Collection; Nick's call. |
| 5 | The first eight Study pages | **Button, Switch, Slider, Slide to confirm, Command menu, Dialog, Thinking, Range chart.** | Each has a hand on it or a wait in it, and each moves differently per material, so the Under each material strip earns its place. |
| 6 | Spotlight card's cursor-following light | **Fun mode only**, as the heatmap's lens is. | R4 bans cursor-following; fun mode is the one exception and already holds one. |
| 7 | Under Device, does the Thinking row carry the agent indicator instead of the clock? | **Yes.** It moves only while tokens arrive. Press and Flat keep the clock. | `device.md` non-goals allowed exactly this. The clock says how long; the indicator says what, in hardware. |
| 8 | Sound | **A Device ability**, Silent by default, a hand only. | A world brings abilities. A click from a key makes sense; a click from a flat grey block does not. |
| 9 | What is paid, and when | **Nothing now.** A brand world as the studio's product first; a studies pack once eight are in. | Audience first. The free worlds are the marketing. |
| 10 | The registry's default material (Q17) and Device's place (Q18) | **Unchanged**: the registry ships Press; a project picks a world by its attribute; recipes through tokens, never a JS branch. | A world is chosen, not imposed. If a study needs a branch, it is a second item. |
| 11 | The 56px statement on the world pages | **Keep the gallery exception**, as the home has it. | A world page is a first screen. Same question as `gallery-wow.md`'s 1. |
| 12 | How a world goes deeper (Depth, above) | **Abilities and world-only parts, said with `meta.worlds`; shared parts never fork.** Device first, then Flat, then Press. | A leaf costs nothing; a fork in the trunk costs every builder a branch. The strengths are already written in the taste docs; this is where they show. |
| 13 | Do the parts themselves differ per world? (Bodies, above) | **Yes, for the parts a hand touches: one contract, three bodies.** Decided by Nick on 2026-11-08 ("shouldn't we start by making each theme different"); it replaces decision 10's "never a JavaScript branch" and answers Q18. | A theme is the same part in three coats; a world is three bodies under one contract. The contract keeps the host's code and the accessibility one; the bodies are where the hand feels the world. |
| 14 | Does each world have its own default color and type? | **Yes.** With no attribute a world shows its own accent and its own face: Press is Blue 4 in Helvetica Neue, Flat is ink in Geist, Device is orange in Geist Mono (Nick, 2026-11-08: "each world should have a default color and type", "helvetica should go to press and flat should take geist"). An explicit `data-accent` or a type override still wins, and Blue 4 gains an attribute of its own (`data-accent="blue"`, Q16) so a Flat or Device project can ask for it. A `litt` tokens change with a `breaking` line and a Migrate step, its own PR after wave one of the bodies. Built 2026-11-08 (taste v1.11): `--font-choice` is the face a project chooses, which every world reads first; Flat's block restates monochrome's; Blue 4 is retuned to Device's body and screens. | Today Flat with no attribute is Blue 4 in Geist, the same as Press, and only the gallery's default look makes it read monochrome. A world you can tell apart at a glance has its own color and its own voice. |

## Migration, in verifiable units

Each unit ends with `verify`, the build, screenshots in both themes at 1440 and 390 under every material, and axe; each is its own PR.

1. **Worlds in the nav and on the home.** The three world pages (`00-press.tsx`, `00-flat.tsx`, `00-device.tsx`), Material moved from Customize's popover onto the deck and into the nav, the hero block live under the deck, Foundations as cards onto existing pages, `gen-llms.mjs` writing a Worlds section from `look.ts`. **Nothing in `src/components` changes**, so no registry version moves. `test:wall` runs the wall under each material. `test:home` checks the deck's Material switch changes every tile and starts no transition (a material switch is instant, like a theme switch).
2. **The study treatment in the kit.** `Page` gains Anatomy, Replay, States, Mechanism, Source and the Under each material strip, from page data; `gen-docs.mjs` lists which pages carry them; `gen-llms.mjs` ships `meta.mechanism`. The eight pages of decision 5. A pixel test: a demo at rest is identical with and without the treatment, and under each material it matches the material's own page.
3. **Depth, in three waves** (decision 12), each its own PR. First `meta.worlds` and the Only here section, with the filters and the claim in `test:wall` and `test:worlds`, in the same PR as the Device wave. **Device:** `agent-indicator`, `copy-button`, Progress's tape recipe, Thinking's Device row, a seven-segment counter, the Study pages for Code input and Command menu; changelog lines, `test:registry`, `check.mjs` check 12 under Device for every new pair. **Flat:** the work slider, the large cover, the editorial reading layout, the photo essay block, and the portfolio hero; Q5 answered for Flat. **Press:** the knob, the meter bank, the instrument panel block, and the control room hero.
4. **Bodies, in three waves** (decision 13), each its own PR. The contract first (`byWorld`, `useMaterial` from `@/motion`, the `bodies/` convention, `data-body`, the `test:study` claim). **Wave one:** Switch, Button, Slider. **Wave two:** Checkbox, Segmented, Input, Select. **Wave three:** Tabs, Dialog, Toast. Then the Flat parts (the work slider, the article, the photo essay, the portfolio hero) and Press's (the knob, the meter bank, the instrument panel, the control room).
5. **Each world's own color and type** (decision 14): the no-attribute accent and face per material in `tokens.css` (Press Blue 4 and Helvetica Neue, Flat ink and Geist, Device orange and Geist Mono), `data-accent="blue"` (Q16), `look.ts` naming the world's own accent first, the pre-paint script, Customize's words, `check.mjs` running every Flat pair with ink as the accent and every Press pair in Helvetica Neue; a `breaking` `litt` line with a Migrate step.
6. **Sound**, if decision 8 holds. Customize gains Sound; `check.mjs` gains a check that nothing plays without a pointer or key event in the last 300ms.
7. **The business surface.** OG images per look on world and Study pages; a Worlds section in `README.md`; the brand-world offer as a page on litt.design, not in this repo.

Unit 1 is a week and changes how the site reads; it is the one to ship first and post about. Units 2 and 3 are where the depth comes from and can run as parallel builders in worktrees, as the agents and data-color steps did. Units 1 and 2 shipped on 2026-11-07 (PRs 84 and 85); the Device wave of unit 3 on 2026-11-08 (PR 86).

## What does not change

- The nine rules, the fixed decisions and the tells. No taste change is proposed; the journal entry for this round is a `process` entry.
- The one motion engine, the tiers and the bounds (`rules.ts`, `check.mjs` check 9).
- The registry's items, versions and default look (Blue 4, Press) until Q16 and Q17 are answered.
- `#canvas`, the Playground, fun mode's rule (it changes how things move, never how they look at rest).
- The gallery's default look (Monochrome, Flat): the gallery opens in the Flat world.

## Questions for Nick's tests

1. Standing on the Device world page, with Agent live under the hero: does it go as hard as the before in the `device.md` comparison? If not, what is missing: the mono, the glass, the indicator, the sound?
2. Material on the deck: does flipping it with a whole screen under it feel like changing worlds, or like a theme toggle?
3. The Under each material strip: does seeing one Button three ways make litt read as one language, or as three themes?
4. The Study pages: which of the five parts earns its place, and which is noise? Anatomy and Mechanism are the bet.
5. Taglines: the three above, or Nick's own lines?
