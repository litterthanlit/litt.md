# Plan 024: Dial in each world, one at a time, to the components repo's bar

> **Executor instructions**: Read `.claude/CLAUDE.md`, `skills/litt-md/taste/litt-principles.md`, plans 018 to 020, and
> the components repo's `DESIGN.md` in full (`git clone --depth 1 https://github.com/litterthanlit/components`). Then
> open the contact sheets of the audit this plan comes from (2026-11-16, `sheet-<world>.png` and `sheet-reference.png`).
> Work one world at a time, in the order below. Every phase ends green and committed, and each world ends in a STOP
> for Nick. Do not edit `plans/` except your row in `README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b40b46d..HEAD -- gallery/src/gallery gallery/src/worlds gallery/src/components skills/litt-md/taste`
> If a world's pages, bodies or principles changed, re-shoot that world before starting it.

## Status

- **Priority**: P1 (Nick, 2026-11-16)
- **Effort**: XL, in six world-sized pieces (Device L, then each other world M to L)
- **Risk**: MEDIUM. Phases 1 and 3 are gallery chrome. Phase 2 changes bodies, which changes registry items (changelog
  lines per world, `test:registry`). Phase 4 is taste.
- **Depends on**: 019 and 020 (merged). Absorbs 018 phase 2 (see Decisions, 3). 021 (Device's sound) slots into
  Device's phase 4. 017 stays deferred until every world is dialled in.
- **Category**: direction
- **Planned at**: commit `b40b46d`

## Why

Nick, 2026-11-16: "I think we gotta dial in each world first, I feel like components is so strong in terms of
presentation and cohesiveness we're not even close."

The audit of 2026-11-16 shot the components repo (home, six studies, `/system`) and every world's player, gallery view,
About and three or four component pages, at 1440 by 1000. What the components repo has that no litt world has yet:

1. **One object, one written material vocabulary, every part built from it.** Plate, then well, then part. Each
   material is a named token group with a recipe; every study starts from the plate recipe and marks its parts
   (`data-part`), so `check:anatomy` can prove it. The fader, the knob desk and the one-time code are visibly the same
   instrument.
2. **Studies, not demos.** 23 curated studies, one stage each, each a product pattern in the instrument's words
   (`Mix · take_04`, `Scene A`, `LOADED`, `AUTO · READ`), moving in the first frame.
3. **Restraint.** Monochrome, red for REC, orange only for a hand on it, one blue on the screen. A list of what was
   taken out, with reasons.
4. **Pages stripped to the name.** A faded number, the name, one stage, Anatomy and Replay, the source. No lede, no
   badges, no second demo.
5. **One scale of everything on the object.** Radii in em that nest (1.25, 1.05, 0.7, 0.4), lettering in em of the
   plate, the same two-shadow key on every part.

What the audit found in litt, across all six worlds:

- **Every demo is shared.** 116 pages, 349 stages, and not one page draws a different demo per world (no page reads
  the material). So every world's gallery opens on the same three tiles (Button's "Start a project / View work /
  Cancel / Disabled", Kbd, Icons); every world's Menu is "Northwind site · Framer · published 2 days ago"; every
  world's Slider is "Animation speed … on litt.design"; Device's and Heat's Gauge are both "Credits left 20,830" in
  teal. The world's own words live only on `#<world>/about`, in its scenes.
- **Bodies cover a quarter of the parts.** 23 of 97 contracts have a body per world (`byWorld`); Heat has 5 bodies
  and Plain 7. The rest take the world's tokens on Press's structure, so in greyscale most tiles do not name their
  world. 24 components never read the material at all (gauge, pad, curve-editor, spring-editor, inspector,
  range-chart, rolling-number, carousel, lightbox among them), and several of those are in a world's set.
- **Pages explain.** A component page is a title and lede, tier chips (Instant, Responsive, Expressive), Copy prompt,
  Source, Markdown, then three to six stages, each with a name, a tier chip, "How it works" and a Preview/Code
  switch. Plain, which is still, shows "Expressive" chips.
- **Five players are `bare`.** A hairline box with a sidebar rail of the set inside it and a text transport
  (`00 / 12 Home … Previous Play Next`). Device's recorder is the only body, and its screen is a grey hairline panel
  with the same web rail inside, not glass behind a bezel; its readout is text on the plate, not an LCD.

## Decisions for Nick

| # | Question | Recommendation | Why |
|---|---|---|---|
| 1 | Which world first? | **Device.** | It has a written measure (the components repo is its own measure in `litt-principles.md`), the only object already drawn, four parts of its own, and plan 021's sound waiting. The gaps are the most concrete and checkable, so it proves the method the other five then follow. Plain is already closest and Nick said to change nothing in it without asking. |
| 2 | Then? | **Press, Flat, Heat, Rack, Plain.** | Press and Flat carry the most traffic and have fresh direction from Nick (022, 023). Heat and Rack are proposals with the furthest to go. Plain last, as a light pass. |
| 3 | Does 018 (a body for each world's player) go inside the dial-in or after it? | **Inside, as each world's last phase.** | An object is built from its world's materials. Drawing one before the materials are written and the parts use them repeats Device today: a good recorder whose screen shows parts that are not of it. Built last, the object is the world's materials at their largest, and the greyscale test has siblings that already pass it. 018 phase 2's remaining five bodies move here. |
| 4 | May a page draw a different demo per world? | **Yes: per-world stages, the contract's props unchanged.** | "The vocabulary dresses the demo, not the component" (*components*). Shared demos are why every world reads as one site recoloured. |
| 5 | How many stages on a component page? | **One per world, at the top, by name. Variants move under it, quietly, behind Code.** | The components repo's pages are stripped to the name. litt's stages are a teaching set; an agent needs them in `docs/<page>.md`, not the reader on the page. |
| 6 | Do Device's studies run by themselves? (`litt-principles.md`, Open 3) | **Ask Nick at Device's STOP, with both shot side by side.** | It is the components repo's strongest trait and against R4; it should be decided by eye. |

## Phase 0. A presentation pass first (gallery chrome only, 2026-11-16)

Nick: "should we dial in the presentation first or individual worlds first? like these components look the same for
all no?" A small pass on the chrome first, then world by world. Nothing in `src/components`, `src/worlds`,
`src/motion` or `tokens.css` changed, and no world's look.

- [x] One page, one stage: a component page is its name and its lead stage (the demo its tile uses), Code and Replay
      under it, and one disclosure, Variants (a real `button`, `aria-expanded`), holding the lead's caption, the other
      stages and Try it (Decision 5, as a disclosure rather than behind Code). Tier chips, "How it works" and the lede
      left the page; the tiers and the summary stay in `docs/<page>.md` and `llms.txt`, whose output is byte for byte
      what 62c0240 wrote. About, the docs and the install follow, quieter. The mosaic still deals every stage.
- [x] A demo can differ per world (Decision 4's mechanism): `byWorld` on `Stage`, `tileByWorld` on `Page`, read from
      `WorldContext` (set by `world-site.tsx`); a world without its own draws the shared demo. One example: Device's
      Gauge, "Card left", 3H 12M of 8H at 48 kHz, 24 bit. The registry ships the shared demo as before.
- [x] Quiet tiles and chrome: no counts on the overview's filter, a world's jump links or its group titles, no
      explanation line under a world's gallery view or the wall's headings. A tile is the object and its name.
- [x] Checks green, unchanged but `test:motion`, which now opens Variants before it presses a page's triggers.

**STOP**: Nick looks at the before and after sheets (`#device/gauge`, `#press/slider`, `#flat/card`, `#heat/menu`,
both gallery views, the overview, Device's Gauge dark) and says whether Variants as one disclosure is right, and
whether Device's Gauge reads as the way every world's stages should go, before Device's phase 1 starts.

## Device

### Phase 1. Materials, color, voice and part kinds (drafted, waiting for Nick, 2026-11-17)

Nick said "go" to starting Device. Written in `taste/litt-principles.md`, under Device (Device's materials, color and
voice; Open 6 lists what Nick confirms), commit `d5abc9f`. Read-only on code: nothing in `gallery/` or `tokens.css`.

- [x] Materials, in the order they combine: frame (the object only), plate, well, key, cap and collar, LCD (its chip
      with it), bezel (glass and window with it), lamp, lettering. Each with its one line, the tokens that draw it
      today and its radius. Drafted, waiting for Nick.
- [x] The color rule in one table: monochrome, red for REC, the playhead and a fault, orange for a hand on it (and
      the focus ring), one blue on the screen for selection, no data hues (charts in the ink at 100, 55 and 30%).
      Drafted, waiting for Nick.
- [x] The voice: eleven nouns, five demo strings and the reference's Writing rules. Drafted, waiting for Nick.
- [x] The `data-part` kinds, below. Drafted, waiting for Nick.

**Token gaps for phase 2** (each through Propagate, never a raw value in a body): a frame token; the plate's gradient
and grain on a part's plate; the LCD's sheen, its chip and its dim units; a bezel; meter on and off, a lamp recess and
a lamp glow; a quiet legend ink apart from `--fg-muted`; a selection blue on the glass. And Nick's call on em radii.

**`data-part` kinds.** After `anatomy/parts.ts`, so `test:materials` can read which material a part is. A body marks
the element that draws the material. Kinds not in this list fail under Device.

| Kind | Material | Tokens today | Where it shows first |
|---|---|---|---|
| `frame` | Frame | `--object-radius`, `--object-cast`, `--surface-3` | The recorder |
| `plate` | Plate | `--canvas`, `--surface-1` to `-3`, `--plate-lift`, `--highlight` | Every stage, the recorder's body |
| `well` | Well | `--tray`, `--tray-shade` | Readout, number field, checkbox |
| `slot` | Well, with a lit fill | `--slot`, `--slot-shade`, `--slot-fill` | Slider, slide to confirm |
| `collar` | Cap and collar | `--tray`, `--tray-shade` | The dial, a knob |
| `key` | Key | `--block`, `--key-lift`, `--block-press` | Button, copy button, stepper |
| `cap` | Cap and collar | `--cap`, `--cap-lift`, `--cap-press`, `--dial` | Dial, switch, slider |
| `lcd` | LCD | `--field`, `--field-ink`, `--field-shade` | Input, seven-segment cells, readout |
| `chip` | LCD | none yet | Readout, agent indicator |
| `bezel` | Bezel | none yet (`--field`) | The recorder's screen, code input |
| `glass` | Bezel | none yet | Over a screen |
| `window` | Bezel | none yet | Tape progress |
| `light` | Lamp | `--signal`, `--accent`, `--field-ink`, `--danger` | Switch, file drop, agent indicator |
| `lettering` | Lettering | `--engrave`, `.litt-legend` | Every label on the body |
| `screen` | Particular | the dark screens (`--device-screen-*`) | The recorder's screen, command menu |
| `matrix` | Particular (LCD) | `--field-ink` | Agent indicator, chart, sparkline |
| `reel`, `tape` | Particular | `--cap`, `--field` | Tape progress, the recorder's tape |
| `face` | Particular | none | Agent indicator's tuner |

**Phase 2 work: breaches of the materials and the color rule** (audit of 2026-11-16 and the source, 17 found).

1. `#device/button`, and the first tile of `#device/components`: the primary key is filled orange ("Start a project").
   `src/worlds/device/button.tsx`. The primary becomes the ink key.
2. `#device/about`: Install is an orange key (`src/gallery/world.tsx`).
3. `#device/agent-indicator`: the REC light, the tuner's needle and the matrix's head are in the accent, not red or
   the ink (`src/components/agent-indicator.tsx`, the `data-rec` circle, the needle, the `data-[s=head]` dot).
4. `#device/tape-progress`: the record light is the accent (`src/components/tape-progress.tsx`). REC is red.
5. `#device/slider`: the slot's fill lights in the accent (`src/worlds/device/slider.tsx`). A level is the ink.
6. `#device/gauge`: Device's own stage and tile are the ink, but the Variants' Sizes stage (Minutes, Build minutes) is teal
   (`src/gallery/pages/17-gauge.tsx`).
7. `#device/legend`: lamps in the five data hues, glowing (`src/worlds/device/legend.tsx`).
8. `#device/tag`, and `#device/about`'s Runs: statuses filled green, amber and red, and data-hue tints
   (`src/worlds/device/tag.tsx`). Status takes the chip's glyphs.
9. `#device/chart`, `#device/sparkline` and every page that passes a `hue` (16 pages): the Device body lights the hue.
10. Every Device page: links are orange text (`--device-accent-text`). Orange is never text; a link is the ink,
    underlined (Nick confirms).
11. `#device/select`, `#device/menu`, `#device/command-menu`: the chosen row on glass is a lamp in the glass's ink;
    the one blue for selection is missing (`src/worlds/device/select.tsx`).
12. `#device/components`, Inputs: input, token input, select, combobox and file drop are black LCD fields with no
    plate or well round them.
13. `#device/date-picker`, `#device/color-picker`: white page fields, not glass in a well.
14. `#device/gauge`, `#device/seven-segment`, `#device/composer`: a stage is a black slab (a panel is a dark screen
    under Device); the player shows the same parts on the plate. A stage becomes a plate.
15. `#device/components`, Inputs: lettering is mixed. PROJECT NAME, MAIL FROM and DROP FILES HERE are engraved;
    Seats, Role, Client, Launch date, Sign-in code and Brand color are not.
16. `#device/components`, Actions: Kbd and Icons sit on no plate.
17. `#device` (phase 4): the readout is text on the plate, not an LCD; the screen is a hairline panel in `--field`
    and `--tray-shade` with no bezel, and holds the web rail.

**Phase 3 work: demo strings that break the voice** (12 found). Each becomes a Device stage in the recorder's words.

1. `#device/button`: "Start a project", "View work", "Cancel" (`01-button.tsx`).
2. `#device/input`: "Project name", "Halo site", "Shown in the dashboard and the browser tab." (`02-input.tsx`).
3. `#device/number-field`: "Seats", "€12 a seat, €96 a month" (`02-number-field.tsx`).
4. `#device/select`: "Role", "Designer", "Sets what you see in the studio." (`02-select.tsx`).
5. `#device/combobox`: "Client", "Search 30 clients" (`02-combobox.tsx`).
6. `#device/date-picker`: "Launch date", "The Marlow Labs site goes live at 09:00 on this day." (`02-date-picker.tsx`).
7. `#device/color-picker`: "Brand color", American where Device's demos are British (`03-color-picker.tsx`).
8. `#device/token-input`: "Mail from" (`02-token-input.tsx`).
9. `#device/slider`: "Animation speed" on litt.design (`03-slider.tsx`).
10. `#device/menu`, `#device/popover`, `#device/command-menu`: "Northwind site · Framer · published 2 days ago"
    (`10-menu.tsx`, `09-popover.tsx`, `11-command-menu.tsx`).
11. `#device/gauge`: the Variants, "Storage", "42 GB of 100 GB", "Minutes", "Build minutes"
    (`17-gauge.tsx`). Device's own stage, "Card left", is the model.
12. `#device/composer`: "Ask Litt about a build, a deploy or a client site", "Draft the Northwind launch note" (`20-composer.tsx`).

**STOP**: Nick reads Device's materials, color and voice in `litt-principles.md`, and Open 6, before phase 2 starts.

Nick, 2026-11-17, on the sheet of the eight calls: "all yes, thank you for this visual. this is what I mean diving into
the world!" Open 6 is closed.

### Phase 2. Every Device part in Device's materials and color rule (done, 2026-11-17, waiting for Nick)

- [x] Tokens first, through Propagate: Device's frame, a part's plate (gradient, edge, grain), the LCD's sheen, edge
      and dim units, its chip, a bezel, lamps on and off with their recess and glow, a quiet legend, the one blue on the
      glass, and links in the ink (`--device-accent-text` is `--device-fg`). Values from the components repo's
      `tokens.css` where they fit (frame, body edge, LCD, rim, meter, recess, its accent as the selection blue); the
      plate a step lighter and the quiet legend a step darker, to keep 3:1 and 4.5:1. A chart's hues and the statuses
      are greys under Device. Every other world gets the names as aliases of its own. Check 12 holds the rule.
- [x] R9's exception for Device's em radii (plate 1.25, well 1.05, key 0.7, chip 0.4), `taste:` commit `7ae583d`;
      check 7, `rules.ts` (`DEVICE_RADII_EM`), the lint (gallery and host), `test:rules` and `test:corners` hold them
      to Device, each with a case that fails elsewhere.
- [x] Breaches 1 to 16 fixed (17, the player body, is phase 4), each part marked with its `data-part` kind.
- [x] `test:materials` (after `check:anatomy`): Device's kinds only, orange only in a lamp, no data hue, green or
      amber, every stage and gallery tile a plate. Its self-test puts back an orange primary key, a teal gauge, a Press
      part's kind and a dark stage. `KNOWN` is empty. In CI beside `test:worlds`.
- [x] Press, Flat, Plain, Rack and Heat compared page by page against the base commit, light and dark, at
      deviceScaleFactor 1.
- Left: the rule builder's condition row keeps the control radius around Device's select well (`test:corners`
      `KNOWN`); code input's cells are not in a well; demo strings are phase 3.

**STOP**: Nick looks at the before and after sheet of the sixteen breaches before phase 3 starts.

### Phase 3. Every Device page in the recorder's words (done, 2026-11-17, waiting for Nick)

Nick: "go". Each page keeps its component and contract props and gets Device's own stage through `byWorld` (and
`tileByWorld` where the page has a `tile`): a product pattern a team ships, told with takes, cards, scenes, REC and real
units, British with -ize. Every other world draws the shared demo, unchanged.

- [x] The twelve demo strings above, lead stage and tile, and every Variants stage whose words broke the voice:
      button (Export take), input (take_04), number field (pre-roll, 576 kB a take), select (sample rate), combobox
      (a location on the slate), date picker (a timer for the dawn chorus), colour picker (a track's colour, clear of
      red, orange and blue), token input (a routing rule), slider (monitor level in dB), menu, popover and command
      menu (take_04.wav, Play, Export), gauge's Variants (Card A, Battery left) and composer (ask about a take).
- [x] Then Device's set: switch (recording settings), seven segment (takes today, a level in dB), copy button's
      second stage (ffmpeg, rec export), tool call (an agent fixing the takes that clip) and message's lead.
      Agent indicator and tape progress already spoke it.
- [x] The registry's `<stem>-demo` items, `docs/*.md`, `llms.txt`, `llms-full.txt` and `docs.json` are byte-identical
      to main (a diff of the `gen-registry` and `gen-llms` output). A page's Device demo keeps its own imports apart
      from the shared demo's, so the generated demo does not change.
- [x] Then the rest (Nick: "go"), in three batches: the other 60 pages of `#device/components` and message's later
      stages, each in the recorder's words (inputs and tools, layout and data, charts and the agent parts). Carousel's
      lead was already Device's (a photo series). The registry and agent docs stay byte-identical to main.
- Left: a page's `TryIt` props and `study` objects, which take no per-world demo, keep the shared words. No new noun
  was needed in `taste/`.

**STOP**: Nick looks at the before and after sheet of phase 3 before phase 4 starts.

### Phase 4. The recorder's body (done, 2026-11-17)

Nick, on every Device page in the recorder's words: "I love it! keep going. go". The body only (breach 17); plan 021's
sound is another agent's, and Decision 6 is still Nick's.

- [x] The screen holds the take alone: the contract's rail is out of the recorder's screen (`rail: false` on the body;
      `bare` keeps it). The set is on Home, behind Index (the top row's and the dial's) and on the dial's Previous and
      Next. The screen sits in a black, polished bezel (`bezel`) with glass over it (`glass`, `--glass-sheen`, the one
      token added, through Propagate, with `litt` and `device-litt` lines).
- [x] The readout is an LCD in a well: the chip (a red lamp and PLAY while the set plays, the stop's square and STOP
      when not), the take's name, and `05 / 12`, marked `well`, `lcd`, `chip` and `light`.
- [x] Every part marked: `frame`, `plate`, `bezel`, `glass`, `tape`, `well`, `lcd`, `chip`, `collar`, `cap`, `key`.
      Orange shows nowhere at rest; red is the playhead and the chip's lamp.
- [x] Taken out, as repeats: the rail (Home holds the set), the readout's group caption (Details says it), and the
      ring beside the count (the chip says it).
- [x] `test:playground`'s rail claim splits: a `bare` object's rail still lists the set; a world in `OBJECTS` has no
      rail inside its screen. `test:materials` reads the player, Home and every take, light and dark; `KNOWN` stays empty.
- [x] Decision 6, whether Device's takes run by themselves: Nick, "6 no". Nothing plays until Play is pressed, as in
      every world.

Nick looked at the before and after sheet (2026-11-17): "6 no, keep the bezel, open the pr". The bezel stays though
the components repo's screen has none.

## Press

### Phase 1. Materials, colour, voice and part kinds (drafted; paused, 2026-11-17)

**Paused (2026-11-17).** Nick, on the nine calls live on `#canvas`: "I think we're taking away from what press is. for
example the tags look cool here but each line being pressed is a bit much. the materials we have are brilliant, let's
build on them. I hate the chart, it doesnt fit kinda I feel like". Round 2 went up beside them (`press-round2.tsx`: the
table's rows on one tray with the tags kept raised, today's tags kept with Building as a word on a block, and three
charts made of Press's materials: blocks in a tray, a trace on glass, slots cut into the plate). Then: "I cant decide
now, maybe current look isn't so bad. maybe we should jump into the new flat." Press stays as it ships; nothing below
is decided, and both rounds stay on the canvas for when Press comes back. Flat goes next.

Read-only on code: nothing in `gallery/`, `tokens.css` or `taste/` changed. Drafted from plan 022 (the first Press is the
measure; a raised thing says it is raised once; no outline round a button), `litt-principles.md` (Press), the journal
(26 October, 13 and 16 November), R3 and `material.md` 6, and the components repo's bar. Audit: main at `01225e3`,
`#press/components` light, dark and in greyscale with one face, the player, About and eight component pages, at 1440 by
1000. Score **5 / 10**, as on 16 November (phase 0's chrome since). The sheet of the nine calls goes to Nick; the
vocabulary goes into `taste/litt-principles.md` as a `taste:` commit only after Nick's answers (`evolve.md`).

- [x] Materials, in the order they combine: surface, then what is pressed into it (tray, cut), then what stands on it
      (block; the plate with its slot and cap), then glass over everything; one light from the top on all of it. Drafted,
      waiting for Nick.
- [x] The colour rule. Drafted, waiting for Nick.
- [x] The voice: ten nouns, five demo strings. Drafted, waiting for Nick.
- [x] The `data-part` kinds. Drafted, waiting for Nick.

**Materials.**

| Material | One line | Tokens today | Radius |
|---|---|---|---|
| Surface | Where content sits: flat, a hairline and the top highlight, never a cast. | `--canvas`, `--surface-1` to `-3`, `--line`, `--highlight`, `--well` | `--radius-surface` |
| Tray | Holds choices: a floor one step down, its top wall's shade. | `--tray`, `--tray-shade` | `--radius-control` |
| Cut | What you type or put a mark into: the shallowest step, inside the 3:1 line. | `--cut`, `--cut-shade`, `--line-control` (as `--field-*`) | `--radius-control`; a radio round |
| Block | What you press: raised once by its cast, sinks half a pixel. Selected is raised. No outline. | `--block`, `--block-lift`, `--block-press`, `--block-hover`, `--press-depth`, `--key-lift` | `--radius-control`, less 2px in a tray |
| Plate, slot and cap | What you hold and move: a taller plate with a slot cut into it and a cap riding in it. The slider, and the object. | `--plate-lift`, `--slot`, `--slot-shade`, `--slot-fill`, `--slot-fill-shade`, `--cap`, `--cap-held`, `--cap-lift`, `--cap-press`, `--cap-grip`, `--notch`, `--notch-home` | plate `--radius-control`; slot and cap less 2px |
| Glass | What floats over content, glowing evenly on every side. Never glass on glass. | `.litt-glass`, `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-saturate`, `--shadow-tooltip`, `--shadow-float`, `--shadow-modal` | `--radius-surface` |
| Light | One, from the top: the edge highlight, the accent's light, grain. | `--light`, `--highlight`, `--glow`, `--grain`, `--grain-opacity` | none |
| Lettering | Helvetica Neue, three weights by role, sentence case, no engraving. | `--font-sans`, `--weight`, `--weight-title`, `--weight-label`, `--label-case` | none |

**Colour rule.**

| Colour | Means | Never |
|---|---|---|
| Warm stone and the ink | Everything else: surfaces, blocks, words, ticks and radios, a switch's On, a status that is fine | — |
| Blue 4 (`--accent`) | The view's one primary action, or its one main switch. As light: the focus ring and links | A second fill, a status, a tint behind a tag, a series |
| Red (`--danger`) | A fault and a destructive action's words; one fill, on a destructive dialog's confirm | Decoration |
| Green, amber | Nothing, if call 2 is taken | A status chip |
| Data hues | A chart's series, in R7's order; a single quantity stays the ink | Chrome |
| Selection | Not a colour: the raised block; a menu row's fg 7% | The accent |

**Voice.** Press's audience is "product UI, settings and dashboards", and `#press/about`'s scenes already speak it.
Nouns: deploy, build, branch, commit, preview, production, environment, region, seat, plan. Demo strings: `harbor-web`,
`main · 4f9c2e1 · Add pricing page`, `Building (68%)`, `1m 42s · 312 files · fra1`, `3 seats left on Pro`. Plain product
English, sentence case, units on every number, status in words. Spelling waits on Open 4 (About writes "Optimising").

**`data-part` kinds**, named after Press's Anatomy callouts (the block, the plate, the slot, the pulled-out part, the
notches, the cap): `surface`, `tray`, `cut`, `block`, `plate`, `slot`, `fill`, `cap`, `notch`, `mark` (a tick, a bead),
`glass`, `lettering`.

**Token gaps.** None for the vocabulary. Calls 2 and 3 change rules, not values: `--success` and `--warning` would go
unused under Press, and `--glow` would be none under Press (through Propagate).

**Calls for Nick** (the sheet, today beside the proposal):

| # | Call | Recommend | Why |
|---|---|---|---|
| 1 | Raised only where a hand presses: statuses (tag, table, list, card, context menu), the stat's figure and table rows leave their blocks | yes | They read as buttons. "Depth says what a thing does"; `material.md` 6, "Where not". |
| 2 | Status: only a fault takes colour (red); Ready, Live, In review and Building are the ink word | yes | Green, amber and a blue tint all mean "status". Narrows R7 under Press only. |
| 3 | The primary is Blue 4, raised once by its cast, with no glow | yes | Fill, cast and halo are three cues on one block, loudest in dark. An R6 exception for Press. |
| 4 | Keep the shallow cut for fields (not a deeper one) | yes | The audit found it faint, but Nick turned down the sunken well on 26 October and 022 put the shallow cut back. |
| 5 | A stage stays the surface, not a plate (unlike Device) | yes | A plate round a block is the outline 022 took off. The plate stays the slider's and the object's. |
| 6 | Charts keep R7's five hues; a single quantity (a stat's sparkline, its "Up 12%") is the ink | yes | Press is for dashboards, so series keep their hues; one quantity needs none. |
| 7 | Voice: the deploy dashboard of About's scenes, not the web studio (Northwind site · Framer, Halo site, Animation speed on litt.design) | yes | It is Press's stated audience, and About already speaks it. |
| 8 | Card covers: a real preview, not an X-crossed wireframe | yes | A placeholder is not the work (R1). The card's ring and surface stay. |
| 9 | One name per job in the words: surface, tray, cut, block, plate (slot and cap in it), glass; a key is a block, a field is the cut | yes | 13 November: "no material recipe repeats another under a new name". Token names stay. Whether a key keeps its darker lower edge (`--key-lift`) is the one second cue left. |

**Tiles whose structure does not say Press** (greyscale, one face; 38 of 88), phase 2's list: icons, tooltip, hover
card, menu, breadcrumb, steps, header, app shell, tree, card, avatar, callout, accordion, scroll area, resizable,
details, timeline, log view, gauge, sparkline, range chart, breakdown, bar list, funnel, dot plot, spread, heatmap,
cohort grid, message, thinking, sources, plan, run card, code block, pad, curve editor, spring editor, price. The other
way round, raised where no hand presses: tag, the table's and list's statuses, the stat's figure, card statuses, the
context menu's statuses. Lightbox, media and carousel are content.

**STOP**: Nick answers the nine calls ("all yes" takes every recommendation) before the vocabulary goes into `taste/`
and phase 2 starts.

## Flat

### Phase 1. Materials, colour, voice and part kinds (drafted, waiting for Nick, 2026-11-18)

Nick: "maybe we should jump into the new flat." Press's lesson taken: build on what Flat already is (the pill, an outline
means off, ink means on, the grey bubble, no lines, the 0.28 bounce) and on Nick's direction of 16 November ("light,
easy to use, airy, flat - no complications, fun"), not strip it. Read-only on code but the canvas: nothing in
`src/components`, `src/worlds`, `tokens.css` or `taste/` changed. The calls are live on `#canvas` (`flat-calls.tsx`,
`flat-calls.css`): `Flat · the new Flat, all calls together` at x 0, y 15840, and `Flat call 1` to `9` three across
under it (x 0 to 3600, y 17840 to 21756), each today beside the proposal, light over dark, every proposal on call 1's
ground. The vocabulary goes into `taste/litt-principles.md` as a `taste:` commit only after Nick's answers (`evolve.md`).

Audit: main at `8862c94`, `#flat/components` light, dark and in greyscale (88 tiles), the player, About, and card,
button, table, stat and input, at 1440 by 1000. Score **4 / 10**, as on 16 November. What it shows:

- The ground is white (`--flat-canvas` in light) and a stage or tile is a hair off it (`--well`); the objects are
  grey. The direction is the other way round: grey ground, white and ink on it.
- `#flat/card`: a hairline ring and the float shadow on every card (`litt-raised` plus `shadow-float` under Flat), and
  X-crossed wireframes for covers. The invoice card is the same ring with no cover.
- Statuses are green, amber and red words in grey pills (table, card, list); the stat's deltas are green and red; the
  error field is a pink tint.
- The words are the studio's that every world shares (Halo site, Start a project, Deploys this week, Northwind site ·
  Framer). Variants' captions describe Press ("the cut: a floor a hair below the page, the control line", "carries the
  glow", "raised once by its cast").
