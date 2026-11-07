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

### Sound, as a world's ability

bencho sells Sounds; Nick's studies tie a sound to the visual event; `gallery-wow.md` proposed sounds in fun mode and left it as Nick's call. In a world, sound is an ability a material brings (Nick: "each system provides new abilities"). Device is the one that has it: a key's click on press, a notch's tick on the slider, a switch's clack, a code digit's beep behind the glass. Synthesised with Web Audio, no files, so the registry ships no assets. Off by default; a Sound choice in Customize, Silent or On; only in answer to a hand, never on arrival or on its own (R4 holds for the ear too); reduced motion leaves it alone, since it is not motion, but a system-level mute does not exist, so the default is Silent.

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

## Migration, in verifiable units

Each unit ends with `verify`, the build, screenshots in both themes at 1440 and 390 under every material, and axe; each is its own PR.

1. **Worlds in the nav and on the home.** The three world pages (`00-press.tsx`, `00-flat.tsx`, `00-device.tsx`), Material moved from Customize's popover onto the deck and into the nav, the hero block live under the deck, Foundations as cards onto existing pages, `gen-llms.mjs` writing a Worlds section from `look.ts`. **Nothing in `src/components` changes**, so no registry version moves. `test:wall` runs the wall under each material. `test:home` checks the deck's Material switch changes every tile and starts no transition (a material switch is instant, like a theme switch).
2. **The study treatment in the kit.** `Page` gains Anatomy, Replay, States, Mechanism, Source and the Under each material strip, from page data; `gen-docs.mjs` lists which pages carry them; `gen-llms.mjs` ships `meta.mechanism`. The eight pages of decision 5. A pixel test: a demo at rest is identical with and without the treatment, and under each material it matches the material's own page.
3. **Device, wave one.** `agent-indicator`, `copy-button`, Progress's tape recipe, Thinking's Device row, Code input's and Command menu's Study pages. Changelog lines, `test:registry`, `check.mjs` check 12 under Device for every new pair.
4. **Sound**, if decision 8 holds. Customize gains Sound; `check.mjs` gains a check that nothing plays without a pointer or key event in the last 300ms.
5. **The business surface.** OG images per look on world and Study pages; a Worlds section in `README.md`; the brand-world offer as a page on litt.design, not in this repo.

Unit 1 is a week and changes how the site reads; it is the one to ship first and post about. Units 2 and 3 are where the depth comes from and can run as parallel builders in worktrees, as the agents and data-color steps did.

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
