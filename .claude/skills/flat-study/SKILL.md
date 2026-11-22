---
name: flat-study
description: Take one Flat part to Flat's study bar (plans/027): built from Flat's materials and marked, moved by the hand, one arrival, Flat's words. Use for any work on a Flat study, a Flat body in gallery/src/worlds/flat, or one of Flat's own parts (poll, streak, kudos, reaction-bar, goal-ring, reading-progress).
---

# A Flat study

One study at a time, built whole: look, hand, keys, reduced motion and words together. Never start a second study
before the first has passed and is committed.

## Read first

- `plans/027-flat-to-the-bar.md` (the plan, Nick's calls, the list).
- `skills/litt-md/taste/litt-principles.md`, Flat: the materials in order, the colour table, the voice.
- The part: its contract in `gallery/src/components/<part>.tsx`, Flat's body in `gallery/src/worlds/flat/<part>.tsx`
  (Flat's own six have no separate body), and its page in `gallery/src/gallery/pages/`.
- `gallery/src/motion/hand.ts` (`useHand`, `snap`, `useSettle`) and `gallery/src/motion/index.tsx` (`useTransition`,
  `useMotionDial`).

## The bar

- [ ] 1. **One arrival, then still.** One arrival when it first comes into view, on `useTransition("expressive")`.
      No loop and no timer after it. Nothing when `useMotionDial().reduced`.
- [ ] 2. **It fits.** Its wall tile and the player's screen hold it at 320px with nothing spilling.
- [ ] 3. **Built from the materials, and marked.** Ground, then paper, then part. A widget sits on a paper card
      (`litt-paper rounded-surface bg-surface-1 p-6`, `data-part="paper"`); a lone pill, circle or switch may stand
      on the ground. Tags are frameless dots at weight 400 with a hover wash only. Every part carries `data-part`
      with one of `FLAT_KINDS` (`gallery/scripts/materials.mjs`). Context budget is the reference (Nick, 2026-11-22:
      "this is what it should look like, simplicity + color + ease of use").
- [ ] 4. **Colour by Flat's table.** One ink fill per view. Candy hues on data only. How much, and how far along, is
      the sunset ramp (`--data-seq-1..4`) and no other gradient.
- [ ] 5. **The hand moves it.** A continuous value follows a drag 1:1 through `useHand` and settles with `useSettle`.
      A press answers on pointerdown.
- [ ] 6. **Keys match the hand.** One tab stop per composite, arrows, Home and End.
- [ ] 7. **It says what changed.** A polite live region. No instructions written inside the part.
- [ ] 8. **Flat's words.** Its nouns (site, post, issue, letter, reader) and demo strings. A lede says what the part
      does, never what it is made of.
- [ ] 9. **Its page can take it apart.** A `study` export: Anatomy parts, States, Replay.
- [ ] 10. **Small blast radius.** Only Flat's body (or the component, for Flat's own six) and the page change, unless
      the contract truly needs a prop. If it does, stop and say so first.

## Never

- A shadow on anything but a float (menu, popover, dialog, toast).
- An edge or a line between things on the ground: the fill is the edge.
- A second ink fill in one view, or a data hue on chrome, a button or a status word.
- A gradient that is not the sunset ramp.
- A loop, a timer or anything that plays again by itself.
- A sound. Flat is silent.
- Words about the design in the part or its lede ("Candy", "heatwave", "vivid").
- "Click", "tap" or any instruction inside the component.
- A new token, a hex value or an off-scale radius. A new token goes through `workflows/evolve.md` with Nick.
- A change to another world's body, or to a contract's props without saying so first.
- `litt-target` without `relative` or `absolute`.
- Two utilities on one element that set the same property under the same variants (`lint:collisions`).

## Steps

1. Run the check in study mode on the part as it is, and list what fails:
   `npm run test:materials --prefix gallery -- --study <id>` (after a build).
2. Mark the parts, then fix rule 4.
3. Give it the hand and the keys (rules 5 and 6), then the arrival (rule 1).
4. Words, live region and `study` (rules 7, 8 and 9).
5. Add its `gallery/CHANGELOG.md` lines: `flat-<part>` and the base item when a body file changed, since the base ships
   every body. Run verify and commit the regenerated `gallery/registry.lock.json` with the change.
6. Add its id to `BAR.flat` in `gallery/src/gallery/play-object/takes.ts`.
7. Run the checks in the plan. Look at its page and its take on `#flat`, light and dark, at 1440 and 390 wide, and
   try it with a pointer and with the keys.
8. Fill in the review table in the commit body or the PR.

## Review table

| Rule | Result | Where (file:line) | Fix |
|---|---|---|---|
| 1 Arrival | | | |
| 2 Fits | | | |
| 3 Marked | | | |
| 4 Colour | | | |
| 5 Hand | | | |
| 6 Keys | | | |
| 7 Announced | | | |
| 8 Words | | | |
| 9 Study | | | |
| 10 Blast radius | | | |

Every pass names a line. A rule that cannot pass yet is reported, never skipped.
