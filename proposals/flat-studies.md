# Flat is the studies

Written 2026-11-23 for Nick, as an evolve proposal (`skills/litt-md/workflows/evolve.md`). Nothing in the rules, the tokens or the components changes until you say yes. This page says what Flat becomes, which rules change and why, what stays open for you, and how the rewrite would run.

## Where this came from

On 2026-11-23 the 23 studies of `litterthanlit/components` were redesigned in Flat, one by one, from the product pattern underneath each, with the hardware thrown away. They sit on a wall of live tiles that open into a sheet. You said:

> "yes!! now we're talking" … "this is so perfect! nailed this! this is what I imagined flat to be, the simplicity, the movement" … "we should also rewrite flat, so its whatever this is."

The evidence, in this folder:

- `flat-studies/studies.html`, the whole wall in one file. Open it in a browser. It is also the private artifact "Flat Studies Preview" on claude.ai.
- `flat-studies/wall-light.jpg` and `flat-studies/wall-dark.jpg`, the wall at rest.
- `flat-studies/studies/*.js`, one file per study, and `flat-studies/shell.html` and `build.py`, which put them together. These are the working spec for the rewrite.
- `taste/journal.md`, the six entries of 2026-11-23.

The steps on the way there were these:

1. The dots came off Flat's parts ("remove the dots. simplify as much as possible").
2. The first port kept each device in Flat's colours ("I meant redesign the components in flat' style").
3. The redesign landed (the quote above).
4. One hue of cotton candy went on what is on and how much ("feels okay-ish").
5. You took the colour back out ("let's strip back the color, we can add color themes later on"). The step sequencer kept its four track hues ("I like the previous step sequencer colors"). The copy button lost its scramble, because that is Device's ("copy button animation was meant for device only").

## Flat, in one paragraph

Flat is a white paper on a grey ground with one large figure on it. What a hand uses is a pill or a circle. The ink (black, white in dark) is the only accent, and it is on the one action and on what is on. A state is said in words. Colour appears only where a series needs telling apart. One thing moves at a time: things arrive with a small bounce, leave with none, and grow out of whatever was touched. Nothing is a device. Each part is the plain product pattern for a small site, a newsletter and its readers.

## What changes in the rules

### `taste/litt-principles.md`, "Flat, the page"

Rewrite the four bullets and add two more:

- **Light, airy and easy** stays as it is.
- **Bold, simple shapes on grey** stays, with one line added: one large figure per object is the fun at rest. It is the subscriber count, the price, the percentage or the time live.
- **Things come from where you touched them** stays, with examples from the studies:
  - a sheet grows out of its tile and gathers back into it;
  - toasts come out of the button that sent them;
  - the palette grows out of its search pill;
  - "Copied to clipboard" rises where the command was.
- **Fun, and it moves that way** stays, and points to the new "Flat's motion" section below.
- *New:* **Designed from the pattern, never from a device.** A Flat part starts from what a product needs (a settings list, a sign-in code, an upload, a plan picker, a mic check). It is drawn as if no hardware existed: no readout card, no reels, no needles, no knobs, no fader strips, no scramble. When the subject is itself a tool (a mixer, a sequencer), Flat draws the plain web-app version of it.
- *New:* **No dots.** A state is a word in the ink. Nothing in Flat is said with a status dot, a bullet, a dot tag or a dot matrix. A picture made of dots (the dithered covers) is content, not chrome.

### Flat's materials table

- **Ink card.** Today it allows "at most one per view". Change it to: rare, and none by default. It is earned only when one live thing is the whole object, a timer for example. Of the 23 studies, none uses one.
- **Circle.** Drop "a status's mark". Status is a word.
- **Outline**, **Paper**, **Pill**, **Bubble** and **Float** stay. Every study already keeps them: only a toast, a palette and a floating label cast a shadow.
- **Lettering.** Keep "one figure per object may stand above 18px". Whether that figure is fixed at 28px or scales with the object is Q-A below.

### Flat's colour table

Flat's default becomes **monochrome**: grey, white and the ink.

| Colour | Means, after this change |
|---|---|
| Grey | The ground. Inside paper, what is chosen. |
| White and black | Paper and the ink: everything a hand uses, what is on, the one action, and the words. |
| The data hues | Which series. A data hue tells series apart, one per series and never cycled, on the mark that says which (the step sequencer's four tracks, a chart's lines). Nothing else. |
| Danger | Only a word that must warn ("Too loud", "That code didn't work", "Didn't finish"). Never a fill. |

What leaves the default:

- the sunset ramp for how much;
- Flat heatwave, where Progress walks the ramp (v1.21);
- the ink card's blue;
- the status circle before a word (v1.17);
- success green on words.

Bright Candy stays, but only for series, which is the job R7 always gave the data hues. The rest becomes a colour theme later (Q-C).

### New section: Flat's motion

Six rules, taken from the studies:

1. **Arrivals bounce a little; small moves and exits never do.** Arrivals use the expressive spring, 350ms at bounce 0.28: a toast, a palette, a price, a figure that changes. Small moves (a highlight between rows, a thumb settling) and every exit use the responsive spring at bounce 0, and an exit is quicker.
2. **Things come from where you touched them.** This is R4's Flat line, now with the studies as examples.
3. **Springs wherever a hand is.** A spring keeps its speed when interrupted. The studies keep the components repo's springs because they serve the hand: the row highlight's glide, the magnet's pull, a motor that lets go when grabbed, a switch that snaps over its centre, a flick that carries. A part moved by a hand never runs on a fixed duration and curve.
4. **One thing moves at a time.** Each part has one motion idea: digits roll, a bar fills, a pill pops. Nothing shimmers, pulses or loops behind it.
5. **Text swaps by leaving up and arriving in its place.** The old line goes up and fades with no bounce, and the new line rises in on the 0.28 spring. A scramble or glitch is Device's.
6. **A hand always wins**, and reduced motion is still. Reduced motion is what R4 already says.

### `taste/profile.md`

- **R4** keeps "nothing moves on its own" (see Q-B). Flat's line gains rules 3 to 5 above.
- **R6.** Drop "Under Flat a Progress fills with the sunset instead". A Progress under Flat fills with the ink, as everywhere.
- **R7.** Replace the Flat sentences (Candy, the sunset ramp, heatwave, the status circle, the ink card's first hue) with: "Under Flat the default is monochrome; a data hue tells series apart and does nothing else, and colour beyond that comes from a theme a project picks." R7's core (a hue means which, chrome never takes one) does not change.
- **R10.** Its example of Flat's feeling changes from "Flat's bright Candy data and its bounce" to "Flat's one standing figure and its bounce".
- **Fixed decisions, Color.** This changes Flat's colour strategy, which only you can change. Your words above are the reason.
- **Changelog.** Add v1.22 with the six journal entries.

### Tokens

Monochrome needs no new token. The Candy hues, the sunset ramp and the ink card stay in `tokens.css` for series and for the themes to come. What changes is which components read them, and that is the rewrite below. If Q-A makes the figure scale, Flat's block gains `--type-figure-size-lg`.

## Open, for you

- **Q-A. The figure's size.** The studies stand their figure at 28 to 48px by the size of the object: 48 for a price or a subscriber count on its own card, 40 for a sign-in code's cells, 28 in a dense card. Keep R8's one size (28), or let Flat have two, 28 and 44?
- **Q-B. Running by itself.** Each study plays a short demo until a hand touches it: a ghost types, a motor plays back. R4 says nothing moves on its own. Recommended: the demo belongs to the gallery, not the part. A shipped Flat part never moves by itself, and the gallery's wall and sheet run a demo script around it, the way the Playground's Play does. The other choice is for Flat parts to take a `demo` prop.
- **Q-C. Colour themes.** "We can add color themes later." Candy, the sunset and the cotton candy pink you tried would each be a theme a project picks (`data-flat-theme="candy"`, for example) and would never be the default. Is that the direction?
- **Q-D. PRs #169 and #170.** #170 (no dots) is the first step of this. #169 makes Poll's hues stronger, which this proposal undoes, so close #169 or keep it for a Candy theme.

## The rewrite, once you say yes

Each phase ends with verify, the build and the page checks green, and lands as its own PR.

1. **The rules.** One `taste:` commit makes every change above: the principles, the profile, the changelog, the journal statuses (`→ v1.22`), and `system/material.md` where it repeats Flat's colour.
2. **Flat's own parts.** Poll, Streak, Kudos, Reaction bar, Reading progress, Goal ring, Context budget, Hold to confirm, Agent run and Toast stack are rebuilt in the studies' grammar: one paper, one figure, monochrome, no dots, the swap and arrival motion. Each gets a changelog line.
3. **Flat's bodies of shared parts** (`gallery/src/worlds/flat/`), rebuilt from the study that is their pattern:

   | Study | Flat part |
   |---|---|
   | Switch | switch, and the settings-list layout |
   | Segmented Control | segmented |
   | Command Menu | command menu |
   | One-Time Code | code input |
   | Tape Reels | progress |
   | Knob and Fader | slider |
   | Toast Stack | toast |
   | Copy Button | copy button |
   | Number Ticker | stat |

   Studies with no part yet become new Flat parts at the top of `SET.flat`: Agent Status, Agent Indicators, Agent Loaders, Magnetic Button and Spotlight Card.
4. **Flat's gallery.** `#flat/components` becomes the wall: live tiles on the ground, and a sheet that grows from the tile. Flat's player Index stays the player contract (`test:playground`).
5. **Encode the lessons**, so the rules hold without anyone remembering them:
   - a `lint:litt` rule that fails a status dot, a bullet dot or a dot tag under Flat;
   - Flat's `WORDS` list in `world-words.mjs` gains readout, LCD, reel, needle and scramble;
   - `test:materials`-style checks for Flat, which fail a data hue on chrome or a fill that is not paper, bubble or ink.
6. **Propagate.** Changelog lines for every changed registry item, `breaking` wherever a prop goes away (the `hue` props, as in #170). Then regenerate the lock, run `check.mjs`, and do the full gallery run.
