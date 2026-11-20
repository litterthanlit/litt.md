# Rack, audited: where it is weak to use and where it fails to land

The audit plan 026 asks for, done for Rack on 2026-11-20, against the build served locally from `main` at `de2db3e`. It reads one world as a visitor would, with each weakness measured, ranked and given a test that says when it is fixed. It follows `plans/audits/heat.md` in shape.

Nothing was changed. Every fix below is a proposal, and the calls that are Nick's are marked **Nick**.

## The feeling Rack is for

Nick's lines for Rack (`taste/litt-principles.md`) say what it is, not what it should make a person feel. A line to judge by, proposed for Nick:

> An hour into a session. Grey all round, your clips in their colors, and every value a box you can grab and set on the beat.

It follows the four lines: after Live, every value in reach, color that belongs to what you make, on the beat. Each finding below says whether it costs ease of use, this feeling, or both.

## How it was read

- The built gallery as served at `http://localhost:4173`, driven with Chromium. Not rebuilt.
- Fourteen of Rack's pages: the player (`#rack`), `#rack/components`, `#rack/about`, the three Rack-only parts (clip-launcher, device-rack, step-sequencer) and eight shared parts from the set (slider, curve-editor, pad, time-scrubber, inspector, number-field, segmented, switch).
- Each at 1440 by 1000 and at 390 by 844 with touch, in dark and in light: 56 page states, each screenshot looked at.
- The words of all 91 part pages under `#rack`, at 1440: the lead stage's text, and the About, How it moves and Anatomy sections.
- Three tasks: step through the set with keys only on a desktop; on a phone, open a part from Index and get to its page; on a phone, find Install on a part's page.
- Measured in the page: every text pair's contrast (colors converted through a canvas, so `oklch()` and `color()` read right), every control's size and the box of its `litt-target`, what a finger hits on a 20px grid of the first screen and with real touch taps, the tab order, what the selector says, the animations that run after each action, and every color that shows with what it stands for.

Not read: the other 77 part pages by eye (only their words), the Variants under each lead, a real phone, a screen reader's speech, and axe, reduced motion, forced colors, reflow at 320px and 200% text, which CI runs on every page.

## What already works

Keep these. They are the reason the weaknesses are worth fixing.

- **The three Rack-only parts are the world.** The clip launcher is a grid of slots under track headers with a Master column of scenes, the device rack is a row of dials in boxes with their values under them, the step sequencer is a grid of steps under numbered beats. Take the color away and each still says Live.
- **The set speaks the studio.** Eleven of the twelve lead stages in the set are in Rack's words: "Drums · Track gain" at −3.0 dB, "Auto Filter · Synth track" at 3.4 kHz · 45% res, "Ghost town · Arrangement" with cues at Bar 1 to Bar 25, Metronome click, Overdub MIDI, Export mix and Freeze track.
- **It is on the beat.** Every state change measured (a step on the player, a clip launched, a switch, a step toggled, Play on the sequencer) is a 100ms color change on the ease-out curve. The switch does not travel: its parts sit at the same x before and after. Nothing moves on load. Play waits for a press and steps every 4s.
- **Values are words with units.** 3.4 kHz, +6 dB, 124 BPM, 4 / 4 live, each in tabular mono at 12px semibold. Every text pair read is at 4.5 to 1 or better in both themes; the only pairs below it are disabled controls, which are exempt.
- **Day and night are one world.** By day the clips are pastel with dark marks, by night deep with bright marks, and what is on is the ink in both.
- **No control without a name, no sideways scroll at 390, no script errors** across the 56 states.
- **Install is one tap away on a phone.** The jump row's Install lands on the section (task 3 passes).

## Findings, worst first

Severity: **High** costs the world its point or tells the visitor something false. **Medium** slows or confuses. **Low** is polish.

| # | Finding | Costs | Severity | Scope |
|---|---|---|---|---|
| 1 | On a phone, taps land on the wrong control | ease | High | every world, and Rack's Play key |
| 2 | Rack's pages describe Press | trust | High | every world but Press |
| 3 | Inspector, in the set, is a toast tuner | the feeling | Medium | Rack's demo |
| 4 | Color is dealt out, not owned | the feeling | Medium | Rack's body and demos |
| 5 | The clip launcher and step sequencer are a tab stop per cell | ease | Medium | Rack's parts |
| 6 | Focus on the selector is nearly invisible | ease | Medium | Rack's body |
| 7 | Focus runs against the eye on the player | ease | Medium | Rack's body |
| 8 | Rack's own small controls lose the 44px target | ease | Medium | Rack's parts and body |
| 9 | The front door is a list of words | the feeling | Medium | Rack's body |
| 10 | What is on is ink, not color | the feeling | Medium | **Nick** |
| 11 | The selector is named Components | ease | Low | every world |
| 12 | On a phone the clip launcher cuts its clips' names | ease | Low | Clip launcher |
| 13 | The player's lane shows 10 of 13 clips with no edge | ease | Low | Rack's body |
| 14 | The time scrubber eases after you let go | the feeling | Low | Time scrubber |
| 15 | The Rack-only parts' own words slip | trust | Low | Rack's parts |