- Player `bare`: a hairline box, the set as a list of names and lines, a text transport.

**Materials**, in the order they combine:

| Material | One line | Tokens today | Radius |
|---|---|---|---|
| Ground | The grey everything sits on. Nothing is drawn on it but objects and words. | `--canvas` (call 1: `--flat-surface-3` light, `--flat-surface-2` dark) | none |
| Paper | A white rounded square on the ground (black in dark): a card, a panel, a table, a field. No edge, nothing cast. | `--surface-1`, `--block`, `--cut` (call 1 maps them to white, or `--flat-canvas` in dark) | `--radius-surface` |
| Pill | What a hand presses or types into: a button, a field, a segment, a tag, the switch. | `--block`, `--cut`, `--radius-control` | `--radius-control` (28) |
| Circle | A key with one symbol, a checkbox, a radio, a knob, an avatar, a status's mark (call 6). | `--radius-pill` | round |
| Bubble | What is chosen inside paper: a grey fill (the current segment, row, tab). On the ground, chosen is white. | `--surface-3` | the shape it sits in, less its inset |
| Ink | What is on, and the one primary action: black on light, white on dark. | `--fg`, `--accent` (the ink), `--canvas` on it | the shape it fills |
| Ink card | One per view: the ink as a rounded square holding one live thing, in one data hue (call 4). | the opposite theme's `--canvas` and `--fg`; `--data-blue` | `--radius-surface` |
| Outline | Only what is off: a switch, an unticked box, a step to come (kept, call 7). | `--line-control` at 1.5px | the control's |
| Float | Only what floats over the page keeps a shadow: a menu, a dialog, a toast. | `--shadow-float`, `--shadow-modal` | `--radius-surface` |
| Lettering | Geist, three weights by role; one figure per object may stand above 18px (call 8). | `--font-sans`, `--weight*`, `--type-*` | none |

