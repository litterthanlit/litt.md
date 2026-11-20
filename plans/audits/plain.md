# Plain, audited: where it is weak to use and where it fails to land

The audit plan 026 asks for, done for Plain on 2026-11-20 against the branch of pull request 150 at `de2db3e` (`main` plus the fixes for Heat), in the shape of `heat.md`. It reads what is there: one world, walked through as a visitor, with each weakness measured, ranked and given a test that says when it is fixed.

**Nothing in Plain is to be built from this file without Nick's yes.** Nick's standing rule is "change nothing in Plain without asking" (`litt-principles.md`, Plain). This audit changed nothing. Every fix for something that is Plain's own (its body, its tokens, its words, its demos) is marked **Nick**. The fixes marked shared touch only the contract or the part pages and do not change how Plain looks, but they change Plain's pages too, so show Nick before they land.

## The feeling Plain is for

Plain has three lines of its own (No UI, Still, The reader's own page) and a tagline, "No UI. A page that works." No line says what a visitor should feel. One to judge by, proposed for Nick:

> A page a careful person wrote. You read it, you use it, and nothing on it asks to be looked at.

It follows Plain's lines: a control is its words, a link looks like a link, nothing moves, and the page is in the reader's own face. Each finding below says whether it costs ease of use, this feeling, or both.

## How it was read

- The built gallery as already served at `localhost:4173` (not rebuilt for this audit), driven with Chromium.
- Sixteen of Plain's pages: the player (`#plain`), `#plain/components`, `#plain/about`, the seven parts with a Plain body (button, checkbox, input, select, switch, segmented, tabs) and six without one (table, callout, slider, card, pagination, dialog).
- Each at 1440 by 1000 and at 390 by 844 with touch, in dark and in light: 64 page states. Then every take of the set at 1440 in both themes (24 more), the wall scrolled screen by screen in light (25 screens), and four players side by side in greyscale with one font (Plain, Press, Rack, Flat).
- Three tasks: step through the set with keys only on a desktop; on a phone open a part from Index and get to its page; on a phone find Install on a part's page.
- Measured in the page: text contrast, control sizes and names, page width and height, tab order, what the selector says, what a tap at a point actually hits, how much of the screen each take covers, motion tokens and running animations, the words on 22 part pages with Variants open, and which fonts load.

Not read: the other 72 or so part pages, Variants as screenshots (the words were read with Variants open, the screenshots were taken closed), the wall in dark below the first screen, a real phone, a screen reader's speech, and what CI already runs on every page (axe, reduced motion, forced colors, reflow at 320px, 200% text).

## What already works

Keep these. They are the reason the weaknesses are worth fixing.

- **Where Plain is its own, it is the best-kept world.** `#plain/about` is the clearest statement of any world: a request form with one line under each field, a help page with underlined blue links in running text, a records table whose statuses are words ("Paid", "Refunded"). The seven bodies (the field's one line, the select's chevron on a line, the tick in a square, the primary in four corner marks, tabs as words) read as Plain in greyscale.
- **The player names the world in greyscale.** Beside Press, Rack and Flat, Plain's is the only one that is a single line round a page with a row of words under it and the current word in corner marks.
- **Still is real.** On `#plain` every duration token computes to 0s, `--travel` to 0px and `--press-scale` to 1. A dialog opens at full opacity with no transform and zero running animations; a tab change starts none.
- **It is as usable as the other worlds where CI looks.** Across the 64 states: no control without a name, no sideways scroll at 390, no script errors. Every text pair below 4.5 to 1 belongs to a disabled control (checked one by one), which is exempt.
- **Keys work as the foot says.** The selector is one tab stop; Right steps and wraps from Dialog to Index; End and Home go to the ends; it says "Table, 6 of 12". Play starts only when pressed and steps every 4s (Forms to Input).
- **The strip takes its own taps.** Plain's body gives each word `relative` with its 44px target, so on a phone the strip works where the shared Index rows do not (finding 1).
- **Install is one tap away on a phone.** The jump row sits at y 144 on `#plain/select`, and a tap on Install brings its heading to the top.

## Findings, worst first

Severity: **High** costs the world its point or tells the visitor something false. **Medium** slows or confuses. **Low** is polish.

| # | Finding | Costs | Severity | Scope |
|---|---|---|---|---|
| 1 | On a phone, every Index row opens Dialog, and the top row's links open About | ease | High | shared: five worlds' Index, every world's top row |
| 2 | Plain's pages describe Press, and motion Plain does not have | trust | High | shared mechanism; Plain's lines are **Nick**'s |
| 3 | Half the set is Press's structure in Plain's tokens, and a visitor can tell | the feeling | High | **Nick** (Plain's wave 3) |
| 4 | Focus runs against the eye on the player | ease | Medium | **Nick** (Plain's body) |
| 5 | A take is a small thing in the middle of an empty page | the feeling | Medium | **Nick** (Plain's body) |
| 6 | A link or an action standing alone looks like a caption | ease | Medium | **Nick** |
| 7 | On the wall in light, a name floats between two objects | ease | Medium | **Nick** (Plain's tokens) |
| 8 | The demos speak for a studio, not for docs and admin | the feeling | Medium | **Nick** |
| 9 | The player's top row reads as one phrase | ease | Low | **Nick** (Plain's tokens) |
| 10 | The selector is named "Components" | ease | Low | shared: the contract |
| 11 | A web font loads on Plain's first screen | the feeling | Low | **Nick** (Plain's tokens) |

### 1. On a phone, every Index row opens Dialog, and the top row's links open About (High)

At 390 by 844 with touch, a tap on any row of Index (Forms, Select, Table, Pagination) opens Dialog, 12 of 12. On `#plain/select`, a tap on Components opens `#plain/about`. On the player at Index, a tap on Components, or on empty space beside the readout, also opens About, because there Page points to `#plain/about`.

The cause is `litt-target`. On a coarse pointer it draws a 44px `::before` with `position: absolute`, and `tokens.css` says the control must be positioned. These are not: the Index rows (`contract.tsx`, line 341), the player's top-row links (line 245) and the world's top row (`world-site.tsx`, line 34). So each `::before` fills the nearest positioned box: 390 by 844 for the top row, 390 by 671 for each Index row. The last one painted takes every tap. `elementFromPoint` at the centre of each visible Index row hits its own row 0 times out of 8 in Plain, Press, Flat, Device and Rack, and 12 of 12 in Heat, whose own Index is positioned. On a desktop every row and link takes its own click.

Task 2 fails on the first tap. A visitor who taps Forms sees Dialog and cannot tell why.

- **Fix.** Add `relative` to those three class lists. Plain's look does not change.
- **Fixed when.** A check at 390 with touch finds, on every world's player and one part page, that the centre of each `litt-target` control hits that control.

Screenshot: `phone.tap-forms-opens-dialog.png` (the red ring is where Forms was tapped).

### 2. Plain's pages describe Press, and motion Plain does not have (High)

Each part has one lede, one "How it moves" and one anatomy for every world, written for Press. `meta` can now carry per-world lines (`ledeByWorld`, `movesByWorld`, `summaryByWorld`), but only Heat's are written. On Plain, where nothing moves, they are false:

- Index, 3 of 12 lines: Checkbox and radio, "filled with ink when on" (Plain's box holds a tick and is never filled); Tabs, "Views that slide into place"; Dialog, "The view's one expressive moment".
- `#plain/button`: "A press sinks the block half a pixel and tightens its cast." Plain has no block, no cast and a press depth of 0. Its Anatomy points "1 The block" and "2 The row" at a word with nothing round it.
- `#plain/dialog`: "The panel fades in, rises by the travel token's distance and settles". It appears at once.
- `#plain/input`: "A roomy, slightly rounded field cut a hair into the page". Plain's field is square and one line under the words.
- `#plain/select`: "the list is a tray of slats in glass … with one gliding highlight".
- Button, Switch, Pagination and Dialog explain each world ("In Press …, In Flat …, In Device …") and leave Plain out.
- Every part page has "How it moves" and a Replay, on a world that moves nothing.

Of the 22 part pages read with Variants open, 18 carry at least one sentence like these. It is Heat's finding 2, now fixed for Heat alone.

- **Fix.** Write `ledeByWorld.plain`, `movesByWorld.plain` and `summaryByWorld.plain` for the set first, then the rest (**Nick**: these are Plain's words). For "How it moves" on Plain one line can be true for every part: "Nothing moves: it changes the moment you ask." Hide Replay where the world is still.
- **Fixed when.** `test:words` reads every page under `#plain/*` and fails on Press's material and motion words (glass, cast, raised, sinks, cap, plate, tray, glides, slides, fades, rises, settles, expressive).

### 3. Half the set is Press's structure in Plain's tokens, and a visitor can tell (High, Nick)

`proposals/plain.md` already names this as open ("What is not right yet", wave 3). This adds what a visitor sees.

Of the twelve in the set, five have a Plain body (input, select, checkbox, button, tabs) and Dialog has Plain's overlay classes. Table and Pagination draw Press's body (`data-body="press"`), although Rack and Heat have bodies of their own for both. Form, Details, Callout and Breadcrumb are Press's structure with Plain's tokens.

The seams, in the set:

- `#plain/table`: Ready and Failed in green and red outlined boxes, and a box round the header row. `#plain/about`'s Records scene, the same pattern, has statuses in words and two weights of line.
- Details, in dark: a grey panel a step off the page, holding a green Ready box and a blue avatar. In light the same panel has no fill. "No fills, no frames" holds by day and fails by night.

On `#plain/components`, of 88 tiles: 13 show a grey panel, about 15 that are not charts show a status hue in text or an outline (Table, Details, Card, Context menu, List and cards, Avatar, Timeline …), Card and List and cards use X-crossed wireframe covers, and the slider sits in a box with a filled bar and a cap. Next to the quiet tiles above them, they read as a second world.

- **Fix.** Wave 3, in the set's order: Table, Details and Pagination first, as `proposals/plain.md` plans (a table is lines and a caption, as Records). Status in words, as Records does. A body for Slider and Card next.
- **Fixed when.** The quiet rule the proposal asks for: a check that fails on a fill, a status hue or a second frame inside a part under `#plain/*`, with what is left in its `KNOWN` list.

Screenshots: `take.dark.07.png` (Details) and `take.light.06.png` (Table).

### 4. Focus runs against the eye on the player (Medium, Nick)

At 1440 wide, Tab goes along the top row (8 stops at y 24), drops to the selector at the foot (y 766), then Play, then climbs to the screen (y 105). Plain's body puts the controls first in the DOM and draws them last (`order-3`), on purpose, as its header comment says. On the phone the strip is above the screen, so the two layouts disagree. It is Heat's finding 4, fixed for Heat alone.

The focus ring also wraps the twelve takes and not Index, although Index is the selector's first step.

- **Fix.** Draw the strip above the screen at every width, as Plain's compact layout already does, and let the ring take in Index.
- **Fixed when.** `test:playground` checks on every world's player that each tab stop is at or below the one before it, or to its right.

### 5. A take is a small thing in the middle of an empty page (Medium, Nick)

Index is set like a document: its title and rows start at the top left, 40px in. Every take is centred in the same 1214 by 648 box instead. The text and controls of a take cover a median 3.2% of the screen: Button 0.6%, Pagination 0.7%, Dialog 0.3% (one grey line, "Publish litt.design v3"). Only Table (45.5%) and Details (19.4%) fill much of it. The screen stops looking like a page and starts looking like a vitrine.

- **Fix.** Start each take where Index's text starts, top left, as a page would. Or a shorter screen at desktop widths.
- **Fixed when.** By eye. A check can hold the first part: each take's top-left is within 8px of Index's.

### 6. A link or an action standing alone looks like a caption (Medium, Nick)

On `#plain/about`, the link "Open the document" and the caption "To the email above." are the same grey at the same size and weight, and neither is underlined. Secondary and ghost buttons ("View work", "Cancel") are the same grey too. On a desktop the hand finds them by hover. On a phone there is no hover, so a quiet control has no cue at all: the Dialog take on the phone is a grey line in an empty screen.

This is a decision, not an accident: wave 1 says "a link that stands alone is its words", and Nick picked it. It sits against Plain's own line, "A link looks like a link. Nothing has to be learned."

- **Options.** Keep it. Or underline a standing link and keep actions quiet. Or underline both on coarse pointers only.
- **Fixed when.** Nick picks. If the rule changes, the No UI prototype's check (what a hand can use is underlined or in link blue, and nothing else is) can hold it.

### 7. On the wall in light, a name floats between two objects (Medium, Nick)

In light a Plain tile has no ground: its fill is the page's white exactly (Press's is one step off, Rack's and Heat's are visible). A tile is 428px tall, its name sits 384px down, and the next tile starts 16px below. With nothing to mark a tile's edge, a name sits about as close to the object below it as to its own: "Tooltip" is 117px above the hover card's demo and "Hover card" is 105px below it. In dark the tile is a step off the page and the problem is smaller.

- **Fix.** One 1px line between tiles, which is Plain's one material, or the name above its object as a heading.
- **Fixed when.** `test:wall` checks that each tile's name is nearer its own object than any other.

### 8. The demos speak for a studio, not for docs and admin (Medium, Nick)

Plain is for "docs, forms, admin and internal tools". Its part pages speak for a design studio: "Start a project / View work", "Remove the Framer badge", "Animation speed … on litt.design", "Publish litt.design v3", "Halden Gallery" with wireframe covers. Its About page already has Plain's voice: "Ask for help", "Create an API key", "Invoices, newest first", "Email me when someone replies to my request". Plan 024 decision 4 allows a stage per world; only Device's Gauge has one.

- **Fix.** `byWorld.plain` stages for the set, in About's voice.
- **Fixed when.** Nick reads the set. A word list in a check can hold it afterward.

### 9. The player's top row reads as one phrase (Low, Nick)

At the top right of the player, the theme key, Index and Details read "Light Index Details": Plain's controls have no side padding (0px, where Press has 14px and Flat and Heat 12px), so three controls sit a word-space apart. Page is spaced further off.

- **Fix.** Space the controls by the gutter, not by their padding, or set a thin rule between them.
- **Fixed when.** By eye at 1440 and 390.

### 10. The selector is named "Components" (Low)

The contract names the selector "Components" (`contract.tsx`, line 181). A screen reader hears "Components, slider, Index, 12 in the set", a few stops after a link also named Components that goes somewhere else.

- **Fix.** Name it for what it is: "The set in Plain".
- **Fixed when.** No two controls on a player share a name.

### 11. A web font loads on Plain's first screen (Low, Nick)

"The system's face and nothing to load." `#plain` loads Geist Mono for the count "00 / 12", because Plain does not restate `--font-mono`. The gallery also requests a Google Fonts stylesheet for four families on every page, which a host app would not.

- **Fix.** Restate `--font-mono` in Plain's block as the system's monospace (a token, so through `evolve.md`).
- **Fixed when.** Loading `#plain` requests no font file.

## What to do first

1. **Finding 1**, because a phone visitor cannot open a part from Index in five worlds, and three missing words fix it. Shared, no change to Plain's look.
2. **Finding 2**, because it is false on 18 of 22 pages and the place for Plain's lines already exists. The lines are Nick's.
3. **Finding 3**, Table, Details and Pagination, because they are in the set and contradict Plain's own About page. Nick's.

Findings 4 to 11 are an afternoon each, and all but 10 wait on Nick.
