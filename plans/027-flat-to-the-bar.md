# Plan 027: Flat goes to the bar one study at a time, look and hand together, and shows only what has passed

> **Executor instructions**: Read this plan, `.claude/CLAUDE.md`, `.claude/skills/flat-study/SKILL.md` and Flat's section
> of `skills/litt-md/taste/litt-principles.md`. Work one study at a time, each ending in a green, committed state, and
> follow the skill for every one. Honour every STOP: Nick looks before the next phase starts. Do not edit `plans/` except
> this plan's log and your row in `README.md`.
>
> **Drift check (run first)**:
> `git diff --stat 60056e7..HEAD -- gallery/src/worlds/flat gallery/src/gallery/play-object/takes.ts gallery/scripts/materials.mjs gallery/src/motion/hand.ts skills/litt-md/assets/tokens.css`
> and read any change to Flat's block of `tokens.css` or to `FLAT_KINDS` before building.

## Status

- **Priority**: P1 (Nick, 2026-11-22: "I actually want to build out the components gallery, in a more focused way tho,
  the way opus has done components repo")
- **Effort**: XL in all (about twenty studies); S for phase 0, M for the pilot, then about S per study
- **Risk**: MEDIUM. A study's body and page change, so each one moves registry items (`flat-<part>` and the base item,
  which ships every body). The guards are the bar's check, the STOP after the pilot and a STOP every four studies.
- **Depends on**: PR #168 (Flat's showcase wave) merged, for phase 1 on. Phase 0 depends on nothing.
- **Category**: direction, worlds, interaction
- **Planned at**: commit `60056e7`, 2026-11-22
- **Replaces**: plan 024's Flat section and plan 025 for Flat. Plans 024 and 025 wait for the other worlds; plan 026
  (PR #165) waits.

## Why this matters

Nick wants everything in one style and on theme, with one world taken to the bar first, and chose Flat.

What makes the components repo read as focused (read from `litterthanlit/components` on 2026-11-22):

- **A written bar.** Its `DESIGN.md` ends in ten rules a study must pass, and a project skill makes every session
  follow them, with a Never list and a review table.
- **One study at a time.** One file per study, built whole (look, hand, keys, reduced motion) before the next starts.
- **Two generic checks** (`check:fit`, `check:anatomy`) that need no new test code per study.
- **One material vocabulary**, every part marked `data-part`.

Flat today, against that:

- 94 parts, scored 7 of 10 in plan 024's phase 5.
- None of the 23 bodies in `gallery/src/worlds/flat/` carries a `data-part` mark.
- Flat's own ten parts answer a tap or hold only; none follows a drag.
- Goal ring and Reading progress draw gradients that are not the sunset ramp, against Flat's own colour table.
- Plan 024 does the look across six worlds and plan 025 adds the hand afterwards, so every part is built twice.

## What PR #168 settles (read 2026-11-22)

PR #168 ("World-native agentic components + Flat showcase wave", merged) is the same day's work on Flat, and this plan
builds on it.

- **The reference study is Context budget.** Nick, on it: "much better, this is what it should look like, simplicity +
  color + ease of use! slightly bump % font back up. now let's start building flat".
- **A Flat widget sits on paper.** A paper card on the grey ground (`litt-paper rounded-surface bg-surface-1 p-6`,
  `data-part="paper"`), frameless 400-weight dot tags with a hover wash only, and its one standing figure at 28px
  (`--type-figure-size`, tuned from 40px). #168 frames Flat's own ten this way.
- **Flat's set changes**: context-budget, hold-confirm, agent-run, toast-stack, poll, streak, kudos, reaction-bar,
  reading-progress, goal-ring, progress, toast. Gauge, heatmap, button and card leave the set.

So the bar's rule 3 reads paper first: a figure or a mark standing on the ground with no paper fails `root`, which is
how the check was built. Before #168 that one call fails poll, streak, kudos, reaction-bar and goal-ring; #168's frames
should clear it.

## Nick's calls (2026-11-22)

| Question | Answer |
|---|---|
| What does focused mean? | "everything is in that style, and so on theme. yes probably one world to the bar first" |
| Which world? | Flat |
| How many studies? | About 20: the twelve in Flat's set, then about eight staples. Nick approves the list first. |
| Does a study move untouched? | One short arrival when it comes into view, then still. No loops. Nothing under reduced motion. |
| What does Flat show meanwhile? | Only studies at the bar. Other parts keep their pages and their installs. |
| Does Flat sound? | No. Sound stays Device's. |

## Flat's study bar

A study passes when all ten hold. `.claude/skills/flat-study/SKILL.md` is the working copy, with the Never list and the
review table.

1. **One arrival, then still.** When it first comes into view it plays one arrival on Flat's expressive spring (bars
   grow, a figure counts up, a ring fills), then waits. No loop, no timer after it. Nothing under reduced motion.
