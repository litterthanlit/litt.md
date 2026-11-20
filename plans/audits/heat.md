# Heat, audited: where it is weak to use and where it fails to land

A sample of the audit plan 026 asks for, written for Nick on 2026-11-20 against `main` at `e21cf90`. Plan 026 counts what is built. This file reads what is there: one world, walked through as a visitor, with each weakness measured, ranked and given a test that says when it is fixed. If the shape works, the other five worlds get one each.

Nothing here is changed. Every fix below is a proposal, and three of them are Nick's calls (marked **Nick**).

## The feeling Heat is for

No file says what Heat should make a person feel, so nothing could be judged against it. A line to judge by, proposed for Nick:

> The minute before a race at night. Everything is black and still, and one amber thing is waiting for your hand.

It follows `litt-principles.md`: black slabs, cream words, amber on what you pick, things arriving from the side and gone at once. Each finding below says whether it costs ease of use, this feeling, or both.

## How it was read

- The built gallery (`npm run build --prefix gallery`), served locally and driven with Chromium.
- Twelve of Heat's pages: the player (`#heat`), `#heat/components`, `#heat/about`, and nine part pages (button, menu, slider, table, select, chart, pursuit-meter, tune-menu, lap-timer).
- Each at 1440 by 1000 and at 390 by 844 with touch, in dark and in light: 48 page states.
- Three tasks: step through the set with keys only on a desktop; open a part from Home on a phone and get to its page; find the install on a part's page on a phone.
- Measured in the page: every text pair's contrast, every control's size and name, the page's width and height, the tab order, and what the selector tells a screen reader.

Not read: the other eighty or so part pages, a real phone, a screen reader's speech, 200% text, reduced motion and forced colors (CI already runs the last three on every page).

## What already works

Keep these. They are the reason the weaknesses are worth fixing.

- **The three Heat-only parts are the world.** Pursuit meter, Tune menu and Lap timer carry stripes, brackets and dashes in their structure, and they name Heat with the color taken away.
- **It is as usable as the other worlds where it counts.** Across all 48 states: no control without a name, no sideways scroll at 390, no script errors, and every sampled text pair at 4.5 to 1 or better in both themes (the only pairs below it are disabled controls, which are exempt).
- **Keys work as the foot says.** The selector is one tab stop, Left and Right step and wrap, Home and End go to the ends, and it says "Pursuit meter, 1 of 12". The Tune menu answers the arrows on its own page. Play starts only when pressed and steps every 4s.
- **Touch targets hold.** Every 32px control read on the phone carries the 44px target.
- **It is fast.** A step's motion is over within 160ms.
- **The set speaks racing.** "Start race", "Tune car", "Event locked", a standings table with gaps and best laps.

## Findings, worst first

Severity: **High** costs the world its point or tells the visitor something false. **Medium** slows or confuses. **Low** is polish.

| # | Finding | Costs | Severity | Scope |
|---|---|---|---|---|
| 1 | The front door is a list of words | the feeling | High | Heat's Home |
| 2 | Heat's pages describe Press | trust | High | every world but Press |
| 3 | "Home" means two places and shows four times | ease | High | every world |
| 4 | Focus runs against the eye on the player | ease | Medium | Heat's body |
| 5 | Focus and selection are the same amber | ease | Medium | Heat's body |
| 6 | On Home the line outweighs the name | ease | Medium | every world |
| 7 | A take fills a tenth of its screen | the feeling | Medium | Heat's body |
| 8 | By day the pick is not amber | the feeling | Medium | **Nick** |
| 9 | A part's page is 15 screens on a phone with no way to jump | ease | Medium | every world |
| 10 | "Source" opens the part's page | ease | Medium | every world |
| 11 | Keycaps that are not keys | trust | Medium | Pursuit meter |
| 12 | The demos use the game's own place names | risk | Medium | **Nick** |
| 13 | The phone's strip shows 2 of 13 names with no edge | ease | Low | Heat's body |
| 14 | Nearly every word is 12 or 13px | ease | Low | **Nick** (R8) |

### 1. The front door is a list of words (High)

`#heat` opens on Home: twelve names with a line each, in 13 and 12px type, on a slab whose lower half is empty at 1440 by 1000. The only amber is the count and the Home cell. The pursuit meter, the best thing Heat has, is one step away and unseen. A first-time visitor meets a table of contents, not a night menu.

