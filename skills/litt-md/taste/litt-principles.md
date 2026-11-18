# litt principles

What litt believes, in two layers: a short floor every world shares, and each world's own principles, written for the people that world is for. The ten rules (`taste/profile.md`) say what to check. This file says why, so that an agent given room inside a world uses it well.

Read it before you build or change a body, a world-only part or a study, and when a critique turns on a world.

> Draft, for Nick to confirm. Nick first asked for the principles of the components repo (`litterthanlit/components`, `DESIGN.md`) to be brought in, then said on 2026-11-15: "maybe we shouldnt fit all rules through components. each world should have its own, enhancing the experience and usability". So only what holds everywhere is shared. On 2026-11-16 Nick went through each world's lines, and the sections below carry Nick's words from that day. Press and Flat name a direction that is not built yet. A line marked *components* comes from that repo. Nothing here is a new value: values live only in `assets/tokens.css`.

## What every world shares

Seven principles. A world's own principles may go further than these, never against them.

**1. A world is one object.** Every part in a world is a part of one thing, built from its materials, and speaks in that world's words. An object makes polish legible: "a lit edge, a recess or a 2px base is either right or it isn't" (*components*). So a part is never a card that could sit in any world, and never a second frame inside the frame. R1.

**2. A hand always wins.** What a person is touching follows them exactly, can be caught mid-flight, and never waits on an animation. Anything a part does by itself lets go the moment a hand arrives, for good (*components*). R4.

**3. Restraint is subtraction.** Each color only ever means one thing, so it reads at once (R6, R7). Take out whatever repeats something the part already says: "Repeats are taken out, not restyled" (*components*).

**4. Say it once, in words.** A state is a word, never color, a dot or position alone (R5). A label says what happens: "Copy command", then "Copied".

**5. Accessibility is native.** "A hardware metaphor is no excuse for a div" (*components*). A part is the real role it looks like. One tab stop per composite. Focus follows the hand without a ring and comes back for the keyboard. A change of state is said once. Reduced motion lands everything at once (`system/foundations.md`, 7).

**6. The craft speaks for itself.** A part is something teams ship. The world is the polish, the product pattern is the subject (*components*). No debug overlays, no explanatory chrome, no label that points at what to admire.

**7. Easy, then felt.** A person should finish what they came for without thinking, and leave having felt something. Ease is never traded for feeling; once the task is easy, the world's own materials, color on its data and motion give the feeling. Each world's principles below say what it should make someone feel. R10.

## Each world's own

A world's principles say what it does for the person using it. Build a body to its own world's lines first, then check it against the floor above.

### Press, the instrument

For product UI, settings and dashboards. Nick, 2026-11-16: "I said it was overdesigned cause I liked the first press better. those outlines on the buttons dont look good."

- **Depth says what a thing does.** What you press is raised and catches the light; what you type into is cut in; what floats is glass. A person knows what a thing is for before touching it.
- **It feels physical.** Things have weight: a set settles from above and lands, and a pressed block sinks under the hand. Nothing flies across the screen.
- **The first Press is the measure.** The boards of 26 October 2026 ("Thats really strong! I love it!"). A raised thing says it is raised once, and a button has no outline around it.

### Flat, the page