### 1. On a phone, taps land on the wrong control (High)

`litt-target` grows a control's hit area with an absolute `::before`, and `tokens.css` says to put it "on a positioned control". Several controls in the worlds carry it without being positioned, so on a coarse pointer their `::before` grows to the nearest positioned ancestor: the screen or the whole viewport. Measured on a phone at 390 by 844:

- The top row's Home, Rack, Components, About and Page links each have a `::before` of 390 by 844.
- Each of the twelve Index rows on the player has a `::before` 390 by 694, the whole screen. The last row, Button, sits on top.
- Rack's Play key (`rackKey` in `bodies/rack.tsx` has `litt-target` and no `relative`) has a `::before` of 390 by 844.

What a finger does, with real taps:

- On `#rack`, a tap on the Step sequencer row opens Button, 12 of 12. A tap on About, on a clip in the lane, on Details or on Page starts Play instead. Of the first screen, 74% of the points hit Button and 26% hit Play.
- On `#rack/clip-launcher`, a tap on Home, Rack or Components opens About. 42% of the first screen is About; on `#rack/about` it is 87%.

So on a phone a visitor cannot open a part from Index, cannot reach a part's page from the player, and cannot leave a part's page by the top row (task 2 fails at every step). Positioned controls (the jump row, the clips in the stage) still work, which is why Install does. The same reading finds About over 39% of `#flat/button` and the mute over 40% of `#device/button`, so this is every world. Heat's Index rows are its own and are positioned, so its Index works, but its top row hits Page.

- **Fix.** Make the rule hold where the class is: `position: relative` on `.litt-target` itself, unless the control is already absolute or fixed. Then the Index rows, the top row and Rack's keys are fixed in one line of `tokens.css`, and no control needs to remember.
- **Fixed when.** A check on every page at 390 with touch finds no `litt-target` whose `::before` is larger than the larger of its own box and 44px in either direction, and a tap on each Index row opens that row's part.

### 2. Rack's pages describe Press (High)

The shared lede, About, How it moves and Anatomy were written for Press, and on Rack they say what is not there. Rack casts nothing and sinks nothing (check 15), and its switch does not travel (measured).

- Index, Slider: "A cap you hold, riding in a slot on a raised plate." Rack's slider is a filled bar.
- Index, Switch: "A block thrown along a tray, uncovering On or Off." Rack's switch is a key that reads On or Off in place.
- Index, Curve editor: "An easing shaped by hand, as a cubic Bézier." Under a stage that says "Synth · Filter sweep into the drop", the words are about CSS.
- `#rack/button`, How it moves: "A press sinks the block half a pixel and tightens its cast."
- `#rack/slider`, Anatomy: the plate, the pulled-out part, the cap and the slot, pointing at a bar labelled "Animation speed", Slower to Faster.
- `#rack/pad`, About: "A well cut into the page … a round cap … sinks while held."

Counted: Press's material or motion words (glass, cast, raised, sinks, cap, plate, tray, well, glides, springs, thrown, floats) are in the About of 9 of the 12 set pages and 50 of the 91 pages, in How it moves on 8 of the 9 pages that have one, and in 3 of the 12 Index lines. Only Heat has its own lines (`ledeByWorld`, `movesByWorld`, `summaryByWorld`); Rack has none.

- **Fix.** Write Rack's lines in `meta` for the twelve in the set first, then the rest: say what the part does and how the hand works it in Rack, in Rack's words. Where a world has none, the shared line must be true of every body.
- **Fixed when.** The check that holds Heat's words (`test:words`) also reads `#rack/*` and fails on Press's material and motion words, with what is left in its `KNOWN`.

### 3. Inspector, in the set, is a toast tuner (Medium)

The player's Inspector take is Rack's own, "Drums · Channel" with Gain at −3 dB. Its page is not. `#rack/inspector` leads with "Invoice sent to Atelier Nord", a rounded toast with a shadow and a green check, tuned by an inspector reading "Lively", "Float shadow: Lifts the toast off the page" and "Spring 380ms, bounce 0.24 … overshoots 2%". It is the one page of the twelve that a visitor reaches from the set and finds a web product with springs. The page has `tileByWorld.rack` and no `byWorld.rack` for its stage.