**Colour rule.**

| Colour | Means | Never |
|---|---|---|
| Grey | The ground; inside paper, what is chosen | An edge, a frame, a line between things |
| White and black | Paper and the ink: everything a hand uses, and words | — |
| The ink (`--accent`) | What is on, and the view's one primary action | A second fill per view (R6) |
| One data hue | The ink card's data, a chart's series in R7's order, one hue per object | Chrome, a button, a status word |
| Success, warning, danger | A status, on its circle only (call 6); danger's words on a destructive action | A whole word in colour, a tinted field |
| A plate's own colours | A cover is content | — |

**Voice.** Flat's audience is "sites, portfolios and reading"; for "light, airy, fun", the person who keeps a small
site and a letter, and the people who read it (call 9). Nouns: site, post, issue, letter, reader, subscriber, series,
picture, draft, week. Demo strings: `Spring series · twelve pictures from the coast`, `Issue 14 goes out Friday at
9:00`, `1,204 readers this week`, `4 min read`, `Subscribe` / `Read the letter`. Plain and friendly, sentence case, a
unit on every number, status in words. Spelling waits on Open 4.

**`data-part` kinds**, after the materials: `ground`, `paper`, `pill`, `circle`, `bubble`, `ink`, `ink-card`,
`outline`, `float`, `mark` (a tick, a status's circle), `figure`, `lettering`.

**Token gaps** (each a question, through Propagate): the ground needs a name of its own (`--ground`) once picked, since
it re-maps the canvas; in light it is `--flat-surface-3`, close to litt.design's own grey, and whether a step
between surface-2 and -3 is wanted is Nick's eye. In dark the ground `--flat-surface-2` and black paper `--flat-canvas`
stand only 1.1:1 apart (light's white on grey is 1.18:1): the words carry them, as Flat's grey field does today. A
figure size above 18px (call 8, R8, Open 1). The status circle needs no token (8px, `--radius-pill`).

**Calls for Nick** (live on `#canvas`, today beside the proposal):

| # | Call | Recommend | Why |
|---|---|---|---|
| 1 | The ground: grey ground with white and ink on it, against today's white ground with grey objects | grey ground (light surface-3 under white and ink; dark surface-2 under black and white) | 16 November: "bold, simple shapes on grey". The grey moves from the object to the ground; the bubble stays for chosen. |
| 2 | Paper has no edge: no hairline ring and no float shadow on a card or a panel | yes; only what floats keeps its shadow | Both references and Flat's rules: nothing outlined, nothing cast. On grey the fill is the edge. |
| 3 | Covers: a real picture (the gallery's plates), not an X-crossed wireframe | yes | A placeholder is not the work (R1); Flat is for sites and portfolios. |
| 4 | The black card with one vivid colour enters Flat as the ink card, one per view (a stat, a live run, a timer), its colour the first data hue on its data | yes | The second reference, kept to R6 and R7: one hue per object, no shadow (the references' shadows were rejected on 16 November). In dark it is white, as the ink is. |
| 5 | Flat keeps the ink as its accent (plan 012's violet shown as the alternative) | keep the ink | Colour now lives in data and the ink card; no hue plan 012 found is clear of Blue 4, danger and the data hues but the violet, and the primary as black on white is the reference. |
| 6 | A status is its word in the ink after a small circle in the status colour; the pill stays | yes | A circle is one of Flat's shapes, and colour sits where it says something; the word still says it (R5). |
| 7 | Off keeps its outline (the reference's filled half shown as the alternative) | keep the outline | 6 November: "Feels so easy on the eye!". It also keeps the 3:1 edge on the grey ground. |
| 8 | Fun at rest is a figure that stands up: one figure per object above 18px (40px shown); fun in motion stays the 0.28 bounce on arrival | yes; the size is Nick's | Both references: the one figure is several times its label. No token above 18px today. |
| 9 | Voice: a site and its readers (post, issue, reader, series), not the studio's client work every world shares | yes | Flat is for sites, portfolios and reading, and light and airy wants plain friendly words. |

**Tiles whose structure does not say Flat** (greyscale, one face; 35 of 88), phase 2's list: kbd (key caps), pad,
spring editor, curve editor, time scrubber, rule builder, inspector and tune (hairline panels), hover card, menu,
context menu (white panels with a ring on white), header and action bar (wireframe covers), app shell, card, product
card and cart (ring and shadow, wireframes), resizable and scroll area (hairline frames), states, details, message and
composer (ringed panels), log view and code block (boxed), timeline and steps (rails, lines between things), chart,
legend, range chart, dot plot, spread, heatmap and cohort grid (gridlines; ink marks on grey would say Flat), gauge.
Media, carousel and lightbox are content.

**STOP**: Nick answers the nine calls on the canvas ("all yes" takes every recommendation) before the vocabulary goes
into `taste/` and phase 2 starts.

Nick, 2026-11-18: "all yes". The vocabulary is in `taste/` (v1.17).

### Phase 2a. The system-wide calls in shipping Flat (done, 2026-11-18)

- [x] Call 1: `--flat-ground` and `--flat-paper` (light, dark, auto-dark); under Flat the canvas and the well are the
      ground, surface-1 is paper, and a block, a cut and a slot are paper on the ground and the grey bubble inside
      `.litt-raised`, `.litt-glass` or `.litt-paper`. Flat's data hues a step deeper in light (`--flat-data-*`) so every
      pair in `check.mjs` passes on the grey. A stage or a tile is the ground, so it no longer shows as a box.
- [x] Call 2: `.litt-raised`'s ring is `--raised-line`, transparent under Flat; cards, details and lists drop the float
      shadow. Menus, popovers, dialogs, toasts and the select's list keep theirs.
- [x] Call 3: the card page's demos and tile under Flat use the gallery's plates.
- [x] Calls 5 and 7 hold as they were. Call 6: a status tag is its word in the ink after an 8px circle. Call 8:
      `--type-figure-size`, 40px under Flat, on the stat's figure.
- [x] Press, Device, Plain, Rack and Heat compared page by page against `446faa7`, light and dark: identical but the
      version stamps of items whose shared files changed and animations caught at different frames.

Left for 2b: the ink card (call 4) and the 35 tiles whose structure does not say Flat. Left for 3: Flat's voice in
the demos (call 9), the shared captions and ledes that still describe Flat's old grey (the tag's lede among them).

### Phase 2b. The ink card and the tiles that did not say Flat (done, 2026-11-18, waiting for Nick)

- [x] Call 4, the ink card: `Card tone="ink"`, which is `.litt-ink` (tokens.css, Flat's block of rules alone). Under Flat
      the card is the ink (`--flat-fg`) with the paper's color for its words (`--flat-paper`), Flat's disabled grey for
      its quiet words (7.1:1 on black, 5.5:1 on white) and the first data hue on its data, the line's dot included; no
      ring and no shadow. Outside Flat it is the world's own card, unchanged. Check 11 holds its pairs and its empty
      shadow; `test:wall` fails on a second ink card in a view. It shows on `#flat/card` (Variants, "The ink card, and
      no link", byWorld) and as Flat's stat tile on `#flat/components` (tileByWorld), both holding the readers stat at
      the figure size. No new token: the opposite theme's face is built from Flat's own greys.
- [x] Re-shot `#flat/components` in greyscale after 2a: 2a had already put rule builder, time scrubber, tune's and the
      inspector's panels, cart, resizable, details, composer, log view, code block and the charts on paper with no edge.
      Changed now, each Flat-only (`in-[[data-material=flat]]:` in the contract, so every other world is unchanged):
      kbd (a pill cap, white on the ground, the grey bubble in a tooltip or the command menu), pad, spring editor and
      curve editor (the well has no edge), inspector and tune (no lines between the groups), list cover (no hairlines:
      paper panels on a 4% ink wash, so header, action bar, list, scroll area and carousel covers are bold flat shapes),
      timeline (the result's word in the ink after a status circle), stat (the delta in the quiet ink after a status
      circle), tag (a status is its circle and its word with no pill: Nick, 2026-11-18, on the Hypher comparison, "I
      like the tags", amending call 6; a `taste:` commit). Gallery demos, Flat-only classes: context menu and states (rows on paper, no lines between them),
      message and app shell (no window outline), header (no frame edge, no lines between the work), scroll area (no
      cover hairline).
- [x] Press, Device, Plain, Rack and Heat compared page by page against `da7bd82`, light and dark, at deviceScaleFactor 1: a
      first pass (1/8 of the pages) and the final build's 1/12 identical but animations caught at different frames (the
      log view's stream); the rest of the compare was stopped, and CI's page checks cover the PR.
- Left, judged on the sheet and needing Nick's eye rather than a sweep: the timeline's rail (a line between steps, or
  the run's data?); the drawn covers are still drawings, since a real picture in `ProjectCover`/`Project` is a new prop
  (a contract change, a STOP); product card's matted pictures (content); hover card, menu and context menu's own
  menu keep their float shadow (Flat's Float); steps' segments are progress, not lines; the charts keep grey marks and
  the first data hue for a series, not the ink. Flat's voice (call 9) is still phase 3.

### Phase 3. Every Flat page in Flat's words (done, 2026-11-18, waiting for Nick)

Nick: "go". Device's phase 3, copied: each page keeps its component and contract props and gets Flat's own stage
through `byWorld` (and `tileByWorld` where the page has a `tile`), in call 9's voice: a small site (with no
name since 2026-11-18; see the note below), its posts and series of pictures, and the Friday letter and its readers. Plain and friendly, sentence
case, a unit on every number, status in words. Every other world draws the shared demo, unchanged, and Device's
entries stay as they were.

- [x] Flat's set first, lead stage and tile: button (Subscribe, Read the letter), switch (the letter's settings), media
      (pictures in a post), carousel (the spring series, a strip of posts), lightbox (the series on the site), card (posts
      with their pictures; the shared client words the 2a covers kept are gone), accordion (reader questions), avatar
      (readers who wrote back), header (the site under the glass bar, its pictures under it), tabs (the site's
      dashboard), popover (share a draft), toast (draft saved, post published, issue sent). Their Variants too: button's
      danger, loading and icons, switch's form, accent and disabled, carousel's strip, card's cover styles, accordion's
      settings, avatar's sizes and stack, header's phone and current page, tabs' view switch and keyboard, toast's
      action, burst and error.
- [x] Then every other page's lead stage (and tile), in four commits: inputs and actions; tools; layout, data and
      charts; the agent parts (Litt mends the series' picture links and gets issue 14 ready, not a studio's build).
      Variants whose words broke the voice joined where the page's lead did: input's inline form, tag's status and list
      of letters, stat's good and bad news.
- [x] The registry's `<stem>-demo` items, `docs/*.md`, `llms.txt`, `llms-full.txt`, `docs.json` and
      `registry.lock.json` are byte-identical to `d807d72` (a diff of the `gen-registry` and `gen-llms` output). A
      Flat demo keeps its own imports apart from the shared demo's (a second import line where it needs one).
- Left on purpose, as their words already speak Flat or there are none: icons, kbd (key names), segmented (a
  reader's theme switch), heatmap (page views a day, a site's own), and the shop (cart, option picker, price, product
  card, Shopify: prints from the site's pictures).
- Left: 144 Variants stages still in the shared studio's words (a scan for deploy, build, Framer, client, project and
  the studio's names; no lead stage is among them) (select, combobox, date picker, slider, table,
  chart, form's settings and sign-in, popover, command menu, dialog, message, plan, run list, sources, thinking, tool
  call and others), the next sweep if Nick wants them; a page's `TryIt` props and `study` objects, which take no
  per-world demo; the drawn covers of `ProjectCover` in list and action bar (a real picture there is a new prop, a
  contract change). No new noun was needed in `taste/`.
- Nick rejected the site's invented name on 2026-11-18. The demos now use no site name: they
  say "your site", or name the thing itself (Issue 14, the spring series, Open water), and example.com stands in
  where a URL or an address is truly needed. Everything else in them is unchanged, and the registry and agent docs
  stayed byte-identical.
- Spelling waits on Open 4: the demos follow the shared spelling (American: color, gray, grayscale, center in captions
  that describe the part) and avoid the words that differ where they could (harbour, ticked).

**STOP**: Nick looks at the before and after sheet of phase 3 before phase 4 starts.

**Open candidate: a fun icon set for Flat (trial, not decided).** Nick, 2026-11-18, with a reference of chunky outline
icons: "also maybe we could trial a fun icon set for flat sort of like this". On the canvas as `Flat icons · …`
(`gallery/src/canvas/flat-icons.tsx`): every one of `icons.tsx`'s 99 names, StatusIcon's five marks and ten fun ones
for Flat's voice (post, issue, reader, coffee, heart, ghost, paw, smiley…), drawn new on the same 16 grid as one 1.75
outline with round caps and joins and every corner rounded, beside today's set and in real Flat parts. If Nick takes
it, it becomes Flat's body of the same `Icon` names in phase 2 (R8's "one solid set" would then hold for every world but
Flat); until then nothing ships and every world keeps `icons.tsx`.

**Open comparison: Flat as Hypher (not decided).** Nick, 2026-11-18: "I like the design in https://www.hypher.app/
which world would it fit?" (the answer was Flat), then "put it on canvas, let 2b finish". On the canvas
(`gallery/src/canvas/flat-hypher.tsx`, `flat-hypher.css`), to the right of the calls (x 3840 to 7960, y 15840 to
18500): `Flat · today (after 2a)`, `Flat · the new Flat, all calls` and `Flat · as Hypher`, one screen in the
reader's voice (eyebrow, two-line headline, lede, Subscribe and Read the letter, the spring series with the gallery's
Open water plate, the week's readers, issue 14, the posts with statuses, a field row), light over dark each; then
`Flat · as Hypher, the differences`, each choice alone on the new Flat so Nick can take some and leave others:
A paper has an edge and a soft wide shadow (the ground nearly white, `--flat-well`; a hairline and two wide zero-offset
blurs), B controls are rounded rectangles (the 6px step of `SHAPES`, surfaces 10px) with the secondary outlined,
C a mono spaced eyebrow and a two-tone headline at the figure size in an editorial header, D the picture behind paper,
E a status is a dot and a word with no pill, F the dark panel stays dark in dark. Hypher is a direction, not a source:
none of its words, marks or pictures. A and B undo calls 1 and 2's "nothing outlined, nothing cast" and the pill, so
taking them is a `taste:` change through `evolve.md`. Nothing ships until Nick picks, and 2b goes on as planned.

Nick looked (2026-11-18): "ok you took it too literally, but I like the tags". Taken: **E**, a status is a dot and a
word with no pill (a change to call 6, which kept the pill), to build after 2b and through `evolve.md` since it amends
an approved call. Left: A, B, C, D and F; Flat stays as the nine calls have it. The lesson for the next reference: take
the feeling it gives, shown on Flat's own parts, not a list of its features side by side.

**Colourful means the data (2026-11-18).** Nick looked at the three directions on the canvas (A soft pastel surfaces,
B colour pops on objects, C playful; `flat-directions.tsx`) and said: "I meant the data visualization and just overall,
guages, heatmap, etc, should be colorful, my bad. and just the feel. I like this but I think it's not the right move".
So the surfaces stay as the calls have them (the grey ground, white paper with no edge, pills, the ink card, a status as
a dot and a word), and "colourful" means the data and the feel: gauge, heatmap, charts, sparkline, stat, meter and the
rest. The directions stay on the canvas as a record. The study is `gallery/src/canvas/flat-data.tsx` (right of the
directions, from x 8920): `Flat · data, today`, three candidate palettes (`flat-data-palettes.ts`: Candy, Spectrum,
Studio, each eight hues, a ramp and a diverging pair, light and dark, checked with the dataviz validator) on every live
data part, and `Flat · data in a screen`. Nothing ships until Nick picks; the pick becomes new `--flat-data-*` values
through `evolve.md`, and slots six to eight, a ramp the Heatmap and Cohort grid read, and a diverging pair are contract
changes.

### Flat's data in Candy (done, 2026-11-18, waiting for Nick)

Nick saw the study and the recommendation: "yes I love this all! open a pr! keep going!". Candy ships.

- [x] Step 1, `taste:` (v1.18): Flat's five `--flat-data-*` hues and `-text` tones are Candy's, light and dark. Candy's
      light blue sat 0.107 from Blue 4 (R6 asks 0.12), so it moved a little toward the sky, keeping its hue and chroma
      as near as passing allows (its mark and text tone in light; tokens.css has the values). The ink card's
      mark and dot take the other theme's step (`--flat-data-blue-ink`): 6.2:1 on black, 3.3:1 on white (was 2.9:1).
      R7, Flat's color rule, the journal, `material.md` and SKILL.md say so; `check.mjs` runs the new slots in every
      theme and Flat's ramp (each step further from the ground, steps two to four 3:1 on ground and paper).
- [x] Step 2, the contract, Flat only: slots six to eight (`sky`, `bubblegum`, `sun`) are hue names Breakdown, Chart
      (series and Meter), Legend, Heatmap, Cohort grid and Gauge accept; every other world aliases them to its teal,
      rose and amber. Under Flat a Breakdown shows eight before Other and `hues` hands out eight (lines six to eight
      dashed long, dash-dot-dot and short); elsewhere five, unchanged (`byWorld(useMaterial(), { press: 5, flat: 8 })`).
      `--flat-data-seq-1..4`, Candy's bubblegum ramp, read as `--data-seq-*` only under Flat: a Heatmap or Cohort grid
      with no `hue` walks it (elsewhere blue's and teal's mixes, as before), and `Gauge ramp` lets the lit ticks walk
      steps two to four by thirds of the arc (elsewhere it keeps the hue). The ramp is picked by `byWorld`, so a world's
      own install never names a token its CSS lacks. Flat's demos: the heatmap's lead and tile (reads by hour, a week,
      on the ramp), the gauge's lead and tile (`ramp`), the breakdown's second stage (ten places, eight before Other),
      and the cohort grid's lead (no hue, so the ramp).
- [x] Validator (dataviz, on the final tokens): light marks on the ground and on paper, dark on the ground and on paper,
      all eight in order: every check passes (worst adjacent CVD ΔE 9.7 protan light, 10.1 deutan dark; normal-vision
      floor 25.8 and 27.4). The first three pass all pairs; four do not (blue and grape 2.2 under deutan), so a
      scatter-style form keeps to three. Both ramps pass the ordinal checks (monotone, steps 0.06 apart, one hue).
- [x] `#device/heatmap`, `#press/gauge`, `#heat/breakdown` and `#rack/stat`, light, with Variants shut and open:
      pixel-equal to the build before down to the docs table, which now lists the new props and hue names.
- Left: the diverging pair (no part takes one yet); slots six to eight in Bar list, Sparkline, Funnel, Spread, Dot plot,
  Tag, Avatar and Timeline (their hue types still name five); the study files keep Candy's first blue and call today's
  hues muted, as a record.

## The order of work inside a world

The same five phases for every world. A phase is not started until the one before it is committed.

### Phase 1. Write the world's material vocabulary (taste, read-only on code)

- [ ] A **Materials** section for the world in `taste/litt-principles.md` (through `workflows/evolve.md`, a `taste:`
      commit shown to Nick first), after `DESIGN.md`'s Materials: the world's materials in the order they combine,
      each with the tokens that already draw it (no new value), its radius in the nesting, and its one line. Device:
      plate, well, key, cap and collar, LCD, bezel, lamp, lettering. Press: plate, raised block, cut-in field, glass.
      Flat: grey ground, pill, circle, rounded square, ink. Plain: the page, the rule, the link, the corner marks.
      Rack: panel, title bar, clip, value box, lane. Heat: slab, band, bracket, row, keycap.
- [ ] The world's **colour rule** in one table: what each colour means, and nothing else gets it. (Device: orange is a
      hand on it, today it is the CTA fill and Install; red is REC; the gauge's teal goes. Heat: amber is the row you
      are on. Rack: colour belongs to what the person makes.)
- [ ] The world's **voice**: ten nouns and five demo strings in its words (Device: take, slate, REC, `take_04`;
      Heat: race, lap, garage, standings; Rack: clip, track, scene, device, bars).
- [ ] A `data-part` kind list for the world, after `anatomy/parts.ts`, so a check can read which material a part is.

### Phase 2. Make every part use it (bodies and tokens)

- [ ] Shoot the world's gallery view (`#<world>/components`) light and dark, and the greyscale sheet of each tile.
      List every tile whose structure does not name the world. That list is this phase.
- [ ] In set order first, then the rest of the gallery: give each listed part a body in `src/worlds/<world>/` built
      only from phase 1's materials, marked with `data-part`. A part that only needs a token class stays in the
      contract. Changelog lines per world, `test:registry` per the repo rules.
- [ ] A check, `test:materials`, that reads every tile in a world's gallery view: each visible box carries a
      `data-part` of that world's kinds, and no fill uses a colour outside the world's colour rule. Its `--self-test`
      puts a Press plate in Device and fails if missed. `KNOWN` holds what is not fixed yet, and shrinks.

### Phase 3. One family of studies, and pages stripped to the name

- [ ] Per-world stages (Decision 4): each page's first stage in each world is a study in the world's words, a real
      product pattern from the world's audience. Device: an agent run, a deploy on the readout, a 2FA code on seven
      segments. Heat: a garage, a lap timer, a race menu. Rack: a clip launcher, a device chain. Shared stages stay as
      the fallback for a world without its own.
- [ ] The gallery view's first shelf is the world's own parts and its set, not Actions (Button, Kbd, Icons).
- [ ] The component page in a world: the name, its one stage, Replay where the stage moves, the source. Tier chips,
      "How it works", Copy prompt and Markdown leave the page and stay in `docs/<page>.md` and `llms.txt`. The lede goes
      under the stage at meta size, or goes.
- [ ] `test:study` and `test:worlds` follow the new page; `test:wall` still holds one accent fill per view.

### Phase 4. The world's player body (plan 018, phase 2, for this world)

- [ ] Draw `play-object/bodies/<world>.tsx` after 018's table, from phase 1's materials only. The screen holds the
      take alone: the rail inside the screen goes, as the components repo's screen holds only the study. The readout
      is the world's own (Device: an LCD under glass, chip, name, `05 / 12`).
- [ ] Add the world to `OBJECTS`; the greyscale sheet beside its siblings.
- [ ] Device only: plan 021 (sound) lands here, and Decision 6 is asked.

### Phase 5. Measure

- [ ] Re-shoot the world's three surfaces and put them beside the reference sheet. Score it out of 10 against the five
      traits under Why; under 8, name what is left and go back to the phase it belongs to.

**STOP** after each world: Nick sees the sheet before the next world starts.

## Per world: where it starts (audit of 2026-11-16, light, 1440 by 1000)

| World | Score | What to do first |
|---|---|---|
| Device | 5 | Materials are written (`--device-*`) but parts are black LCD fields without plate or well (`#device/components`, Inputs); lettering is mixed (PROJECT NAME, MAIL FROM beside Seats, Role, Client); Date picker and Colour picker are white page inputs; `#device/gauge` is teal on a black stage; component stages are black slabs while the player shows the same parts on the grey plate; orange fills the CTA. Player: screen is a hairline panel with a web rail, readout is text, not an LCD. |
| Press | 5 | Player is `bare`. Pages are the longest: `#press/slider` has four stages with chips and Preview/Code bars. Raised and cut-in read only faintly at 1440; scenarios are web-studio generic (Animation speed, Export 24 images). |
| Flat | 4 | "Grey is the object", yet the gallery ground is near white with grey tiles. `#flat/card` breaks "no outline and nothing cast": a hairline ring and a shadow on every card, and wireframe placeholders with X crosses for covers. Player `bare`. |
| Plain | 7 | Closest to one family. Breaks: `#plain/callout` boxes each note with green, amber and red icons; `#plain/table` boxes "Ready" and "Failed" in coloured outlines; "Expressive" chips on a still world; gallery tiles have no ground, so Icons floats. Player `bare`. |
| Rack | 3 | "Fun and colourful" shows only on `#rack/about` (the orange clips). Its set (pad, curve editor, inspector, time scrubber) is pale Press panels on grey, with web scenarios (Your voice, Hero exit on the Atelier Nord site); the time scrubber's log is red, green and amber text. Player `bare`. |
| Heat | 3 | In light it is cream parchment, not black slabs; only `#heat/about`'s Audio scene looks like the references. `#heat/menu` is "Northwind site · Framer"; `#heat/gauge` is teal; `#heat/stat` greens and reds. Five bodies only. Player `bare`. |

## Checks per phase

```
claude plugin validate .
node skills/litt-md/scripts/check.mjs
npm ci --prefix gallery && npm run verify --prefix gallery && npm run build --prefix gallery
for t in playground wall worlds study motion reflow text-zoom forced-colors focus gaps corners; do npm run test:$t --prefix gallery || break; done
npm run test:registry --prefix gallery   # phase 2 only
```

## STOP conditions

- Phase 1 of each world: Nick confirms the vocabulary before any code.
- A part cannot take the world's materials without a new token: name it; it goes through `evolve.md`.
- A body would need a prop, role or key the contract lacks: stop, it is a contract change.
- A world's score is under 8 after two rounds of phase 5: report with the sheet.
- Every world's end: Nick sees the sheet.

## Done when

- Each world scores 8 or more beside the reference sheet, by Nick's eye.
- `test:materials` passes for all six with an empty `KNOWN`.
- `OBJECTS` holds all six; no world draws `bare`.
- No two worlds share a first stage on any component page in their set.
