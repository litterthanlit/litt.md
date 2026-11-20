# Flat, audited: where it is weak to use and where it fails to land

The audit plan 026 asks for, done for Flat the way `plans/audits/heat.md` did it for Heat, written for Nick on 2026-11-20 against the build served that day. It reads what is there: one world, walked through as a visitor, with each weakness measured, ranked and given a test that says when it is fixed.

Nothing was changed. Every fix below is a proposal, and two are Nick's calls (marked **Nick**).

## The feeling Flat is for

`litt-principles.md` gives Flat its words ("light, easy to use, airy, flat, no complications, fun"), but no line to judge a screen by. One, proposed for Nick:

> A clean grey table on a bright morning. Nothing in the way, and whatever you touch springs up to meet you.

It follows Flat's lines: grey ground, white paper and the ink, no edge and nothing cast, color only on data, things coming from where you touched them, and Flat's 0.28 bounce. Each finding below says whether it costs ease of use, this feeling, or both.

## How it was read

- The built gallery as served at `localhost:4173`, driven with Chromium.
- Sixteen of Flat's pages: the player (`#flat`), `#flat/components`, `#flat/about`, the six Flat-only parts (poll, streak, kudos, reaction-bar, reading-progress, goal-ring) and seven shared ones (button, card, gauge, progress, heatmap, toast, slider).
- Each at 1440 by 1000 and at 390 by 844 with touch, in dark and in light: 64 page states. Then every one of the twelve takes on the player at both sizes and both themes (48 more), and the gallery view and the player in greyscale with one font, beside Press's gallery view.
- Three tasks: step through the set with keys only on a desktop; on a phone, open a part from Index and get to its page; on a phone, find Install on a part's page.
- Measured in the page: every text pair's contrast, every control's size, name and 44px target, the page's width and height, the tab order, what the selector says, how much of the screen each take covers, how far the chosen pill overshoots, what a press does to a button, and which boxes draw an edge.
- One scan of the words a visitor can see (Variants open) on all 97 pages under `#flat`: the player, About, the gallery view and all 94 part pages.

Not read: the other 81 part pages by eye (only by the word scan), a real phone, a screen reader's speech, what each Variant does under a hand, the overlays a take opens, and axe, reduced motion, forced colors, reflow at 320px and 200% text, which CI already runs on every page.

## What already works

Keep these. They are the reason the weaknesses are worth fixing.

