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

### Three directions, each to its extreme

Written 2026-11-08, after decision 14 shipped each world's own color and type. Nick, shown the wall in Press and in Device: "components still the same", then "I thought each world components should look way different". Asked how far, he chose **every visible part**, not only what a hand touches, and **all three worlds per wave**, each pushed to its own extreme (decision 15). The line from Bodies holds (one contract, a body per world) and widens: every part that draws something has a body in each world, data and layout parts included. A world is no longer a coat on a shared shape; it is three shapes under one contract.

**Press, the instrument.** Everything is an object on a bench, lit by one light from above. A surface is a plate that stands on the page and casts; a group is a tray cut into it; a value sits on a raised face; a list is slats in a tray; a chart sits in a sunken well with its grid lit from the top; overlays are glass that floats. Every edge is physical, a lit top edge and a shade below, never a drawn line. The hand presses blocks, rides caps in slots and turns. References: precision instruments, lab gear, good hi-fi.

**Flat, the page.** Ink on paper. Nothing stands up and nothing is framed: grey is the object, space is the divider, the pill the one shape for what a hand touches. A card is its picture and its words; a table is rows set apart by space; a chart is ink marks on grey with their values beside them, no axes and no gridlines; a menu is a solid card that grows from where you touched; a dialog is a sheet. Weight, ink and space do what an editorial layout does, inside R8 (nothing above 18px). Things deal out of the hand that opened them. References: a well-set book, an editorial site, the work pages on litt.design.

**Device, the machine.** Hardware. A part is made of keys on skirts, wells, LCD glass, lamps, seven-segment figures and engraved capitals. A surface is a plate fixed to the aluminium body or a dark screen set into it; a value is in segments; a list is screen lines with a lamp on the current one; a chart is a dot matrix, a needle on a scale or a bar of lit segments; progress is segments lighting in steps. Nothing glides; everything switches where it stands, in steps. References: Nick's studies on litt.design, test equipment, synthesizers.

**The test of a body.** Put a part in its three frames and take away the color and the face (greyscale, one font). If you cannot tell the world from the structure alone, the body is not done.

**What stays one.** The contract (props, accessibility, keyboard, states, what a screen reader hears), the nine rules (one accent fill, states in words, nothing moves on its own, 44px targets, weight by role, nothing above 18px) and the motion bounds and tiers. Parts that draw nothing (the Shopify client and cart, Tune) have no bodies; Icons follow the ink they sit in.

### Sound, as a world's ability

bencho sells Sounds; Nick's studies tie a sound to the visual event; `gallery-wow.md` proposed sounds in fun mode and left it as Nick's call. In a world, sound is an ability a material brings (Nick: "each system provides new abilities"). Device is the one that has it: a key's click on press, a notch's tick on the slider, a switch's clack, a code digit's beep behind the glass. Synthesised with Web Audio, no files, so the registry ships no assets. Off by default; a Sound choice in Customize, Silent or On; only in answer to a hand, never on arrival or on its own (R4 holds for the ear too); reduced motion leaves it alone, since it is not motion, but a system-level mute does not exist, so the default is Silent.

## Inventory: three bodies per part

Rewritten 2026-11-08 for Nick, after decision 15. The first draft of this table gave a body only where a hand touched a part and a recipe (tokens only) everywhere else, and it built the worlds one after another, Device first. Nick has since chosen every visible part and all three worlds per wave (Three directions, above), so every cell below is a body: its own structure and its own hand, pushed to its world's extreme, Press the instrument, Flat the page, Device the machine. Each row passes the test of a body: in greyscale and one font, the three cells are three different things. Today's Press is the shape all three worlds share, so every Press cell is a new body too, not today's part; it stays the default body in each part's own file.

The rows are the 95 items with a page (`docs.json` names 97). Framed and Glide have no page and get no row. Framed draws nothing. Glide is the highlight that travels between rows: under Press it carries the lifted slat, under Flat the grey bubble, and under Device nothing travels, so the lamp row takes its place. "Built" means the body has shipped; Device's bodies in wave 1 are being built now.

