# litt principles

What litt believes, in two layers: a short floor every world shares, and each world's own principles, written for the people that world is for. The nine rules (`taste/profile.md`) say what to check. This file says why, so that an agent given room inside a world uses it well.

Read it before you build or change a body, a world-only part or a study, and when a critique turns on a world.

> Draft, for Nick to confirm. Nick first asked for the principles of the components repo (`litterthanlit/components`, `DESIGN.md`) to be brought in, then said on 2026-11-15: "maybe we shouldnt fit all rules through components. each world should have its own, enhancing the experience and usability". So only what holds everywhere is shared. On 2026-11-16 Nick went through each world's lines, and the sections below carry Nick's words from that day. Press and Flat name a direction that is not built yet. A line marked *components* comes from that repo. Nothing here is a new value: values live only in `assets/tokens.css`.

## What every world shares

Six principles. A world's own principles may go further than these, never against them.

**1. A world is one object.** Every part in a world is a part of one thing, built from its materials, and speaks in that world's words. An object makes polish legible: "a lit edge, a recess or a 2px base is either right or it isn't" (*components*). So a part is never a card that could sit in any world, and never a second frame inside the frame. R1.

**2. A hand always wins.** What a person is touching follows them exactly, can be caught mid-flight, and never waits on an animation. Anything a part does by itself lets go the moment a hand arrives, for good (*components*). R4.

**3. Restraint is subtraction.** Each color only ever means one thing, so it reads at once (R6, R7). Take out whatever repeats something the part already says: "Repeats are taken out, not restyled" (*components*).

**4. Say it once, in words.** A state is a word, never color, a dot or position alone (R5). A label says what happens: "Copy command", then "Copied".

**5. Accessibility is native.** "A hardware metaphor is no excuse for a div" (*components*). A part is the real role it looks like. One tab stop per composite. Focus follows the hand without a ring and comes back for the keyboard. A change of state is said once. Reduced motion lands everything at once (`system/foundations.md`, 7).

**6. The craft speaks for itself.** A part is something teams ship. The world is the polish, the product pattern is the subject (*components*). No debug overlays, no explanatory chrome, no label that points at what to admire.

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
- **Fun, and it moves that way.** Motion is quick and playful, to match, and Flat bounces more than the other worlds do (Nick, 2026-11-16: "yes flat should be more bouncy I feel like"). It is Flat's own exception to R4's bounce cap, picked by eye on the canvas (Nick, 2026-11-16: "0.28 at 350ms, no bounce on small moves looks good"): where something arrives on the expressive spring it bounces 0.28, where every other world keeps 0.12. Small moves and exits never bounce.

### Device, the machine

For agents, terminals and tools. Nick, 2026-11-16: "tactile, actual device feeling, apple product etc, my components repo is a perfect representative of how I want it to feel. yes we can have sound."

- **It feels like a device in the hand.** Tactile: a key travels, a dial clicks through its detents, glass sits behind a bezel. The components repo is the measure of the feel, and a well-made product the measure of the finish.
- **It uses an instrument's vocabulary.** Keys, wells, LCD glass, lamps, engraved capitals. The words arrive with behavior people already know, so the interface needs fewer explanations. "The vocabulary dresses the demo, not the component" (*components*).
- **Things are mechanisms.** A part switches where it stands, in steps, and never fades or travels. Where it stands in for a mechanism, model the mechanism: "a duration and a curve can't be interrupted gracefully, can't overshoot from a flick, and can't tie a click to the exact moment a detent passes" (*components*).
- **The machine shows its work.** Segments, meters and reels move only while the work does, so a glance says whether it is running.
- **Sound answers a key.** A click confirms a press faster than sight (*components*). Synthesized, and only in answer to a hand. It starts with sound on, and the viewer can mute it (Nick, 2026-11-16: "start with sound for device"), which replaces decision 8's silent start. A browser plays nothing before the first press, so it is quiet until then.

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

1. **Flat's bounce and size.** The bounce is answered (2026-11-16): the expressive spring at 0.28, the responsive at 0, in R4. Still unanswered: Nick's references for Flat have figures larger than 18px. May Flat set type above 18px (R8)?
2. **Device's sound.** Answered: it starts on. Not built yet; litt has no sound engine.
3. **Running by itself.** In the components repo every study moves in its first four seconds, untouched. Here nothing moves on its own (R2, R4). May Device's studies and its object run by themselves, while the other worlds stay still? Until Nick says, none does.
4. **Spelling.** The components repo is British with -ize (colour, centre, synthesized). The skill writes color. Which is litt's?
5. **Values.** The components repo's curves and springs differ from litt's tiers, and one preset bounces past R4's bound. This file brings no values. A value Device should take comes in through Propagate (`workflows/evolve.md`, 4).
