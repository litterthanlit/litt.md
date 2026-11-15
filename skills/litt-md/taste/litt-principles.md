# litt principles

What litt believes, where a world is free, and what every world keeps. The nine rules (`taste/profile.md`) say what to check. This file says why, so that an agent given room inside a world uses it well.

Read it before you build or change a body, a world-only part or a study, and when a critique turns on a world.

> Draft, 2026-11-15, for Nick to confirm. Built from the nine rules (R1 to R9), the decisions in `proposals/worlds.md` (8 and 12 to 15) and the ethos of Nick's components repo (`litterthanlit/components`, `DESIGN.md`), which Nick asked to bring in: "the principles from the components repo, which Im really happy with". A line marked *components* comes from that file. Nothing here is a new value: values live only in `assets/tokens.css`.

## The principles

**1. A world is one object.** Press is an instrument on a bench, Flat a page, Device a machine, Plain a document as HTML draws it; Rack and Heat follow the same rule (`system/material.md`, 6 to 11). Every part in a world is a part of that one thing, built from its materials. An object makes polish legible: "a lit edge, a recess or a 2px base is either right or it isn't" (*components*). So a part is never a card that could sit in any world, and never a second frame inside the frame. R1.

**2. A world brings a vocabulary.** An instrument's words arrive with behavior people already know: a detent, a lamp, a tray, a sheet. The interface needs fewer explanations because the vocabulary carries them. "The vocabulary dresses the demo, not the component" (*components*): a body and its demo speak the world's language, while the part's props and name stay general.

**3. A hand always wins.** Motion answers a hand (R4). What a person is touching follows them exactly, can be caught mid-flight, and never waits on an animation. Anything a part does by itself lets go the moment a hand arrives, for good: "a motor lets go of a cap the moment a finger is on it" (*components*). In a product, nothing moves on its own at all; see Open, 1.

**4. Physics carry the feel.** Where a part stands in for a mechanism, model the mechanism: a spring that keeps its speed when interrupted, a detent that clicks as it passes, a flick decided by speed and not position. "A duration and a curve can't be interrupted gracefully, can't overshoot from a flick, and can't tie a click to the exact moment a detent passes" (*components*). In litt that is `useHand` and `useSettle` in the motion engine, inside R4's bounds.

**5. Restraint is subtraction.** Color barely appears, and each color only ever means one thing, so it reads at once (R6, R7). Take out whatever repeats something the part already says: "Repeats are taken out, not restyled" (*components*). The work should be the loudest thing on the screen.

**6. Say it once, in words.** A state is a word, never color, a dot or position alone (R5). A label says what happens: "Copy command", then "Copied" (*components*). If one place already says it, no other place does.

**7. Accessibility is native.** "A hardware metaphor is no excuse for a div" (*components*). A part is the real role it looks like: a slider, a switch, a listbox, one real field under drawn cells. One tab stop per composite. Focus follows the hand without a ring and comes back for the keyboard. A change of state is said once. Reduced motion stops anything that loops and lands everything at once (`system/foundations.md`, 7).

**8. The craft speaks for itself.** A part is something teams ship: a command menu, a settings switch, a destructive confirm. The world is the polish, the product pattern is the subject (*components*). No debug overlays, no explanatory chrome, no label that points at what to admire. The one exception is a study page's anatomy, which names parts because naming them is its job.

**9. Sound answers a hand.** Sound confirms a press faster than sight (*components*). In litt it is an ability a world brings, Device first: synthesized, so nothing loads, and only in answer to a hand, never on arrival or on its own (`proposals/worlds.md`, decision 8). See Open, 2.

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

What a body meets before it ships, after the study bar in the components repo. Each line names its check where there is one; the rest are judged by eye.

1. **Its world shows in greyscale.** The test above, against its siblings.
2. **Every state is designed and said.** Default, hover, pressed, focus, disabled, and empty, loading or error (R1), each readable with color and motion hidden (R5). `test:forced-colors`.
3. **It keeps the contract.** It takes the contract's resolved props and draws; it adds no prop, role or key of its own. `typecheck`, `test:a11y`, `test:focus`.
4. **It sizes to its container, never the viewport** (*components*). `test:reflow` at 320px, `test:text-zoom` at 200%.
5. **A hand wins.** A drag follows one to one, can be caught mid-settle and keeps its speed on release. Nothing loops by itself. `test:motion`.
6. **It draws without React** (*components*). Per-frame work writes a motion value, a CSS variable or an attribute; React hears about commits, not frames.
7. **It rounds its geometry** (*components*). Coordinates a server may render are rounded to two decimals, so the browser agrees when it hydrates in a Next.js host.
8. **It is exact.** Only tokens, no hex and no radius off the scale (`lint:litt`); corners concentric (`test:corners`); no dead space between rows (`test:gaps`); no two utilities fighting on one element (`lint:collisions`); one accent fill (`test:wall`).
9. **It is in its place.** The contract in `components/<part>.tsx`, each body in `components/bodies/<part>.<world>.tsx`, every prop documented with JSDoc in the contract, a changelog line for the item.
10. **It looks intended in every theme.** Light, dark and forced colors, on a phone and on a desk.

Not carried over, because they belong to the player's stage and that repo's build: the 282 by 332 box, turning without transforms, and its lint rules. "It moves in its first four seconds, untouched" is carried only for studies; see Open, 1.

## Writing

Plain, precise and quiet. "Write it the way you would say it to someone at the next desk" (*components*).

- Sentence case everywhere. Capitals belong to hardware: lettering on a Device body is set in capitals by CSS, and the source and the accessible name keep sentence case.
- A label says what happens. A description is plain prose about what the part does and how.
- Numbers carry units and real symbols: a true minus, a times sign, a middle dot.
- Say a thing once.

## Open, for Nick

The components repo and litt differ in four places. Until Nick says otherwise, litt's own rule holds.

1. **Running by itself.** There, every study moves in its first four seconds, untouched, and then rewards the hand. Here, nothing moves on its own (R2, R4, the rules every body keeps). This draft keeps litt's rule for product parts and allows a self-running rehearsal only on a study page or in a demo, stopped for good by the first touch and never started under reduced motion.
2. **Sound.** There, every press clicks until the viewer mutes it. Here, decision 8 makes sound a Device ability, silent by default. Keep decision 8, or let other worlds have a voice?
3. **Spelling.** There, British with -ize (colour, centre, synthesized). The skill writes color. Which is litt's?
4. **Values.** Its curves, durations and springs differ from litt's tiers, and one preset bounces past R4's bound. This file brings the principles and no values. A value Nick wants comes in through Propagate (`workflows/evolve.md`, 4).