2. **It fits.** Its wall tile and the player's screen hold it at 320px with nothing spilling.
3. **Built from the materials, and marked.** Ground, then paper, then part. Every part carries `data-part` with one of
   `FLAT_KINDS`.
4. **Colour by Flat's table.** One ink fill per view. Candy hues on data only. How much, and how far along, is the
   sunset ramp (`--data-seq-1..4`) and no other gradient.
5. **The hand moves it.** A continuous value follows a drag 1:1 through `useHand` and settles with `useSettle`
   (`gallery/src/motion/hand.ts`). A press answers on the way down.
6. **Keys match the hand.** One tab stop per composite, arrows, Home and End.
7. **It says what changed.** A polite live region; no instructions written inside the part.
8. **Flat's words.** Its nouns and demo strings from `litt-principles.md`. A lede says what the part does, never what
   it is made of.
9. **Its page can take it apart.** A `study` export: Anatomy parts, States, Replay.
10. **Small blast radius.** Only Flat's body (`gallery/src/worlds/flat/<part>.tsx`, or the component for Flat's own
    ten) and the page change, unless the contract truly needs a prop.

## Phase 0. The bar, the skill, the check, the list. STOP for Nick.

- [ ] This plan and its row in `plans/README.md`; the skill; one bullet in `.claude/CLAUDE.md`.
- [ ] `BAR` in `gallery/src/gallery/play-object/takes.ts`: the ids at the bar, per world, empty at first.
- [ ] `gallery/scripts/materials.mjs` holds every page in `BAR.flat` to rules 3 and 4 (root, unmarked, gradient, ink),
      with a `--self-test` for each and a mode that judges a page not yet in `BAR`.
- [ ] A sheet on `#canvas` (`gallery/src/canvas/flat-studies.tsx`): the proposed twenty as live tiles, each with what
      it still lacks.
- [ ] **STOP**: Nick confirms the bar and the list, or strikes a tile. The arrival (rule 1) changes R4's "nothing plays
      on load" for Flat, so it goes through `workflows/evolve.md` as a `taste:` change once Nick has seen the pilot.

Proposed list:

