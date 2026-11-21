# Device, audited: where it is weak to use and where it fails to land

The second audit of the kind plan 026 asks for, after `heat.md`, written for Nick on 2026-11-20 against the branch of pull request 150 at `de2db3e` (`main` plus the fixes for Heat). Device is the world the repo treats as finished: plan 024 took it through all four phases, `test:materials` and `test:sound` guard it, and its `KNOWN` lists are empty. So this audit asks a narrower question than "is it built". It asks whether it is done for a visitor, or only complete.

Nothing was changed. Every fix below is a proposal, and three are Nick's calls (marked **Nick**).

## The feeling Device is for

`litt-principles.md` says what Device is ("tactile, actual device feeling, apple product etc") but not what a visitor should feel when they put it down. A line to judge by, proposed for Nick:

> A well-made machine on the desk. A key goes down, the dial clicks, and the glass tells you what it is doing.

It follows Device's own lines: it feels like a device in the hand, things are mechanisms, the machine shows its work, sound answers a key. Each finding below says whether it costs ease of use, this feeling, or trust.

## How it was read

- The built gallery, served at `localhost:4173`, driven with Chromium.
- Sixteen of Device's pages: the player (`#device`), `#device/components`, `#device/about`, `#device/sound`, the four Device-only parts (tape progress, seven-segment, agent indicator, copy button) and eight shared parts (button, slider, switch, menu, composer, gauge, chart, tool call).
- Each at 1440 by 1000 and at 390 by 844 with touch, in dark and in light: 64 page states, screenshotted and looked at.
- The player again at 1366 by 768, 1280 by 800, 1024 by 768 and 768 by 1024.
- Every one of the 92 part pages under `#device/` in light at 1440, read for its words and for what draws its lower stages.
- Three tasks: step through the set with keys only on a desktop; on a phone, open a part from Index and get to its page; on a phone, find Install on a part's page.
- Measured in the page: text contrast, control sizes and names, page width and height, the tab order, what the selector says, what a finger lands on (`elementFromPoint` at each control's centre, then real touch taps), how big a take is on the screen, and which keys start a sound (with `AudioContext` stubbed and its sources counted, as `test:sound` does).
- The Copy prompt on `#device/about`, read back from the clipboard.

Not read: any sound by ear (the stub counts sources, it does not hear them), a real phone, a screen reader's speech, the Variants of each page (the crawl read pages with Variants closed, as a visitor first meets them), and the other worlds except where a finding is shared. Axe, reduced motion, forced colors, reflow at 320px, 200% text, `test:materials` and `test:sound` all run in CI on every page, so they were not redone.

## What already works

Keep these. They are why the rest is worth fixing.

- **On a desktop in the dark, the recorder is the best object in the gallery.** A frame round an aluminium plate, the screen in a black bezel under glass, an LCD readout in a well with its chip (STOP, then PLAY with a red lamp) and `09 / 12`, and a light dial in a collar. No orange anywhere at rest; the only orange is the focus ring.
- **The four Device-only parts are the world.** Tape reels, seven-segment glass, the agent indicator's six mechanisms (digits, a tuner, meters, a dot matrix, step lights, reels). Each would be wrong in another world, which is the test of a world-only part.
- **The lead demos speak the recorder.** "Export take", "Add marker", "Monitor level 0 dB", "Card left 3H 12M of 8H at 48 kHz · 24 bit", "take_04.wav · 48 kHz · 24 bit · 00M 14S 06F", "Record a safety track at −12 dB". Plan 024's phase 3 landed.
- **Keys work on a desktop.** The selector is one tab stop named Components, says "Composer, 1 of 12", wraps through Index, and Home and End go to the ends. Play starts only when pressed, steps every 4s, and the chip says PLAY. M toggles the mute on the player.
- **Sound only answers a hand.** With the stub, a press on the recorder's keys and dial, on Button, Switch, Seven-segment's keys and Message's Copy and Retry each started sources. Nothing else in the probe did.
- **The basics hold.** Across 64 states: no named control missing a name, no sideways scroll at 390, no script errors, and every text pair below 4.5 to 1 was a disabled control or a color the parser misread.
- **Install is easy to find on a phone.** On `#device/slider` the jump row's Install sits at 184px and lands the Install heading at the top of the screen.

## Findings, worst first

Severity: **High** stops a task or tells the visitor something false. **Medium** slows, confuses or costs the world its feeling. **Low** is polish.

| # | Finding | Costs | Severity | Scope |
|---|---|---|---|---|
| 1 | On a phone, a tap lands on the wrong control | ease | High | every world |
| 2 | Device's About and Copy prompt contradict Device's rules | trust | High | Device |
| 3 | Device's part pages still describe Press | trust | High | every world but Press and Heat |
| 4 | Below the lead stage, the pages go back to black slabs and studio copy | the feeling | Medium | Device's pages |
| 5 | A take fills 3 to 22% of the screen | the feeling | Medium | Device's body |
| 6 | The dial does not say what it does, and on a laptop it is cut off | ease | Medium | Device's body |
| 7 | By day the screen is paper | the feeling | Medium | **Nick** |
| 8 | The Sound page is a tuning bench in the visitor's top row | ease, the feeling | Medium | **Nick** |
| 9 | Focus climbs back up the player, and Mute is the 26th stop | ease | Low | Device's body |
| 10 | Some of Device's keys do not click | the feeling | Low | **Nick** |

### 1. On a phone, a tap lands on the wrong control (High)

On a coarse pointer `.litt-target` grows an invisible `::before` to at least 44 by 44px. Its rule in `tokens.css` says to put it on a positioned control. Three class lists put it on controls that are not positioned: the top row's links (`LINK` in `world-site.tsx`), the player's Page link (`LINK` in `contract.tsx`) and Index's rows (`ROW` in `contract.tsx`). Their `::before` then sizes to the nearest positioned ancestor instead: 390 by 844px for each top-row link, 390 by 631px for each Index row. The last one in the page sits on top of all the others.

Measured at 390 by 844 with touch:

- On `#device`, a finger at the centre of 16 of the 18 controls on the first screen lands on something else. Home, Device, Components, About, Sound, Light, Index, Details, Play and Mute all land on Page. Every Index row lands on Command menu.
- Real taps: Play on `#device` opens `#device/about`. Tapping the Slider row opens Command menu, and Page then opens `#device/command-menu`. On `#device/slider`, Components and Device open `#device/sound`.
- On `#device/components`, all 17 links on the first screen (the top row and the thirteen group links) land on Sound.
- The same happens in other worlds: 13 of 15 controls on `#flat`, 8 of 23 on `#heat` (its own Index is fine, its top row is not), 3 of 17 on `#press/button`.

So the second task failed: on a phone you cannot open a part from Index, and you cannot use the top row on any page. CI runs its page checks with a fine pointer, so none of them could see it.

- **Fix.** Add `relative` to `LINK` in both files and to `ROW`. Then make the lint hold the rule from now on: a class list with `litt-target` must also carry `relative` or `absolute`, or the element must be one that `Button` draws.
- **Fixed when.** A check at 390 by 844 with touch finds, on every player and part page, that `elementFromPoint` at the centre of each visible control lands on that control.

### 2. Device's About and Copy prompt contradict Device's rules (High)

Device's foundations and its agent prompt (`look.ts`, the Device entry and the Device line of the prompt) were written before plan 024 and were not brought up to it. On `#device/about`:

- Color: "orange as its own accent, the hues retuned to the body. A project may ask for Blue 4, monochrome or pink." Device's color rule says orange is only a hand on it, never a key's fill or text, and Device has no data hues. Nothing can be asked for any more: there is no Customize.
- Shape: "As Press: 4px, 8px and the pill, concentric." Nick took the em radii for Device on 2026-11-17 (R9's exception, plate 1.25, well 1.05, key 0.7, chip 0.4).
- Color, again: "dark LCD screens for panels and overlays". Phase 2 made a part's stage a plate.

The Copy prompt, which is what an agent reads, says the same: "Set up the litt.md look 'Orange, device material, calm motion'" and "an aluminium body, keys that sink 2px, dark LCD screens for panels and overlays, orange as its own accent". An agent told that orange is the accent will fill the primary key orange, which is breach 1 of plan 024 and what `test:materials` fails on.

A Device-only page has the same fault: on `#device/agent-indicator`, Accessibility says "The record lamp is the accent". Breach 3 made REC red.

- **Fix.** Rewrite Device's foundations and its prompt line from Device's materials and color tables in `litt-principles.md`: monochrome, red for REC and a fault, orange only for a hand, one blue on the glass; the em radii; plate, well, part. Name the look for what it is, not for an accent it does not lead with. Fix the agent indicator's line.
- **Fixed when.** The check in finding 3 also reads `#device/about` and the prompt text, and fails on "orange as its own accent" and "As Press".

### 3. Device's part pages still describe Press (High)

This is Heat's finding 2, still open for Device. The mechanism exists (`ledeByWorld`, `movesByWorld`, `summaryByWorld`), but only Heat has its lines written, and `test:words` reads Heat alone.

- **Index:** 2 of 12 lines are false. Switch: "A block thrown along a tray, uncovering On or Off." Device's switch is a key in a well, and its word sits on an LCD beside it. Slider: "A cap you hold, riding in a slot on a raised plate." Device's slider has no plate ("The body is the aluminium, so there is no plate", `worlds/device/slider.tsx`).
- **Of the 12 part pages read**, 7 say something false of Device. Button's About: "Under Press, secondary is a block raised once by its cast". Button's Use when: "Make it primary, because the accent fill appears once per view"; under Device the primary is the ink key. Switch's About: "A raised block rides a sunken tray with On and Off set in its floor", and "accent fills it when on". Slider's How it moves: "sinking half a pixel as its cast tightens ... Pushed fast it leans"; Device's body ignores the lean. Menu: "A glass dropdown with one highlight that glides". Composer: "Send is the view's one accent fill". Gauge's usage passes `hue="teal"`. Agent indicator: see finding 2.
- **Across all 92 pages**, 23 About paragraphs carry a Press material word. Some go on to name Device's body too (card picker, pagination, tag). At least 11 describe only Press: button, switch, slider, kbd ("the smallest raised block ... in Geist"), select, combobox, menu, card, message, number field and checkbox. Five How it moves paragraphs open on Press's body and reach Device's only at the end (button, switch, slider, code input, slide to confirm).
- **Anatomy labels** name Press's parts under a Device body: "The tray", "The block", "The word" on Switch; "The plate" on Slider; "The block" on Button.

A visitor who reads one paragraph under Device's switch is told about a tray, a floor and a word uncovered, and sees a key, a well and an LCD.

- **Fix.** Write Device's `ledeByWorld`, `summaryByWorld` and `movesByWorld` for the set first, then for the pages above, in the recorder's nouns. Where a shared line has to stay, make it say what the part does, not what it is made of. Name the anatomy's parts from the body that is drawn.
- **Fixed when.** `test:words` reads Device too, with Device's own list of foreign words (at least: cast, raised, tray, thrown, floor, glides, leans, half a pixel, pill, Geist).

### 4. Below the lead stage, the pages go back to black slabs and studio copy (Medium)

Phase 2 made every component stage a plate, and `test:materials` holds it. It does not hold the stages that follow. On 13 of the 92 part pages, Anatomy, States and Replay are drawn on a black slab (the same dark panel on every one, in light and in dark), not on a plate. In light it is the first thing below the fold: a pale aluminium plate with a key on it, then a black box the width of the page.

On 3 of those 13 the slabs also bring back the shared demo the lead stage replaced: "View work" on Button, "Email me about new deploys" on Switch (with "Watch the block cross the tray and uncover the word in the floor" under it), and "Animation speed" on Slider. So `#device/slider` opens on "Monitor level, 0 dB, Quieter, Louder" and, one scroll later, says "Animation speed, 1.2x, Slower, Faster" three times.

This is breach 14 of plan 024, fixed for the lead and left everywhere else.

- **Fix.** Draw the Anatomy, States and Replay stages as the lead is drawn under Device (`data-part="plate"`, `--plate-face`), and give them the page's Device demo through `byWorld`.
- **Fixed when.** `test:materials` reads every stage on a `#device/*` page, not only the component stages, and its self-test puts a dark Anatomy stage back.

### 5. A take fills 3 to 22% of the screen (Medium)

At 1440 by 1000 the recorder's screen is 1104 by 648. Each take is drawn at its wall tile's size in the middle of it. Gauge is 200 by 101 (2.8% of the screen), Seven-segment 384 by 98 (5.3%), Agent indicator 630 by 60 (5.3%), Composer 672 by 200 (19%), Tape progress 448 by 354 (22%). The rest is grey glass.

The recorder is the most convincing object in the gallery, and the thing it shows is the smallest thing on it. The components repo's player fills its screen with the study. Heat had the same finding (its 7) and took a shorter screen.

- **Fix.** Let Device's body draw a take larger on its screen (a scale per take, or a stage size per part), or shorten the screen at desktop widths as Heat did, which also helps finding 6.
- **Fixed when.** `test:playground`'s floor for Device: every take covers at least a quarter of the screen, as Heat's covers at least 13%.

### 6. The dial does not say what it does, and on a laptop it is cut off (Medium)

The dial carries five controls. Four of them are glyphs 10 to 12px wide at 80% opacity: two triangles (Previous, Next), three short rules (Index) and a grid of four squares (Every component). None has a word, a legend on the plate or a `title`, so hovering tells you nothing. The Mute key beside it does have its word engraved under it. The grid of four does not read as "every component" to anyone who has not read the source.

The keyboard does not miss them (the four have `tabindex="-1"` by contract, and the selector, the top row and Components cover the same ground), so this is a pointer problem.

At 1366 by 768 and at 1280 by 800 the dial's bottom sits at 792px and the frame's at 824: Every component, the bottom of the dial, is below the fold, and the screen clips Index's own "Every component, 92 in 13 groups" link. The screen's height has a 30rem floor, so on a laptop the deck goes under the fold.

- **Fix.** Engrave the dial's legends on the plate round the collar, in capitals, as the recorder's other lettering is (MENU or INDEX above, the arrows at the sides, ALL below), and give each edge a `title`. Fit the deck into 768px: lower the screen's floor for Device, or let the deck sit beside the screen at that height.
- **Fixed when.** At 1366 by 768 the whole frame is in the first screen, and every control on the dial has a visible word on or beside it.

### 7. By day the screen is paper (Medium, Nick)

In light, the screen inside the black bezel is the page's light canvas, the same grey as the plate round it. The bezel frames paper. The LCD readout stays black, so the one thing that reads as glass by day is the readout, not the screen. In the dark the screen is a shade off the plate and reads as glass. Device's line is "glass sits behind a bezel". The bezel was Nick's call ("keep the bezel"), and the screen wears the world, which by day is light.

- **Options.** Accept it: by day the screen is a printed panel, and the bezel is its frame. Or keep the screen dark in both themes, as the LCD is, so the takes always sit on glass (the takes would then draw in the dark world inside a light body). Or tint the glass by day (a darker step and the sheen) so it reads as a surface behind glass, not a hole in the plate.
- **Fixed when.** Nick picks. The greyscale test of the body (`litt-principles.md`) should pass in light as well as dark.

### 8. The Sound page is a tuning bench in the visitor's top row (Medium, Nick)

Every Device page has Sound in its top row. `#device/sound` was built for Nick's ear (plan 021, phase 1): each voice with Pitch, Length and Level sliders and "Nothing here is saved: paste the lines below into Device's block in tokens.css", then the tokens. A visitor meets a sound engineer's bench.

It is also the only place a visitor is told that Device makes sound at all. The player says nothing: the first press of Play or the dial clicks, unannounced. The Mute key's speaker glyph shows sound on, and on a desktop "Mute" is engraved under it. On a phone the deck's Mute and Play are two round 44px keys that differ only in their glyph, with no word.

The Sound page's own About says "Mute in the top row, or M". On the player the mute is on the recorder's deck, not in the top row.

- **Options.** Keep the page as it is. Or keep a short Sound page for visitors (the four voices to press, one line on when Device sounds, the mute) and move the tuning behind a flag Nick uses. Or drop Sound from the top row and say it once on About, under Only here.
- **Fixed when.** Nick picks. Either way the page's words say where the mute is on the page you are on, and the phone's Mute key has its word.

### 9. Focus climbs back up the player, and Mute is the 26th stop (Low)

At 1440 wide, Tab goes along the top row (9 stops at 24px), drops to the tape (764px), then Play (866px), then climbs to the screen (96px) and its Index rows. That order is deliberate (the body puts "the tape and Play before the screen, so the keyboard meets the controls first"), and it is the components repo's order. Heat moved its strip above the screen for the same reason; Device's recorder cannot, since its controls belong under the glass.

What is not deliberate is Mute. It is last in the body's markup, after the screen, so on Index it is the 26th tab stop, behind all twelve rows and Every component. M works, but a keyboard visitor who does not know M meets the mute last.

- **Fix.** Move the Mute key in the markup to just after Play. The grid already places it.
- **Fixed when.** Mute is the next tab stop after Play on Index and on every take.

### 10. Some of Device's keys do not click (Low, Nick)

"Sound answers a key." With the stub, a press on Copy button's key, one of Device's own four parts and a key by name ("A key that copies a command"), starts no sound. Neither do the agent indicator's six keys, the composer's Send and Model, or the tool call's rows. On the next page, Button's Cancel clicks. Plan 021's phase 2 lists the bodies to wire (Button, Switch, Slider, Segmented, Checkbox, Code input, the recorder), and Copy button is not on it.

- **Options.** Wire Copy button's key (it is a key, and Device's own), and leave the rest silent. Or decide that only keys drawn as keys sound, and say so in `litt-principles.md`.
- **Fixed when.** Nick picks. `test:sound` then presses each Device-only part's keys and fails on silence where a voice is due.

## What to do first

1. **Finding 1**, because it breaks every world on every phone and the fix is one class in three places, plus a lint so it stays fixed.
2. **Finding 2**, because the Copy prompt teaches an agent the opposite of Device's color rule, and it is a few lines in `look.ts`.
3. **Finding 3**, by writing Device's lines for its set of twelve and turning `test:words` on for Device.

Findings 7, 8 and 10 wait on Nick. Findings 4, 5 and 6 are Device's body and pages, an afternoon each. Finding 9 is a line.

## What this says about Device

Device is complete where the repo looks: the lead stage of every page, the recorder on a desktop, and the checks that guard both. It is not done where a visitor goes next. On a phone the player cannot be used. One scroll below any lead stage, the black slabs and the studio copy come back. The words a visitor reads, and the prompt an agent reads, describe Press or an older Device. None of the ten needs new taste except 7, 8 and 10. They are the last mile of the same plan.