Home is also the one screen that is literally a menu, and it is the one screen not drawn as Heat's menu: no brackets on the row under the keys, no chevrons, no dashes.

- **Fix.** Let a body draw Home's list in its own grammar. In Heat: a column of rows, amber brackets on the row under the keys or the pointer, Up and Down to move, Enter to open, with the row's part live beside it. The contract still owns the list, its order and its keys.
- **Fixed when.** `test:playground` finds, on `#heat` at Home, a live part on the screen and exactly one row marked as current.

### 2. Heat's pages describe Press (High)

Each part has one lede, one "How it moves" and one anatomy for every world, and they were written for Press. On Heat they are false:

- Home, Menu: "A glass dropdown with one gliding highlight." Heat has no glass.
- Home, Slider: "A cap you hold, riding in a slot on a raised plate." Heat's slider is a row of dashes.
- `#heat/button`, How it moves: "A press sinks the block half a pixel and tightens its cast." Heat's press depth is 0 and nothing casts.
- `#heat/button`, Anatomy: the key reads "View work", studio copy, under a stage that reads "Start race".

This is the largest gap between what Heat is and what Heat says. It will be the same in Flat, Device, Rack and Plain.

- **Fix.** Give `meta` a per-world lede and motion line (as `byWorld` does for a stage), read by Home, the part's page and `docs/<page>.md`. Where a world has none, the shared line must be true of every body: say what the part does, not what it is made of.
- **Fixed when.** A check reads the visible words under `#<world>/*` and fails on another world's material words (in Heat: glass, cast, glow, raised, sinks, pill, cap, plate).

### 3. "Home" means two places and shows four times (High)

On the player, four things read "Home" at once: the top-left link, the readout, the selector's first cell and a keycap. The top-left one leaves the world for litt.design. The other three mean the player's index. Then the same index is also called "Index", twice: a button in the top row and the word beside the Home keycap.

A visitor who presses the top-left Home to get back to the list is thrown out of the world.

- **Fix.** One name per place. Inside the slab, call the list Index everywhere (readout, cell, button). Keep the keycap, since the key is really named Home. Name the way out for where it goes: Systems.
- **Fixed when.** `test:playground` finds one link named for the way out and no other control with that name on any player.

### 4. Focus runs against the eye on the player (Medium)

At 1440 wide, Tab goes along the top row (8 stops at y 24), drops to the selector at the foot (y 784), then Play, then jumps back up to the screen (y 122). The body puts the strip first in the DOM and last on screen (`order-3`). A sighted keyboard user watches focus leave the top, land at the bottom, then climb. On the phone the strip sits above the screen, so the two layouts also disagree.

- **Fix.** Draw the strip above the screen at every width, as the compact body does, so the order read and the order tabbed are one. The references put the hints at the foot, and they can stay there.
- **Fixed when.** `test:playground` checks that each tab stop on a player is at or below the one before it, or to its right.

### 5. Focus and selection are the same amber (Medium)

With focus on the selector, a 2px amber ring wraps all twelve names, and the chosen cell's amber brackets cut through it. At night the focus color and the pick color are the same hue, so the ring reads as a second selection around the whole set.

- **Fix.** Show focus on the chosen cell, where the eye already is: its brackets close into a full box. No ring round the strip.
- **Fixed when.** A screenshot of the chosen cell differs between focused and not, and no outline wider than the cell is drawn.

### 6. On Home the line outweighs the name (Medium)

Each row sets the name at 13px regular and the line under it at 12px semibold. The eye reads the descriptions and skips the names, which are the things to press. Rows also center on their height, so "Tune menu", whose line wraps, sits 8px above its neighbors (y 302 against 310).

- **Fix.** Name at the title weight, line at regular in the muted ink, rows aligned to their tops.
- **Fixed when.** By eye, plus a check that every name in a row of Home shares a top.

### 7. A take fills a tenth of its screen (Medium)

At 1440 by 1000 the screen is 1198 by 648 and the pursuit meter on it is 368 by 222: 10.5% of the area. The rest is black. In the references the panel is the screen. Here the frame, stripes and brackets are all on the slab's edge, and the thing they frame is small and far away.