| Part | Press, the instrument | Flat, the page | Device, the machine | Wave |
|---|---|---|---|---|
| Accordion (`accordion`) | Sections as slats in a tray; the open slat lifts and its panel sits in a well beneath | Headings in the title weight parted by space; the open section's text simply follows, a − beside it | Each header an engraved legend on a plate, a toggle key at its end latched down while open | 5 |
| Action bar (`action-bar`) | A glass bench floating at the foot, actions as blocks in a tray, the count on a raised face | An ink pill at the foot, the count and actions as words in canvas ink | A screen strip fixed to the bottom edge: the count in segments, the actions a row of keys | 4 |
| Agent indicator (`agent-indicator`) | n/a (Device only) | n/a (Device only) | built | built |
| App shell (`app-shell`) | The sidebar a plate standing on the page; the current link a raised block on a tray rail | No sidebar frame: links as a column of words, the current in a grey bubble, space for the edge | A chassis: the sidebar an engraved panel with a lamp by the current link, the main area a screen | 5 |
| Avatar (`avatar`) | The picture in a raised round bezel with a lit rim, like a dial's | The picture alone, round, no edge; without one, initials in ink on a grey disc | A small round window of LCD glass, the picture behind it or initials in the mono | 10 |
| Bar list (`bar-list`) | Each row a slat; its bar a fill drawn out of a slot cut into the slat | Rows parted by space, a grey band behind each label to its share, the value in ink | Each row a run of lit segments in a well, the value in seven segments at its end | 7 |
| Breadcrumb (`breadcrumb`) | Each level a small block on a rail, the current one raised and lit | Words in grey split by a slash, the current in ink; a grey bubble under the hand | An engraved strip of small keys, one per level, the current latched with its lamp lit | 5 |
| Breakdown (`breakdown`) | One slot cut into a plate, the parts as fills end to end, readings on a raised face below | One grey band split by space into the parts, their names and shares set as words under it | A segment bar in a well, runs lit in each part's hue, the shares as LCD lines | 7 |
| Button (`button`) | A thick block on its own plate, lit top edge and shade below, sinking into the plate when pressed | Words in a grey pill, nothing standing; the primary an ink pill a step darker under the hand | built | 2 |
| Callout (`callout`) | A small plate standing on the page, its icon sunk in a well at the start | A paragraph in a grey bubble, the lead words in the title weight; no frame | A fault panel: a strip of LCD glass with a lamp at its start, the note in the mono | 8 |
| Card (`card`) | A plate that stands and casts, lit along its top edge, its cover set into a sunken well | No box: the picture on its grey ground and its words below, space around | A module fixed into the body, an engraved legend across its top, its content on a screen set in | 8 |
| Card picker (`card-picker`) | Cards as plates in a tray; the picked plate rises out of it and catches the light | Cards as pictures and words; the picked one in a grey bubble with an ink tick and its word | Each card a plate with a corner lamp; the picked one set down 2px into a well, its lamp lit | 2 |
| Carousel (`carousel`) | Slides seated in a long tray, a cap in a slot below marking the place, ridden to scroll | Slides edge to edge, parted by space; "3 of 8" in grey words and two grey pills | A viewfinder: one slide behind glass, the frame number in segments, step keys either side | 10 |
| Cart (`cart`) | A glass tray of slats, one per line; quantities as rocker blocks, the total on a raised face | A sheet set like a receipt: item, quantity and price in columns of type, space between lines | A till: lines in the mono on a screen, the total in segments, Checkout the one accent key | 10 |
| Chart (`chart`) | Marks in a sunken well, its grid as grooves lit from the top, the axis on a raised rail | Ink marks on grey, no axes and no gridlines, each value set in type beside its mark | A dot-matrix screen: bars as columns of lit dots, a line as a trace of dots, the reading in segments | 7 |
| Checkbox and radio (`checkbox`) | A square cut into a plate, an ink block seated flush when checked; the radio a cup taking a bead | An outline when off and an ink fill when on, the label beside in type; no cut, no shade | A square key that latches down and lights; radio keys interlock, pressing one lets the last up | 1 |
| Code block (`code-block`) | Code in a well cut into a plate, line numbers on a raised gutter rail, Copy a block | Code on grey with no frame and no rules, Copy a grey word | A terminal screen behind a bezel, mono on dark glass, Copy the Copy button's key | 9 |
| Code input (`code-input`) | A plate with one cut per character; a filled cut catches the light on its lower wall | One grey pill per character parted by space, the current one ringed in ink | One glass cell per character with the ghost "8", each typed digit lit in segments | 1 |
| Cohort grid (`cohort-grid`) | A plate of small wells, the number on each floor, the hue dot sunk beside it | Numbers in columns of type, a hue dot before each, no rules and no cells | A lamp board: one lamp per cell at four brightnesses in the hue, the number in the mono beside | 8 |
| Color picker (`color-picker`) | The swatch a raised face; the area a well with a cap, hue and alpha caps in slots | A grey sheet: the area and two pill rails with round ink knobs, the value in words | The swatch a lit well, the value on glass, the hue and alpha rails faders in wells | 3 |
| Combobox (`combobox`) | A cut field on a plate; its list a glass tray of slats, the current slat lifted | A grey pill field; its list a sheet that grows from it, the current in a grey bubble | The Input's glass; its list a screen with the lamp row, chosen values as lit cells | 5 |
| Command menu (`command-menu`) | A glass slab that rises: the search a cut across its top, results as slats, the current lifted | A sheet of type: the query in ink, results as lines parted by space, the current in a grey bubble | A terminal: a prompt line on glass, results as screen lines with the lamp row, shortcuts as key caps | 4 |
| Composer (`composer`) | A deep well cut into a plate, its tools a rail of blocks below, Send the one lit block | A grey pill that grows with the text, its tools as grey words, Send an ink circle | The Input's glass with a prompt mark, files as lit cells, tools a row of keys, Send the accent key | 2 |
| Context menu (`context-menu`) | Menu's glass tray of slats, rising at the pointer | Menu's sheet, growing from the point you pressed | Menu's screen with the lamp row, switching on at the pointer | 4 |
| Copy button (`copy-button`) | n/a (Device only) | n/a (Device only) | built | built |
| Curve editor (`curve-editor`) | A well with a lit grid, the curve a groove, its handles caps ridden on short arms | An ink curve on grey, two round ink knobs, the values in words; no grid, no frame | A scope: the curve a lit trace on glass, handles as knob caps, the value an LCD line | 3 |
| Date picker (`date-picker`) | The date on a raised face; the month a tray of day blocks, the chosen day raised and lit | Figures set in a grid of space, the chosen day an ink circle, a range a grey bubble | The date on a readout with step keys; the month a screen of day keys, the chosen one latched | 5 |
| Details (`details`) | A plate of rows, each value seated in a shallow well beside its label | Label and value as two columns of type, grey and ink, space between rows | A spec plate: labels engraved in capitals, each value on a strip of LCD glass | 8 |
| Dialog (`dialog`) | A glass slab that rises with weight, its actions as blocks in a tray along its foot | A sheet that grows from its opener: solid, no glass, no ring, actions as pills at its end | A screen in a bezel that switches on in three steps, an engraved title, its actions keys | 4 |
| Dot plot (`dot-plot`) | Dots as raised beads stacked in a sunken well, the goal a groove across its floor | Ink dots on grey stacked from the center, no axis, the counts in type beside | A dot-matrix screen: each stack a column of lit dots, the goal an engraved mark on the bezel | 7 |
| File changes (`file-changes`) | Each file a slat in a tray, its counts on a raised face, Keep and Undo as blocks | File names as lines of type, counts as grey words, each diff on grey with no rules | A screen of mono lines, + and − counts in segments per file, Keep and Undo as keys | 9 |
| File drop (`file-drop`) | A deep tray in a plate, its lower wall lit while a file is over it; each file a slat | A grey sheet with one sentence, "Drop files or choose", ringed in ink while a file is over it | A slot in the body with an engraved legend and a Choose key; each file a glass line | 2 |
| Forms (`form`) | A plate per group, fields seated in a column of cuts, labels on the plate above | A column of grey pills and type, groups parted by space and a title, no frames | A front panel: groups as engraved sections on the body, each field a glass window | 8 |
| Funnel (`funnel`) | One slot per step cut into a plate, each fill drawn to its share, stepping down | Steps as lines of type, a grey band behind each to its share, conversion in words | A column of segment bars in wells, each count in segments, conversion on an LCD line | 7 |
| Gauge (`gauge`) | A dial sunk into a plate, a raised pointer over ticks lit on its floor | An ink arc on a grey arc, the figure in type at its center, no ticks | A moving-coil meter: a needle over engraved ticks behind glass, the figure in segments | 6 |
| Header (`header`) | A glass bar over the page, nav links as blocks on a rail, the current raised | A line of words on the page, the current in ink; no bar, no glass, no rule under it | The body's top panel: engraved legends, a lamp under the current, the title on an LCD strip | 5 |
| Heatmap (`heatmap`) | A plate of small wells, each fill seated in its well, the scale in a slot beside | Grey and hue squares parted by space, no frame, the scale in words | A dot matrix of lit dots at four brightnesses in the data hues, behind glass | 7 |
| Hover card (`hover-card`) | A small glass slab that rises from its link, lit along its top edge | A sheet that grows from its link, its words and picture, no ring | A small screen that switches on beside its link in steps, its facts as LCD lines | 4 |
| Icons (`icons`) | follows the ink | follows the ink | follows the ink | none |
| Input (`input`) | A cut into a raised plate with its top wall's shade, the label on the plate above | A grey pill with no outline, the label as words above, the focus ring the only line | LCD glass in a bezel well, the label engraved above, hint and error as dim LCD lines | 1 |
| Inspector (`inspector`) | A rack of plates, one per group, controls seated in trays, values on raised faces | A column of rows parted by space, the label in grey, its control at the end; no panels | A patch panel: engraved section legends, faders and keys in rows, values on LCD | 3 |
| Kbd (`kbd`) | A raised key cap standing proud of the line, lit top edge and shade below | The key's name in a small grey bubble, nothing raised | A real key on its 2px skirt, its legend engraved in capitals | 9 |
| Legend (`legend`) | Series as blocks in a tray with a hue chip; a hidden one sinks flush and says Hidden | Series as words with a hue dot; a hidden one in grey with an outline dot | A row of latching keys, each lamp in its series' hue, down shows it, its word says which | 2 |
| Lightbox (`lightbox`) | The picture on a lit plate under glass, previous and next as blocks on the glass's foot | The picture grows from its thumbnail onto a whole grey page, the count in words, nothing else | A viewfinder screen: the picture behind a bezel, the frame number in segments, step keys | 10 |
| List and cards (`list`) | Rows as slats in a tray, the hovered slat lifts and catches the light; cards as plates | Rows as lines of type parted by space, a grey bubble under the hand; cards as pictures and words | Screen lines with the lamp row; filter chips as latching keys | 8 |
| List cover (`list-cover`) | Rectangles as raised plates and cut wells, lit from above | Flat grey and ink rectangles set like a page layout | Patterns of lit segments and dots in the screen inks | 10 |
| Log view (`log-view`) | Lines in a deep well, its header a raised rail with Copy as a block | Mono lines on grey, no frame, the newest at the foot, Copy a grey word | A terminal behind a bezel, lines in the screen ink, a lamp lit while the job runs | 9 |
| Media (`media`) | The picture seated in a well cut into a plate, its lower wall lit | The picture alone on grey, no frame; a failure is one sentence on the grey | The picture behind glass in a bezel; loading the Chase, a failure an LCD line | 10 |
| Menu (`menu`) | A glass tray of slats, the hovered slat lifted and lit, shortcuts as key caps | A sheet of words that grows from its trigger, a grey bubble gliding under the hand | A screen list with the lamp row, switching row to row, shortcut legends engraved | 4 |
| Message (`message`) | The person's turn on a raised face, the agent's words on the page, actions as small blocks | The person's turn in a grey bubble, the agent's bare type, actions as grey words | A printout on a screen: turns as mono lines, who spoke engraved in capitals | 9 |
| Number field (`number-field`) | The figure in a cut, − and + one rocker block beside it that tips toward the side pressed | The figure in ink between − and + set as words, one grey pill around all three | The figure on an LCD readout, − and + as keys on their skirts beside the glass | 1 |
| Option picker (`option-picker`) | Values as blocks in a tray, the chosen one raised and lit, a sold-out one lying flat | Values as words in grey pills, the chosen in an ink pill, sold out struck and said | A row of latching keys with engraved legends, the chosen down and lit; sold out lies flat | 1 |
| Pad (`pad`) | A sunken floor in a plate with a lit grid, a casting cap ridden over it, values on raised faces | A grey square, a round ink knob, the two values in words; no grid | An XY pad behind glass: a dot grid, a lit crosshair through a knob cap, both values as readouts | 3 |
| Pagination (`pagination`) | The range on a raised face, Previous and Next as blocks at either end of a tray | The range in words, Previous and Next as grey word pills | The range in segments on an LCD strip, two step keys at its ends | 2 |
| Plan (`plan`) | Steps as slats in a tray, done ones seated flush with an ink tick, the current raised | Steps as a list of type, done ones grey with a tick, the current in ink | A column of step lamps on an engraved strip, done ones lit, the Agent indicator by the current | 6 |
| Popover (`popover`) | A glass slab that rises from its trigger, its fields seated in cuts | A sheet that grows from its trigger, no ring, its content as type | A small screen in a bezel that switches on where it stands | 4 |
| Price (`price`) | The figure on a raised face, the old price sunk in a cut beside it | The figure in ink type, the old price grey and struck, the unit in words | The amount in seven segments, the old price a dim LCD line, the currency engraved | 10 |
| Product card (`product-card`) | A plate with its picture in a sunken well, the price and Add on a raised rail below | The picture and its words, no box, the price in ink under the name | A vending window: the picture behind glass, the price in segments, Add a key | 10 |
| Progress (`progress`) | A fill drawn out of a slot cut into a plate, the percent on a raised face at its end | An ink band in a grey pill, the percent in words beside it | Segments in a well lighting in steps, the percent in seven segments; unknown length the Chase | 6 |
| Range chart (`range-chart`) | Bars in a sunken well, the brush two caps riding a slot above, the total on a raised face | Ink bars on grey, the brushed span a grey bubble, the total in type above; no axis | Bars as lit dot columns on a screen, the brush two fader caps, the total in segments | 3 |
| Resizable (`resizable`) | Panels as plates, the gap between them a slot with a cap you ride across | No line: space between the panels, a grey pill grip under the hand | Panels as screens set in the body, the divider a ridged bar with a lamp lit while held | 3 |
| Rolling number (`rolling-number`) | Digits on drums behind a slot window, rolling past its lit lower lip | Figures in plain ink type that roll, no window and no frame | Seven-segment digits behind glass, a changed digit switching in three steps where it stands | 6 |
| Rule builder (`rule-builder`) | Each rule a slat in a tray of field, operator and value blocks; groups as nested trays | Each rule a sentence of grey pills, "Seniority is Manager", groups indented by space | A patch bay: each rule a row of readouts with step keys, groups on engraved panels | 9 |
| Run card (`run-card`) | A plate with the run's ring as a fill round a sunken dial, the step on a raised face | The run's name and step in type, the ring an ink arc on grey, no box | A dial of lit segments lighting in steps, the step on an LCD line, folded a key to press | 6 |
| Run list (`run-list`) | Runs as slats in a tray, the open one raised, each status word on its slat's face | Runs as lines of type, status in words, the open one in a grey bubble | Screen lines, a status lamp and its word per run, the open one latched | 9 |
| Scroll area (`scroll-area`) | The thumb a cap riding a slot cut along the edge | A thin grey pill thumb on nothing, no track | A well along the edge, a run of lit segments for the part in view | 3 |
| Segmented control (`segmented`) | Blocks in a tray, the chosen one raised; the hand drags it along the tray to the nearer option | Words alone, a grey bubble gliding to the chosen one, no tray | A row of keys on one skirt, the chosen latched with its lamp lit, no glide | 1 |
| Select (`select`) | A raised block trigger; its list a glass tray of slats, the current slat lifted | A grey pill trigger; its list a sheet that grows from it, the current in a grey bubble | The value on a readout with up and down keys; pressing the readout opens a screen with the lamp row | 1 |
| Seven-segment (`seven-segment`) | n/a (Device only) | n/a (Device only) | built | built |
| Shopify (`shopify`) | no body (draws nothing) | no body (draws nothing) | no body (draws nothing) | none |
| Shopify cart (`shopify-cart`) | no body (draws nothing) | no body (draws nothing) | no body (draws nothing) | none |
| Slide to confirm (`slide-confirm`) | A gripped cap ridden along a slot in a plate to an end stop, its words in the slot's floor | A grey pill with an ink circle you push to its end, the words inside the pill | A latch key pushed along a well to a stop, words on an LCD strip, a lamp lit once confirmed | 1 |
| Slider (`slider`) | A cap on a deep plate with lit notches, its value on a raised face that rides with it | A pill track, the filled part ink, a round ink knob, the value in words at its end | built | 2 |
| Sources (`sources`) | Numbered marks as tiny raised blocks in the line; the list a tray of slats | Numbers as small grey bubbles in the text; the list as lines of type | Numbers as small engraved keys; the list screen lines, a lamp on the one cited | 9 |
| Sparkline (`sparkline`) | One line as a groove in a sunken strip, its last point a raised bead | One ink line on nothing, the last value in type at its end | A dot trace on a small screen, the last value in segments | 7 |
| Spread (`spread`) | One slot per row cut into a plate, the spread a fill, the median a cap seated in it | Per row an ink thread on grey, the median a dot, the figure in type | Per row a run of lit segments across the range, the median brighter, the figure in segments | 7 |
| Spring editor (`spring-editor`) | The curve in a sunken well, time and bounce on two knobs that turn in detents | An ink curve on grey, time and bounce as two pill sliders with their values in words | The Pad's glass, the spring a lit trace, time and bounce as readouts on the glass | 3 |
| Stat (`stat`) | The figure on a raised face set into a plate, the label on its top rail | The figure in ink type on the page, no box; space parts the tiles | The figure in seven segments on an LCD window, the label engraved above | 6 |
| States (`states`) | Empty as a tray with its sentence on the floor; loading still plates at the content's size | Empty and error as one sentence and a pill; loading still grey blocks at the content's size | Loading the Chase in a well; empty and error LCD lines, an error with a lamp in `--danger` | 6 |
| Steps (`steps`) | A row of blocks on a rail, done ones seated flush, the current raised and lit | Numbers and words in a line, done in grey, the current in ink, the rest outlined | A strip of numbered lamps, done ones lit, the current step's word on an LCD line | 6 |
| Switch (`switch`) | A thick block thrown along a deep tray to a stop, uncovering On or Off set in the floor | A small ink pill with a canvas knob when on, an outline pill when off, the word in type beside | built | 2 |
| Table (`table`) | Rows as slats in a tray, the hovered slat lifts and catches the light, the header a raised rail | Rows set apart by space, no lines, the header in grey label type, a grey bubble under the hand | A screen of mono columns, the lamp row at the start, the header engraved on the bezel | 8 |
| Table filter (`table-filter`) | A block that stays raised while a filter is on, opening Menu's glass tray | A word with its count, in ink while on, opening Menu's sheet | A latching key, its lamp lit while a filter is on, opening Menu's screen | 5 |
| Tabs (`tabs`) | Labels as tabs cut from a plate's top edge, the current one standing forward, joined to its panel | Labels as words, the current in ink with a grey bubble behind it, the panel bare below | Engraved legends with a lamp under the current one, switching on, never gliding | 1 |
| Tag (`tag`) | A small raised block with a lit top edge, its word on the face | The word in a grey pill, nothing raised | The word engraved in capitals on a small plate; a status tag adds its lamp | 2 |
| Tape progress (`tape-progress`) | n/a (Device only) | n/a (Device only) | built | built |
| Thinking (`thinking`) | A block you press open, the reasoning in a tray below, the clock on a raised face | A line of grey type, "Thinking 4s", the reasoning plain grey text under it | The clock in segments on a small LCD, the Agent indicator in its slot, the reasoning on glass | 6 |
| Time scrubber (`time-scrubber`) | A ruler in a sunken slot, a cap ridden along it, notches lit from above at each mark | A grey pill ruler, an ink needle, the time in type above | A tape counter: the time in segments over an engraved ruler under a fixed needle, keys in detents | 3 |
| Timeline (`timeline`) | Steps as slats, each time on a raised face, the whole run a fill drawn along a slot | Steps as lines of type in columns, times grey, outcomes in words, nothing joining them | A strip of step lamps, each time in segments, the outcome as words on an LCD line | 8 |
| Toast (`toast`) | A glass slip that rises from below with weight, its action a block on its face | An ink pill with canvas words, its action a word inside the pill | One LCD line in a bezel that switches on in steps, its action a key at the end | 4 |
| Token input (`token-input`) | A cut with each token a raised block standing out of it, a small block to remove it | A grey pill field, tokens as darker grey pills with an × | The Input's glass, each token an inverted cell of lit mono words with a small remove key | 2 |
| Tool call (`tool-call`) | Each call a slat in a tray, a run folding into one raised block, Approve and Deny as blocks | Calls as lines of type, "Read src/app.tsx", a run folded into one line, approval two pills | Mono lines on a screen, a status lamp and word per call, approval two keys | 9 |
| Tooltip (`tooltip`) | A small glass label that rises a hair over its trigger | A small ink pill of words | One LCD line that switches on beside its trigger | 4 |
| Tree (`tree`) | Rows as slats nested in stepped trays, the selected slat raised and lit | Names as indented lines of type, the selected in a grey bubble, no guide lines | Screen rows with the lamp row, a folder's toggle a small key latched down while open | 5 |
| Tune (`tune`) | no body (draws nothing) | no body (draws nothing) | no body (draws nothing) | none |