- **Fix.** Give the lead stage the take's own demo through `byWorld`: a track's channel, gain, pan and mono, in Rack's panel.
- **Fixed when.** Every page in Rack's set leads with its Rack demo: a check finds none of the set's lead stages without Rack's words (clip, track, scene, bar, dB, BPM or the like).

Beyond the set, the lead stages of 46 of Rack's 91 pages speak web studio (deploys, Framer, Atelier Nord, invoices), 33 are neutral or commerce, and 12 speak the studio. That is plan 024's phase 3 for Rack, not new here.

### 4. Color is dealt out, not owned (Medium)

Rack's line: "The color belongs to what the person makes … One color means one thing everywhere it shows." What each color stands for on the pages read:

| Color | Stands for |
|---|---|
| Orange | Drums (clip launcher), Kick (sequencer), Cutoff and Dry/Wet (one device), Guitar (About's takes), and the player's chips for Clip launcher, Pad and Switch |
| Blue | Bass (both parts, the one that holds), Resonance, Attack, and the chips for Device rack, Time scrubber and Button |
| Cyan | Hi-hat, Feedback, Detune, Percussion, and the chips for Step sequencer and Inspector |
| Purple | Synth, Width, Wavetable, and the chips for Slider and Number field |
| Green | Keys, Snare, Drive, Release, and the chips for Curve editor and Segmented control |
| Warning amber | "Warning: Drop · Full drum kit & acid bass line" in the time scrubber; Inspector's "Change" |
| Status green | Inspector's "Fits" and the toast's check |
| The yellow accent | Install on `#rack/about`, Export mix on the Button take |
| The ink | What is on: a playing clip, the chosen chip, the active preset, a switch at On, the bypass |

Three places break the line. The player colors its lane by position (`CLIP_HUES[i % 5]` in `bodies/rack.tsx`), so a part's color means nothing and is not something anyone made. One device gives orange to two macros. And the time scrubber marks the drop of a song as a warning, in the warning amber, and tells a screen reader "Warning".

- **Fix.** The lane's chips in one neutral grey, the chosen one in the ink, as the Index cell already is. A device's macros each in their own hue or all in one. The scrubber's cues in the track's color with no status, "Warning" kept for a warning.
- **Fixed when.** `test:materials` (or a Rack check beside it) fails when one hue fills two different names in one view, and when a status hue shows in a Rack lead stage without a status word that is true.

### 5. The clip launcher and step sequencer are a tab stop per cell (Medium)

The floor says "One tab stop per composite" (principle 5). In `#rack/clip-launcher` the grid is 21 tab stops, and the arrows do nothing (ArrowDown from Hat pulse stays on Hat pulse). In `#rack/step-sequencer` the 32 steps are 32 tab stops, and ArrowRight from Kick step 1 stays there. A keyboard user tabs 32 times to pass one pattern. Live moves through its grid with the arrows.

- **Fix.** Make each grid one composite with a roving tab stop: the arrows move across slots and steps, Enter or Space launches or toggles, Tab leaves the grid. Say it in each page's Keyboard table.
- **Fixed when.** `test:focus` (or a new case) finds each grid takes one Tab to enter and one to leave, and ArrowRight moves focus to the next cell.

### 6. Focus on the selector is nearly invisible (Medium)

With the selector focused, its ring is drawn inside the group (`-outline-offset-2`) and the clips cover it. What shows is a white tick in each 4px gap between chips (compare `walk.desk.selector-focus.crop.png` with `rack.desk.dark.crop.png`). A keyboard user cannot tell the strip has focus, though it is the one control that runs the player.

- **Fix.** Show focus on the chosen clip, where the eye already is: a 2px ring in `--focus` round that chip, outside it. No ring round the strip.
- **Fixed when.** A screenshot of the chosen chip differs between focused and not, and the focus outline is not hidden under another element.

### 7. Focus runs against the eye on the player (Medium)

At 1440 wide, Tab goes along the top row (8 stops at y 24), drops to the selector at the foot (y 776), then Play, then climbs to the screen (y 111). Rack's body puts the lane first in the DOM and last on screen (`order-3`). Heat had the same fault and fixed it by drawing its strip above the screen. On the phone Rack's own compact body already does.

- **Fix.** Draw the lane under the title bar at every width, as the compact body does.
- **Fixed when.** `test:playground`'s check that each tab stop on a player is at or below the one before it, or to its right, holds on `#rack`.

### 8. Rack's own small controls lose the 44px target (Medium)

Rack is dense on purpose, and its shared controls keep their targets. Its own do not, on a phone:

- The step sequencer's steps are 22 by 44 with 4px between them, and carry no `litt-target`.
- The device rack's bypass is 24 by 24, round, with no `litt-target`.
- In the player, the Index chip (51 by 32) and the lane's clips (32 high) carry no target.

The dials (48 by 48) and the clip launcher's slots (44 high on a coarse pointer) are fine.

- **Fix.** Give each of these `litt-target` on a positioned element (after finding 1, any), and let the sequencer's grid scroll sideways inside its panel on a phone, as the clip launcher's does, so a step can be 44 wide.
- **Fixed when.** The phone reading finds no enabled control in a Rack part under 44 by 44 whose target box is under 44 by 44.

### 9. The front door is a list of words (Medium)

`#rack` opens on Index: the name, two lines and twelve names with a line each, in 13 and 12px type on an empty screen, the lower 30% of it blank at 1440 by 1000. The one place on the player with Rack's color is the lane under it. A first-time visitor meets a contents page, not a session. Heat had the same front door and now draws Index in its own grammar.

- **Fix.** Let Rack draw Index as a session: the twelve parts as slots in one column of clips, the one under the keys or the pointer lit, the part live beside it. The contract still owns the list, its order and its keys.
- **Fixed when.** `test:playground` finds, on `#rack` at Index, a live part on the screen and exactly one row marked as current.

### 10. What is on is ink, not color (Medium, Nick)

Nick's line names "a switch that is on" among the things color belongs to. In the build, everything that is on is the ink: a switch at On, the active preset, the bypass, and a playing clip, which drops its track's color the moment it plays. In light, the playing clips of the four tracks are four identical black slabs. The yellow accent shows only on Install and Export mix. This follows the proposal (switch "lit in the ink, or the accent for the one main switch") and R6's one accent fill per view.

- **Options.** Keep the ink and let the line read "a clip, a track". Or let a playing clip keep its track's color and mark play with a shape, as Live does. Or light a switch that is on in its track's color where it belongs to one, and the ink elsewhere.
- **Fixed when.** Nick picks. Check 15 and `test:wall` hold whatever is chosen.

### 11. The selector is named Components (Low)

The player's selector is a slider whose accessible name is "Components" (`contract.tsx`), and it says "Index, 12 in the set" or "Clip launcher, 1 of 12". The top row has a link also named Components that goes to `#rack/components`. A screen reader user hears two controls with one name that do different things.

- **Fix.** Name it for what it steps through: "The set".
- **Fixed when.** No two controls on a player share a name.

### 12. On a phone the clip launcher cuts its clips' names (Low)

At 390 the grid is 432px wide in a 292px panel and scrolls sideways inside it, which is allowed. But 12 of its 18 clip names are cut ("Hat p…", "Rim …", "Sub …"), and Keys and Master are off the edge with nothing to say so. Every value in reach means its name too.

- **Fix.** On a narrow panel, show the tracks as columns that keep a 96px slot, with a cut edge on the side that has more.
- **Fixed when.** At 390 no clip name in the lead is truncated, or the panel shows that it scrolls.

### 13. The player's lane shows 10 of 13 clips with no edge (Low)

At 1440 the lane ends mid-word ("Segm") under the step keys; Switch and Button are out of view until chosen. On the phone it shows two.

- **Fix.** A cut edge on the side that has more.

### 14. The time scrubber eases after you let go (Low)

On `#rack/time-scrubber`, after a drag is let go, the ruler keeps moving for 400ms (21 frames) to settle on the nearest step, on the responsive tier. Rack's line is that things stop at once. The shared part has no Rack body, so it moves as it does in Press.

- **Fix.** Under Rack, put the ruler on the nearest step on the frame it is let go.
- **Fixed when.** `test:motion`-style sampling finds no transform change on `#rack/time-scrubber` more than one frame after release.

### 15. The Rack-only parts' own words slip (Low)

- Preset and device names are in title case ("Dub Tape", "Warm Wash", "Acid Ping", "Glass Pad", "Dub Echo Rack"); litt writes sentence case everywhere.
- The step sequencer's About lists "Kick (amber/orange), Snare (rose/green), Hi-hat (teal/cyan)", the token names beside the colors a visitor sees.
- The clip launcher's About uses an em dash.

- **Fix.** Sentence case, colors named once as they show, and plain punctuation.
- **Fixed when.** By eye on the three pages.

## What to do first

1. **Finding 1**, because on a phone no world can be used, and one line in `tokens.css` fixes it everywhere.
2. **Finding 2**, because Rack's own pages say things that are false, and the work Heat started (`ledeByWorld`, `test:words`) carries straight over.
3. **Findings 4 and 9**, because they are the player, the first thing anyone sees of Rack, and its color is the world's point.

Finding 10 waits on Nick. Findings 5 to 8 are a day between them.

## What this audit says about the shared layer

Three of the fifteen findings are not Rack's (1, 2 and 11), and finding 1 is the worst in every world, so it is worth fixing before any world's own pass. The rest are Rack's body, its demos and its three parts, which is where the next pass on Rack belongs.