- **Fix.** Let a body set a take's scale or the screen's height. In Heat, a shorter screen at desktop widths, or the take drawn at a larger size inside it.
- **Fixed when.** By eye against the references. A floor can be checked: the take covers at least a quarter of the screen.

### 8. By day the pick is not amber (Medium, Nick)

Heat's line is "black slabs, cream words, and amber on what you pick". In light the page is sepia paper and the pick is the ink, because amber words cannot reach 4.5 to 1 on that paper. That is correct (check 16: by day amber is a fill only, so the primary button keeps it), and it leaves the day player with no amber on it at all: the readout, the chosen cell and its brackets are all ink. The line itself is shown on the paper, describing a night that is not there.

- **Options.** Accept it and write a day line. Or try a brown-amber for words by day through `evolve.md` (the tokens are Nick's). Or draw the chosen cell's brackets in the amber fill by day: they are shapes, not words, so they need 3 to 1, not 4.5, if the amber reaches that on the paper.
- **Fixed when.** Nick picks. Check 5 and check 16 hold whatever is chosen.

### 9. A part's page is 15 screens on a phone with no way to jump (Medium)

At 390 wide, `#heat/slider` is 13,162px tall (15.6 screens), `#heat/table` 17,148 and `#heat/components` 36,166 (43 screens). On Slider, Install starts 3,000px down and Props runs for 6,100px. Nothing is sticky and there is no On this page list, which the About page does have.

- **Fix.** A jump row under the h1 (Variants, Install, Props, Keyboard), and Props closed by default on a phone.
- **Fixed when.** A check finds a link to Install in the first screen of every part's page at 390 wide.

### 10. "Source" opens the part's page (Medium)

In the player's top row, Source is a link to `#heat/table`. A visitor expects code. Details then offers "Open the Table page", the same place by a truer name.

- **Fix.** Name it Page, or drop it and let Details carry the link.
- **Fixed when.** No link named Source points inside the gallery.

### 11. Keycaps that are not keys (Medium)

Under the pursuit meter, two keycaps read "Cooldown" and "Raise heat" with a word beside each. They are the buttons' names set as keys. No key does either. The references pair a real key with a word, and Heat's own player does the same at its foot.

- **Fix.** Bind two real keys and show those, or drop the row.
- **Fixed when.** Every `Kbd` in a Heat part names a key that the part answers.

### 12. The demos use the game's own place names (Medium, Nick)

`proposals/heat.md` says Heat takes "the menus' grammar, not the game's brand". The demos now name the game's city, its list and its districts across eight pages (pursuit-meter, lap-timer, tabs, menu, select, stat, progress, toast), along with a real car maker's model. The pursuit meter's first stage ships in the registry as its demo, so the names leave the gallery. The Standings scene shows the other way: invented teams that still sound like racing.

- **Fix.** Invented names throughout, in the Standings scene's voice.
- **Fixed when.** Nick decides. A word list in the lint can hold it afterward.

### 13. The phone's strip shows 2 of 13 names with no edge (Low)

The selector on the phone is a sideways scroller 277px wide holding 1,016px. Nothing marks that it goes on, and the step keys are not drawn there. The chosen cell does scroll into view, and the readout's "08 / 12" helps.

- **Fix.** A cut edge on the side that has more.

### 14. Nearly every word is 12 or 13px (Low, Nick)

On `#heat/slider` at 390 wide: 538 runs of text at 13px, 174 at 12px, 8 at 14px and 1 at 18px. R8 caps type at 18px and sets weight by role, so this is the rule working. On a phone in Saira's wide letters, the 12px semibold lines are the hardest thing on the page to read. Noted for Nick, not proposed.

## What to do first

1. **Finding 2**, because it is false in five worlds and one change to `meta` fixes all of them.
2. **Finding 1**, because it is the first thing anyone sees of Heat.
3. **Finding 3**, because it throws people out of the world.

Findings 8 and 12 wait on Nick. The rest are an afternoon each.

## What this sample says about the audit

Nine of the fourteen findings are not Heat's. They belong to the contract, the part pages or the shared copy, and they will show up in every world. So the next step is not five more files like this one. It is one pass on the shared layer (findings 2, 3, 6, 9, 10), then a short file per world for what is its own.