- **Flat names itself in greyscale.** With the color and the face taken away, the gallery view is still pills, circles, dots and white sheets on grey with no edges, and Press's beside it is boxes, hairlines and trays. The test of a body passes.
- **It bounces, and only where it should.** Stepping the selector, the white pill travels to the next name, overshoots by 3.9% of its travel and settles in about 490ms. Nothing moves on load. Play steps only when pressed (Progress to Poll after 4.3s).
- **It is as usable as the other worlds where it counts.** Across the 64 states: no control without a name, no sideways scroll at 390, no script errors, and every text pair below 4.5 to 1 is a disabled control or its label (Send issue 14, Reset to 18 px, the disabled slider's label), which is exempt. Every 32px control on the phone carries `litt-target` and its 44px box.
- **Keys work as the foot says.** The selector is one tab stop, says "Index, 12 in the set" and then "Poll, 2 of 12", steps and wraps.
- **The phone tasks are short.** A tap on an Index row puts the part on the screen with Page in the top row: two taps to a part's page. On that page, Install is in the jump row in the first screen.
- **The set speaks a site and its readers.** "Which series for Issue 15?", "Friday letter, 6 weeks", "1,204 readers get the letter", "Draft saved. Issue 14 goes out Friday at 9:00." Covers are real pictures.
- **Where the color rule is followed, it sings.** Progress, Streak, Kudos, Gauge and Heatmap walk the sunset ramp, gold to plum by day and plum to gold by night, and both read. The only ink fill on a take is its one primary action.

## Findings, worst first

Severity: **High** costs the world its point or tells the visitor something false. **Medium** slows or confuses. **Low** is polish.

| # | Finding | Costs | Severity | Scope |
|---|---|---|---|---|
| 1 | Flat's pages describe Press | trust | High | every world but Press |
| 2 | The front door is a page of words | the feeling | High | Flat's body |
| 3 | The Flat-only parts talk about the design, not the reader | ease, trust | Medium | Flat's six parts |
| 4 | "How far along" has two ramps, and a data hue fills buttons | the feeling | Medium | **Nick** |
| 5 | A take fills a twentieth of its screen | the feeling | Medium | Flat's body |
| 6 | Focus runs against the eye on the player | ease | Medium | Flat's body |
| 7 | The focus ring outlines twelve of thirteen places | ease, the feeling | Medium | Flat's body |
| 8 | The selector is named "Components" | ease | Medium | every world |
| 9 | Frames and hairlines Flat says it does not have | the feeling | Low | shared chrome, under Flat |
| 10 | Index's last link is 22px tall on a phone | ease | Low | every world |

### 1. Flat's pages describe Press (High)

Heat's finding 2 gave `meta` a per-world lede and motion line, but only Heat's are written, and `test:words` reads only Heat. On Flat the shared words are still Press's, and some are plainly false:

- Index and Details, Card: "A raised surface for one thing that links." Flat's paper has no edge and nothing cast (call 2).
- Index, Heatmap: "How much, in four steps of one hue." Flat's heatmap walks four hues, gold, tangerine, crimson and plum.
- `#flat/button`, How it moves: "A press sinks the block half a pixel and tightens its cast at once." Measured under a held mouse: `--press-depth` is 0px, the button does not move and it has no shadow.
- `#flat/button`, Anatomy, States and Replay: the key reads "View work", studio copy, under a stage that reads "Subscribe".
- `#flat/card`, Skip when: "Those are glass; a card never is." `#flat/menu`: "A glass dropdown." The gallery view names a tile "Glass header".

Of the 97 pages, 42 show at least one of glass, cast, raised, sinks, sunken, plate, stone, tray, bezel or glow, not counting a clause that says the thing is absent. The words sit in the stage captions and ledes (35 hits), Props (46), About (26), Accessibility (19), Anatomy (18), How it moves (6). And 54 pages show studio, client, deploy or Framer, the shared studio's words that call 9 retired for Flat.

- **Fix.** Write Flat's `ledeByWorld` and `movesByWorld` for the twelve in the set first, then the rest, as Heat's were. Where a shared line stays, make it true of every body: say what the part does, not what it is made of.
- **Fixed when.** `test:words` reads every `#flat/*` page with Flat's own list (glass, cast, raised, sinks, plate, tray, bezel, glow) and its `KNOWN` for Flat shrinks to nothing.

### 2. The front door is a page of words (High)

`#flat` opens on Index: twelve names and twelve lines, all at 14px, black and mid grey on a white sheet. Measured on the screen: no colored text, no picture, no live part. The text ends 40px above the sheet's foot, so it is not empty, but it is a table of contents. Flat's lines ask for "fun" and "a figure that stands up". The poll, the streak and the kudos, the most fun things Flat has, are one step away and unseen. The only figure is the caption's "00", and it counts nothing.

Heat fixed its own version by drawing Index in Heat's grammar with the row's part live beside it. The contract already hands every body the cued part (`part`, `[data-play-live]`); Flat's body does not use it.

- **Fix.** In Flat's body, draw Index as Flat would: the names as pills on the grey ground (the selector already is), the row under the hand or the keys showing its part live on the sheet, at its real size, and the chosen pill travelling on the 0.28 spring as it does below. The lines can go to Details.
- **Fixed when.** `test:playground` finds, on `#flat` at Index, a live part on the screen and exactly one row marked as current.

### 3. The Flat-only parts talk about the design, not the reader (Medium)

The six parts that are Flat's own carry the words of the brief that built them:

- Index lines: "A reader poll whose Candy share bars spring open on Flat's bounce." "A publishing or reading cadence walking Flat's sunset heatwave." "Minimal cotton-candy reaction pills that pop on Flat's bounce." "A minimal chapter progress bar stepping through Flat's cotton-candy palette." Six of the twelve lines name a palette or a spring a visitor has never heard of. With finding 1's two false lines, 8 of 12 Index lines do not plainly say what the part does.
- Anatomy callouts: "The Candy dot", "The cotton-candy ring".
- Demo copy that explains itself: Streak ships "press the outlined pill to light it up" and "click again to undo" in the component (`components/streak.tsx`), so a host gets it too; Poll's stage says "click any pill to change your vote", read on a phone. Principle 6: no label that points at the craft. Principle 4: a state is a word, not "the outlined one".
- Voice that is the studio's, not a reader's: Reading progress's essay is "Field notes on motion" with chapters "Springs" and "Tactile feel"; Goal ring's title is "2026 Reading goal", out of sentence case. About's scene says "colour" while the demos write color (spelling waits on Open 4).

- **Fix.** Ledes that say what each part does for a reader ("A question for your readers, with everyone's share once they vote"). Drop the instruction lines: the outline already says off, and the status line can say "Not sent yet". Give Reading progress a post a site would publish, in sentence case.
- **Fixed when.** No visible word under `#flat/*` names a palette or a spring (Candy, cotton-candy, heatwave, bounce), and no shipped component's text says click, tap or press.

### 4. "How far along" has two ramps, and a data hue fills buttons (Medium, Nick)

Flat's color table says how far along is told on the sunset ramp (Flat heatwave, v1.21), and that a data hue is never on a button or any fill but Progress's. Progress, Streak, Kudos and Gauge keep to it. Three of the six Flat-only parts, added on 2026-11-19 for "that cotton candy vibe", do not:

- Reading progress lights its chapters sky, blue, violet, bubblegum, and Goal ring draws its arc as a sky to bubblegum gradient. So in one world, how far along is gold to plum on one part and blue to pink on the next.
- Reaction bar fills a reacted pill with its reaction's hue tint (bubblegum for the heart, sky for the sparkle). That is a data hue on a button, and the state is carried by the tint and the lost outline.

Principle 3 says each color only ever means one thing. Here blue means "your first series" in a poll and "a chapter read" in reading progress.

- **Options.** Move Reading progress and Goal ring onto the sunset ramp and Reaction bar to the white bubble with the hue on its glyph only. Or amend Flat's color rule through `evolve.md` to give cotton candy a meaning of its own. Nick's "cotton candy vibe. vivid." came the day before the parts and is quoted in v1.20 for the sunset ramp, so which way it was meant is Nick's call.
- **Fixed when.** Nick picks. Then one check holds it: under Flat, a progress-like fill reads only `--data-seq-*`, and no button's fill is a data hue.

### 5. A take fills a twentieth of its screen (Medium)

At 1440 by 1000 the screen is 1216 by 648. The box around what each take draws covers, from smallest: Toast 0.1% (its one button, Save draft), Kudos 1.8%, Gauge 2.3%, Reaction bar 3.1%, Goal ring 3.4%, Button 3.8%, Progress 5.4%, Reading progress 6.3%, Heatmap 6.5%, Streak 8.9%, Poll 11.5%, Card 11.9%. The median is 4.6%. On the phone the same takes cover 6 to 37%, so the phone is the better player.

Airy is Flat's word, but a 159 by 89 kudos in the middle of a white field reads as an empty sheet, not as a figure standing up. Heat's take now holds 13.8% of its screen, with a floor in `test:playground`.

- **Fix.** Let Flat's body size the screen to the take, or draw a take at a larger scale, so the figure (40px today) can stand up.
- **Fixed when.** By eye, plus a floor in `test:playground`: on `#flat` at 1440 by 1000, the median take covers at least an eighth of the screen.

### 6. Focus runs against the eye on the player (Medium)

At 1440 wide, Tab goes along the top row (8 stops at y 24), drops to the selector (y 806) and Play (y 800), then climbs to the screen (y 72) and Index's rows (y 240). Flat's body puts the pills before the screen in the DOM and under it on screen (`order-1`, `order-2`). On the phone the pills sit above the screen, so the two layouts also disagree. Heat had the same fault (Heat's finding 4) and fixed it in Heat's body only.

- **Fix.** Put the caption and pills above the screen at every width, as the compact body does, or the screen first in the DOM. The pills under the screen are the reference's shape, so this is a trade Nick may want to see.
- **Fixed when.** `test:playground` checks that each tab stop on a player is at or below the one before it, or to its right, in every world.

### 7. The focus ring outlines twelve of thirteen places (Medium)

With focus on the selector, a 2px ring in the ink draws a long pill round the twelve take names (x 183 to 1178). Index, which is the selector's first place and where it starts, sits outside the ring. In Flat an outline means off (call 7), so the ring reads as a frame round a group, not as "you are here", and the chosen pill inside it already says where you are.

- **Fix.** Show focus on the chosen pill only: its ring, at the pill's own radius, wherever the pill is, Index included. No ring round the row.
- **Fixed when.** A screenshot of the chosen pill differs between focused and not, and no outline wider than one pill is drawn on the selector.

### 8. The selector is named "Components" (Medium)

The player's selector carries `aria-label="Components"` (`contract.tsx`). The top row also has a link named Components, to `#flat/components`, which holds all 94. The selector holds Index and the twelve in the set. A screen reader hears "Components, slider, Poll, 2 of 12" and then meets a second Components that goes somewhere else.

- **Fix.** Name it for what it holds: "The set in Flat", as the Index list already is.
- **Fixed when.** No two controls on a player share a name, checked in `test:playground` for every world.

### 9. Frames and hairlines Flat says it does not have (Low)

Flat's grey is never "an edge, a frame, a line between things", and paper has no edge. Two pieces of shared chrome still draw them under Flat:

- About's scenes (`world.tsx`) stand in a 1px `--line` outline on the ground's own grey. The same kind of live object is a borderless white sheet on the gallery view and the player, so the world shows one thing two ways.
- Every part's page divides About, Install and the rest with hairlines, and lists Use when, Skip when and Props rows between them (`docs/sections.tsx`, `props-table.tsx`).

By day the line is a step off the ground and nearly invisible; by night it shows.

- **Fix.** Under Flat, draw a scene on the sheet the gallery view uses (`.flat-sheet`) and let space separate the docs, as Form already does under Flat (`in-[[data-material=flat]]:divide-y-0`).
- **Fixed when.** On `#flat/about` and any `#flat/<part>`, no box in `main` draws a border or outline at rest, outside a control that is off.

### 10. Index's last link is 22px tall on a phone (Low)

"Every component, 94 in 13 groups" is a 213 by 22 link with no `litt-target`, the only control on the phone player under 44px without one.

- **Fix.** Give it the `litt-target` class the top row uses.
- **Fixed when.** Every link and button on `#<world>` at 390 wide is 44px tall or carries the target.

## What to do first

1. **Finding 1**, because it is false on 42 pages of Flat, and Heat already built the mechanism and the check: Flat only needs its words written and its list added.
2. **Finding 2**, because it is the first thing anyone sees of Flat, and the contract already hands the body the part to show.
3. **Finding 3**, because it is cheap and it is in the six parts that make Flat Flat.

Finding 4 waits on Nick. Findings 6, 7 and 8 are an afternoon together, and 8 fixes every world at once.

## What this audit says about the others

Three of the ten findings (1, 8, 10) are shared, and 9 is shared chrome that only Flat's rules forbid. Two (2, 6) are faults Heat had and fixed in Heat's body alone, so the other worlds' bodies likely still have them: worth a check in each before their audits, or a rule in the contract so a body cannot get them wrong.