For sites, portfolios and reading. Nick, 2026-11-16: "I want it light, easy to use, airy, flat - no complications, fun and I want motion that matches that." With two references, "no direct copy but in that direction" (`taste/inspirations.md`, Flat's references).

- **Light, airy and easy.** No complications: one clear thing at a time, room around it, nothing to work out.
- **Bold, simple shapes on grey.** Grey is the ground. What sits on it is a pill, a circle or a rounded square in the ink or in white, with no outline and nothing cast, and a small pop of color only where it says something.
- **Things come from where you touched them.** A set deals out of what opened it and gathers back; an overlay grows from its opener. A reader never loses where they were.
- **Fun, and it moves that way.** Motion is quick and playful, to match, and Flat bounces more than the other worlds do (Nick, 2026-11-16: "yes flat should be more bouncy I feel like"). It is Flat's own exception to R4's bounce cap, picked by eye on the canvas (Nick, 2026-11-16: "0.28 at 350ms, no bounce on small moves looks good"): where something arrives on the expressive spring it bounces 0.28, where every other world keeps 0.12. Small moves and exits never bounce. At rest the fun is a figure that stands up: one figure per object may be large (call 8).

#### Flat's materials

Written 2026-11-18 for plan 024, phase 1, from Nick's direction of 16 November and the two references (`taste/inspirations.md`), and confirmed the same day on the nine calls (Nick: "all yes"). Built on what Flat already is: the pill, an outline means off, ink means on, the grey bubble, no lines between things, the 0.28 bounce. Each material names the tokens that draw it; phase 2 brings the new ones through Propagate (`workflows/evolve.md`, 4).

They combine in one order: **ground, then paper, then part.** The ground is the grey everything sits on. Paper sits on the ground; pills, circles and words sit on the ground or on paper. What is chosen inside paper is a grey bubble; on the ground, chosen is white. Only what floats casts. Every part steps in from what holds it, and its corner is the outer radius less the inset (`system/foundations.md`, Concentric).

| Material | One line | Tokens | Radius |
|---|---|---|---|
| Ground | The grey everything sits on. Nothing is drawn on it but objects and words. | `--canvas` under Flat is `--flat-ground` (light: Flat's surface-3; dark: Flat's surface-2). A part shown on its own (`--well`) stands on the ground too. | None |
| Paper | A white rounded square on the ground (black in dark): a card, a panel, a table's sheet. No edge and nothing cast: on grey the fill is the edge (call 2). | `--surface-1` under Flat is `--flat-paper` (light: white; dark: Flat's canvas, the black); `.litt-raised` loses its ring under Flat. | `--radius-surface` (16) |
| Pill | What a hand presses or types into: a button, a field, a segment, a label tag, the switch (a status has no pill). White on the ground, so it reads as paper. | `--block`, `--cut` and `--slot` are paper under Flat; `--radius-control` | `--radius-control` (28) |
| Circle | A key with one symbol, a checkbox, a radio, a knob, an avatar, a status's mark (call 6). | `--radius-pill` | Round |
| Bubble | What is chosen inside paper: a grey fill (the current segment, row or tab). | `--surface-3` | The shape it sits in, less its inset |
| Ink | What is on, and the one primary action: black on light, white on dark. | `--fg`, `--accent` (the ink, call 5), `--accent-fg` on it | The shape it fills |
| Ink card | At most one per view: the ink as a rounded square holding one live thing (a stat, a live run, a timer), its one color the first data hue on its data only. No shadow; white in dark (call 4). | The opposite theme on the square (`data-theme` flipped), and `--data-blue` on its data | `--radius-surface` |
| Outline | Only what is off: a switch, an unticked box, a step to come. It also keeps the 3:1 edge on the grey ground (call 7). | `--line-control` at 1.5px | The control's |
| Float | Only what floats over the page keeps a shadow: a menu, a popover, a dialog, a toast. | `--shadow-float`, `--shadow-modal` | `--radius-surface` |
| Lettering | Geist, three weights by role. One figure per object may stand above 18px (call 8). | `--font-sans`, `--weight*`, `--type-*`; the figure `--type-figure-size` | None |