### Pieces built once

Each world builds a few mechanisms once, in the first wave that needs them, and every later body reuses them.

**Press, the instrument.**

- **The plate** (wave 1, under Input and Code input): a block that stands on the page with a lit top edge and a shade below. Card, Callout, Details, Stat, Forms, Inspector, App shell and Product card stand on it.
- **The tray of slats** (wave 1, Select's list): rows as slats, the hovered or current slat lifted on Glide. Menu, Command menu, Combobox, List, Table, Tree, Run list, Tool call, Plan, Timeline, Cart and File changes.
- **The raised face** (wave 1, Number field): a value on its own raised face. Stat, Price, Pagination, Progress, Date picker and Thinking's clock.
- **The lit well** (wave 3, Pad): a sunken floor with its grid lit from the top as grooves. Curve and Spring editors, Range chart, then every chart in wave 7, Media and Product card's cover.
- **The cap in a slot** (built, Slider): Slide to confirm, Time scrubber, Range chart's brush, Resizable, Scroll area, Progress, Funnel and Spread.
- **The knob with detents** (wave 3, Spring editor): it is also the Press-only knob part (Depth, above).

**Flat, the page.**

- **The sheet** (wave 1, Select's list): a solid card that grows from where you touched. Menu, Context menu, Popover, Hover card, Dialog, Combobox, Command menu and Date picker.
- **The ink row** (wave 1, Select's list): a line of type set apart by space, the current one in ink, no rule. List, Table, Tree, Run list, Tool call, Timeline, File changes, Plan, Cart and Message.
- **The grey bubble** (built, Flat's Glide): Tabs, Segmented, Select, Menu, App shell, Header, Breadcrumb and Range chart's span.
- **The pill** (wave 1, Input): every field and every control a hand touches. Button, Tag, Token input, Pagination, Number field and Composer.
- **The ink mark on grey** (wave 3, Range chart): marks with their values set beside them, no axes, no gridlines. Every chart in wave 7, Gauge, Progress and Run card's ring.

**Device, the machine.**

- **The latching key row** (wave 1, Checkbox and radio): Segmented, Tabs, Option picker, Card picker, Legend, Table filter and Breadcrumb.
- **The readout with step keys** (wave 1, Select and Number field): Date picker, Time scrubber, Pagination and Rule builder.
- **The lamp row** (wave 1, Select's list): Menu, Command menu, Combobox, Tree, List, Table, Run list and App shell. It replaces Glide under Device.
- **The segments** (built, Seven-segment): Code input, Rolling number, Progress, Stat, Price, Gauge, Time scrubber and Thinking.
- **The Chase** (built, Agent indicator): Progress with no known length, States' loading and Media's loading.
- **The dot matrix** (wave 3, Range chart; added in this round): Chart, Sparkline, Dot plot and Heatmap.

### The rules every body keeps

- **The greyscale test.** Every body is checked in greyscale in one font against its two siblings; if its structure does not name its world, it is not done.
- **One accent fill per view.** A lamp lights in the ink or the glass's own ink, a Flat "on" is the ink, and a Press lift is never the accent, unless the part is the view's one accent: a primary key or button, or a `tone="accent"` switch. Lamps, dots and fills take the data hues only where the color carries data (Legend, Heatmap, Cohort grid, Breakdown).
- **Nothing moves on its own.** A slat lifts under a hand, a lamp lights on a state change, a segment switches when its figure changes, and the Chase runs only while the work does.
- **States in words.** A lamp, a lift, an outline or an ink fill never says a state alone: the word stays, or the accessible state says it. A Flat chart's values set beside its marks are those words.
- **Weight by role, nothing above 18px.** Flat's editorial ranking comes from weight, ink and space; Device's segments and engraved capitals keep the role weights.
- **44px targets on coarse pointers.** A small key, a bead or a remove × keeps its look and grows its hit area.
- **The motion bounds and tiers**, in each world's own language. Sound (decision 8) arrives in Device's bodies as they ship, Silent by default.

### Waves

Every wave builds all three bodies of each of its parts, one PR per wave, with `test:study` asserting three different `data-body`s per part.

1. **Wave 1:** Checkbox and radio, Segmented, Input, Select, Tabs, Number field, Code input, Slide to confirm, Option picker (9). The controls on every form and settings page; they build each world's first pieces (plate, tray of slats, sheet, ink row, key row, readout, lamp row). Device's bodies are being built now; Press's and Flat's follow in the same wave.
2. **Wave 2:** Switch, Button, Slider, Card picker, Token input, Composer, File drop, Legend, Pagination, Tag (10). The rest of what a hand presses: the three parts the deck uses get their pushed Press and Flat bodies, so the home shows all three worlds the moment it lands.
3. **Wave 3:** Pad, Spring editor, Curve editor, Color picker, Time scrubber, Range chart, Resizable, Scroll area, Inspector (9). What a hand drags and tunes; it builds the lit well, the knob, the ink mark on grey and the dot matrix that the data waves reuse.
4. **Wave 4:** Dialog, Toast, Menu, Context menu, Command menu, Popover, Hover card, Tooltip, Action bar (9). What a hand opens over the page: glass, the sheet and the bezel screen, each in its world's motion language.
5. **Wave 5:** Combobox, Date picker, Accordion, Tree, Table filter, Header, App shell, Breadcrumb (8). What a hand opens in place and moves through, built on wave 1's lists and wave 4's overlays.
6. **Wave 6:** Progress, Rolling number, Gauge, Steps, States, Stat, Plan, Thinking, Run card (9). What a hand watches: figures and steps that change only while the work does.
7. **Wave 7:** Chart, Sparkline, Bar list, Breakdown, Funnel, Spread, Dot plot, Heatmap (8). Data you read, on wave 3's well, marks and matrix.
8. **Wave 8:** Table, Cohort grid, Timeline, Card, Callout, Details, Forms, List and cards (8). Tables and the layout every screen is built from, on the plate, the ink row and the lamp row.
9. **Wave 9:** Message, Sources, Tool call, File changes, Run list, Log view, Code block, Rule builder, Kbd (9). What an agent's turn and a tool are read in.
10. **Wave 10:** Product card, Price, Cart, Media, List cover, Carousel, Lightbox, Avatar (8). Commerce and imagery, last because they compose everything above, and Flat's own parts (the work slider, the large cover, the photo essay) follow on them.

After wave 10 come the world-only parts (Depth, above): Press's knob, meter bank and instrument panel, and Flat's work slider, large cover, editorial layout and photo essay.

### The data wave comes next

Written 2026-11-10. Nick: "What I mostly wanna see is each world display data in their own way." So the data parts move ahead of waves 3 to 5. The inventory above already says what each one is in each world; only the order changes.

1. **Figures:** Stat (built first, as the pattern), then Progress, Rolling number and Gauge. They reuse pieces that exist: the plate, the raised face, the cap in a slot, the segments and the Chase.
2. **Rows of marks:** Bar list, Breakdown, Funnel, Spread and Sparkline. They build Flat's ink mark on grey and Press's fill in a slot cut into a slat.
3. **Charts:** Chart, Dot plot, Heatmap and Range chart. They build Press's lit well and Device's dot matrix, which wave 3 was to build.
4. **Tables:** Table, Cohort grid and Timeline, on the tray of slats, the ink row and the lamp row from wave 1.

Each part lands with all three bodies, a Three bodies stage on its page, a Bodies line in `components.md` and a changelog line, as Stat did. Waves 3 to 5 (what a hand drags, opens over the page and opens in place) follow the data wave, less the pieces it has already built.

### Counts

Of the 95 parts:

- **Press:** 87 bodies to build (waves 1 to 10, Switch, Button and Slider included), 4 n/a (the Device-only parts).
- **Flat:** 87 bodies to build, 4 n/a.
- **Device:** 84 bodies to build, 3 shared bodies built (Switch, Button, Slider) and 4 Device-only parts built.
- **No body:** 4. Shopify, Shopify cart and Tune draw nothing; Icons follow the ink.

That is 258 bodies across ten waves, about 26 a wave, each with its hand tests.

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
| 15 | How far do the worlds go? | **Every visible part has a body per world, and every wave builds all three, each pushed to its extreme** (Three directions, above). Decided by Nick on 2026-11-08 ("I thought each world components should look way different"), choosing every visible part and all three worlds per wave. It widens decision 13 from parts a hand touches to every part that draws something. | Three coats of one shape read as themes; three shapes under one contract read as worlds. The contract keeps the host's code and the accessibility one. |

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
