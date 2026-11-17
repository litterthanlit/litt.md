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
