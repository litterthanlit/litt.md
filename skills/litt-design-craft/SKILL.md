---
name: litt-design-craft
description: How to design and build UI to Nick's bar, step by step - start from the product pattern, pick one world and hold to it, subtract until it reads in two seconds, then prove it in screenshots before Nick sees it. Use alongside litt-md whenever you design, redesign, build or review components, studies, prototypes or app screens for Nick, in any litt world or a fresh product. litt-md owns every value and rule; this skill owns the process and the craft bar, and never overrides litt-md.
---

# litt design craft

The bar is Nick's: every screen **simple, calm and uplifting**. Easy to use and read at a glance, never overwhelming, nothing on it that doesn't need to be there, and one thing on it someone will feel.

This skill is the **process** for reaching that bar. It holds no values. Every token, colour, radius, duration and world rule lives in `litt-md` (`../litt-md/SKILL.md`), the reasons behind them in `../litt-md/taste/litt-principles.md`, and every hex in `../litt-md/assets/tokens.css` only. When this file and `litt-md` disagree, `litt-md` wins; when either disagrees with Nick's words in the session, Nick wins.

## 1. Before you draw

1. **Name the world, then read its lines.** Press, Flat, Device, Plain, Rack or Heat (`litt-principles.md`, "Each world's own"). Read that world's section and "What every world shares" in full. One world per screen; never borrow another world's material, motion or words.
2. **Name the product pattern.** What is the person doing? (Approve a tool call, pick a model, watch a deploy, measure a gap.) Design that. A reference is a source of grammar, never of subject: Rack follows Ableton Live's panels and clips, but its studies are about agents and interfaces, not music.
3. **Name the feeling in one line** (R10). Calm confidence, momentum, delight. Then pick the one moment that carries it: a figure, a motion, a surface. Everything else stays quiet.
4. **Use real content.** Real names, real numbers with units, real copy in the world's voice. No lorem ipsum, no grey placeholder boxes, no fake telemetry.

## 2. Redesign, don't translate

When you bring a component into a world (or from another repo), rethink it for that world's people. A port that keeps the old layout and swaps the colours is not done.

- **Shape from the pattern, not the source.** If the original is a mixer, ask what the person controls (a budget, an opacity, an effort) and build the world's own control for that.
- **Don't copy a sibling world.** A Rack loader that looks like Flat's loader with square corners is Flat's. Find the shape only this world would make.
- **Greyscale test** (`litt-principles.md`, "The test of a body"): with colour and face removed, the structure alone should name the world.

## 3. Subtract

Do this pass twice: once on the first draft, once before you show it.

- **One working surface.** One place where the thing lives and takes most of the room; one thin strip for its name and at most a couple of values. No second strip, no stats footer.
- **List every element and delete what isn't the pattern.** For each label, icon, divider, border, badge and helper line, ask: if I delete this, does the person lose anything? If not, delete it.
- **Say each thing once.** If a meter, a clock and a percentage all show progress, keep one. No legend when the colours already carry names.
- **No chrome that points at itself.** No `FIG. 01` eyebrows, debug labels, captions telling the reader what to admire, or decoration standing in for craft.
- **Fewer objects, each clear.** Two to five things on a surface is plenty. Colour only on what the person makes or the data (R6, R7), in the world's own palette, one meaning per colour everywhere it shows.

When Nick says "simplify", aim for about half the boxes and words, and keep whatever Nick praised exactly as it is.

## 4. Make it feel good under a hand

- **A hand always wins** (shared principle 2). A drag follows 1:1, can be caught mid-motion, holds where it was let go. Anything a gallery demo plays by itself stops for good on the first `pointerdown`, `keydown` or `wheel`. A shipped part never moves on its own.
- **Move in the world's language,** with its tokens: Flat grows from where you touched it, Press settles with weight, Device steps like a mechanism, Rack cuts in on the beat, Heat arrives from the side, Plain doesn't move (R4). One expressive moment per view.
- **Only transform and opacity animate.** A bar fills by `translateX` inside a clipped track, never by width.
- **Every state is designed and said in words** (R1, R5): default, hover, pressed, focus, disabled, and empty, loading or error.
- **Native roles,** one tab stop per composite, a polite live region for changes, reduced motion that lands everything at once.

## 5. Prove it before Nick sees it

Look at the real thing, not your memory of the code.

1. **Screenshot every view** in headless Chromium: light and dark, desktop and 390px (and 320px for reflow), at rest and in its key states (pressed, open, running, done, error). Read every shot.
2. **Hunt the usual breaks:** clipped or wrapping labels, text unreadable mid-transition (a key that swaps ink and fill snaps on the frame instead of fading), blank digits while a number ticks, empty tiles before an observer fires, a clock that runs negative (clamp `dt` and times to zero), sideways scroll on a phone.
3. **Drive it once** with Playwright: press, drag, type, and check focus lands where it should.
4. **Run the repo's checks.** In `litt.md`: `node skills/litt-md/scripts/check.mjs`, `claude plugin validate .`, and for gallery work `npm run verify --prefix gallery` plus the page checks for the pages you touched (`.claude/CLAUDE.md` lists them). Remove scratch files before committing.
5. **Do the subtraction pass again** with the screenshots open.

## 6. Show, then listen

- Show Nick the live thing (an artifact or a preview), not a description of it. Report one plain line per piece: what it became and what you removed.
- Nick's reactions are the spec. Take the exact words, apply them, and log them (`litt-md`, log mode). A reaction that should become a rule goes through `../litt-md/workflows/evolve.md`; never edit `taste/` or the tokens directly.
- When a direction is unclear, build the smallest version of two options side by side rather than asking in the abstract.

## Never

- Generic AI looks: purple-blue gradient heroes, gradient text, glow-heavy glass, emoji markers, a wall of equal widget cards.
- A reference's subject in place of the product's (DAW hardware in an agent tool), or a reference infographic cloned.
- A hex value, an off-scale radius or a literal duration in code or Markdown outside `tokens.css`.
- Colour or a dot alone for status, or colour on chrome.
- Shipping a study's demo loop inside a component.