In dark the ground and black paper stand only 1.1:1 apart (light's white on grey, 1.18:1): the words and what is on the paper carry it, as Flat's grey field always has. A cover is a real picture, never an X-crossed wireframe (call 3): a placeholder is not the work (R1), and Flat is for sites and portfolios.

#### Flat's color

Two fills on a grey ground, and color only where it says something (R6, R7). Colourful in Flat means the data (Nick, 2026-11-18): the surfaces stay grey and white, and the data is bright Candy, every hue at the most chroma the screen holds.

| Color | Means | Never |
|---|---|---|
| Grey | The ground; inside paper, what is chosen | An edge, a frame, a line between things |
| White and black | Paper and the ink: everything a hand uses, and the words | — |
| The ink (`--accent`) | What is on, and the view's one primary action (call 5: Flat keeps the ink as its accent) | A second fill per view (R6) |
| The data hues, bright Candy | A chart's series in R7's order, one hue per series and never cycled (eight slots before Other: blue, tangerine, mint, grape, cherry, then sky, bubblegum and sun; a scatter-style form keeps to three); how much, on the sunset ramp (`--flat-data-seq-1` to `4`, v1.20: gold to plum in light, plum to gold in dark, its lightness one way; a heatmap, a cohort grid, a gauge's ticks walking every step); the ink card's data, in the first hue | Chrome, a button, a surface, a status word |
| Success, warning, danger | A status, on its small circle only, the word after it in the ink and no pill (call 6, amended 2026-11-18: "I like the tags"); danger's words on a destructive action | A whole word in color, a tinted field |
| A cover's own colors | A cover is content | — |

#### Flat's voice

Flat is for sites, portfolios and reading. Light and airy wants plain, friendly words: the person who keeps a small site and a newsletter, and the people who read it (call 9), not the studio's client work every world shares.

- **Nouns:** site, post, issue, letter, newsletter, reader, subscriber, series, picture, draft, week.
- **Demo strings:** `Spring series · twelve pictures from the coast`, `Issue 14 goes out Friday at 9:00`, `1,204 readers this week`, `4 min read`, `Subscribe` and `Read the letter`.
- **Plain and friendly.** Sentence case, a unit on every number, a status in words.
- **Spelling** waits on Open 4.

### Device, the machine

For agents, terminals and tools. Nick, 2026-11-16: "tactile, actual device feeling, apple product etc, my components repo is a perfect representative of how I want it to feel. yes we can have sound."

- **It feels like a device in the hand.** Tactile: a key travels, a dial clicks through its detents, glass sits behind a bezel. The components repo is the measure of the feel, and a well-made product the measure of the finish.
- **It uses an instrument's vocabulary.** Keys, wells, LCD glass, lamps, engraved capitals. The words arrive with behavior people already know, so the interface needs fewer explanations. "The vocabulary dresses the demo, not the component" (*components*).
- **Things are mechanisms.** A part switches where it stands, in steps, and never fades or travels. Where it stands in for a mechanism, model the mechanism: "a duration and a curve can't be interrupted gracefully, can't overshoot from a flick, and can't tie a click to the exact moment a detent passes" (*components*).
- **The machine shows its work.** Segments, meters and reels move only while the work does, so a glance says whether it is running.
- **Sound answers a key.** A click confirms a press faster than sight (*components*). Synthesized, and only in answer to a hand. It starts with sound on, and the viewer can mute it (Nick, 2026-11-16: "start with sound for device"), which replaces decision 8's silent start. A browser plays nothing before the first press, so it is quiet until then.

#### Device's materials

Written 2026-11-17 for plan 024, phase 1 (Nick: "all yes"), and its gaps filled in phase 2, after the components repo's `DESIGN.md` (Materials, Lights, Lettering) and `anatomy/parts.ts`. It names the tokens that draw each material; those phase 2 brought through Propagate (`workflows/evolve.md`, 4) are marked Phase 2.

They combine in one order: **plate, then well, then part** (*components*). The frame holds the body, which is the plate. Wells are pressed into a plate. Keys, LCDs and collars sit in wells; caps sit in collars. A lamp sits in a small recess beside its word. A screen sits behind a bezel. Lettering is printed on the plate or a key, never on glass: on glass, words are the LCD's ink. Every part steps in from what holds it, and its corner is the outer radius less the inset (`system/foundations.md`, Concentric; `test:corners`).

| Material | One line | Tokens today | Radius |
|---|---|---|---|
| Frame | The machined band that holds the object, a shade off the body and lit on its top edge. The object only. | `--object-radius`, `--object-cast`, `--highlight`; the recorder borrows `--surface-3` for the band. **Phase 2:** `--frame`, `--frame-edge`. | `--object-radius` |
| Plate | The body: aluminium, lit on its top edge, with fine grain. Every part starts here. | `--canvas` (the body), `--surface-1` to `--surface-3` (plates on it), `--plate-lift`, `--highlight`, `--grain` at `--object-grain`. **Phase 2:** a part's plate is `--plate-face` (the gradient), `--plate-edge` and its grain at `--plate-grain`. | The recorder's body: `--object-radius` less its 4px inset. A part's own plate: `--radius-surface`. |
| Well | Anything pressed into the plate: a shade darker, shaded inside, lit along its lower lip. A slot is a well with a lit fill. | `--tray`, `--tray-shade`; a slot `--slot`, `--slot-shade`, `--slot-fill`, `--slot-fill-shade`. | `--radius-control`, set 4px into a plate. |
| Key | A face on a 2px skirt. Pressed, it sinks the whole 2px and the skirt is gone. The primary key is the ink key, not the orange one. | `--block`, `--key-lift`, `--block-press`, `--block-hover`, `--press-depth`; the ink key from monochrome's mapping (`--fg` face, `--canvas` words). **Still flat:** the reference's gradient face is not taken. | `--radius-control`, less 2px when set 2px into a well. |
| Cap and collar | A round cap lit from above, seated in a collar, a round well; it sinks like a key. The dial is the one part in the body's opposite finish. | Cap `--cap`, `--cap-held`, `--cap-lift`, `--cap-press`, `--cap-grip`; collar `--tray`, `--tray-shade`; dial `--dial`, `--dial-ink`, `--dial-lift`, `--dial-press`, `--dial-recess`. | Round, by its size (`--radius-pill`). |
| LCD | Black glass with light figures in the mono, sat in a well. Its chip, white on the glass, says the state with a glyph before the word. | `--field`, `--field-ink`, `--field-ink-subtle`, `--field-line`, `--field-shade`, `--field-font`. **Phase 2:** `--lcd` (the sheen), `--lcd-edge`, `--lcd-dim`, the chip `--chip` and `--chip-ink`. | `--radius-control`, less 2px when set into a well. A chip: `--radius-control` less the glass's inset. |
| Bezel | Black, with a polished edge, round a screen, a row of LCD cells or a dot matrix set into the plate. Glass sits in it. | **Phase 2:** `--bezel`, `--bezel-edge`. | The recorder's screen: `--object-radius` less 16px. In a part: `--radius-surface`. |
| Lamp | A light in a small recess beside its word. It comes on at once and goes out at the exit speed. It never says a state alone. | Red `--signal`; orange `--accent`; lit without a signal `--field-ink` on glass and `--fg` on the body; a fault's words `--danger`. **Phase 2:** `--lamp-on`, `--lamp-off`, `--lamp-recess`, `--lamp-glow`. | Round (`--radius-pill`). |
| Lettering | Tracked capitals printed into the surface, with a 1px lip on the side away from the light. Set in capitals by CSS; the source and the accessible name keep sentence case. | `--engrave`, `--label-case`, `--label-tracking`, `.litt-legend`, in `--fg` (to read) and `--fg-muted`. **Phase 2:** `--legend-quiet`, the quiet legend. | None. |

The reference nests four radii in em of the plate (plate 1.25, well 1.05, key 0.7, chip 0.4). Nick took them for Device on 2026-11-17 ("all yes"), as R9's exception for parts: `--radius-plate`, `--radius-well`, `--radius-key` and `--radius-chip`, in em of the part that wears them, each one the radius outside it less its inset. Every other world nests on litt's scale.

Panels and overlays under Device are dark screens today (`.litt-raised`, `.litt-glass`), so a part shown alone stands on a black slab. In the reference a part starts from the plate, and glass is only the LCD and the screen. Phase 2 draws a part's stage as a plate.

#### Device's color

Monochrome, and four signals. "Colour is never decoration" (*components*): each signal means one thing, and nothing else gets it.

| Color | Means | Draws it today | Never |
|---|---|---|---|
| The body's greys and the ink | Everything else: the body, keys, lettering, the glass and its figures, a lamp lit with no signal, a chart. | The neutrals, `--fg`, `--field-ink` | — |
| Red | REC, the playhead, a light that fires, a fault (an agent's error, a wrong code). A fault's glyph is the stop's square, so it never reads as a run. | `--signal` (a lamp), `--danger` (a fault's words) | A key's fill, or a decoration. The one red key is a destructive dialog's confirm (R7). |
| Orange | A hand on it: a cap under a finger, an edited scene, a switch that is on (its lamp), an agent waiting for your OK. On the keyboard, the focus ring. | `--accent` (a lamp), `--focus` (the ring) | The call to action, Install, a key's fill, a link, any text. On the light body it is a light beside a word, never the word. |
| One blue, on the screen | Selection on glass: the highlight bar, a caret, the chosen row. | **Phase 2:** `--select`, its words `--select-ink`. | The body. A second blue. |
| Data hues | None under Device. A chart is the glass's ink at three levels (100, 55 and 30%), lit dots against unlit, and its words name each series. A value past its limit lights red, as a fault. | Device's chart body already steps the ink. | Teal, or any of the five hues. A sixth series folds into Other. |

Status follows the chip, not green and amber: Ready is an ink dot, Paused two bars, Stopped a square, Failed a red square, Waiting for you an orange dot, and the word always (R5). A project's own artwork behind glass (a cover) keeps its palette, clear of red, orange and blue (*components*).

#### Device's voice

A product pattern keeps its subject (a run, a deploy, a code) and speaks the recorder's words. "The vocabulary dresses the demo, not the component" (*components*).

- **Nouns:** take, tape, slate, REC, transport, scene, card, mix, detent, readout, channel.
- **Demo strings:** `Mix · take_04`, `take_04.wav · 48 kHz · 24 bit`, `00M 14S 06F`, `Card left · 3H 12M of 8H`, `Scene A (edited)`.
- **Plain and quiet.** "Write it the way you would say it to someone at the next desk" (*components*). Say it once: if the screen says it, the LCD does not.
- **Capitals belong to the hardware.** Lettering on the body and the LCD's chip are capitals by CSS; everything you read along stays in sentence case.
- **Units and real symbols.** A unit on every number, a true minus, a times sign, a middle dot: `−3.5 dB`, `282 × 332`, `48 kHz · 24 bit`. Clocks read minutes, seconds and frames at 25 fps.
- **Status in parentheses.** `Fix the build (Running)`, with its lamp.
- **British, with -ize, in Device's demos.** Colour, centre, dialled; synthesized (*components*). litt's own prose is Open 4.

### Plain, the document

For docs, forms, admin and internal tools: anything that should just work. Nick, 2026-11-16: "plain is my favorite one right now. I really like the way it is right now." Change nothing in Plain without asking.

- **No UI.** A control is its words. A link looks like a link. Nothing has to be learned.
- **Still.** Nothing moves, so a state changes the moment you ask.
- **The reader's own page.** The system's face and nothing to load, so it is theirs from the first paint.

### Rack, the module

A proposal (`proposals/rack.md`). For creative tools, editors and pro apps: screens full of values touched all day. Nick, 2026-11-16: "follows ableton, so I want it fun and colorful too but in it's own way".

- **After Live.** It follows Ableton Live: panels, clips, devices, values you set.
- **Every value in reach.** Dense panels of small values, each a box you can set, with its value in words.
- **Fun and colorful, in its own way.** The color belongs to what the person makes: a clip, a track, a switch that is on. One color means one thing everywhere it shows. It is Live's kind of fun, not Flat's.
- **On the beat.** A tool used all day answers on the frame: things cut in and stop at once, and nothing travels.

### Heat, the night menu

A proposal (`proposals/heat.md`). For games, sports, racing and live events. Nick, 2026-11-16: "just the UI should look like the need for speed references I went. it should be just as usable as any of the other worlds. just make sure it looks like the references."

- **It looks like the references.** The street-racing game's menus, faithfully: black slabs, cream words, amber on what you pick, corner brackets, striped bands. When a body and the references disagree, the references win.
- **It works like every other world.** Just as usable, for a pointer, a finger and keys alike. Heat is a look, not a different way to work: it never costs a control its target, its words or its clarity.
- **At speed.** Things arrive from the side one after another and are gone at once when you leave.

## Where a world is free, and what it keeps

One contract, a body per world (`proposals/worlds.md`, decisions 13 and 15). "A body may not change what the part is for, only what it is made of and how the hand works it."

| A body is free to choose | Every body keeps |
|---|---|
| Its structure: which elements it has (a skirt, a tray, an LCD well, a word or none) | What the part is for, its props and their defaults |
| Its material and depth | Its role, its name and its states: what a screen reader is told |
| How the hand works it: a slide, a flip, a detent, a travel | Its keys, one tab stop per composite, and where focus goes in and comes back to |
| Its motion language, inside the tiers and bounds (R4) | The value it sends in a form |
| Its vocabulary, in the body and the demo | States in words (R5), one accent fill per view (R6), color only for data (R7) |
| Its face and its own accent (decision 14) | Weight by role and nothing above 18px (R8); the space, radius and control scales (R9) |
| Abilities only it has, such as Device's sound | Nothing moves on its own; reduced motion and forced colors are designed |
| Parts only it has (`meta.worlds`), which cost the other worlds nothing | 44px targets on coarse pointers; reflow at 320px; text at 200% |

A world goes deep by adding leaves, never by splitting the trunk: a shared part is never made world-only to seem deeper. The test of a world-only part is that it would be wrong in the others.

**The test of a body.** Put the part in each world's frame and take away the color and the face (greyscale, one font). If the structure alone does not name the world, the body is not done.

## The bar

What a body meets before it ships, in any world. Each line names its check where there is one; the rest are judged by eye.

1. **Its world shows in greyscale.** The test above, against its siblings.
2. **It serves its world's people.** Read the world's own lines above and say which one the body carries. A body that only recolors Press carries none.
3. **Every state is designed and said.** Default, hover, pressed, focus, disabled, and empty, loading or error (R1), each readable with color and motion hidden (R5). `test:forced-colors`.
4. **It keeps the contract.** It takes the contract's resolved props and draws; it adds no prop, role or key of its own. `typecheck`, `test:a11y`, `test:focus`.
5. **It sizes to its container, never the viewport** (*components*). `test:reflow` at 320px, `test:text-zoom` at 200%.
6. **A hand wins.** A drag follows one to one, can be caught mid-settle and keeps its speed on release. Nothing loops by itself. `test:motion`.
7. **It draws without React** (*components*). Per-frame work writes a motion value, a CSS variable or an attribute; React hears about commits, not frames.
8. **It rounds its geometry** (*components*). Coordinates a server may render are rounded to two decimals, so the browser agrees when it hydrates in a Next.js host.
9. **It is exact.** Only tokens, no hex and no radius off the scale (`lint:litt`); corners concentric (`test:corners`); no dead space between rows (`test:gaps`); no two utilities fighting on one element (`lint:collisions`); one accent fill (`test:wall`).
10. **It is in its place.** The contract in `components/<part>.tsx`, each body in `components/bodies/<part>.<world>.tsx`, every prop documented with JSDoc in the contract, a changelog line for the item.

## Writing

Plain, precise and quiet, in every world. "Write it the way you would say it to someone at the next desk" (*components*).

- Sentence case everywhere. Capitals belong to hardware: lettering on a Device body is set in capitals by CSS, and the source and the accessible name keep sentence case.
- A label says what happens. A description is plain prose about what the part does and how.
- Numbers carry units and real symbols: a true minus, a times sign, a middle dot.
- Say a thing once.

## Open, for Nick

1. **Flat's bounce and size. Closed, 2026-11-18.** The bounce is answered (2026-11-16): the expressive spring at 0.28, the responsive at 0, in R4. The size is answered on Flat's call 8 ("all yes"): one figure per object may stand above 18px, at 40px as shown (`--type-figure-size`, Flat's block alone), R8's exception.
2. **Device's sound.** Answered: it starts on. Not built yet; litt has no sound engine.
3. **Running by itself.** In the components repo every study moves in its first four seconds, untouched. Here nothing moves on its own (R2, R4). May Device's studies and its object run by themselves, while the other worlds stay still? Until Nick says, none does.
4. **Spelling.** The components repo is British with -ize (colour, centre, synthesized). The skill writes color. Which is litt's?
5. **Values.** The components repo's curves and springs differ from litt's tiers, and one preset bounces past R4's bound. This file brings no values. A value Device should take comes in through Propagate (`workflows/evolve.md`, 4).
6. **Device's phase 1 (plan 024). Closed, 2026-11-17.** Nick: "all yes". The focus ring stays orange, as the keyboard's hand; a link under Device is the ink, underlined; Device's statuses are the chip's glyphs and words, not green and amber; charts are the ink's three levels; a part's stage is a plate, not a dark screen; Device's demos spell British with -ize; a switch that is on lights an orange lamp; and Device takes the reference's em radii (1.25, 1.05, 0.7, 0.4) as an exception to R9, as its object did, which phase 2 carries into R9, check 7 and `rules.ts` through evolve.
7. **Flat's phase 1 (plan 024). Closed, 2026-11-18.** Nick, on the nine calls live on the canvas: "all yes". A grey ground with white and the ink on it; paper has no edge, and only what floats keeps a shadow; covers are real pictures; the ink card enters Flat, at most one per view; the accent stays the ink; a status is its word in the ink after a small circle in the status color, in the pill (amended the same day, on the Hypher comparison, "I like the tags": a dot and the word, with no pill); off keeps its outline; one figure per object stands above 18px; and Flat speaks for a site and its readers.