- **The set** (as #168 leaves it): context-budget, hold-confirm, agent-run, toast-stack, poll, streak, kudos,
  reaction-bar, reading-progress, goal-ring, progress, toast.
- **Staples**: button, slider, switch, segmented, checkbox, tabs, input, select.
- **Next, if Nick wants more than twenty**: gauge, heatmap, card, chart.

The sheet on `#canvas` was drawn before #168 was read, so it shows the old set. It is redrawn with the four new parts
once #168 is on `main`, since their pages are not on this branch.

A deviation from the first draft: a page is held to the bar when its id joins `BAR.flat`, not through a `KNOWN` list of
twenty that shrinks. An id joins when its study passes, so the check is green at every commit.

## Phase 1. The pilot: poll and slider. STOP for Nick's hand.

- [ ] Merge `main` once #168 is in. Run the check in study mode on **context-budget** first: it is the reference, so
      a rule it fails is either a rule to fix or a note for Nick, before anything is built against it.
- [ ] **poll** (Flat's own; a tap only today) and **slider** (a staple with a body and no marks), each to all ten rules.
- [ ] The audit's findings on them (`plans/audits/flat.md`): poll's note, poll's roles.
- [ ] One commit each, with its `gallery/CHANGELOG.md` lines and the regenerated `gallery/registry.lock.json`.
- [ ] **STOP**: Nick tries both, light and dark, on a phone. The bar is edited from what Nick says before phase 2.

## Phase 2. The rest of the set, four at a time, a sheet and a STOP after each four.

- [ ] context-budget, hold-confirm, agent-run, toast-stack.
- [ ] streak, kudos, reaction-bar, goal-ring.
- [ ] reading-progress, progress, toast.
- Known on the way: goal-ring's and reading-progress's gradients move to the sunset ramp; streak's instructions leave
  the component. Reaction bar's data-hue fill and kudos's tap dip are Nick's calls: shown on the sheet, not shipped
  without a pick.
- [ ] When twelve have passed, `shelvesOf("flat")` and Flat's Index read `BAR.flat`.

## Phase 3. The staples, the same loop.

- [ ] button, switch, segmented, checkbox.
- [ ] tabs, input, select.

## Phase 4. Flat shows only its studies, then the measure. STOP for Nick.

- [ ] `#flat/components` and Flat's player list `BAR.flat` alone; other pages keep their addresses and installs.
      `gallery/scripts/playground.mjs` and `wall.mjs` read "every component in the world" from `shelvesOf`, so their
      words and self-tests change with it.
- [ ] Flat's About scenes (`gallery/src/gallery/systems/flat.tsx`) are rebuilt from the studies.
- [ ] Flat's Index already has its own front door on `main` (the table of pills). Re-read `plans/audits/flat.md`
      findings 5, 6 and 7 against the player as it is then, and fix what still holds.
- [ ] Re-shoot and score against plan 024's five traits. Under 8 goes back to the study that failed.

## What does not change

- `skills/litt-md/assets/tokens.css` and `taste/`, except through `workflows/evolve.md` with Nick.
- The other worlds, the contracts' props, Radix, sound.
- Parts outside the list: no new work, no removal.

## Checks, per study

```bash
node skills/litt-md/scripts/check.mjs
npm run verify --prefix gallery && npm run build --prefix gallery
npm run test:materials --prefix gallery
npm run test:study --prefix gallery
npm run test:words --prefix gallery -- --worlds flat
npm run test:targets --prefix gallery
npm run test:motion --prefix gallery
```

`npm run test:registry --prefix gallery` after each four. Phase 4 adds `test:playground`, `test:wall` and `test:worlds`.

## STOP conditions

- A study needs a new token or a rule in `taste/`: stop, and propose it through `evolve.md`.
- A study needs a new prop on a contract: say so on the sheet before building it.
- A study fails the same rule after two rounds: report it with the sheet.

## Done when

- Twenty studies are in `BAR.flat` and `test:materials` passes with them.
- `#flat/components` and Flat's player show only those.
- Flat scores 8 or more on each of plan 024's five traits, by Nick's eye.

## Log

- 2026-11-22. Planned with Nick. Phase 0 started.
- 2026-11-22. Phase 0 built: `BAR`, the four study rules in `test:materials` with `--study`, the sheet on `#canvas`.
  The playground check read `BAR`'s list as Flat's set and failed on the PR; it now reads `SET`'s block alone.
  Today, before #168, all twenty pages fail: the six own parts mostly on `root` alone, the rest for want of marks.
  Not caught yet: reading-progress paints its off-ramp colours as solid fills, and the gradient rule reads gradients.
- 2026-11-22. Read PR #168 at Nick's word. The list, the reference and rule 3 follow it (above).
- 2026-11-23. Merged PR #168; refreshed the `#canvas` sheet (`gallery/src/canvas/flat-studies.tsx`) to the post-#168
  set of twelve and eight staples, and updated the skill and plan for Flat's own ten parts.
